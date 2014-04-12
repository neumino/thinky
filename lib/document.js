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
    this._options.enforce_missing = (options.enforce_missing != null) ? options.enforce_missing : model.getOptions().enforce_missing;
    this._options.enforce_extra = (options.enforce_extra != null) ? options.enforce_extra : model.getOptions().enforce_extra;
    this._options.enforce_type = (options.enforce_type != null) ? options.enforce_type : model.getOptions().enforce_type;
    this._options.timeFormat = (options.timeFormat != null) ? options.timeFormat : model.getOptions().timeFormat;
    this._options.validate = (options.validate != null) ? options.validate : model.getOptions().validate;

    this._saved = options.saved || false;

    // Copy methods from eventEmitter
    for(key in eventEmitter.prototype) {
        var fn = eventEmitter.prototype[key];
        if (typeof fn === 'function') this[key] = fn.bind(self);
    }

    /*
        tableLinkName: {
            <link>: true
        }
    */

    // Save the links used for hasAndBelongsToMany
    // We use it to know if some links have been removed/added before saving.
    // Example: { <linkTableName>: { <valueOfRightKey>: true, ... }, ... }
    this._links = {}

    // links to parent documents -- used for doc.otherDoc.delete()
    this._hasOne = {};
    this._hasMany = {};

    // Keep reference to parents for `purge`
    this._parents = {
        _hasOne: {}, // <tableName>: [{doc, key}]
        _hasMany: {}, // <tableName>: [{doc, key}]
        _belongsTo: {}, // <tableName>: [{doc, key, foreignKey}]
        _belongsLinks: {} // <tableName>: [{doc, key}]
    }

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


// Called on the instance of the Model
Document.prototype._getOptions = function() {
    return this.__proto__._options;
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
    var schema = self._getModel()._schema;
    var options = self._getModel().getOptions();

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
    // Document options
    options = options || {};
    var docOptions = util.deepCopy(this._getOptions());
    for(var key in options) {
        if (options.hasOwnProperty(key)) {
            docOptions[key] = options[key]
        }
    }

    prefix = prefix || '';
    var schema = this._getModel()._schema;

    // Validate this schema
    this._validate(this, schema, prefix, docOptions)

    if (options.getJoin !== false) {
        // Validate joins documents
        for(var joinKey in this._getModel()._joins) {
            if ((this.hasOwnProperty(joinKey)) && (this[joinKey] != null)) {
                if ((this._getModel()._joins[joinKey].type === 'hasOne') || (this._getModel()._joins[joinKey].type === 'belongsTo')) {
                    if (this[joinKey] instanceof Document) {
                        // We do not propagate the options of this document, but only those given to validate
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
                            this[joinKey][i].validate(options, prefix+'['+joinKey+']['+i+']');
                            result.push(this[joinKey][i]);
                        }
                        else {
                            this[joinKey][i].validate(options, prefix+'['+joinKey+']['+i+']');
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
    var typeOf, className, key, fieldChecked, currentSchema;


    var iterator = (Array.isArray(schema)) ? doc : schema;

    // We need a deepcopy because we are going to pass the options around and overwrite them
    localOptions = util.deepCopy(options)

    for(key in iterator) {
        // An element in an array can never be undefined because RethinkDB doesn't support such type
        if ((Array.isArray(schema))  && (doc[key] === undefined)) {
            throw new Error("The element in the array "+prefix+" (position "+key+") cannot be `undefined`.")
        }
        fieldChecked = false;
        
        // Define the current schema
        currentSchema = (Array.isArray(schema)) ? schema[0] : schema[key]

        // Set the local settings
        if (util.isPlainObject(currentSchema) && (currentSchema._type !== undefined) && (util.isPlainObject(currentSchema.options))) {
            localOptions.enforce_missing = (currentSchema.options.enforce_missing != null) ? currentSchema.options.enforce_missing : localOptions.enforce_missing;
            localOptions.enforce_type = (currentSchema.options.enforce_type != null) ? currentSchema.options.enforce_type : localOptions.enforce_type;
            localOptions.enforce_extra = (currentSchema.options.enforce_extra != null) ? currentSchema.options.enforce_extra : localOptions.enforce_extra;
        }
        else {
            localOptions.enforce_missing = localOptions.enforce_missing;
            localOptions.enforce_type = localOptions.enforce_type;
            localOptions.enforce_extra = localOptions.enforce_extra;
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
                    /*
                    else if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, typeOf);
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, key, typeOf);
                    }
                    */
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
                    /*
                    else if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, key, typeOf);
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, key, typeOf);
                    }
                    */
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
                else if ((util.isPlainObject(doc[key]._self)) && (typeof doc[key]._self.type === 'string'))  {
                    // TODO Improve -- we currently just check if it's a term from the driver
                    // We suppose for now that this is enough and we don't throw an error
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
    if (Array.isArray(schema) === false) {
        if (((schema.options != null) && (schema.options.enforce_extra === true)) ||
            (((schema.options == null) || (schema.options.enforce_extra == null)) && (options.enforce_extra === true))) {

            for(key in doc) {
                if (((doc._getModel == null) || (doc._getModel()._joins.hasOwnProperty(key) === false)) && (doc.hasOwnProperty(key)) && (iterator.hasOwnProperty(key) === false)) {
                    util.extraField(prefix, key);
                }
            }
        }
    }
}

Document.prototype.save = function() {
    return this._save({}, false, {});
}
Document.prototype.saveAll = function(modelToSave) {
    var saveAll = (modelToSave === undefined) ? true: false;
    modelToSave = modelToSave || {};

    return this._save(modelToSave, saveAll, {});
}

Document.prototype._save = function(modelToSave, saveAll, savedModel) {
    //TODO Check for circular references?

    var self = this;

    var model = self._getModel(); // instance of Model
    var constructor = self.__proto__.constructor;
    var r = model._thinky.r;

    if (util.isPlainObject(modelToSave) === false) {
        modelToSave = {};
    }

    savedModel[model.getName()] = 1;

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
            var promisesLink = []

            for(var key in model._joins) {
                //And write tests about that!
                if (((key in modelToSave) || (saveAll === true)) &&
                        (model._joins[key].type === 'hasAndBelongsToMany')) {

                    if (Array.isArray(self[key])) {
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
                                var newLink = {};

                                if (constructor.getName() < model._joins[key].model.getName()) {
                                    newLink.id = self[model._joins[key].leftKey]+"_"+link;
                                }
                                else {
                                    newLink.id = link+"_"+self[model._joins[key].leftKey];
                                }
                                newLink[constructor.getName()+"_"+model._joins[key].leftKey] = self[model._joins[key].leftKey]
                                newLink[model._joins[key].model.getName()+"_"+model._joins[key].rightKey] = link

                                promisesLink.push(new Promise(function(resolve, reject) {
                                    r.table(self._getModel()._joins[key].link).insert(newLink, {upsert: true, returnVals: true}).run().then(function(result) {
                                        self.__proto__._links[model._joins[key].link][result.new_val[model._joins[key].model.getName()+"_"+model._joins[key].rightKey]] = true;
                                        resolve();
                                    }).error(reject);
                                }))
                            }
                        }
                        self.__proto__._links[model._joins[key].link] = {}

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
                            var table = r.table(model._joins[key].link)
                            promisesLink.push(table.getAll.apply(table, keysToDelete).delete().run())
                        }
                    }
                }
            }

            if (promisesLink.length > 0) {
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
                if (((key in modelToSave) || (saveAll === true)) &&
                        (model._joins[key].type === 'hasOne') && ((saveAll === false) || (savedModel[model._joins[key].model.getName()] !== 1))) {

                    savedModel[model._joins[key].model.getName()] = 1;

                    if (self[key] != null) {
                        self[key][model._joins[key].rightKey] = self[model._joins[key].leftKey]
                        if (saveAll === true) { //TODO or modelToSave
                            promisesMany.push(new Promise(function(resolve, reject) {
                                self[key]._save(modelToSave[key], saveAll, savedModel).then(function() {
                                    if (self !== null) {
                                        self.__proto__._hasOne[key] = {
                                            doc: self[key],
                                            foreignKey: self._getModel()._joins[key].rightKey
                                        }
                                    }
                                    resolve();
                                }).error(reject);
                            }))
                        }
                        else {
                            promisesMany.push(new Promise(function(resolve, reject) {
                                self[key]._save(modelToSave[key], saveAll, savedModel).then(function() {
                                    if (self !== null) {
                                        self.__proto__._hasOne[key] = {
                                            doc: self[key],
                                            foreignKey: self._getModel()._joins[key].rightKey
                                        }
                                    }
                                    resolve();
                                }).error(reject);
                            }))
                        }
                    }
                    else if ((self[key] == null) && (self.__proto__._hasOne[key] != null)) {
                        var doc = self.__proto__._hasOne[key].doc;
                        delete doc[self.__proto__._hasOne[key].foreignKey];
                        promisesMany.push(doc._save(modelToSave[key], saveAll, savedModel))
                        self.__proto__._hasOne[key] = null;
                    }
                }
            }
            for(var key in model._joins) {
                if (((key in modelToSave) || (saveAll === true)) &&
                        (model._joins[key].type === 'hasMany') && ((saveAll === false) || (savedModel[model._joins[key].model.getName()] !== 1))) {

                    savedModel[model._joins[key].model.getName()] = 1;

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
                                promisesMany.push(self.__proto__._hasMany[key][i].doc._save(modelToSave[key], saveAll, savedModel))
                            }
                        }
                    }
                    self.__proto__._hasMany[key] = [];
                    
                    for(var i=0; i<self[key].length; i++) {
                        self[key][i][model._joins[key].rightKey] = self[model._joins[key].leftKey]

                        if (saveAll === true) {
                            promisesMany.push(new Promise(function(resolve, reject) {
                                self[key][i]._save(modelToSave[key], saveAll, savedModel).then(function(doc) {
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
                                self[key][i]._save(modelToSave[key], saveAll, savedModel).then(function(doc) {
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
                // Compare to null
                if (((key in modelToSave) || (saveAll === true)) &&
                        (model._joins[key].type === 'hasAndBelongsToMany') && ((saveAll === false) || (savedModel[model._joins[key].model.getName()] !== 1))) {

                    savedModel[model._joins[key].model.getName()] = 1;

                    if (Array.isArray(self[key])) {
                        for(var i=0; i<self[key].length; i++) {
                            if (saveAll === true) {
                                promisesMany.push(new Promise(function(resolve, reject) {
                                    self[key][i]._save(modelToSave[key], saveAll, savedModel).then(function() {
                                        if (self !== null) {
                                            self.__proto__._hasOne[key] = {
                                                doc: self[key],
                                                foreignKey: self._getModel()._joins[key].rightKey
                                            }
                                        }
                                        resolve();
                                    }).error(reject);
                                }))
                            }
                            else {
                                promisesMany.push(new Promise(function(resolve, reject) {
                                    self[key][i]._save(modelToSave[key], saveAll, savedModel).then(function() {
                                        if (self !== null) {
                                            self.__proto__._hasOne[key] = {
                                                doc: self[key],
                                                foreignKey: self._getModel()._joins[key].rightKey
                                            }
                                        }
                                        resolve();
                                    })
                                }))
                            }
                        }
                    }
                }
            }

            if (promisesMany.length > 0) {
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
                        saveSelfHelper();
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
            if (((key in modelToSave) || (saveAll === true)) &&
                    (model._joins[key].type === 'belongsTo') && (self[key] != null) && ((saveAll === false) || (savedModel[model._joins[key].model.getName()] !== 1))) {

                savedModel[model._joins[key].model.getName()] = 1;
                if (saveAll === true) {
                    promises.push(self[key]._save({}, true, savedModel))
                }
                else {
                    promises.push(self[key]._save(modelToSave[model._joins[key].model.getName()], false, savedModel))
                }
            }
        }

        // Save the belongsTo docs
        if (promises.length > 0) {
            var cbBelongsTo = function() {
                for(var key in model._joins) {
                    if (((key in modelToSave) || (saveAll === true)) &&
                        (model._joins[key].type === 'belongsTo') && (self[key] != null)) {

                        // Copy foreign key
                        if (self[key][model._joins[key].rightKey] == null) {
                            if (self.hasOwnProperty(model._joins[key].leftKey)) {
                                delete self[model._joins[key][model._joins[key].leftKey]];
                            }
                            if (copy.hasOwnProperty(model._joins[key].leftKey)) {
                                delete copy[model._joins[key][model._joins[key].leftKey]];
                            }
                        }
                        else {
                            self[model._joins[key].leftKey] = self[key][model._joins[key].rightKey];
                            copy[model._joins[key].leftKey] = self[key][model._joins[key].rightKey]; // We need to put it in copy before saving it
                        }

                        // Save the document that belongs to self[key]
                        if (self[key].__proto__._parents._belongsTo[model.getName()] == null) {
                            self[key].__proto__._parents._belongsTo[model.getName()] = [];
                        }
                        self[key].__proto__._parents._belongsTo[model.getName()].push({
                            doc: self,
                            foreignKey: model._joins[key].leftKey,
                            key: key // foreignDoc
                        });
                    }
                }
                saveSelf()
            }

            if (model._tableReady === true) {
                Promise.all(promises).then(function() {
                    cbBelongsTo()
                }).error(reject);
            }
            else {
                model.once('ready', function() {
                    Promise.all(promises).then(function() {
                        cbBelongsTo()
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

Document.prototype.isSaved = function() {
    return this.__proto__._saved;
}
Document.prototype._setSaved = function(all) {
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
                    this[key].__proto__._parents._belongsTo[this._getModel()._name] = {
                        doc: this,
                        foreignKey: this._getModel()._joins[key].leftKey,
                        key: key
                    };
                }
            }
            else if (this._getModel()._joins[key].type === 'hasMany') {
                if (Array.isArray(this[key])) {
                    for(var i=0; i<this[key].length; i++) {
                        if (this[key][i] instanceof Document) {
                            this[key][i]._setSaved(true);
                        }
                    }
                }
            }
            else if (this._getModel()._joins[key].type === 'hasAndBelongsToMany') {
                if (Array.isArray(this[key])) {
                    for(var i=0; i<this[key].length; i++) {
                        if (this[key][i] instanceof Document) {
                            this[key][i]._setSaved(true);

                            this[key][i].__proto__._parents._belongsLinks[this._getModel()._name] = {
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
}
Document.prototype._setUnSaved = function() {
    this.__proto__._saved = false;
}


// delete self
// update hasOne docs // remove foreignKey
// nothing to do for belongsto
// update hasMany docs // remove foreignKey
// remove some hasAndBelongsToMany links only if it's a primary key
// TL;DR: Delete self + links/foreign keys if possible
Document.prototype.delete = function() {
    return this._delete({})
}

// hasOne - belongsTo
// hasMany - belongsTo
// hasAndBelongsToMany

// remove this
// remove hasOne joined doc
// remove belongsTo joined doc if the reverse is a hasOne
// remove hasMany docs
// TL;DR: Delete self + joined documents/links
Document.prototype.deleteAll = function(modelToDelete) {
    var deleteAll = (modelToDelete === undefined) ? true: false;
    modelToDelete = modelToDelete || {};

    return this._delete(modelToDelete, deleteAll, true)
}

// deleteAll, default: false
// deleteSelf, default: true
Document.prototype._delete = function(modelToDelete, deleteAll, deleteSelf) {
    //TODO Retest
    var self = this;

    modelToDelete = modelToDelete || {}

    var model = self._getModel(); // instance of Model
    var constructor = self.__proto__.constructor;
    var r = model._thinky.r;

    var promises = [];
    var joins = self._getModel()._joins;

    for(var key in joins) {
        if ((joins[key].type === 'hasOne') && (util.isPlainObject(self[key]))) {
            if ((key in modelToDelete) || (deleteAll === true)) {
                promises.push(self[key]._delete(modelToDelete[key], deleteAll))
            }
            else {
                delete self[key][joins[key].rightKey];
                if ((self[key] instanceof Document) && (self[key].isSaved() === true)) {
                    promises.push(self[key].save())
                }
            }
        }
        if ((joins[key].type === 'belongsTo') && (util.isPlainObject(self[key]))) {
            if ((key in modelToDelete) || (deleteAll === true)) {
                promises.push(self[key]._delete(modelToDelete[key], deleteAll))
            }
        }

        if ((joins[key].type === 'hasMany') && (Array.isArray(self[key]))) {
            if ((key in modelToDelete) || (deleteAll === true)) {
                for(var i=0; i<self[key].length; i++) {
                    if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                        // We do not delete the foreign key here because the user may want to keep the
                        // relation even though the documents are not saved anymore
                        promises.push(self[key][i]._delete(modelToDelete[key], deleteAll))
                    }
                }
            }
            else {
                for(var i=0; i<self[key].length; i++) {
                    if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                        delete self[key][i][joins[key].rightKey];
                        promises.push(self[key][i].save())
                    }
                }
            }
        }
        if ((joins[key].type === 'hasAndBelongsToMany') && (Array.isArray(self[key]))) {
            if ((key in modelToDelete) || (deleteAll === true)) {
                // Delete links + docs
                var pks = []; // primary keys of the documents
                var linksPks = []; // primary keys of the links
                for(var i=0; i<self[key].length; i++) {

                    if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                        pks.push(self[key][i][joins[key].model._getModel()._pk])
                        // We are going to do a range delete, but we still have to recurse 
                        self[key][i]._delete(modelToDelete[key], deleteAll, false)

                        if (self._getModel()._name < joins[key].model._getModel()._name) {
                            linksPks.push(self[joins[key].leftKey]+"_"+self[key][i][joins[key].rightKey]);
                        }
                        else {
                            linksPks.push(self[key][i][joins[key].rightKey]+"_"+self[joins[key].leftKey]);
                        }
                    }
                }
                if (linksPks.length > 0) {
                    var query = r.table(joins[key].link);
                    query = query.getAll.apply(query, linksPks).delete();
                    promises.push(query.run());
                }
                if (pks.length > 0) {
                    query = r.table(joins[key].model.getName());
                    query = query.getAll.apply(query, pks).delete();
                    (function(_key) {
                        promises.push(new Promise(function(resolve, reject) {
                            query.run().then(function() {
                                for(var i=0; i<self[key].length; i++) {
                                    self[key][i]._setUnSaved()
                                }
                                resolve();
                            }).error(reject);
                        }))
                    })(key);
                }
            }
            else {
                // It's safe to destroy links only if it's a primary key
                if (self.getModel()._getModel()._pk === joins[key].leftKey) {
                    var pks = [];
                    for(var i=0; i<self[key].length; i++) {
                        if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                            if (self._getModel()._name < joins[key].model._getModel()._name) {
                                pks.push(self[joins[key].leftKey]+"_"+self[key][i][joins[key].rightKey]);
                            }
                            else {
                                pks.push(self[key][i][joins[key].rightKey]+"_"+self[joins[key].leftKey]);
                            }
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
    }

    if (deleteSelf !== false) {
        promises.push(new Promise(function(resolve, reject) {
            r.table(model._name).get(self[model._pk]).delete().run().then(function(result) {
                self._setUnSaved();
                resolve(self);
            }).error(reject);
        }))
    }

    return new Promise(function(resolve, reject) {
        Promise.all(promises).then(function() {
            resolve(self);
        }).error(reject);
    })
}


// Delete the references to self in the parents we know
// Clean the database
Document.prototype.purge = function() {
    //TODO Write tests
    var self = this;

    // Clean parent for hasOne
    // doc.otherDoc.delete()
    for(var key in self.__proto__._parents._hasOne) {
        for(var i=0; i<self.__proto__._parents._hasOne[key].length; i++) {
            var parentDoc = self.__proto__._parents._hasOne[key][i].doc; // A doc that belongs to otherDoc (aka this)
            delete parentDoc[self.__proto__._parents._hasOne[key][i].key] // Delete reference to otherDoc (aka this)
        }
    }

    // Clean parent for belongsTo
    // doc.otherDoc.delete()
    for(var key in self.__proto__._parents._belongsTo) {
        for(var i=0; i<self.__proto__._parents._belongsTo[key].length; i++) {
            var parentDoc = self.__proto__._parents._belongsTo[key][i].doc;
            delete parentDoc[self.__proto__._parents._belongsTo[key][i].key];
            delete parentDoc[self.__proto__._parents._belongsTo[key][i].foreignKey];
        }
    }

    // Clean parent for hasMany
    // doc.otherDocs[3].delete
    for(var key in self.__proto__._parents._belongsLinks) {
        for(var i=0; i<self.__proto__._parents._belongsLinks[key].length; i++) {
            var parentDoc = self.__proto__._parents._belongsLinks[key][i].doc;
            var field = self.__proto__._parents._belongsLinks[key][i].key;
            for(var j =0; j< parentDoc[field].length; j++) {
                if (parentDoc[field][j] === this) {
                    parentDoc[field].splice(j, 1);
                    break;
                }
            }
        }
    }

    // Clean parent for hasAndBelongsToMany
    // doc.otherDocs[3].delete
    for(var key in self.__proto__._parents._belongsLinks) {
        for(var i=0; i<self.__proto__._parents._belongsLinks[key].length; i++) {
            var parentDoc = self.__proto__._parents._belongsLinks[key][i].doc;
            var field = self.__proto__._parents._belongsLinks[key][i].key;
            for(var j =0; j< parentDoc[field].length; j++) {
                if (parentDoc[field][j] === this) {
                    parentDoc[field].splice(j, 1);
                    break;
                }
            }
        }
    }


    // Purge the database
    var promises = [];
    for(var modelName in self._getModel()._joins) {
        var join = self._getModel()._joins[modelName];
        var joinedModel = join.model;

        if ((join.type === 'hasOne') || (join.type === 'hasMany')) {
            promises.push(r.table(joinedModel.getName()).getAll(self[join.leftKey], {index: join.rightKey}).replace(function(doc) {
                return doc.without(join.rightKey)
            }).run())
        }
        // nothing to do for "belongsTo"
        else if (join.type === 'hasAndBelongsToMany') {
            if (self.getModel()._getModel()._pk === join.leftKey) {
                // [1]
                promises.push(r.table(join.link).getAll(self[join.leftKey], {index: self.getModel().getName()+"_"+join.leftKey}).delete().run())
            }
        }
    }

    // TODO Keep track of joins in a "reverseJoins" object
    var thinky = self.getModel()._getModel()._thinky;
    for(var modelName in thinky.models) {
        var joins = thinky.models[modelName]._getModel()._joins;
        for(var field in joins) {
            // Nothing to do for "hasOne" and "hasMany" relations
            if ((joins[field].type === "belongsTo") && (joins[field].model === self.getModel())) {
                promises.push(r.table(modelName).getAll(self[join.rightKey], {index: join.leftKey}).replace(function(doc) {
                    return doc.without(join.leftKey)
                }).run())
            }
            else if ((joins[field].type === "hasAndBelongsToMany") && (joins[field].model === self.getModel())) {
                // That is in theory (= most of the cases) redundant with [1] (when we clean the same relation on the left field -- but relations may not be symmetric?)
                if (self.getModel()._getModel()._pk === join.leftKey) {
                    promises.push(r.table(join.link).getAll(self[join.rightKey], {index: self.getModel().getName()+"_"+join.rightKey}).delete().run())
                }
            }
        }
    }
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
