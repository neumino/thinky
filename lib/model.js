var r = require('rethinkdb');
var Document = require('./document.js');

function Model(name, schema, settings, thinky) {
    settings = settings || {};

    this.name = name;
    this.schema = schema;
    this.checkEnforce = thinky.checkEnforce; // TODO fix ugliness

    this.settings = {
        primaryKey: settings.primaryKey || 'id',
        enforce: this.checkEnforce(settings.enforce, thinky.options.enforce)
    };

    this.thinky = thinky;
    this.pool = thinky.pool;
    this.thinkyOptions = thinky.options
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


    if (enforce.extra === true) {
        for(key in doc) {
            if (schema[key] === undefined) {
                throw new Error('An extra field '+key+' not defined in the schema was found.')
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
Model.prototype.define = function(key, fn) {
    var model = this.__proto__;
    model[key] = fn;
}

Model.prototype.setSchema = function(schema) {
    this.schema = schema;
}


Model.prototype.getSettings = function() {
    return this.settings;
}

Model.prototype.getPrimaryKey = function() {
    return this.settings.primaryKey;
}

Model.prototype.save = function(callback) {
    //TODO Implement replace
    var self = this; // The document
    var model = this.getModel();
    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        var query;
        var docSettings = self.getDocSettings()

        if (docSettings.saved === true) {
            var primaryKey = model.getPrimaryKey();
            //TODO remove the r.expr around self when the driver will be fixed regarding circular reference
            r.db(model.thinkyOptions.db).table(model.name)
                .get(self[primaryKey])
                .update(r.expr(self), {returnVals: true})
                .run(connection, function(error, result) {
                    if (error) {
                        if ((callback) && (typeof callback === 'function')) callback(error, null);;
                    }
                    else if ((result) && (result.errors > 0)) {
                        if ((callback) && (typeof callback === 'function')) callback(result, null);
                    }
                    else {
                        self.replace(result.new_val);

                        if ((callback) && (typeof callback === 'function')) callback(error, self);
                        model.pool.release(connection);
                    self.emit('save', self, result.old_val);
                }
            });

        }
        else {
            //TODO remove the r.expr around self when the driver will be fixed regarding circular reference
            r.db(model.thinkyOptions.db).table(model.name)
                .insert(r.expr(self), {returnVals: true})
                .run(connection, function(error, result) {
                    if (error) {
                        if ((callback) && (typeof callback === 'function')) callback(error, null);
                    }
                    else if ((result) && (result.errors > 0)) {
                        if ((callback) && (typeof callback === 'function')) callback(result, null);;
                    }
                    else {
                        self.replace(result.new_val);
                        self.getDocSettings().saved = true;
                        if ((callback) && (typeof callback === 'function')) callback(null, self);
                        // We can release the connection because we get back an object
                        model.pool.release(connection);
                        self.emit('save', self, result.old_val);
                    }
            });

        }
    });
    return this;
};

// TODO: Refactor all queries
Model.prototype.get = function(id, callback) {
    var self = this;
    var model = this.__proto__;
    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        if (Object.prototype.toString.call(id) === '[object Array]') {
            var table = r.db(model.thinkyOptions.db).table(model.name);
            table.getAll.apply(table, id).run( connection, function(error, cursor) {
                if (error) {
                    callback(error, null);
                    model.pool.release(connection);
                }
                else {
                    cursor.toArray( function(error, results) {
                        if (error) {
                            callback(error, null);
                            model.pool.release(connection);
                        }
                        else {
                            var docs = [];
                            for (var index in results) {
                                result = results[index];
                                var doc = new self(result, {saved: true});
                                docs.push(doc);
                            }
                            callback(null, docs);
                            model.pool.release(connection);
                        }
                    });
                }
            });

        }
        else {
            //TODO Handle type error
            r.db(model.thinkyOptions.db).table(model.name).get(id).run( connection, function(error, result) {
                var doc = null;
                if ((error == null) && (result != null)) {
                    doc = new self(result, {saved: true});
                }
                callback(error, doc);
                model.pool.release(connection);
            });
        }
    });
}

Model.prototype.filter = function(filter, callback) {
    var self = this;
    var model = this.__proto__;
    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        r.db(model.thinkyOptions.db).table(model.name).filter(filter).run( connection, function(error, cursor) {
            if (error) {
                callback(error, null);
                model.pool.release(connection);
            }
            else {
                cursor.toArray( function(error, results) {
                    if (error) {
                        callback(error, null);
                        model.pool.release(connection);
                    }
                    else {
                        var docs = [];
                        for (var index in results) {
                            result = results[index];
                            var doc = new self(result, {saved: true});
                            docs.push(doc);
                        }
                        callback(null, docs);
                        model.pool.release(connection);
                    }
                });
            }
        });
    });
}

Model.prototype.mapReduce = function(mapFunction, callback) {
    //TODO
}
Model.prototype.count = function(callback) {
    var self = this;
    var model = this.__proto__;
    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        r.db(model.thinkyOptions.db).table(model.name).count().run( connection, function(error, result) {
            if (error) {
                callback(error, null);
                model.pool.release(connection);
            }
            else {
                callback(null, result);
                model.pool.release(connection);
            }
        });
    });
}


var model = module.exports = exports = Model;
