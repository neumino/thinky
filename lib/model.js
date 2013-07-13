var r = require('rethinkdb');
var Document = require('./document.js');

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

        result = {}
        modelProto.createBasedOnSchema(result, doc, doc, enforce);
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
Model.prototype.createBasedOnSchema = function(result, doc, originalDoc, enforce, prefix, schema) {
    var enforce = enforce; // Add another check here?
    var prefix = prefix || '';

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
        else if (this.checkType(result, doc, originalDoc, schema, key, schema_key, Array, 'array', prefix, enforce) === true) { continue; }
        else if (this.checkType(result, doc, originalDoc, schema, key, schema_key, Object, 'object', prefix, enforce) === true) { continue; }
    }

    // Copy joins references
    if (doc === originalDoc) {
        for(var joinKey in model.joins) {
            doc[key] = originalDoc[key];
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

        // Deal with the special case of full objects and arrays
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
Model.prototype.execute = function(query, callback) {
    var self = this;
    var model = this.getModel();

    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        query.run(connection, function(error, result) {
            callback(error, result);
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
                        for (var index in results) {
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
                var doc = new model(result, {saved: true});
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
    }

}

// TODO: Refactor all queries
Model.prototype.get = function(id, argCallback, options) {
    var self = this;
    var model = this.getModel();

    var query, callback;
    if (Object.prototype.toString.call(id) === '[object Array]') {
        var query = r.db(model.thinkyOptions.db).table(model.name);
        query = query.getAll.apply(query, id);
        callback = self.callbacks.stream(self, argCallback);
    }
    else {
        query = r.db(model.thinkyOptions.db).table(model.name).get(id);
        if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
            query = this.getJoin(query, model);
            console.log(query.toString());
        }
        callback = self.callbacks.document(self, argCallback);
    }
    this.execute.call(self, query, callback);
}

Model.prototype.getJoin = function(query, model) {
    for(var fieldName in model.joins) {
        var otherModel = model.joins[fieldName].model;
        var joinClause = model.joins[fieldName].joinClause;
        if (typeof joinClause === 'object') {
            query = query.do( function(doc) {
                return r.db(otherModel.thinkyOptions.db).table(otherModel.name)
                    .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}).coerceTo('array').do( function(stream) {
                        return r.branch( stream.count().gt(1),
                            r.error("Found more than one match"), // TODO Improve error
                            r.branch( stream.count().eq(0),
                                r.expr(doc),
                                doc.merge(
                                    r.expr([[fieldName, otherModel.getJoin(stream.nth(0), otherModel)]]).coerceTo('object')
                                )
                            )
                        )
                    });
            });
        }
        else if (typeof joinClause === 'function') { // the joinClause is a function
            //TODO
        }
    }
    return query;
}

Model.prototype.getAll = function(id, index, argCallback) {
    var self = this;
    var model = this.getModel();

    var query, callback;
    if (Object.prototype.toString.call(id) === '[object Array]') {
        var query = r.db(model.thinkyOptions.db).table(model.name);
        var args = [];
        for(i in id) {
            args.push(id[i]);
        }
        args.push({index: index});
        query = query.getAll.apply(query, args);
    }
    else {
        query = r.db(model.thinkyOptions.db).table(model.name).getAll(id, {index: index})
    }

    for(var fieldName in this.joins) {
        var otherModel = this.joins[fieldName].model.getModel();
        var joinClause = this.joins[fieldName].joinClause;
        var indexName = index || otherModel.getPrimaryKey();
        if (typeof joinClause === 'object') {
            query.concatMap( function(doc) {
                return r.db(otherModel.thinkOptions.db).table(otherModel.name)
                     .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}).coerceTo('array').do( function(stream) {
                        return r.branch( stream.count().gt(1),
                            r.error("Found more than one match"), // TODO Improve error
                            r.branch( stream.count().eq(0),
                                r.expr(doc),
                                r.expr([doc.merge(r.expr([[fieldName, stream.nth(0)]]).coerceTo('object'))])
                            )
                        )
                    })
            })
        }
        else { // the joinClause is a function
            query.concatMap( function(doc) {
                return r.db(otherModel.thinkOptions.db).table(otherModel.name)
                    .filter( joinClause ).do( function(stream) {
                        return r.branch( stream.count().gt(1),
                            r.error("Found more than one match"), // TODO Improve error
                            r.branch( stream.count().eq(0),
                                r.expr(doc),
                                r.expr([doc.merge(r.expr([[fieldName, stream.nth(0)]]).coerceTo('object'))])
                            )
                        )
                    })
            })
        }
    }

    callback = self.callbacks.stream(self, argCallback);
    this.execute.call(self, query, callback);
}



Model.prototype.filter = function(filter, argCallback) {
    var self = this;
    var model = this.getModel();
    var query = r.db(model.thinkyOptions.db).table(model.name).filter(filter)

    for(var fieldName in this.joins) {
        var otherModel = this.joins[fieldName].model.getModel();
        var joinClause = this.joins[fieldName].joinClause;
        var indexName = index || otherModel.getPrimaryKey();
        if (typeof joinClause === 'string') {
            query.concatMap( function(doc) {
                return r.db(otherModel.thinkOptions.db).table(otherModel.name)
                     .getAll( doc(joinClause), {index: indexName}).coerceTo('array').do( function(stream) {
                        return r.branch( stream.count().gt(1),
                            r.error("Found more than one match"), // TODO Improve error
                            r.branch( stream.count().eq(0),
                                r.expr(doc),
                                r.expr([doc.merge(r.expr([[fieldName, stream.nth(0)]]).coerceTo('object'))])
                            )
                        )
                    })
            })
        }
        else { // the joinClause is a function
            query.concatMap( function(doc) {
                return r.db(otherModel.thinkOptions.db).table(otherModel.name)
                    .filter( joinClause ).do( function(stream) {
                        return r.branch( stream.count().gt(1),
                            r.error("Found more than one match"), // TODO Improve error
                            r.branch( stream.count().eq(0),
                                r.expr(doc),
                                r.expr([doc.merge(r.expr([[fieldName, stream.nth(0)]]).coerceTo('object'))])
                            )
                        )
                    })
            })
        }
    }

    var callback = self.callbacks.stream(self, argCallback);
    this.execute.call(self, query, callback);
}

Model.prototype.count = function(argCallback) {
    var self = this;
    var model = this.getModel();
    var query = r.db(model.thinkyOptions.db).table(model.name).count()
    var callback = self.callbacks.value(self, argCallback);
    this.execute.call(self, query, callback);
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
        model: modelArg.getModel(),
        joinClause: joinClause,
        type: 'hasOne'
    }
}

var model = module.exports = exports = Model;
