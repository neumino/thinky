var r = require('rethinkdb');
var Document = require('./document.js');
var Query = require('./query.js');

function Model(name, schema, settings, thinky) {
    settings = settings || {};

    this.name = name;
    this.schema = schema;
    this.joins = {}
    this.checkEnforce = thinky.checkEnforce; // TODO fix ugliness

    this.settings = {
        primaryKey: settings.primaryKey || 'id',
        enforce: this.checkEnforce(settings.enforce, thinky.options.enforce)
    };

    this.thinky = thinky;
    this.pool = thinky.pool;
    this.thinkyOptions = thinky.options;
    this._listeners = {}
}

Model.compile = function(name, schema, settings, thinky) {
    var modelProto = new Model(name, schema, settings, thinky);
    function model(doc, docSettings) {
        doc = doc || {};

        docSettings = docSettings || {};
        var enforce = modelProto.checkEnforce(docSettings.enforce, modelProto.settings.enforce);

        var result = {}
        modelProto.createBasedOnSchema(result, doc, doc, enforce, '', this.schema, docSettings);
        result.__proto__ = new Document(modelProto, docSettings);
        return result;
    };
    model.__proto__ = modelProto;
    return model;
};

/*
- name: name of the model
- schema: An object which fields can map to the following value
    - String
    - Number
    - Boolean
    - Date
    - Array with one type (like [String], [Number], [{name: String, age: Number}]
    - Object that contains a valid schema
    - {\_type: String, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
    - {\_type: Number, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
    - {\_type: Boolean, enforce: { missing: <boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
    - {\_type: Array, schema: _schema_, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
    - {\_type: Object, schama: _schema_, enforce: { missing: _boolean_, type: _boolean_, extra: _boolean_}, default: _value/function_ }
- settings (object): settings for the model
    - enforce: represents if the schemas should be enforced or not. Its value can be:
        - an object with the 3 fields:
            - missing -- throw on missing fields -- default to false
            - extra -- throw if extra fields are provided -- default to false
            - type -- throw if the type is not the one expected -- default to true
        - a boolean that set all 3 parameters to the same value

TODO: Don't force users to provide all fields in enforce
TODO: Let people custom _type // mostly about test
TODO: Implement maxLenght, minLenght

*/
Model.prototype.createBasedOnSchema = function(result, doc, originalDoc, enforce, prefix, schema, options) {
    var enforce = enforce; // Add another check here?
    var prefix = prefix || '';
    var options = options || {};

    var schema = schema || this.schema;

    var iterator;
    if (Object.prototype.toString.call(schema) === '[object Array]') {
        iterator = doc;
    }
    else {
        iterator = schema;
    }

    for(var key in iterator) {
        key = (doc === iterator)? parseInt(key): key; // Trick or treat
        var schema_key = (doc === iterator)? schema[0] : schema[key];

        // Do not read or your eres are going to bleed
        if (this.checkType(result, doc, originalDoc, schema, key, schema_key, String, 'string', prefix, enforce) === true) { continue; }
        else if (this.checkType(result, doc, originalDoc, schema, key, schema_key, Number, 'number', prefix, enforce) === true) { continue; }
        else if (this.checkType(result, doc, originalDoc, schema, key, schema_key, Boolean, 'boolean',prefix, enforce) === true) { continue; }
        else if (this.checkType(result, doc, originalDoc, schema, key, schema_key, Date, 'date', prefix, enforce) === true) { continue; }
        else if (this.checkType(result, doc, originalDoc, schema, key, schema_key, Array, 'array', prefix, enforce) === true) { continue; }
        else if (this.checkType(result, doc, originalDoc, schema, key, schema_key, Object, 'object', prefix, enforce) === true) { continue; }
    }

    // Copy joins references
    if (doc === originalDoc) {
        for(var joinKey in this.joins) {
            if ((doc != null) && (doc[joinKey] != null)) {
                if (this.joins[joinKey].type === 'hasOne') {
                    if (doc[joinKey] instanceof this.joins[joinKey].model) {
                        result[joinKey] = doc[joinKey];
                    }
                    else {
                        result[joinKey] = new this.joins[joinKey].model(doc[joinKey], options);
                    }
                }
                else if (this.joins[joinKey].type === 'hasMany') {
                    result[joinKey] = [];
                    for(var i=0; i<doc[joinKey].length; i++) {
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
        for(key in doc) {
            if (doc === originalDoc) { // first level
                if ((schema[key] === undefined) && (this.joins[key] === undefined)) {
                    throw new Error('An extra field `'+prefix+'['+key+']` not defined in the schema was found.')
                }
            }
            else {
                if (schema[key] === undefined) {
                    throw new Error('An extra field `'+prefix+'['+key+']` not defined in the schema was found.')
                }
            }
        }
    }

}

// Helper for createdBasedOnSchema
Model.prototype.checkType = function(result, doc, originalDoc, schema, key, schema_key, type, typeOf, prefix, enforce) {
    if (schema_key === type) {
        if (typeof doc[key] === typeOf) {
            result[key] = doc[key];
        }
        else if (type=== Date) {
            if (doc[key] instanceof Date) {
                result[key] = doc[key];
            }
            else if ((Object.prototype.toString.call(doc) === '[object Object]')
                    && (doc[key].$reql_type$ === 'TIME')
                    && typeof (doc[key].epoch_time === 'number')
                    && typeof (doc[key].timezone === 'string')) {
                result[key] = doc[key];
            }
            else if ((Object.prototype.toString.call(doc) === '[object Object]')
                    && (doc[key].$reql_type$ === 'TIME')) {
                throw new Error("Value for "+prefix+"["+key+"] is not properly defined (need `epoch_time` and `timezone` fields.")
            }
            else {
                if ((enforce.missing === true) && (doc[key] == null)) {
                    throw new Error("Value for "+prefix+"["+key+"] must be defined")
                }
                else if ((doc[key] != null) && (enforce.type === true)) {
                    throw new Error("Value for "+prefix+"["+key+"] must be a "+type.name)
                }
            }
        }
        else if ((enforce.missing === true) && (doc[key] == null)) {
            throw new Error("Value for "+prefix+"["+key+"] must be defined")
        }
        else if ((doc[key] != null) && (enforce.type === true)) {
            throw new Error("Value for "+prefix+"["+key+"] must be a "+type.name)
        }
        return true;
    }
    else if ((Object.prototype.toString.call(schema_key) === '[object Object]') && (schema_key._type === type)) {
        if (typeof schema_key.enforce === 'boolean') { enforce = schema_key.enforce; }

        if (schema_key.enforce != null) {
            var enforce = this.checkEnforce(schema_key.enforce, enforce);
        }

        if (type === Object) {
            if (Object.prototype.toString.call(doc[key]) === '[object Object]') {
                result[key] = result[key] || {};
                prefix += '['+key+']';
                Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, schema_key.schema);
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
                else if ((schema['default'] == null) && (enforce.missing === true)) {
                    throw new Error("Default value for "+prefix+"["+key+"] must be defined")
                }
                else if (enforce.type === true) {
                    throw new Error("The default value is not a "+type.name);
                }
            }
            else if ((enforce.missing === true) && (doc[key] == null)) {
                throw new Error("Value for "+prefix+"["+key+"] must be defined")
            }
            else if ((doc[key] != null) && (enforce.type === true)) {
                throw new Error("Value for "+prefix+"["+key+"] must be an Object")
            }
            return true;

        }
        else if (type === Array) {
            if (Object.prototype.toString.call(doc[key]) === '[object Array]') {
                result[key] = [];
                prefix += '['+key+']';
                Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, [schema_key.schema]);
            }
            else if ((doc[key] == null) && (schema_key['default'] != null)) {
                if (typeof schema_key['default'] === 'function') {
                    result[key] = schema_key['default'](originalDoc);
                    if ((enforce.type === true) && (typeof result[key] !== typeOf)) {
                        throw new Error("The default function did not return a "+type.name+" for "+prefix+"["+key+"]");
                    }
                }
                else if (Object.prototype.toString.call(schema_key['default']) === '[object Array]') {
                //else if (typeof schema_key['default'] === typeOf) {
                    result[key] = schema_key['default']; // We are sure that we get the good type here since we have tested it before
                }
                else if ((schema['default'] == null) && (enforce.missing === true)) {
                    throw new Error("Default value for "+prefix+"["+key+"] must be defined")
                }
                else if (enforce.type === true) {
                    throw new Error("The default value is not a "+type.name);
                }
            }
            else if ((enforce.missing === true) && (doc[key] == null)) {
                throw new Error("Value for "+prefix+"["+key+"] must be defined")
            }
            else if ((doc[key] != null) && (enforce.type === true)) {
                throw new Error("Value for "+prefix+"["+key+"] must be an Array")
            }
            return true;

        }
        else {
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
            else if ((enforce.missing === true) && (doc[key] == null)) {
                throw new Error("Value for "+prefix+"["+key+"] must be defined")
            }
            else if ((doc[key] != null) && (enforce.type === true)) {
                throw new Error("Value for "+prefix+"["+key+"] must be a "+type.name);
            }
        }
        return true;
    }
    else if ((type === Array) && (Object.prototype.toString.call(schema_key) === '[object Array]')) {
        if (Object.prototype.toString.call(doc[key]) === '[object Array]') {
            result[key] = [];
            prefix += '['+key+']';
            Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, schema_key);
        }
        else if ((enforce.missing === true) && (doc[key] == null)) {
            throw new Error("Value for "+prefix+"["+key+"] must be defined")
        }
        else if ((doc[key] != null) && (enforce.type === true)) {
            throw new Error("Value for "+prefix+"["+key+"] must be an Array")
        }
        return true;
    }
    else if ((type === Object) && (Object.prototype.toString.call(schema_key) === '[object Object]')) {
        if (Object.prototype.toString.call(doc[key]) === '[object Object]') {
            result[key] = result[key] || {};
            prefix += '['+key+']';
            Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, schema_key);
        }
        else if ((enforce.missing === true) && (doc[key] == null)) {
            throw new Error("Value for "+prefix+"["+key+"] must be defined")
        }
        else if ((doc[key] != null) && (enforce.type === true)) {
            throw new Error("Value for "+prefix+"["+key+"] must be an Object")
        }
        return true;
    }

    return false;
}

// Define a method for the documents
Model.prototype.define = function(key, fn, force) {
    var model = this.getModel();
    if ((force === true) || (model[key] == null)) {
        model[key] = fn;
    }
    else {
        throw new Error("A property/method named `"+key+"` is already defined. Use Model.define(key, fn, true) to overwrite the function.");
    }
}

Model.prototype.setSchema = function(schema) {
    this.getModel().schema = schema;
}


Model.prototype.getSettings = function() {
    return this.settings;
}

Model.prototype.getPrimaryKey = function() {
    return this.settings.primaryKey;
}

Model.prototype.getModel = function() {
    return this.__proto__;
}

//TODO Move in Thinky?
// Execute the query without wrapping the callback
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

// Execute the query with a wrapped callback
Model.prototype.execute = function(query, callback) {
    var self = this;
    var model = this.getModel();

    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        query.run({connection: connection, timeFormat: model.thinkyOptions.timeFormat}, function(error, result) {
            if (result.toArray != null) {
                wrappedCallback = Model.prototype.callbacks.stream(self, callback);
                wrappedCallback(null, result);
            }
            else if (result == null) {
                callback(null, null);
            }
            else {
                wrappedCallback = Model.prototype.callbacks.document(self, callback);
                wrappedCallback(null, result);
            }
            model.pool.release(connection);
        });
    });
}


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

// TODO: Refactor all queries
Model.prototype.get = function(id, callback) {
    var query = new Query(this);
    query = query.get(id, callback);
    return query;
}


// Merge getAll in get?
Model.prototype.getAll = function(id, options, callback) {
    var query = new Query(this);
    query = query.getAll(id, options, callback);
    return query;
}


Model.prototype.filter = function(filter, callback) {
    var query = new Query(this);
    query = query.filter(filter, callback);
    return query;
}

Model.prototype.orderBy = function(field, callback) {
    var query = new Query(this);
    query = query.orderBy(field, callback);
    return query;
}

Model.prototype.getJoin = function(filter, callback) {
    var query = new Query(this);
    query = query.getJoin(filter, callback);
    return query;
}


Model.prototype.count = function(callback) {
    var query = new Query(this);
    query = query.count(callback);
    return query;
}

Model.prototype.run = function(callback) {
    var query = new Query(this);
    query = query.run(callback);
    return query;
}

Model.prototype.pluck = function(field, callback) {
    var query = new Query(this);
    query = query.pluck(field, callback);
    return query;
}
Model.prototype.without = function(field, callback) {
    var query = new Query(this);
    query = query.withou(field, callback);
    return query;
}





// Events
Model.prototype.addListener = function(eventKey, listener) {
    var listeners = this.getModel()._listeners;
    if (listeners[eventKey] == null) {
        listeners[eventKey] = [];
    }
    listeners[eventKey].push(listener);
}
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


Model.prototype.on = Model.prototype.addListener;

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


var model = module.exports = exports = Model;
