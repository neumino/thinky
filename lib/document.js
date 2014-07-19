var eventEmitter = require('events').EventEmitter;
var util = require(__dirname+'/util.js');
var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;

function Document(model, options) {
    var self = this;

    this.constructor = model;
    this._model = model._getModel();

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
    for(var key in eventEmitter.prototype) {
        var fn = eventEmitter.prototype[key];
        if (typeof fn === 'function') this[key] = fn.bind(self);
    }

    /*
        tableLinkName: {
            <link>: true
        }
    */

    // links to hasOne/hasMany documents
    // We use it to know if some links have been removed/added before saving.
    // Example: { key: doc } or { key: [docs] }
    this._belongsTo = {};
    this._hasOne = {};
    this._hasMany = {};
    // Example: { <linkTableName>: { <valueOfRightKey>: true, ... }, ... }
    this._links = {}


    // Keep reference of any doc having a link pointing to this
    // So we can clean when users do doc.belongsToDoc.delete()
    this._parents = {
        _hasOne: {}, // <tableName>: [{doc, key}]
        _hasMany: {}, // <tableName>: [{doc, key}]
        _belongsTo: {}, // <tableName>: [{doc, key, foreignKey}]
        _belongsLinks: {} // <tableName>: [{doc, key}]
    }

    var listeners = model._listeners;
    for(var eventKey in listeners){
        for(var i=0; i<listeners[eventKey].length; i++) {
            if (listeners[eventKey][i].once === false) {
                this.addListener(eventKey, listeners[eventKey][i].listener);
            }
            else if (listeners[eventKey][i].once === true) {
                this.once(eventKey, listeners[eventKey][i].listener);
            }
        }
    }

    for(var key in model._methods) {
        if (this[key] === undefined) {
            this[key] = model._methods[key];
        }
        else {
            console.log(this[key]);
            console.log("A property "+key+" is already defined in the prototype chain. Skipping.");
        }
    }
}
util.inherits(Document, EventEmitter);


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
                        if (schema[key].default._r === undefined) {
                            doc[key] = schema[key].default.apply(originalDoc);
                        }
                        else {
                            doc[key] = schema[key].default;
                        }
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
Document.prototype.validate = function(options) {
    return this._validate(options, {}, false, {}, '')
}
Document.prototype.validateAll = function(options, modelToValidate) {
    var validateAll = (modelToValidate === undefined) ? true: false;
    modelToValidate = modelToValidate || {};

    return this._validate(options, modelToValidate, validateAll, {}, '')
}

Document.prototype._validate = function(options, modelToValidate, validateAll, validatedModel, prefix) {
    var self = this;
    return util.hook({
        preHooks: self._getModel()._pre.validate,
        postHooks: self._getModel()._post.validate,
        doc: self,
        async: self._getModel()._async.validate,
        fn: function() {
            var promises = [];
            var error;

            options = options || {};
            var docOptions = util.deepCopy(self._getOptions()); // Document's options
            for(var key in options) {
                if (options.hasOwnProperty(key)) {
                    docOptions[key] = options[key];
                }
            }

            prefix = prefix || ''; // Someone works.
            var schema = self._getModel()._schema;

            if (typeof self._getModel()._validator === 'function') {
                if (self._getModel()._validator.call(self, self) === false) {
                    throw new Error("Document's validator returned `false`.");
                }
            }

            // Validate this document
            util.tryCatch(function() {
                self.__validate(self, schema, prefix, docOptions, self);
            }, function(err) {
                error = err;
            });

            if (util.isPlainObject(modelToValidate) === false) {
                modelToValidate = {};
            }

            var constructor = self.__proto__.constructor;
            validatedModel[constructor.getTableName()] = true;

            // Validate joins documents
            var joins = self._getModel()._joins;
            for(var key in joins) {
                if (((joins[key].type === 'hasOne') || (joins[key].type === 'belongsTo'))) {
                    if (((key in modelToValidate) || (validateAll === true)) &&
                        ((validateAll === false) || (validatedModel[joins[key].model.getTableName()] !== true))) {
                        if (util.isPlainObject(self[key])) {
                            if (self[key] instanceof Document === false) {
                                self[key] = new self._getModel()._joins[key].model(self[key]);
                            }
                            // We do not propagate the options of this document, but only those given to validate
                            var promise = self[key]._validate(options, modelToValidate[key], validateAll, validatedModel, prefix+'['+key+']');
                            if (promise instanceof Promise) {
                                promises.push(promise);
                                promise = null;
                            }
                        }
                        else if (self[key] != null) {
                            throw new Error("Joined field "+prefix+"["+key+"] should be `undefined`, `null` or an `Object`")
                        }
                    }
                }
                else  if (((joins[key].type === 'hasMany') || (joins[key].type === 'hasAndBelongsToMany'))) {
                    if (((key in modelToValidate) || (validateAll === true)) &&
                        ((validateAll === false) || (validatedModel[joins[key].model.getTableName()] !== true))) {
                        if (Array.isArray(self[key])) {
                            for(var i=0; i<self[key].length; i++) {
                                if (self[key][i] instanceof Document === false) {
                                    self[key][i] = new self._getModel()._joins[key].model(self[key][i]);
                                }
                                promise = self[key][i]._validate(options, modelToValidate[key], validateAll, validatedModel, prefix+'['+key+']['+i+']');
                                if (promise instanceof Promise) {
                                    promises.push(promise);
                                    promise = null;
                                }
                            }
                        }
                        else if (self[key] != null) {
                            throw new Error("Joined field "+prefix+"["+key+"] should be `undefined`, `null` or an `Array`")
                        }
                    }
                }
            }
            if (promises.length > 0) {
                if (error instanceof Error) {
                    return new Promise(function(resolve, reject) {
                        reject(error);
                    });
                }
                else {
                    return Promise.all(promises);
                }
            }
            else if (error instanceof Error) {
                throw error;
            }
        }
    })
}

var types = [
    ['string', String],
    ['number', Number],
    ['boolean', Boolean]
]

// The schema doesn't contain joined docs
Document.prototype.__validate = function(doc, schema, prefix, options, originalDoc) {
    //TODO: Why do we pass doc here?

    var typeOf, className, key

    // We need a deepcopy because we are going to pass the options around and overwrite them
    var localOptions = util.deepCopy(options)

    /*
    // An element in an array can never be undefined because RethinkDB doesn't support such type
    */
    var fieldChecked = false;
    
    // Set the local settings
    if (util.isPlainObject(schema) && (schema._type !== undefined) && (util.isPlainObject(schema.options))) {
        localOptions.enforce_missing = (schema.options.enforce_missing != null) ? schema.options.enforce_missing : localOptions.enforce_missing;
        localOptions.enforce_type = (schema.options.enforce_type != null) ? schema.options.enforce_type : localOptions.enforce_type;
        localOptions.enforce_extra = (schema.options.enforce_extra != null) ? schema.options.enforce_extra : localOptions.enforce_extra;
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

        if (schema === className) {
            fieldChecked = true;

            if (doc === undefined) {
                if (localOptions.enforce_missing === true) {
                    util.undefinedField(prefix);
                }
            }
            else if (doc === null) {
                if (localOptions.enforce_type === "strict") {
                    util.strictType(prefix, typeOf);
                }
            }
            else if (typeof doc !== typeOf) { // doc is not null/undefined
                if (localOptions.enforce_type === "strict") {
                    util.strictType(prefix, typeOf);
                }
                else if (localOptions.enforce_type === "loose") {
                    util.looseType(prefix, typeOf);
                }
            }
        }
        else if (util.isPlainObject(schema) && (schema._type === className)) {
            fieldChecked = true;
            if (typeof schema.validator === 'function') {
                if (schema.validator(doc) === false) {
                    throw new Error("Validator for the field "+prefix+" returned `false`.");
                }
            }
            else {
                if (doc === undefined) {
                    if (localOptions.enforce_missing === true) {
                        util.undefinedField(prefix);
                    }
                }
                else if (doc === null) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, typeOf);
                    }
                }
                else if (typeof doc !== typeOf) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, typeOf);
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, typeOf);
                    }

                }
            }
        }
    }
    if (fieldChecked === false) { // The field is not a primitive, let's keep looking
        if ((schema === Date) || (util.isPlainObject(schema) && schema._type === Date)) {
            if ((util.isPlainObject(schema)) && (typeof schema.validator === 'function')) {
                if (schema.validator(doc) === false) {
                    throw new Error("Validator for the field "+prefix+"[key] returned `false`.")
                }
            }
            else {
                if (doc === undefined) {
                    if (localOptions.enforce_missing === true) {
                        util.undefinedField(prefix);
                    }
                }
                else if (doc === null) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, "date");
                    }
                }
                else if (util.isPlainObject(doc) && (doc["$reql_type$"] === "TIME")) {
                    if (doc.epoch_time === undefined) {
                        util.pseudoTimeError("epoch_time", prefix);
                    }
                    else if (doc.timezone === undefined) {
                        util.pseudoTimeError("timezone", prefix);
                    }
                }
                else if ((typeof doc === 'function') && (Array.isArray(doc._query))) {
                    // TOIMPROvE -- we currently just check if it's a term from the driver
                    // We suppose for now that this is enough and we don't throw an error
                }
                else if (typeof doc === 'string') {
                    var date = new Date(doc);
                    if (date.getTime() === date.getTime()) {
                        var r = originalDoc._getModel()._thinky.r;
                        doc = r.ISO8601(doc); // Use r.ISO8601 and not `new Date()` to keep timezone
                    }
                    else {
                        if (localOptions.enforce_type === "strict") {
                            util.strictType(prefix, "date or a valid string");
                        }
                        else if (localOptions.enforce_type !== "none") {
                            util.looseType(prefix, "date or a valid string");
                        }
                    }
                }
                else if ((doc instanceof Date) === false)  {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, "date");
                    }
                    else if (localOptions.enforce_type !== "none") {
                        util.looseType(prefix, "date");
                    }
                }
            }
        }
        else if (Array.isArray(schema) || (util.isPlainObject(schema) && schema._type === Array)) {
            if (doc === undefined) {
                if (localOptions.enforce_missing === true) {
                    util.undefinedField(prefix);
                }
            }
            else if (doc === null) {
                if (localOptions.enforce_type === "strict") {
                    util.strictType(prefix, "array");
                }
            }
            else if (Array.isArray(doc)) {
                for(var i=0; i<doc.length; i++) {
                    if (doc[i] === undefined) {
                        throw new Error("The element in the array "+prefix+" (position "+i+") cannot be `undefined`.");
                    }

                    if (Array.isArray(schema)) {
                        Document.prototype.__validate(doc[i], schema[0], prefix+'['+i+']', localOptions, originalDoc)
                    }
                    else {
                        Document.prototype.__validate(doc[i], schema.schema, prefix+'['+i+']', localOptions, originalDoc)
                    }
                }
            }
            else {
                if (localOptions.enforce_type === "strict") {
                    util.strictType(prefix, "array");
                }
                else if (localOptions.enforce_type === "loose") {
                    util.looseType(prefix, "array");
                }
            }
        }
        else if (util.isPlainObject(schema)) {
            if (typeof schema.validator === 'function') {
                if (schema.validator(doc) === false) {
                    throw new Error("Validator for the field "+prefix+"[key] returned `false`.")
                }
            }
            else {
                if (doc === undefined) {
                    if (localOptions.enforce_missing === true) {
                        util.undefinedField(prefix);
                    }
                }
                else if (doc === null) {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, "object");
                    }
                }
                else if (util.isPlainObject(doc)) {
                    if (schema._type !== undefined) {
                        for(var key in schema.schema) {
                            Document.prototype.__validate(doc[key], schema.schema[key], prefix+'['+key+']', localOptions, originalDoc)
                        }
                    }
                    else {
                        for(var key in schema) {
                            Document.prototype.__validate(doc[key], schema[key], prefix+'['+key+']', localOptions, originalDoc)
                        }
                    }
                }
                else {
                    if (localOptions.enforce_type === "strict") {
                        util.strictType(prefix, "object");
                    }
                    else if (localOptions.enforce_type === "loose") {
                        util.looseType(prefix, "object");
                    }
                }
            }
        }
    }

    if (util.isPlainObject(schema) && (schema._type === undefined)) {
        if (((schema.options != null) && (schema.options.enforce_extra === true)) ||
            (((schema.options == null) || (schema.options.enforce_extra == null)) && (options.enforce_extra === true))) {

            for(key in doc) {
                if (((doc._getModel == null) || (doc._getModel()._joins.hasOwnProperty(key) === false)) && (doc.hasOwnProperty(key)) && (schema.hasOwnProperty(key) === false)) {
                    util.extraField(prefix, key);
                }
            }
        }
    }
}

Document.prototype.save = function(callback) {
    var self = this;

    return self._save({}, false, {}, callback);
}
Document.prototype.saveAll = function(modelToSave, callback) {
    var self = this;

    var saveAll;
    if (typeof modelToSave === 'function') {
        callback = modelToSave;
        saveAll = true;
        modelToSave = {};
    }
    else {
        saveAll = (modelToSave === undefined) ? true: false;
        modelToSave = modelToSave || {};
    }

    return self._save(modelToSave, saveAll, {}, callback);
}

Document.prototype._save = function(modelToSave, saveAll, savedModel, callback) {
    //TOIMPROVE? How should we handle circular references outsides of joined fields? Now we throw with a maximum call stack size exceed
    var self = this;
    self.emit('saving', self);

    return util.hook({
        preHooks: self._getModel()._pre.save,
        postHooks: self._getModel()._post.save,
        doc: self,
        async: true,
        fn: function() {
            var model = self._getModel(); // instance of Model
            var constructor = self.__proto__.constructor;
            var r = model._thinky.r;

            if (util.isPlainObject(modelToSave) === false) {
                modelToSave = {};
            }

            savedModel[constructor.getTableName()] = true;

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
                    var promisesLink = [];

                    for(var key in model._joins) {
                        //And write tests about that!
                        if (((key in modelToSave) || (saveAll === true)) &&
                                (model._joins[key].type === 'hasAndBelongsToMany')) {

                            if (Array.isArray(self[key])) {
                                var newKeys = {}
                                for(var i=0; i<self[key].length; i++) {
                                    if (self[key][i].isSaved() === true) {
                                        newKeys[self[key][i][model._joins[key].rightKey]] = true;
                                    }
                                }

                                if (self.__proto__._links[model._joins[key].link] === undefined) {
                                    self.__proto__._links[model._joins[key].link] = {}
                                }
                                var oldKeys = self.__proto__._links[model._joins[key].link];

                                for(var link in newKeys) {
                                    if (oldKeys[link] !== true) {
                                        var newLink = {};

                                        if ((constructor.getTableName() === model._joins[key].model.getTableName())
                                            && (model._joins[key].leftKey === model._joins[key].rightKey)) {

                                            // We link on the same model and same key
                                            // We don't want to save redundant field
                                            if (link < self[model._joins[key].leftKey]) {
                                                newLink.id = link+"_"+self[model._joins[key].leftKey];
                                            }
                                            else {
                                                newLink.id = self[model._joins[key].leftKey]+"_"+link;
                                            }
                                            newLink[model._joins[key].leftKey+"_"+model._joins[key].leftKey] = [link, self[model._joins[key].leftKey]];
                                        }
                                        else {
                                            newLink[constructor.getTableName()+"_"+model._joins[key].leftKey] = self[model._joins[key].leftKey];
                                            newLink[model._joins[key].model.getTableName()+"_"+model._joins[key].rightKey] = link;

                                            // Create the primary key
                                            if (constructor.getTableName() < model._joins[key].model.getTableName()) {
                                                newLink.id = self[model._joins[key].leftKey]+"_"+link;
                                            }
                                            else if (constructor.getTableName() > model._joins[key].model.getTableName()) {
                                                newLink.id = link+"_"+self[model._joins[key].leftKey];
                                            }
                                            else {
                                                if (link < self[model._joins[key].leftKey]) {
                                                    newLink.id = link+"_"+self[model._joins[key].leftKey];
                                                }
                                                else {
                                                    newLink.id = self[model._joins[key].leftKey]+"_"+link;
                                                }
                                            }
                                        }
                                        
                                        (function(key, link) {
                                            promisesLink.push(new Promise(function(resolve, reject) {
                                                r.table(self._getModel()._joins[key].link).insert(newLink, {upsert: true, returnVals: true}).run().then(function(result) {
                                                    self.__proto__._links[model._joins[key].link][result.new_val[model._joins[key].model.getTableName()+"_"+model._joins[key].rightKey]] = true;
                                                    resolve();
                                                }).error(reject);
                                            }))
                                        })(key, link);
                                    }
                                }
                                self.__proto__._links[model._joins[key].link] = {};

                                var keysToDelete = []
                                for(var link in oldKeys) {
                                    if (newKeys[link] === undefined) {
                                        if (constructor.getTableName() < model._joins[key].model.getTableName()) {
                                            keysToDelete.push(self[model._joins[key].leftKey]+"_"+link);
                                        }
                                        else {
                                            keysToDelete.push(link+"_"+self[model._joins[key].leftKey]);
                                        }
                                    }
                                }
                                if (keysToDelete.length > 0) {
                                    var table = r.table(model._joins[key].link);
                                    promisesLink.push(table.getAll.apply(table, keysToDelete).delete().run());
                                }
                            }
                        }
                    }

                    if (promisesLink.length > 0) {
                        Promise.all(promisesLink).then(function() {
                            resolve(self);
                        }).error(reject);
                    }
                    else {
                        resolve(self);
                    }
                }

                var saveMany = function() {
                    var promisesMany = [];
                    for(var key in model._joins) {
                        if (((key in modelToSave) || (saveAll === true)) &&
                                (model._joins[key].type === 'hasOne') && ((saveAll === false) || (savedModel[model._joins[key].model.getTableName()] !== true))) {
                            savedModel[model._joins[key].model.getTableName()] = true;

                            if (self[key] != null) {
                                self[key][model._joins[key].rightKey] = self[model._joins[key].leftKey];
                                (function(key) {
                                    promisesMany.push(new Promise(function(resolve, reject) {
                                        self[key]._save(modelToSave[key], saveAll, savedModel).then(function() {
                                            self.__proto__._hasOne[key] = {
                                                doc: self[key],
                                                foreignKey: self._getModel()._joins[key].rightKey
                                            };
                                            if (self[key].__proto__._parents._hasOne[self._getModel()._name] == null) {
                                                self[key].__proto__._parents._hasOne[self._getModel()._name] = [];
                                            }
                                            self[key].__proto__._parents._hasOne[self._getModel()._name].push({
                                                doc: self,
                                                key: key
                                            });
                                            resolve();
                                        }).error(reject);
                                    }))
                                })(key)
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
                                (model._joins[key].type === 'hasMany') && ((saveAll === false) || (savedModel[model._joins[key].model.getTableName()] !== true))
                                && (Array.isArray(self[key]))) {

                            savedModel[model._joins[key].model.getTableName()] = true;

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
                                        delete self.__proto__._hasMany[key][i].doc[self.__proto__._hasMany[key][i].foreignKey];
                                        promisesMany.push(self.__proto__._hasMany[key][i].doc._save(modelToSave[key], saveAll, savedModel));
                                    }
                                }
                            }
                            self.__proto__._hasMany[key] = [];
                            
                            for(var i=0; i<self[key].length; i++) {
                                self[key][i][model._joins[key].rightKey] = self[model._joins[key].leftKey];
                                (function(key, i) {
                                    promisesMany.push(new Promise(function(resolve, reject) {
                                        self[key][i]._save(modelToSave[key], saveAll, savedModel).then(function(doc) {
                                            if (!Array.isArray(self.__proto__._hasMany[key])) {
                                                self.__proto__._hasMany[key] = [];
                                            }
                                            self.__proto__._hasMany[key].push({
                                                doc: doc,
                                                foreignKey: self._getModel()._joins[key].rightKey
                                            });

                                            if (self[key][i].__proto__._parents._hasMany[self._getModel()._name] == null) {
                                                self[key][i].__proto__._parents._hasMany[self._getModel()._name] = [];
                                            }
                                            self[key][i].__proto__._parents._hasMany[self._getModel()._name].push({
                                                doc: self,
                                                key: key
                                            });

                                            resolve();
                                        }).error(reject);
                                    }))
                                })(key, i);
                            }
                        }
                    }
                    for(var key in model._joins) {
                        // Compare to null
                        if (((key in modelToSave) || (saveAll === true)) &&
                                (model._joins[key].type === 'hasAndBelongsToMany') && ((saveAll === false) || (savedModel[model._joins[key].model.getTableName()] !== true))) {

                            savedModel[model._joins[key].model.getTableName()] = true;

                            if (Array.isArray(self[key])) {
                                for(var i=0; i<self[key].length; i++) {
                                    (function(key, i) {
                                        promisesMany.push(new Promise(function(resolve, reject) {
                                            self[key][i]._save(modelToSave[key], saveAll, savedModel).then(function() {
                                                // self.__proto__._links will be saved in saveLinks
                                                if (self[key][i].__proto__._parents._belongsLinks[self._getModel()._name] == null) {
                                                    self[key][i].__proto__._parents._belongsLinks[self._getModel()._name] = [];
                                                }
                                                self[key][i].__proto__._parents._belongsLinks[self._getModel()._name].push({
                                                    doc: self,
                                                    key: key
                                                });
                                                resolve();
                                            }).error(reject);
                                        }))
                                    })(key, i)
                                }
                            }
                        }
                    }

                    if (promisesMany.length > 0) {
                        Promise.all(promisesMany).then(function() {
                            saveLinks(self);
                        }).error(reject);
                    }
                    else {
                        saveLinks(self);
                    }
                }

                // We'll use it to know which `belongsTo` docs were saved
                var belongsToKeysSaved = {};

                // Create callback for once belongsTo docs are saved
                var saveSelf = function() {
                    // belongsTo doc were saved before. We just need to copy the foreign key
                    for(var key in model._joins) {
                        if ((model._joins[key].type === 'belongsTo') && (belongsToKeysSaved[key] === true)) {

                            if (self[key] != null) {
                                self[model._joins[key].leftKey] = self[key][model._joins[key].rightKey]
                            }
                            else {
                                if (self.__proto__._belongsTo[key]) {
                                    //delete copy[model._joins[key][model._joins[key].leftKey]];

                                    delete self[model._joins[key].leftKey];
                                    delete copy[model._joins[key].leftKey];
                                }
                            }
                        }
                    }
         
                    if (self.__proto__._saved === false) {
                        var savedDocCb = function(result) {
                            if (result.first_error != null) {
                                reject(new Error(result.first_error));
                                //return resolve(new Error(result.first_error));
                            }
                            else {
                                util.tryCatch(function() { // Validate the doc, replace it, and tag it as saved
                                    //Document.prototype.__validate(result.new_val, model._schema, '', model._options, self)
                                    self._merge(result.new_val)
                                    self._setOldValue(result.old_val);
                                    self.setSaved();
                                    self.emit('saved', self);

                                    var promise = self.validate();
                                    if (promise instanceof Promise) {
                                        promise.then(saveMany).error(reject);
                                    }
                                    else {
                                        saveMany();
                                    }

                                }, reject);
                            }
                        }

                        var saveSelfHelper = function() {
                            util.tryCatch(function() {
                                // Validate the document before saving it
                                //Document.prototype.__validate(copy, model._schema, '', model._options, self)
                                var promise = self.validate();
                                if (promise instanceof Promise) {
                                    promise.then(function() {
                                        r.table(constructor.getTableName()).insert(copy, {returnVals: true}).run().then(savedDocCb).error(reject)
                                    }).error(reject);
                                }
                                else {
                                    r.table(constructor.getTableName()).insert(copy, {returnVals: true}).run().then(savedDocCb).error(reject)
                                }


                            }, reject);
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
                        r.table(constructor.getTableName()).get(copy[model._pk]).replace(copy, {returnVals: true}).run().then(function(result) {
                            if (result.first_error != null) {
                                reject(new Error(result.first_error));
                            }
                            else {
                                util.tryCatch(function() {
                                    //Document.prototype.__validate(result.new_val, model._schema, '', model._options, self)
                                    self._merge(result.new_val)
                                    self._setOldValue(result.old_val);
                                    self.setSaved();
                                    self.emit('saved', self);

                                    var promise = self.validate();
                                    if (promise instanceof Promise) {
                                        promise.then(saveMany).error(reject);
                                    }
                                    else {
                                        saveMany();
                                    }
                                }, reject);
                            }
                        }).error(reject)
                    }
                }

                var promises = [];
                for(var key in model._joins) {
                    if (((key in modelToSave) || (saveAll === true)) &&
                            (model._joins[key].type === 'belongsTo') && ((saveAll === false) || (savedModel[model._joins[key].model.getTableName()] !== true))) {

                        belongsToKeysSaved[key] = true;


                        if (self[key] != null) {
                            savedModel[model._joins[key].model.getTableName()] = true;
                            if (saveAll === true) {
                                promises.push(self[key]._save({}, true, savedModel))
                            }
                            else {
                                promises.push(self[key]._save(modelToSave[model._joins[key].model.getTableName()], false, savedModel))
                            }
                        }
                    }
                }

                // Save the belongsTo docs
                if (promises.length > 0) {
                    var cbBelongsTo = function() {
                        for(var key in model._joins) {
                            if (((key in modelToSave) || (saveAll === true)) &&
                                (model._joins[key].type === 'belongsTo') && (self[key] != null)) {

                                self.__proto__._belongsTo[key] = true;

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
                                if (self[key].__proto__._parents._belongsTo[constructor.getTableName()] == null) {
                                    self[key].__proto__._parents._belongsTo[constructor.getTableName()] = [];
                                }
                                self[key].__proto__._parents._belongsTo[constructor.getTableName()].push({
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
            if (typeof callback === 'function') {
                p.then(function(result) {
                    callback(null, result);
                }).error(function(error) {
                    callback(error);
                });
            }
            return p;
        }
    });

}
Document.prototype.getOldValue = function() {
    return this.__proto__.oldValue;
}
Document.prototype._setOldValue = function(value) {
    return this.__proto__.oldValue = value;
}

Document.prototype.isSaved = function() {
    return this.__proto__._saved;
}
Document.prototype.setSaved = function(all) {
    this.__proto__._saved = true;
    if (all === true) {
        for(var key in this._getModel()._joins) {
            if (this._getModel()._joins[key].type === 'hasOne') {
                if (this[key] instanceof Document) {
                    this[key].setSaved(true);
                }
            }
            else if (this._getModel()._joins[key].type === 'belongsTo') {
                if (this[key] instanceof Document) {
                    this[key].setSaved(true);
                    // Save the document that belongs to self[key]
                    /*
                    this[key].__proto__._parents._belongsTo[this._getModel()._name] = {
                        doc: this,
                        foreignKey: this._getModel()._joins[key].leftKey,
                        key: key
                    };
                    */
                }
            }
            else if (this._getModel()._joins[key].type === 'hasMany') {
                if (Array.isArray(this[key])) {
                    for(var i=0; i<this[key].length; i++) {
                        if (this[key][i] instanceof Document) {
                            this[key][i].setSaved(true);
                        }
                    }
                }
            }
            else if (this._getModel()._joins[key].type === 'hasAndBelongsToMany') {
                if (Array.isArray(this[key])) {
                    for(var i=0; i<this[key].length; i++) {
                        if (this[key][i] instanceof Document) {
                            this[key][i].setSaved(true);
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
Document.prototype.delete = function(callback) {
    return this._delete({}, false, {}, true, callback)
}

// hasOne - belongsTo
// hasMany - belongsTo
// hasAndBelongsToMany

// remove this
// remove hasOne joined doc
// remove belongsTo joined doc if the reverse is a hasOne
// remove hasMany docs
// TL;DR: Delete self + joined documents/links
Document.prototype.deleteAll = function(modelToDelete, callback) {
    var deleteAll;
    if (typeof modelToDelete === 'function') {
        callback = modelToDelete;
        deleteAll = true;
        modelToDelete = {};
    }
    else {
        deleteAll = (modelToDelete === undefined) ? true: false;
        modelToDelete = modelToDelete || {};
    }

    return this._delete(modelToDelete, deleteAll, {}, true, true, callback)
}

// deleteAll, default: false
// deleteSelf, default: true
Document.prototype._delete = function(modelToDelete, deleteAll, deletedModel, deleteSelf, updateParents, callback) {
    var self = this;

    if (util.isPlainObject(modelToDelete) === false) {
        modelToDelete = {};
    }

    deleteSelf = (deleteSelf === undefined) ? true: deleteSelf;

    return util.hook({
        preHooks: self._getModel()._pre.delete,
        postHooks: self._getModel()._post.delete,
        doc: self,
        async: true,
        fn: function() {
            var model = self._getModel(); // instance of Model
            var constructor = self.__proto__.constructor;
            var r = model._thinky.r;

            var promises = [];
            var joins = self._getModel()._joins;

            deletedModel[constructor.getTableName()] = true;

            for(var key in joins) {
                if ((joins[key].type === 'hasOne') && (util.isPlainObject(self[key]))) {
                    if (((key in modelToDelete) || (deleteAll === true)) &&
                        ((deleteAll === false) || (deletedModel[joins[key].model.getTableName()] !== true))) {

                        (function(key) {
                            promises.push(new Promise(function(resolve, reject) {
                                self[key]._delete(modelToDelete[key], deleteAll, deletedModel, true, false).then(function() {
                                    delete self[key];
                                    resolve();
                                }).error(reject);
                            }))
                        })(key);
                    }
                    else {
                        delete self[key][joins[key].rightKey];
                        if ((self[key] instanceof Document) && (self[key].isSaved() === true)) {
                            promises.push(self[key].save({}, false, {}, true, false));
                        }
                    }
                }
                if (((joins[key].type === 'belongsTo') && (util.isPlainObject(self[key]))) &&
                    ((deleteAll === false) || (deletedModel[joins[key].model.getTableName()] !== true))) {

                    if ((key in modelToDelete) || (deleteAll === true)) {
                        (function(key) {
                            promises.push(new Promise(function(resolve, reject) {
                                self[key]._delete(modelToDelete[key], deleteAll, deletedModel, true, false).then(function() {
                                    delete self[key];
                                    resolve();
                                }).error(reject);
                            }));
                        })(key);
                    }
                }

                if (((joins[key].type === 'hasMany') && (Array.isArray(self[key]))) &&
                    ((deleteAll === false) || (deletedModel[joins[key].model.getTableName()] !== true))) {

                    if ((key in modelToDelete) || (deleteAll === true)) {
                        var manyPromises = [];
                        for(var i=0; i<self[key].length; i++) {
                            if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                                // We do not delete the foreign key here because the user may want to keep the
                                // relation even though the documents are not saved anymore
                                manyPromises.push(self[key][i]._delete(modelToDelete[key], deleteAll, deletedModel, true, false))
                            }
                        }
                        (function(key) {
                            promises.push(new Promise(function(resolve, reject) {
                                Promise.all(manyPromises).then(function() {
                                    delete self[key];
                                    resolve()
                                })
                            }));
                        })(key)
                    }
                    else {
                        for(var i=0; i<self[key].length; i++) {
                            if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                                delete self[key][i][joins[key].rightKey];
                                promises.push(self[key][i].save({}, false, {}, true, false))
                            }
                        }
                    }
                }
                if ((joins[key].type === 'hasAndBelongsToMany') && (Array.isArray(self[key]))) {
                    if (((key in modelToDelete) || (deleteAll === true)) &&
                        ((deleteAll === false) || (deletedModel[joins[key].model.getTableName()] !== true))) {

                        // Delete links + docs
                        var pks = []; // primary keys of the documents
                        var linksPks = []; // primary keys of the links

                        // Store the element we are going to delete.
                        // If the user force the deletion of the same element multiple times, we can't naively loop
                        // over the elements in the array...
                        var docsToDelete = [];


                        for(var i=0; i<self[key].length; i++) {
                            if ((self[key][i] instanceof Document) && (self[key][i].isSaved() === true)) {
                                pks.push(self[key][i][joins[key].model._getModel()._pk]);
                                docsToDelete.push(self[key][i]);
                                // We are going to do a range delete, but we still have to recurse 
                                promises.push(self[key][i]._delete(modelToDelete[key], deleteAll, deletedModel, false, false))

                                if (self.getModel()._getModel()._pk === joins[key].leftKey) {
                                    // The table is created since we are deleting an element from it
                                    if (self._getModel()._name < joins[key].model._getModel()._name) {
                                        linksPks.push(self[joins[key].leftKey]+"_"+self[key][i][joins[key].rightKey]);
                                    }
                                    else {
                                        linksPks.push(self[key][i][joins[key].rightKey]+"_"+self[joins[key].leftKey]);
                                    }
                                }
                            }
                        }
                        if (linksPks.length > 0) {
                            var query = r.table(joins[key].link);
                            query = query.getAll.apply(query, linksPks).delete();
                            promises.push(query.run());
                        }
                        if (pks.length > 0) {
                            query = r.table(joins[key].model.getTableName());
                            query = query.getAll.apply(query, pks).delete();
                            (function(key, docsToDelete) {
                                promises.push(new Promise(function(resolve, reject) {
                                    query.run().then(function() {
                                        for(var i=0; i<docsToDelete.length; i++) {
                                            docsToDelete[i].emit('deleted', docsToDelete[i]);
                                            docsToDelete[i]._setUnSaved();
                                        }
                                        delete self[key];
                                        resolve();
                                    }).error(reject);
                                }))
                            })(key, docsToDelete);
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
            if (updateParents !== false) {
                // Clean links that we are aware of
                for(var key in self.__proto__._parents._hasOne) {
                    var parents = self.__proto__._parents._hasOne[key];
                    for(var i=0; i<parents.length; i++) {
                        delete parents[i].doc[parents[i].key];
                    }
                }
                for(var key in self.__proto__._parents._belongsTo) {
                    var parents = self.__proto__._parents._belongsTo[key];
                    for(var i=0; i<parents.length; i++) {
                        delete parents[i].doc[parents[i].key];
                        delete parents[i].doc[parents[i].foreignKey];
                        promises.push(parents[i].doc.save());
                    }
                }
                for(var key in self.__proto__._parents._hasMany) {
                    var parents = self.__proto__._parents._hasMany[key];
                    for(var i=0; i<parents.length; i++) {
                        for(var j=0; j<parents[i].doc[parents[i].key].length; j++) {
                            if (parents[i].doc[parents[i].key][j] === self) {
                                parents[i].doc[parents[i].key].splice(j, 1);
                                break;
                            }
                        }
                    }
                }
                for(var key in self.__proto__._parents._belongsLinks) {
                    var parents = self.__proto__._parents._belongsLinks[key];
                    for(var i=0; i<parents.length; i++) {
                        for(var j=0; j<parents[i].doc[parents[i].key].length; j++) {
                            if (parents[i].doc[parents[i].key][j] === self) {
                                parents[i].doc[parents[i].key].splice(j, 1);
                                break;
                            }
                        }
                    }
                }
            }


            if (deleteSelf !== false) {
                if (self.isSaved() === true) {
                    promises.push(new Promise(function(resolve, reject) {
                        r.table(model._name).get(self[model._pk]).delete().run().then(function(result) {
                            self._setUnSaved();
                            self.emit('deleted', self);
                            resolve(self);
                        }).error(reject);
                    }))
                }
                // else we don't throw an error, should we?
            }

            var p = new Promise(function(resolve, reject) {
                Promise.all(promises).then(function() {
                    resolve(self);
                }).error(function(error) {
                    reject(error) 
                });
            })
            if (typeof callback === 'function') {
                p.then(function(result) {
                    callback(null, result);
                }).error(function(error) {
                    callback(error);
                });
            }
            return p;
        }
    });
}


// Delete the references to self in the parents we know
// Clean the database
Document.prototype.purge = function(callback) {
    var self = this;

    var model = self._getModel(); // instance of Model
    var r = model._thinky.r;

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
    for(var field in self._getModel()._joins) {
        var join = self._getModel()._joins[field];
        var joinedModel = join.model;

        if ((join.type === 'hasOne') || (join.type === 'hasMany')) {
            promises.push(r.table(joinedModel.getTableName()).getAll(self[join.leftKey], {index: join.rightKey}).replace(function(doc) {
                return doc.without(join.rightKey)
            }).run())
        }
        // nothing to do for "belongsTo"
        else if (join.type === 'hasAndBelongsToMany') {
            if (self.getModel()._getModel()._pk === join.leftKey) {
                // [1]
                promises.push(r.table(join.link).getAll(self[join.leftKey], {index: self.getModel().getTableName()+"_"+join.leftKey}).delete().run())
            }
        }
    }

    for(var field in self._getModel()._reverseJoins) {
        var join = self._getModel()._reverseJoins[field];
        var joinedModel = join.model; // model where belongsTo/hasAndBelongsToMany was called

        if (join.type === 'belongsTo') {
            // What was called is joinedModel.belongsTo(self, fieldDoc, leftKey, rightKey)
            promises.push(r.table(joinedModel.getTableName()).getAll(self[join.rightKey], {index: join.leftKey}).replace(function(doc) {
                return doc.without(join.leftKey)
            }).run())
        }
        // nothing to do for "belongsTo"
        else if (join.type === 'hasAndBelongsToMany') {
            // Purge only if the key is a primary key
            // What was called is joinedModel.hasAndBelongsToMany(self, fieldDoc, leftKey, rightKey)
            if (self.getModel()._getModel()._pk === join.leftKey) {
                promises.push(r.table(join.link).getAll(self[join.rightKey], {index: self.getModel().getTableName()+"_"+join.rightKey}).delete().run())
            }
        }
    }

    // Delete itself
    promises.push(self.delete())


    var p = new Promise(function(resolve, reject) {
        Promise.all(promises).then(function() {
            resolve(self);
        }).error(reject);
    })
    if (typeof callback === 'function') {
        p.then(function(result) {
            callback(null, result);
        }).error(function(error) {
            callback(error);
        });
    }
    return p;
}

Document.prototype._merge = function(obj) {
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
    return this;
}

Document.prototype.merge = function(obj) {
    for(var key in obj) {
        // Recursively merge only if both fields are objects, else we'll overwrite the field
        if (util.isPlainObject(obj[key]) && util.isPlainObject(this[key])) {
            Document.prototype.merge.call(this[key], obj[key])
        }
        else {
            this[key] = obj[key];
        }
    }
    return this;
}


module.exports = Document;
