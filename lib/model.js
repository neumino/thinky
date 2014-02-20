var r = require('rethinkdb');
var Document = require('./document.js');
var Query = require('./query.js');

var typeToTypeOf = [
    ['string', String],
    ['number', Number],
    ['boolean', Boolean],
    ['date', Date],
    ['array', Array],
    ['object', Object]
]

/*
 * Constructor for new modls
 */
function Model(name, schema, settings, thinky) {
    settings = settings || {};

    this.name = name;
    this.schema = schema;
    this.joins = {}
    this._checkEnforce = thinky.checkEnforce;

    this.settings = {
        primaryKey: settings.primaryKey || 'id',
        enforce: this._checkEnforce(settings.enforce, thinky.options.enforce)
    };

    this.thinky = thinky;
    this.pool = thinky.pool;
    this.thinkyOptions = thinky.options;

    this._listeners = {}
}

/*
 * Create a new constructor for a model
 *
 * Arguments are:
 * - name: name of the model
 * - schema: An object which fields can map to the following value
 *    - String
 *    - Number
 *    - Boolean
 *    - Date
 *    - Array with one type (like [String], [Number], [{name: String, age: Number}]
 *    - Object that contains a valid schema
 *    - {\_type: String, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
 *    - {\_type: Number, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
 *    - {\_type: Boolean, enforce: { missing: <boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
 *    - {\_type: Array, schema: _schema_, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
 *    - {\_type: Object, schama: _schema_, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
 * - settings (object): settings for the model
 *    - enforce: represents if the schemas should be enforced or not. Its value can be:
 *        - an object with the 3 fields:
 *            - missing -- throw on missing fields -- default to false
 *            - extra -- throw if extra fields are provided -- default to false
 *            - type -- throw if the type is not the one expected -- default to true
 *        - a boolean that set all 3 parameters to the same value
 *
 * TODO: Implement maxLenght, minLength for _type: Array
 */
Model.compile = function(name, schema, settings, thinky) {
    // Create a new model
    var modelProto = new Model(name, schema, settings, thinky);

    // Create the constructor for new documents of this model
    function model(doc, docSettings) {
        doc = doc || {};

        docSettings = docSettings || {};

        // Check the value of enforce and return its complete value
        var enforce = modelProto._checkEnforce(docSettings.enforce, modelProto.settings.enforce);

        var result = {}
        modelProto.createBasedOnSchema(result, doc, doc, enforce, '', this.schema, docSettings);
        result.__proto__ = new Document(modelProto, docSettings);
        return result;
    };

    // Switch the internal prototype of this model
    model.__proto__ = modelProto;

    return model;
};

/*
 * Update result with the values in doc while:
 *   - Checking the schema
 *   - Paying attention to joined documents
 *
 * Internal method
 *
 * Arguments are:
 *   - result -- the object being updated
 *   - doc -- the document returned by the query
 *   - originalDoc -- the original document, used to set default values and to check if we are at the top level
 *   - prefix: Prefix of the current key -- used to provide information on which field had a bad value
 *   - schema: Expected schema of doc
 *   - options: Options passed to create new joined documents
*/
Model.prototype.createBasedOnSchema = function(result, doc, originalDoc, enforce, prefix, schema, options) {
    var enforce = enforce; // createBasedOnSchema is an internal method and checks for enforce are done before
    var prefix = prefix || '';
    var options = options || {};

    var schema = schema || this.schema;

    var iterator; // On what are we going to iterate
    if (Array.isArray(schema)) {
        // The schema is an array, so we iterate on doc
        iterator = doc;
    }
    else {
        // The schema is an object so we iterate on the keys of the schema
        iterator = schema;
    }

    for(var key in iterator) {
        // If we are iterating on an array, we coerce the key to a number. Why?
        key = (doc === iterator)? parseInt(key): key;

        // The schema for doc[key]
        var schema_key = (doc === iterator)? schema[0] : schema[key];

        for(var i=0; i<typeToTypeOf.length; i++) {
            if (this.checkType(result, doc, originalDoc, schema, key, schema_key, typeToTypeOf[i][1], typeToTypeOf[i][0], prefix, enforce) === true) {
                break;
            }
        }
    }

    // Copy joined documents
    if ((doc === originalDoc) && (doc != null)) { // We are on the top level
        for(var joinKey in this.joins) {
            if (doc[joinKey] != null) {
                if (this.joins[joinKey].type === 'hasOne') {
                    if (doc[joinKey] instanceof this.joins[joinKey].model) {
                        // The joined document is a thinky document, let's just copy it
                        result[joinKey] = doc[joinKey];
                    }
                    else {
                        // The joined document is a thinky document, let's create one
                        result[joinKey] = new this.joins[joinKey].model(doc[joinKey], options);
                    }
                }
                else if (this.joins[joinKey].type === 'hasMany') {
                    result[joinKey] = [];
                    for(var i=0; i<doc[joinKey].length; i++) {
                        // Fill the array
                        if (doc[joinKey][i] instanceof this.joins[joinKey].model) {
                            result[joinKey].push(doc[joinKey][i]);
                        }
                        else {
                            result[joinKey].push(new this.joins[joinKey].model(doc[joinKey][i], options));
                        }
                    }
                }
            }
        }
    }

    if (enforce.extra === true) {
        // Check if some extra fields are defined
        for(key in doc) {
            if ((schema[key] === undefined) && ((doc !== originalDoc) || (this.joins[key] === undefined))) {
                throw new Error('An extra field `'+prefix+'['+key+']` not defined in the schema was found.')
            }
        }
    }

}

/*
 * Throw an error if
 *   - a field is missing and enforce.missing === true
 *   - a field doens't have the appropriate type and enforce.type === true
 *
 * Internal method
 */
Model.prototype._enforceField = function(enforce, doc, key, prefix, type) {
    if ((enforce.missing === true) && (doc[key] == null)) {
        throw new Error("Value for "+prefix+"["+key+"] must be defined")
    }
    else if ((doc[key] != null) && (enforce.type === true)) {
        if ((type.name === "Object") || (type.name === "Array")) throw new Error("Value for "+prefix+"["+key+"] must be an "+type.name);
        throw new Error("Value for "+prefix+"["+key+"] must be a "+type.name);
    }
}

/*
 * Helper for createdBasedOnSchema
 * Check the type of `doc`, and copy it in `result` if it's the good one
 *
 * Internal method
 *
 */
Model.prototype.checkType = function(result, doc, originalDoc, schema, key, schema_key, type, typeOf, prefix, enforce) {
    if (schema_key === type) {
        // Direct match between the expected type and the schema
        if (typeof doc[key] === typeOf) {
            result[key] = doc[key];
        }
        else if (type === Date) { // typeof (new Date()) === "object"
            if (Date.isDate(doc[key])) {
                result[key] = doc[key];
            }
            else if ((Object.prototype.toString.call(doc) === '[object Object]')
                    && (doc[key].$reql_type$ === 'TIME')) {
                // Non complete pseudo type date
                throw new Error("Value for "+prefix+"["+key+"] is not properly defined (need `epoch_time` and `timezone` fields.")
            }
            else {
                this._enforceField(enforce, doc, key, prefix, type);
            }
        }
        else {
            this._enforceField(enforce, doc, key, prefix, type);
        }
        return true;
    }
    else if ((Object.prototype.toString.call(schema_key) === '[object Object]') && (schema_key._type === type)) {
        // The schema is something like {_type: <type>, ... }

        // Overwrite enforce if it's provided in the schema
        if (typeof schema_key.enforce === 'boolean') { enforce = schema_key.enforce; }
        if (schema_key.enforce != null) {
            var enforce = this._checkEnforce(schema_key.enforce, enforce);
        }
        
        if (type === Object) { // We expect an object
            if (Object.isPlainObject(doc[key])) { // We get the appropriate type (object)
                result[key] = result[key] || {};
                prefix += '['+key+']';
                Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, schema_key.schema);
            }
            else if ((doc[key] == null) && (schema_key['default'] != null)) {
                // The field is missing but we have a default value
                if (typeof schema_key['default'] === 'function') { // Field not defined, but a default value is provided
                    result[key] = schema_key['default'](originalDoc);
                    if ((enforce.type === true) && (typeof result[key] !== typeOf)) {
                        throw new Error("The default function did not return a "+type.name+" for "+prefix+"["+key+"]");
                    }
                }
                else if (typeof schema_key['default'] === typeOf) {
                    result[key] = schema_key['default'];
                }
                // We then check for errors
                else if ((schema['default'] == null) && (enforce.missing === true)) {
                    throw new Error("Default value for "+prefix+"["+key+"] must be defined")
                }
                else if (enforce.type === true) {
                    throw new Error("The default value is not a "+type.name);
                }
            }
            else {
                this._enforceField(enforce, doc, key, prefix, type);
            }
            return true;

        }
        else if (type === Array) { // We expect an array
            if (Array.isArray(doc[key])) { // We have an array, everything is good
                result[key] = [];
                prefix += '['+key+']';
                Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, [schema_key.schema]);
            }
            else if ((doc[key] == null) && (schema_key['default'] != null)) { // Field not defined, but a default value is provided
                if (typeof schema_key['default'] === 'function') {
                    result[key] = schema_key['default'](originalDoc);
                    if ((enforce.type === true) && (Array.isArray(result[key]))) {
                        throw new Error("The default function did not return a "+type.name+" for "+prefix+"["+key+"]");
                    }
                }
                else if (Array.isArray(schema_key['default'])) {
                    result[key] = schema_key['default'];
                }
                // We then check for errors
                else if ((schema['default'] == null) && (enforce.missing === true)) {
                    throw new Error("Default value for "+prefix+"["+key+"] must be defined")
                }
                else if (enforce.type === true) {
                    throw new Error("The default value is not a "+type.name);
                }
            }
            else {
                this._enforceField(enforce, doc, key, prefix, type);
            }
            return true;

        }
        else if (type === Date) {
            if (Date.isDate(doc[key])) { // Native date or ReQL raw date
                result[key] = doc[key];
            }
            else if ((doc[key] == null) && (schema_key['default'] != null)) {// Field not defined, but a default value is provided
                var __errorMsg;
                if (typeof schema_key['default'] === 'function') {
                    result[key] = schema_key['default'](originalDoc);
                    __errorMsg = 'function did not return';
                }
                else {
                    result[key] = schema_key['default'];
                    __errorMsg = 'value is not';
                }

                if (enforce.type === true && !Date.isDate(result[key]))
                {
                    throw new Error("The default "+__errorMsg+" a "+type.name+" for "+prefix+"["+key+"]");
                }
            }
            else if ((Object.prototype.toString.call(doc) === '[object Object]')
                    && (doc[key].$reql_type$ === 'TIME')) {
                // Non complete pseudo type date
                throw new Error("Value for "+prefix+"["+key+"] is not properly defined (need `epoch_time` and `timezone` fields.")
            }
            else {
                this._enforceField(enforce, doc, key, prefix, type);
            }
        }
        else { // String, Number, Boolean
            if (typeof doc[key] === typeOf) {
                result[key] = doc[key];
            }
            else if ((doc[key] == null) && (schema_key['default'] != null)) {
                if (typeof schema_key['default'] === 'function') {
                    result[key] = schema_key['default'](originalDoc);
                    if ((enforce.type === true) && (typeof result[key] !== typeOf)) {
                        throw new Error("The default function did not return a "+type.name+" for "+prefix+"["+key+"]");
                    }
                }
                else if (typeof schema_key['default'] === typeOf) {
                    result[key] = schema_key['default']; // We are sure that we get the good type here since we have tested it before
                }
            }
            else {
                this._enforceField(enforce, doc, key, prefix, type);
            }
        }
        return true;
    }
    else if ((type === Array) && (Array.isArray(schema_key))) {
        if (Object.prototype.toString.call(doc[key]) === '[object Array]') {
            result[key] = [];
            prefix += '['+key+']';
            Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, schema_key);
        }
        else {
            this._enforceField(enforce, doc, key, prefix, type);
        }
        return true;
    }
    else if ((type === Object) && (Object.isPlainObject(schema_key))) {
        if (Object.prototype.toString.call(doc[key]) === '[object Object]') {
            result[key] = result[key] || {};
            prefix += '['+key+']';
            Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, schema_key);
        }
        else {
            this._enforceField(enforce, doc, key, prefix, type);
        }
        return true;
    }

    return false;
}

// Define a method for the documents
/*
 * Add a method for all the new documents
 *
 * Arguments are:
 *   - key: the key to access the new function
 *   - fn: the function
 *   - force: boolean - set to true to overwrite the method
 */
Model.prototype.define = function(key, fn, force) {
    var model = this.getModel();
    if ((force === true) || (model[key] == null)) {
        model[key] = fn;
    }
    else {
        throw new Error("A property/method named `"+key+"` is already defined. Use Model.define(key, fn, true) to overwrite the function.");
    }
}

/*
 * Return the schema
 */
Model.prototype.setSchema = function(schema) {
    this.getModel().schema = schema;
}

/*
 * Return the settings
 */
Model.prototype.getSettings = function() {
    return this.settings;
}

/*
 * Return the primary key of the model
 */
Model.prototype.getPrimaryKey = function() {
    return this.settings.primaryKey;
}

/*
 * Return the model
 */
Model.prototype.getModel = function() {
    return this.__proto__;
}

//TODO Merge with Model.prototype.execute
/*
 * Execute a query without wrapping the callback
 */
Model.prototype._execute = function(query, callback) {
    var self = this;
    var model = this.getModel();

    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        query.run({connection: connection, timeFormat: model.thinkyOptions.timeFormat}, function(error, result) {
            callback(error, result);
            model.pool.release(connection);
        });
    });
}

/*
 * Execute a query and wrap the callback
 */
Model.prototype.execute = function(query, callback) {
    var self = this;
    var model = this.getModel();

    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        query.run({connection: connection, timeFormat: model.thinkyOptions.timeFormat}, function(error, result) {
            if (result == null) {
                callback(null, null);
            }
            else if (result.toArray != null) {
                wrappedCallback = Model.prototype.callbacks.stream(self, callback);
                wrappedCallback(null, result);
            }
            else {
                wrappedCallback = Model.prototype.callbacks.document(self, callback);
                wrappedCallback(null, result);
            }
            model.pool.release(connection);
        });
    });
}

/*
 * All callback used to wrap the one passed to execute
 */
Model.prototype.callbacks = {
    stream: function(model, callback) {
        return function(error, cursor) {
            if (error) {
                callback(error, null);
            }
            else {
                cursor.toArray( function(error, results) {
                    if (error) {
                        callback(error, null);
                    }
                    else {
                        var docs = [];
                        for(var index=0; index<results.length; index++) {
                            docs.push(new model(results[index], {saved: true}));
                        }
                        callback(null, docs);
                    }
                });
            }
        }
    },
    document: function(model, callback) {
        return function(error, result) {
            if (error) {
                callback(error, null);
            }
            else {
                var doc = new model(result, {saved: true, createJoinedDocuments: true});
                callback(null, doc);
            }
        }
    },
    value: function(model, callback) {
        return function(error, result) {
            if (error) {
                callback(error, null);
            }
            else {
                callback(null, result);
            }
        }
    },
    any: function(model, callback) {
        return function(error, result) {
            if (error) {
                callback(error, null);
            }
            else if ((result === undefined) || (result === null)) {
                callback(null, null);
            }
            else if (typeof result.toArray === 'function') {
                result.toArray( function(error, results) {
                    if (error) {
                        callback(error, null);
                    }
                    else {
                        var docs = [];
                        for(var index=0; index<results.length; index++) {
                            docs.push(new model(results[index], {saved: true}));
                        }
                        callback(null, docs);
                    }
                });

            }
            else {
                var doc = new model(result, {saved: true});
                callback(null, doc);
            }
        }
    }

}

/*
 * Query's methods that are available on the model
 */
var _keys = ['get', 'getAll', 'filter', 'orderBy', 'getJoin', 'count', 'run', 'pluck', 'without', 'delete', 'update'];
for(var i in _keys) {
    (function() {
        var key = _keys[i];
        Model.prototype[key] = function() {
            var args = Array.prototype.slice.call(arguments);
            var query = new Query(this);
            query = query[key].apply(query, args);
            return query;
        }
    })()
}


/*
 * Implement an interface similar to events.EventEmitter
 */
Model.prototype.addListener = function(eventKey, listener) {
    var listeners = this.getModel()._listeners;
    if (listeners[eventKey] == null) {
        listeners[eventKey] = [];
    }
    listeners[eventKey].push(listener);
}
Model.prototype.on = Model.prototype.addListener;

Model.prototype.once = function(eventKey, listener) {
    var listeners = this.getModel()._listeners;
    if (listeners[eventKey] == null) {
        listeners[eventKey] = [];
    }
    listeners[eventKey].push({
        once: true,
        listener: listener
    });
}

Model.prototype.off = function(eventKey, listener) {
    var listeners = this.getModel()._listeners;
    if (arguments.length === 0) {
        for(var eventKey in listeners){
            delete listeners[eventKey];
        }
    }
    else if (arguments.length === 1) {
        if (typeof eventKey === 'string') {
            delete listeners[eventKey]
        }
        else if (typeof arguments[0] === 'function') {
            for(var eventIterator in listeners) {
                var index = 0;
                while (index < listeners[eventIterator].length) {
                    if ((listeners[eventIterator][index] === arguments[0]) || ((listeners[eventIterator][index].once === true) && (listeners[eventIterator][index].listener === arguments[0]))) {
                        listeners[eventIterator].splice(index, 1);
                    }
                    else {
                        index++;
                    }
                }
            }
        }
    }
    else {
        if (listeners[eventKey] != null) {
            var index = 0;
            while (index < listeners[eventKey].length) {
                if ((listeners[eventKey][index] === listener) || ((listeners[eventKey][index].once === true) && (listeners[eventKey][index].listener === listener))) {
                    listeners[eventKey].splice(index, 1);
                }
                else {
                    index++;
                }
            }
        }
    }
    return this;
}

Model.prototype.listeners = function(eventKey, raw) {
    if (eventKey == null) {
        return this.getModel()._listeners
    }

    raw = raw || true;
    if (raw === true) {
        return this.getModel()._listeners[eventKey];
    }
    else {
        return this.getModel()._listeners[eventKey].map(function(fn) {
            if (typeof fn === 'function') {
                return fn;
            }
            else if (fn.once === true) {
                return fn.listener;
            }
        });
    }
}


/*
 * Create a `hasOne` relation between two models
 */
Model.prototype.hasOne = function(modelArg, fieldName, joinClause) {
    //TODO Check arguments
    // joinClause can be an object with two fields (leftKey and rightKey) or a function only
    var model = this.getModel();
    model.joins[fieldName] = {
        model: modelArg,
        joinClause: joinClause,
        type: 'hasOne'
    }
}

/*
 * Create a `hasMany` relation between two models
 */
Model.prototype.hasMany = function(modelArg, fieldName, joinClause, options) {
    //TODO Check arguments
    // joinClause can be an object with two fields (leftKey and rightKey) or a function only
    var model = this.getModel();
    model.joins[fieldName] = {
        model: modelArg,
        joinClause: joinClause,
        type: 'hasMany',
        options: options || {}
    }
}

// Export everything
var model = module.exports = exports = Model;
