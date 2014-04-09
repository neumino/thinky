var eventEmitter = require('events').EventEmitter;
var util = require(__dirname+'/util.js');
var Promise = require('bluebird');

function Document(model, options) {
    var self = this;

    this.constructor = model;
    this._model = model;

    // We want a deep copy
    options = options || {};
    this._options = {};
    this._options.enforce_missing = (typeof options.enforce_missing != null) ? options.enforce_missing : model.getOptions().enforce_missing;
    this._options.enforce_extra = (typeof options.enforce_extra != null) ? options.enforce_extra : model.getOptions().enforce_extra;
    this._options.enforce_type = (typeof options.enforce_type != null) ? options.enforce_type : model.getOptions().enforce_type;
    this._options.timeFormat = (typeof options.timeFormat != null) ? options.timeFormat : model.getOptions().timeFormat;
    this._options.validate = (typeof options.validate != null) ? options.validate : model.getOptions().validate;

    this._saved = options.saved || false;

    // Copy methods from eventEmitter
    for(key in eventEmitter.prototype) {
        var fn = eventEmitter.prototype[key];
        if (typeof fn === 'function') this[key] = fn.bind(self);
    }

    // Copy methods from model
    for(key in model) {
        if (this[key] == null) {
            this[key] = model[key];
        }
    }

    /*
        tableLinkName: {
            <link>: true
        }
    */
    this._links = {}

    this._hasOne = {};
    this._hasMany = {};
    this._belongsTo = {};
    this._belongsLinks = {};

    /* // TODO 
    var listeners = model._listeners;
    for(var eventKey in listeners){
        for(var i=0; i<listeners[eventKey].length; i++) {
            if (typeof listeners[eventKey][i] === 'function') {
                this.addListener(eventKey, listeners[eventKey][i]);
            }
            else if (listeners[eventKey][i].once === true) {
                this.once(eventKey, listeners[eventKey][i].listener);
            }
        }
    }
    */
}


Document.prototype.getOptions = function() {
    return this._options;
}

// Return the constructor
Document.prototype.getModel = function() {
    return this.__proto__.constructor;
}

// Return the instance of Model
Document.prototype._getModel = function() {
    return this.__proto__._model;
}


// The fuck is that?
Document.prototype._get = function(key) {
    return this.__proto__[key];
}

Document.prototype._generateDefault = function() {
    var self = this;
    var schema = self._schema;
    var options = self._getModel().getOptions(); // TODO Check

    self.__generateDefault(self, schema, options, self);
}

// {foo: String}
// {_type: String}
// {foo: [String]}
// {foo: [{_type: String}]}
// {foo: [{bar: String}]}
// {foo: {_type: Object, schema: {
//      foo2: String
// }}
Document.prototype.__generateDefault = function(doc, schema, options, originalDoc) {
    // iterator = doc if schema is an array, else = schema
    //var iterator = (Array.isArray(schema)) ? doc : schema;

    // We need this check because the document may not be defined while the schema is
    if (util.isPlainObject(doc)) {

        for(var key in schema) {
            // Generate values for undefined fields
            if (doc[key] === undefined) {
                if (util.isPlainObject(schema[key]) && (schema[key]._type !== undefined)) {
                    if (typeof schema[key].default === "function") {
                        doc[key] = schema[key].default.apply(originalDoc);
                    }
                    else if (schema[key].default !== undefined) {
                        doc[key] = util.deepCopy(schema[key].default);
                    }
                }
            }

            // Recurse in objects and array
            if ((util.isPlainObject(schema[key])) && (schema[key]._type === undefined)) {
                Document.prototype.__generateDefault(doc[key], schema[key], options, originalDoc)
            }
            else if ((util.isPlainObject(schema[key])) && (schema[key]._type === Object)) {
                if (util.isPlainObject(doc[key])) {
                    Document.prototype.__generateDefault(doc[key], schema[key].schema, options, originalDoc)
                }
            }
            else if ((util.isPlainObject(schema[key])) && (schema[key]._type === Array)) {
                for(var i = 0; i<doc[key].length; i++) {
                    if ((util.isPlainObject(schema[key].schema)) && (schema[key].schema._type === undefined)) {
                        Document.prototype.__generateDefault(doc[key][i], schema[key].schema, options, originalDoc)
                    }
                    else if ((util.isPlainObject(schema[key].schema)) && (schema[key].schema._type === Object)) {
                        Document.prototype.__generateDefault(doc[key][i], schema[key].schema.schema, options, originalDoc)
                    }

                }
            }
            else if (Array.isArray(schema[key])) {
                if (Array.isArray(doc[key])) {
                    for(var i = 0; i<doc[key].length; i++) {
                        if ((util.isPlainObject(schema[key][0])) && (schema[key][0]._type === undefined)) {
                            Document.prototype.__generateDefault(doc[key][i], schema[key][0], options, originalDoc)
                        }
                        else if ((util.isPlainObject(schema[key][0])) && (schema[key][0]._type === Object)) {
                            Document.prototype.__generateDefault(doc[key][i], schema[key][0].schema, options, originalDoc)
                        }
                    }
                }
            }
        }
    }
    return doc;
}


/*
 * Validate the schema
 * 
 * options = {getJoin: true}
 */
Document.prototype.validate = function(options, prefix) {
    options = options || {};
    prefix = prefix || '';
    var modelOptions = this._getModel()._options;
    var schema = this._getModel()._schema;

    // Validate this schema
    this._validate(this, schema, prefix, modelOptions)

    // TODO test
    if (options.getJoin !== false) {
        // Validate joins documents
        for(var joinKey in this._getModel()._joins) {
            if ((this.hasOwnProperty(joinKey)) && (this[joinKey] != null)) {
                if ((this._getModel()._joins[joinKey].type === 'hasOne') || (this._getModel()._joins[joinKey].type === 'belongsTo')) {
                    if (this[joinKey] instanceof Document) {
                        this[joinKey].validate(options, prefix+'['+joinKey+']');
                    }
                    else {
                        this[joinKey] = new this._getModel()._joins[joinKey].model(this[joinKey])
                        this[joinKey].validate(options, prefix+'['+joinKey+']');
                    }
                }
                else if ((this._getModel()._joins[joinKey].type === 'hasMany') || (this._getModel()._joins[joinKey].type === 'hasAndBelongsToMany')) {
                    // The relation is hidden
                    result = [];
                    for(var i=0; i<this[joinKey].length; i++) {
                        //if (this[joinKey][i] instanceof this._getModel()._joins[joinKey].model) {
                        if (this[joinKey][i] instanceof Document) {
                            this[joinKey][i].validate(options, prefix+'['+joinKey+']');
                            result.push(this[joinKey][i]);
                        }
                        else {
                            this[joinKey][i].validate(options, prefix+'['+joinKey+']');
                            result.push(new this._getModel()._joins[joinKey].model(this[joinKey][i]));
                        }
                    }
                    this[joinKey] = result;
                }
            }
        }
    }
}

var types = [
    ['string', String],
    ['number', Number],
    ['boolean', Boolean]
]
/*
    ['date', Date],
    ['object', Object],
    */



// The schema doesn't contain joined docs
Document.prototype._validate = function(doc, schema, prefix, options) {
    //TODO Validate join documents

    var typeOf, className;
    var fieldChecked, currentSchema;



    var iterator = (Array.isArray(schema)) ? doc : schema;

    // We need a deepcopy because we are going to pass the options around and overwrite them
    localOptions = util.deepCopy(options)

    for(var key in iterator) {
        fieldChecked = false;
        
        // Define the current schema
        currentSchema = (Array.isArray(schema)) ? schema[0] : schema[key]

        // Set the local settings
        if (util.isPlainObject(currentSchema) && (currentSchema._type !== undefined) && (util.isPlainObject(currentSchema.options))) {
            localOptions.enforce_missing = currentSchema.options.enforce_missing || options.enforce_missing;
            localOptions.enforce_type = currentSchema.options.enforce_missing || options.enforce_type;
            localOptions.enforce_extra = currentSchema.options.enforce_missing || options.enforce_extra;
        }
        else {
            localOptions.enforce_missing = options.enforce_missing;
            localOptions.enforce_type = options.enforce_type;
            localOptions.enforce_extra = options.enforce_extra;
        }

        // Check for primitives - bool, number, string
        for(var i=0; i<types.length; i++) {
            if (fieldChecked) break;

            typeOf = types[i][0]; // "string", "number", "boolean"
            className = types[i][1]; // String, Number, Boolean

            if (currentSchema === className) {
                fieldChecked = true;

                if (doc[key] === undefined) {
                    if (localOptions.enforce_missing === true) {
                        util.undefinedField(prefix, key);
                    }
                    else if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, typeOf);
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, key, typeOf);
                    }
                }
                else if (doc[key] === null) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, typeOf);
                    }
                }
                else if (typeof doc[key] !== typeOf) { // doc[key] is not null/undefined
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, typeOf);
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, key, typeOf);
                    }
                }
            }
            else if (util.isPlainObject(currentSchema) && (currentSchema._type === className)) {
                fieldChecked = true;
                if (doc[key] === undefined) {
                    if (localOptions.enforce_missing === true) {
                        util.undefinedField(prefix, key);
                    }
                    else if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, typeOf);
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, key, typeOf);
                    }
                }
                else if (doc[key] === null) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, typeOf);
                    }
                }
                else if (typeof doc[key] !== typeOf) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, typeOf);
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, key, typeOf);
                    }

                }

            }
        }
        if (fieldChecked === false) { // The field is not a primitive, let's keep looking
            if ((currentSchema === Date) || (util.isPlainObject(currentSchema) && currentSchema._type === Date)) {
                if (doc[key] === undefined) {
                    if (localOptions.enforce_missing === true) {
                        util.undefinedField(prefix, key);
                    }
                    else if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "date");
                    }
                    else if (localOptions.enforce_type !== "none") {
                        util.looseType(prefix, key, "date");
                    }
                }
                else if (doc[key] === null) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "date");
                    }
                }
                else if (util.isPlainObject(doc[key]) && (doc[key]["$reql_type$"] === "TIME")) {
                    if (doc[key].epoch_time === undefined) {
                        util.pseudoTimeError("epoch_time", prefix, key);
                    }
                    else if (doc[key].timezone === undefined) {
                        util.pseudoTimeError("timezone", prefix, key);
                    }
                }
                else if ((doc[key] instanceof Date) === false)  {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "date");
                    }
                    else if (localOptions.enforce_type !== "none") {
                        util.looseType(prefix, key, "date");
                    }
                }
            }
            else if (Array.isArray(currentSchema)) {
                if (doc[key] === undefined) {
                    if (localOptions.enforce_missing === true) {
                        util.undefinedField(prefix, key);
                    }
                    else if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "array");
                    }
                    else if (localOptions.enforce_type !== "none") {
                        util.looseType(prefix, key, "array");
                    }
                }
                else if (doc[key] === null) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "array");
                    }
                }
                else if (Array.isArray(doc[key])) {
                    Document.prototype._validate(doc[key], currentSchema, prefix+'['+key+']', localOptions)
                }
                else {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "array");
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, key, "array");
                    }
                }
            }
            else if (util.isPlainObject(currentSchema)) {
                if (doc[key] === undefined) {
                    if (localOptions.enforce_missing === true) {
                        util.undefinedField(prefix, key);
                    }
                    else if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "object");
                    }
                    else if (localOptions.enforce_type !== "none") {
                        util.looseType(prefix, key, "object");
                    }
                }
                else if (doc[key] === null) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "object");
                    }
                }
                else if (util.isPlainObject(doc[key])) {
                    Document.prototype._validate(doc[key], currentSchema, prefix+'['+key+']', localOptions)
                }
                else {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, "object");
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, key, "object");
                    }
                }
            }
        }
    }
}

Document.prototype.save = function() {
    return this._save({});
}
Document.prototype.saveAll = function(modelToSave) {
    var savedModel = {}
    var saveAll = (modelToSave === undefined) ? true: false;
    modelToSave = modelToSave || {};

    return this._save(modelToSave, saveAll, savedModel);
}
Document.prototype.isSaved = function() {
    return this.__proto__._saved;
}
Document.prototype._setSaved = function(all) {
    //TODO look for removed keys

    this.__proto__._saved = true;
    if (all === true) {
        for(var key in this._getModel()._joins) {
            if (this._getModel()._joins[key].type === 'hasOne') {
                if (this[key] instanceof Document) {
                    this[key]._setSaved(true);
                }
            }
            else if (this._getModel()._joins[key].type === 'belongsTo') {
                if (this[key] instanceof Document) {
                    this[key]._setSaved(true);
                    // Save the document that belongs to self[key]
                    this[key].__proto__._belongsTo[this._getModel()._name] = {
                        doc: this,
                        foreignKey: this._getModel()._joins[key].leftKey,
                        key: key
                    };
                }
            }
            else if (this._getModel()._joins[key].type === 'hasMany') {
                for(var i=0; i<this[key].length; i++) {
                    if (this[key][i] instanceof Document) {
                        this[key][i]._setSaved(true);
                    }
                }

            }
            else if (this._getModel()._joins[key].type === 'hasAndBelongsToMany') {
                for(var i=0; i<this[key].length; i++) {
                    if (this[key][i] instanceof Document) {
                        this[key][i]._setSaved(true);

                        this[key][i].__proto__._belongsLinks[this._getModel()._name] = {
                            doc: this,
                            foreignKey: this._getModel()._joins[key].leftKey,
                            key: key
                        };
                    }
                }
            }
        }
    }
}
Document.prototype._setUnSaved = function() {
    this.__proto__._saved = false;
}




Document.prototype._save = function(modelToSave, saveAll, savedModel) {
    //TODO Check for circular references
    //TODO Test modelToSave, savedModel

    var self = this;

    var model = self._getModel(); // instance of Model
    var constructor = self.__proto__.constructor;
    var r = model._thinky.r;

    var copy = {};
    for(var key in self) {
        if ((self.hasOwnProperty(key)) && (model._joins[key] === undefined)) {
            copy[key] = self[key];
        }
    }

    var p = new Promise(function(resolve, reject) {
        // Save belongsTo
        // Save this
        // Save hasOne, hasMany and hasAndBelongsToMany docs
        // Save link
        var saveLinks = function() {
            //TODO delete removed links
            var promisesLink = []

            for(var key in model._joins) {
                if (((model._joins[key].model.getName() in modelToSave) || (saveAll === true)) &&
                        (model._joins[key].type === 'hasAndBelongsToMany') && (Array.isArray(self[key]))) {

                    var newKeys = {}
                    for(var i=0; i<self[key].length; i++) {
                        if (self[key][i].isSaved() === true) {
                            newKeys[self[key][i][model._joins[key].rightKey]] = true
                        }
                    }

                    if (self.__proto__._links[model._joins[key].link] === undefined) {
                        self.__proto__._links[model._joins[key].link] = {}
                    }
                    var oldKeys = self.__proto__._links[model._joins[key].link];

                    for(var link in newKeys) {
                        if (oldKeys[link] !== true) {
                            var newLink = {}

                            if (constructor.getName() < model._joins[key].model.getName()) {
                                newLink.id = self[model._joins[key].leftKey]+"_"+link
                            }
                            else {
                                newLink.id = link+"_"+self[model._joins[key].leftKey]
                            }

                            newLink[constructor.getName()+"_"+model._joins[key].leftKey] = self[model._joins[key].leftKey]
                            newLink[model._joins[key].model.getName()+"_"+model._joins[key].rightKey] = link
                            promisesLink.push(
                                r.table(self._getModel()._joins[key].link).insert(newLink, {upsert: true}).run()
                            )
                        }
                    }

                    var keysToDelete = []
                    for(var link in oldKeys) {
                        if (newKeys[link] === undefined) {
                            if (constructor.getName() < model._joins[key].model.getName()) {
                                keysToDelete.push(self[model._joins[key].leftKey]+"_"+link)
                            }
                            else {
                                keysToDelete.push(link+"_"+self[model._joins[key].leftKey])
                            }
                        }
                    }
                    if (keysToDelete.length > 0) {
                        var table = r.table(self.__proto__._links[model._joins[key].link])
                        promisesLink.push(
                            table.getAll.apply(table, keysToDelete).run()
                        )
                    }
                }
            }

            if (promisesLink.length > 0) {
                //TODO What if the table is not ready?
                Promise.all(promisesLink).then(function() {
                    resolve(self)
                }).error(reject);
            }
            else {
                resolve(self);
            }
        }

        var saveMany = function() {
            var promisesMany = []
            for(var key in model._joins) {
                if (((model._joins[key].model.getName() in modelToSave) || (saveAll === true)) && (model._joins[key].type === 'hasOne')) {

                    if (self[key] != null) {
                        self[key][model._joins[key].rightKey] = self[model._joins[key].leftKey]
                        if (saveAll === true) {
                            promisesMany.push(new Promise(function(resolve, reject) {
                                self[key].saveAll().then(function() {
                                    self.__proto__._hasOne[key] = {
                                        doc: self[key],
                                        foreignKey: self._getModel()._joins[key].rightKey
                                    }
                                    resolve();
                                }).error(reject);
                            }))
                        }
                        else {
                            promisesMany.push(new Promise(function(resolve, reject) {
                                self[key].saveAll(modelToSave[model._joins[key].model.getName()]).then(function() {
                                    self.__proto__._hasOne[key] = {
                                        doc: self[key],
                                        foreignKey: self._getModel()._joins[key].rightKey
                                    }
                                    resolve();
                                }).error(reject);
                            }))
                        }
                    }
                    else if ((self[key] == null) && (self.__proto__._hasOne[key] != null)) {
                        var doc = self.__proto__._hasOne[key].doc;
                        delete doc[self.__proto__._hasOne[key].foreignKey];
                        promisesMany.push(doc.save())
                        self.__proto__._hasOne[key] = null;
                    }
                }
            }
            for(var key in model._joins) {
                if (((model._joins[key].model.getName() in modelToSave) || (saveAll === true)) &&
                        (model._joins[key].type === 'hasMany')) {

                    //Go through _hasMany and find element that were removed
                    var pkMap = {};
                    if (Array.isArray(self[key])) {
                        for(var i=0; i<self[key].length; i++) {
                            if (self[key][i][model._joins[key].model._pk] != null) {
                                pkMap[self[key][i][model._joins[key].model._pk]] = true;
                            }
                        }
                    }

                    if (self.__proto__._hasMany[key] != null) {
                        for(var i=0; i<self.__proto__._hasMany[key].length; i++) {
                            if (pkMap[self.__proto__._hasMany[key][i].doc[[model._joins[key].model._pk]]] == null) {
                                delete self.__proto__._hasMany[key][i].doc[self.__proto__._hasMany[key][i].foreignKey]
                                promisesMany.push(self.__proto__._hasMany[key][i].doc.save())
                            }
                        }
                    }
                    self.__proto__._hasMany[key] = [];
                    
                    for(var i=0; i<self[key].length; i++) {
                        self[key][i][model._joins[key].rightKey] = self[model._joins[key].leftKey]

                        if (saveAll === true) {
                            promisesMany.push(new Promise(function(resolve, reject) {
                                self[key][i].saveAll().then(function(doc) {
                                    if (!Array.isArray(self.__proto__._hasMany[key])) {
                                        self.__proto__._hasMany[key] = []
                                    }
                                    self.__proto__._hasMany[key].push({
                                        doc: doc,
                                        foreignKey: self._getModel()._joins[key].rightKey
                                    })
                                    resolve();
                                }).error(reject);
                            }))
                        }
                        else {
                            promisesMany.push(new Promise(function(resolve, reject) {
                                self[key][i].saveAll(modelToSave[model._joins[key].model.getName()]).then(function(doc) {
                                    if (!Array.isArray(self.__proto__._hasMany[key])) {
                                        self.__proto__._hasMany[key] = []
                                    }
                                    self.__proto__._hasMany[key].push({
                                        doc: doc,
                                        foreignKey: self._getModel()._joins[key].rightKey
                                    })
                                    resolve();
                                }).error(reject);
                            }))
                        }
                    }
                }
            }
            for(var key in model._joins) {
                if (((model._joins[key].model.getName() in modelToSave) || (saveAll === true)) &&
                        (model._joins[key].type === 'hasAndBelongsToMany') && (Array.isArray(self[key]))) {
                    for(var i=0; i<self[key].length; i++) {
                        if (saveAll === true) {
                            promisesMany.push(self[key][i].saveAll())
                        }
                        else {
                            promisesMany.push(self[key][i].saveAll(modelToSave[model._joins[key].model.getName()]))
                        }
                    }
                }
            }

            if (promisesMany.length > 0) {
                //TODO What if the table is not ready?
                Promise.all(promisesMany).then(function() {
                    saveLinks(self)
                }).error(reject);
            }
            else {
                saveLinks(self);
            }
        }

        // Create callback for once belongsTo docs are saved
        var saveSelf = function() {
            //TODO clean relation belongsTo if removed
            if (self.__proto__._saved === false) {
                var savedDocCb = function(result) {
                    try{ // Validate the doc, replace it, and tag it as saved
                        Document.prototype._validate(result.new_val, model._schema, '', model._options)
                        self._replace(result.new_val)
                        self._setSaved();
                        saveMany();
                    }
                    catch(err) {
                        reject(err);
                    }
                }

                var saveSelfHelper = function() {
                    try{
                        // Validate the document before saving it
                        Document.prototype._validate(copy, model._schema, '', model._options)

                        r.table(constructor.getName()).insert(copy, {returnVals: true}).run().then(savedDocCb).error(reject)
                    }
                    catch(err) {
                        reject(err);
                    }
                }

                if (self.__proto__._model._tableReady === true) {
                    saveSelfHelper();
                }
                else {
                    model.once('ready', function() {
                        r.table(constructor.getName()).insert(copy, {returnVals: true}).run().then(savedDocCb).error(reject);
                    })
                }
            }
            else {
                // The table is created here since we retrieved a saved document first
                // If the document saved, it means that we retrieved it from the database, so the table is ready
                r.table(constructor.getName()).get(copy[model._pk]).replace(copy, {returnVals: true}).run().then(function(result) {
                    try{
                        Document.prototype._validate(result.new_val, model._schema, '', model._options)
                        self._replace(result.new_val)
                        self._setSaved();
                        saveMany();
                    }
                    catch(err) {
                        reject(err);
                    }
                }).error(reject)
            }
        }

        var promises = []
        for(var key in model._joins) {
            if (((model._joins[key].model.getName() in modelToSave) || (saveAll === true)) &&
                    (model._joins[key].type === 'belongsTo') && (self[key] != null)) {
                if (saveAll === true) {
                    promises.push(self[key].saveAll())
                }
                else {
                    promises.push(self[key].saveAll(modelToSave[model._joins[key].model.getName()]))
                }
            }
        }

        // Save the belongsTo docs
        if (promises.length > 0) {
            if (model._tableReady === true) {
                Promise.all(promises).then(function() {
                    for(var key in model._joins) {
                        if (((model._joins[key].model.getName() in modelToSave) || (saveAll === true)) &&
                            (model._joins[key].type === 'belongsTo') && (self[key] != null)) {

                            // Copy foreign key
                            if (self[key][model._joins[key].rightKey] == null) {
                                if (self.hasOwnProperty(leftKey)) {
                                    delete self[model._joins[key][leftKey]];
                                }
                                if (copy.hasOwnProperty(leftKey)) {
                                    delete copy[model._joins[key][leftKey]];
                                }
                            }
                            else {
                                self[model._joins[key].leftKey] = self[key][model._joins[key].rightKey];
                                copy[model._joins[key].leftKey] = self[key][model._joins[key].rightKey]; // We need to put it in copy before saving it
                            }

                            // Save the document that belongs to self[key]
                            self[key].__proto__._belongsTo[model.getName()] = {
                                doc: self,
                                foreignKey: model._joins[key].leftKey,
                                key: key // foreignDoc
                            };
                        }
                    }
                    saveSelf()
                }).error(reject);
            }
            else {
                model.once('ready', function() {
                    Promise.all(promises).then(function() {
                        // Copy foreign key
                        for(var key in model._joins) {
                            if (((model._joins[key].model.getName() in modelToSave) || (saveAll === true)) &&
                                (model._joins[key].type === 'belongsTo') && (self[key] != null)) {

                                // Copy foreign key
                                self[model._joins[key].leftKey] = self[key][model._joins[key].rightKey];
                                copy[model._joins[key].leftKey] = self[key][model._joins[key].rightKey]; // We need to put it in copy before saving it

                                // Save the document that belongs to self[key]
                                self[key].__proto__._belongsTo[model.getName()] = {
                                    doc: self,
                                    foreignKey: model._joins[key].leftKey,
                                    key: key
                                };

                            }
                        }
                        saveSelf()
                    }).error(reject);
                });
            }
        }
        else {
            if (model._tableReady === true) {
                saveSelf();
            }
            else {
                model.once('ready', function() {
                    saveSelf();
                });
            }
        }


    });
    return p;

}

Document.prototype.delete = function(purge) {
    //TODO Do we really want to let people not purge their data?
    var self = this;

    var model = self._getModel(); // instance of Model
    var constructor = self.__proto__.constructor;
    var r = model._thinky.r;

    // delete self
    // update hasOne docs // remove foreignKey
    // nothing to do for belongsto
    // update hasMany docs // remove foreignKey
    // remove some hasAndBelongsToMany links

    var promises = [];
    var joins = self._getModel()._joins;

    for(var key in joins) {
        if ((joins[key].type === 'hasOne') && (util.isPlainObject(self[key]))) {
            if ((self[key] instanceof Document) && (self[key].isSaved() === true)) {
                delete self[key][joins[key].rightKey];
                promises.push(self[key].save())
            }
        }
        if ((joins[key].type === 'hasMany') && (Array.isArray(self[key]))) {
            for(var i=0; i<self[key].length; i++) {
                if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                    delete self[key][i][joins[key].rightKey];
                    promises.push(self[key][i].save())
                }
            }
        }
        if ((joins[key].type === 'hasAndBelongsToMany') && (Array.isArray(self[key]))) {
            for(var i=0; i<self[key].length; i++) {
                var pks = [];

                if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                    if (self._getModel()._name < joins[key].model._getModel()._name) {
                        pks.push(self[joins[key].leftKey]+"_"+self[key][i][joins[key].rightKey]);
                    }
                    else {
                        pks.push(self[key][i][joins[key].rightKey]+"_"+self[joins[key].leftKey]);
                    }
                }
                if (pks.length > 0) {
                    var query = r.table(joins[key].link);
                    query = query.getAll.apply(query, pks).delete()
                    promises.push(query.run())
                }
            }
        }
    }

    // Clean parent for belongsTo
    // doc.otherDoc.delete()
    for(var key in self.__proto__._belongsTo) {
        delete self.__proto__._belongsTo[key].doc[self.__proto__._belongsTo[key].key];
        delete self.__proto__._belongsTo[key].doc[self.__proto__._belongsTo[key].foreignKey];
        
        if (purge === false) {
            var arg = {};
            arg[key] = true;
            promises.push(self.__proto__._belongsTo[key].doc.save(arg));
        }
        // else we'll purge everything later (below)
    }

    // Clean parent for hasAndBelongsToMany
    // doc.otherDocs[3].delete
    //
    for(var key in self.__proto__._belongsLinks) {
        var parentDoc = self.__proto__._belongsLinks[key].doc;
        var field = [self.__proto__._belongsLinks[key].key];
        for(var i =0; i< parentDoc[field].length; i++) {
            if (parentDoc[field][i] === this) {
                parentDoc[field].splice(i, 1);
                break;
            }
        }
        
        if (purge === false) {
            //TODO Implement it in save (the delete part)
            var arg = {};
            arg[key] = true;
            promises.push(parentDoc.save(arg));
        }
        // else we'll purge everything later (below)
    }



    if (purge !== false) {
        var reverseJoin;
        // Purge `belongsTo` and `hasAndBelongsToMany` relations
        for(var modelName in self._getModel()._reverseJoins) {
            if (self._getModel()._reverseJoins[modelName].type === 'belongsTo') {
                reverseJoin = self._getModel()._reverseJoins[modelName];
                promises.push(
                    r.table(modelName).getAll(self[reverseJoin.rightKey], {index: reverseJoin.leftKey}).replace(r.row.without(reverseJoin.leftKey)).run()
                )
            }
            else if (self._getModel()._reverseJoins[modelName].type === 'hasAndBelongsToMany') {
                reverseJoin = self._getModel()._reverseJoins[modelName];
                promises.push(
                    r.table(reverseJoin.link).getAll(self[reverseJoin.rightKey], {index: self._getModel()._name+"_"+reverseJoin.rightKey}).delete().run()
                )
            }
        }
    }

    promises.push(new Promise(function(resolve, reject) {
        r.table(model._name).get(self[model._pk]).delete().run().then(function(result) {
            self._setUnSaved();
            resolve(self);
        }).error(reject);
    }))

    return new Promise(function(resolve, reject) {
        Promise.all(promises).then(function() {
            resolve(self);
        }).error(reject);
    })
}


Document.prototype._replace = function(obj) {
    for(var key in this) {
        if (this.hasOwnProperty(key)) {
            if ((obj[key] === undefined) && (this._getModel()._joins[key] === undefined)) {
                delete[key];
            }
        }
    }
    for(var key in obj) {
        this[key] = obj[key];
    }

}

module.exports = Document;
