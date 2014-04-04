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
Document.prototype.validate = function(options) {
    options = options || {};
    var modelOptions = this._getModel()._options;
    var schema = this._getModel()._schema;

    // Validate this schema
    this._validate(this, schema, '', modelOptions)

    // TODO test
    if (options.getJoin === true) {
        // Validate joins documents
        for(var joinKey in this.joins) {
            if (doc[joinKey] != null) {
                if (this.joins[joinKey].type === 'hasOne') {
                    if (doc[joinKey] instanceof this.joins[joinKey].model) {
                        doc[joinKey].validate();
                    }
                    else {
                        doc[joinKey] = new this.joins[joinKey].model(doc[joinKey])
                        doc[joinKey].validate();
                    }
                }
                else if ((this.joins[joinKey].type === 'hasMany') || (this.joins[joinKey].type === 'hasAndBelongsToMany')) {
                    // The relation is hidden
                    result = [];
                    for(var i=0; i<doc[joinKey].length; i++) {
                        if (doc[joinKey][i] instanceof this.joins[joinKey].model) {
                            doc[joinKey][i].validate();
                            result.push(doc[joinKey][i]);
                        }
                        else {
                            doc[joinKey][i].validate();
                            result.push(new this.joins[joinKey].model(doc[joinKey][i]));
                        }
                    }
                    doc[joinKey] = result;
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
    return this._save({hasOne: false, hasMany: false, belongsTo: false, manyToMany: false});
}
Document.prototype.saveAll = function(modelToSave) {
    var savedModel = {}
    return this._save({hasOne: true, hasMany: true, belongsTo: true, manyToMany: true}, modelToSave, savedModel);
}
Document.prototype.isSaved = function() {
    return this.__proto__._saved;
}
Document.prototype._setSaved = function(value) {
    return this.__proto__._saved = value;
}


Document.prototype._save = function(options, modelToSave, savedModel) {
    //TODO Check for circular references
    //TODO Add modelToSave, savedModel

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

    if (self.__proto__._saved === false) {
        var p = new Promise(function(resolve, reject) {
            var cb = function(result) {
                try{
                    Document.prototype._validate(result, model._schema, '', model._options)
                    self._replace(result.new_val)
                    self._setSaved(true);

                    var promises = []
                    if (options.hasOne === true) {
                        for(var key in model._joins) {
                            if ((model._joins[key].type === 'hasOne') && (self[key] != null)) {
                                self[key][model._joins[key].rightKey] = self[model._joins[key].leftKey]
                                promises.push(self[key].saveAll(options))
                            }
                        }
                    }
                    if (options.hasMany === true) {
                        for(var key in model._joins) {
                            if ((model._joins[key].type === 'hasMany') && (Array.isArray(self[key]))) {
                                for(var i=0; i<self[key].length; i++) {
                                    //TODO Test
                                    self[key][i][model._joins[key].rightKey] = self[model._joins[key].leftKey]
                                    promises.push(self[key][i].saveAll(options))
                                }
                            }
                        }
                    }
                    if (options.manyToMany === true) {
                        for(var key in model._joins) {
                            if ((model._joins[key].type === 'manyToMany') && (Array.isArray(self[key]))) {
                                for(var i=0; i<self[key].length; i++) {
                                    //TODO Test
                                    //TODO delete keys
                                    //self[key][i][model._joins[key].rightKey] = self[model._joins[key][i].leftKey]
                                    //promises.push(self[key][i].saveAll(options))
                                }
                            }
                        }
                    }

                    if (promises.length > 0) {
                        Promise.all(promises).then(function() {
                            resolve(self)
                        }).error(reject);
                    }
                    else {
                        resolve(self);
                    }
                }
                catch(err) {
                    reject(err);
                }
            }

            if (self.__proto__._model._tableReady === true) {
                r.table(constructor.getName()).insert(copy, {returnVals: true}).run().then(function(result) {
                    cb(result);
                }).error(reject)
            }
            else {
                model._onTableReady.push({
                    query: r.table(constructor.getName()).insert(copy, {returnVals: true}),
                    resolve: cb,
                    reject: reject
                })
            }
        });
        return p;
    }
    else {
        return r.table(constructor.getName()).get(copy[model._pk]).replace(copy, {returnVals: true}).run().then(function(result) {
            try{
                Document.prototype._validate(result, model._schema, '', model._options)
                self._replace(result.new_val)
                self._setSaved(true);
                resolve(self);
            }
            catch(err) {
                reject(err);
            }
        }).error(reject)
    }
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
