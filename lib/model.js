var r = require('rethinkdb');
var Document = require('./document.js');

function Model(name, schema, settings, thinky) {
    settings = settings || {};

    this.name = name;
    this.schema = schema;
    this.settings = {
        primaryKey: settings.primaryKey || 'id',
        enforce: settings.enforce || thinky.options.enforce || false,
    };
    this.thinky = thinky;
    //this.pool = thinky.pool // That would be pretty nice but there is a bug in the driver with circular references for the moment
}

Model.compile = function(name, schema, settings, thinky) {
    modelProto = new Model(name, schema, settings, thinky);
    function model(doc, docSettings) {
        doc = doc || {};
        
        docSettings = docSettings || {};
        var enforce = (docSettings.enforce != null)? docSettings.enforce: modelProto.settings.enforce;

        result = {}
        modelProto.createBasedOnSchema(result, doc, doc, enforce);

        result.__proto__ = new Document(modelProto, docSettings);
        return result;
    };
    model.__proto__ = modelProto;
    return model;
};

/*
String, Number, Date, Boolean, null, Array, Object
{ name: String }
{ name: { type: String } } // {name: "Kitty"} or { name: { type: "Kitty" } }?
{ name: { type: String, default: value/function }
{ name: { type: [String, Number, ...] }
{ age: { type: Number, min: ..., max: ...} }
{ comments: { type: Array, min: ..., max: ...} }
{ arrayOfStrings: [ String ] }
{ arrayOfStrings: [ String, maxLength, minLength ] }
*/
//TODO Let people default arrays/object
//TODO Implement maxLenght, minLenght
Model.prototype.createBasedOnSchema = function(result, doc, originalDoc, enforce, prefix, schema) {
    var enforce = enforce || false;
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

        if (this.checkType(result, doc, originalDoc, schema, key, String, 'string', prefix, enforce) === true) { continue; }
        else if (this.checkType(result, doc, originalDoc, schema, key, Number, 'number', prefix, enforce) === true) { continue; }
        else if (this.checkType(result, doc, originalDoc, schema, key, Boolean, 'boolean',prefix, enforce) === true) { continue; }
        else if (Object.prototype.toString.call(schema_key) === '[object Array]') {
            result[key] = [];
            prefix += '['+key+']';
            Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, schema_key);
        }
        else if (Object.prototype.toString.call(schema_key) === '[object Object]') {
            result[key] = result[key] || {};
            prefix += '['+key+']';
            Model.prototype.createBasedOnSchema(result[key], doc[key], originalDoc, enforce, prefix, schema_key);
        }
    }


    if (enforce) {
        // TODO Throw if doc has too many fields
    }

}
// Helper for createdBasedOnSchema
Model.prototype.checkType = function(result, doc, originalDoc, schema, key, type, typeOf, prefix, enforce) {
    var schema_key = (typeof key === 'number')? schema[0] : schema[key];

    if (schema_key === type) {
        if (typeof doc[key] === typeOf) {
            result[key] = doc[key];
        }
        else if (enforce) {
            throw new Error("Value for "+prefix+"["+key+"] must be a "+type.name)
        }
        return true;
    }

    if ((Object.prototype.toString.call(schema_key) === '[object Object]') && (schema_key._type == type)) {
        if (typeof doc[key] === typeOf) {
            result[key] = doc[key];
        }
        else if ((doc[key] == null) && (schema_key['default'] != null)) {
            if (typeof schema_key['default'] === 'function') {
                result[key] = schema_key['default'](originalDoc);
                if ((enforce) && (result[key] !== typeOf)) {
                    throw new Error("The default function did not return a "+type.name+" for "+prefix+"["+key+"]");
                }
            }
            else if (typeof schema_key['default'] === typeOf) {
                result[key] = schema_key['default']; // We are sure that we get the good type here since we have tested it before
            }
        }
        else if (enforce) {
            throw new Error("Value for "+prefix+"["+key+"] must be a "+type.name);
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
    model.thinky.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        var query;
        var docSettings = self.getSettings()
        
        if (docSettings.saved === true) {
            var primaryKey = model.getPrimaryKey();
            //TODO remove the r.expr around self when the driver will be fixed regarding circular reference
            r.table(model.name).get(self[primaryKey]).update(r.expr(self), {returnVals: true}).run(connection, function(error, result) {
                if (error) {
                    if ((callback) && (typeof callback === 'function')) callback(error, null);;
                }
                else if ((result) && (result.errors > 0)) {
                    if ((callback) && (typeof callback === 'function')) callback(result, null);
                }
                else {
                    self.replace(result.new_val);

                    if ((callback) && (typeof callback === 'function')) callback(error, self);
                    model.thinky.pool.release(connection);
                    self.emit('save', self, result.old_val);
                }
            });

        }
        else {
            //TODO remove the r.expr around self when the driver will be fixed regarding circular reference
            r.db('test').table(model.name).insert(r.expr(self), {returnVals: true}).run(connection, function(error, result) {
                if (error) {
                    if ((callback) && (typeof callback === 'function')) callback(error, null);
                }
                else if ((result) && (result.errors > 0)) {
                    if ((callback) && (typeof callback === 'function')) callback(result, null);;
                }
                else {
                    self.replace(result.new_val);
                    self.getSettings().saved = true;
                    if ((callback) && (typeof callback === 'function')) callback(null, self);
                    // We can release the connection because we get back an object
                    model.thinky.pool.release(connection);
                    self.emit('save', self, result.old_val);
                }
            });

        }
    });
    return this;
};

Model.prototype.get = function(id, callback) {
    var self = this;
    var model = this.__proto__;
    model.thinky.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        if (Object.prototype.toString.call(id) === '[object Array]') {
            var table = r.table(model.name);
            table.getAll.apply(table, id).run( connection, function(error, cursor) {
                if (error) {
                    callback(error, null);
                    model.thinky.pool.release(connection);
                }
                else {
                    cursor.toArray( function(error, results) {
                        if (error) {
                            callback(error, null);
                            model.thinky.pool.release(connection);
                        }
                        else {
                            var docs = [];
                            for (var index in results) {
                                result = results[index];
                                var doc = new self(result, true);
                                docs.push(doc);
                            }
                            callback(null, docs);
                            model.thinky.pool.release(connection);
                        }
                    });
                }
            });
           
        }
        else {
            //TODO Handle type error
            r.table(model.name).get(id).run( connection, function(error, result) {
                var doc = null;
                if ((error == null) && (result != null)) {
                    doc = new self(result, true);
                }
                callback(error, doc);
                model.thinky.pool.release(connection);
            });
        }
    });
}

Model.prototype.filter = function(filter, callback) {
    var self = this;
    var model = this.__proto__;
    model.thinky.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        r.table(model.name).filter(filter).run( connection, function(error, cursor) {
            if (error) {
                callback(error, null);
                model.thinky.pool.release(connection);
            }
            else {
                cursor.toArray( function(error, results) {
                    if (error) {
                        callback(error, null);
                        model.thinky.pool.release(connection);
                    }
                    else {
                        var docs = [];
                        for (var index in results) {
                            result = results[index];
                            var doc = new self(result, true);
                            docs.push(doc);
                        }
                        callback(null, docs);
                        model.thinky.pool.release(connection);
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
    //TODO
}


var model = module.exports = exports = Model;
