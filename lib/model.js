var r = require('rethinkdb');
var Document = require('./document.js');

function Model(name, schema, settings, pool) {
    settings = settings || {};

    this.name = name;
    this.schema = schema;
    this.settings = {};
    if (settings) {
         this.primaryKey = (settings.primaryKey)? settings.primaryKey: 'id';
         this.enforce = (settings.enforce)? settings.enforce: false;
    }
    this.pool = pool;
}

Model.compile = function(name, schema, settings, rorm) {
    modelProto = new Model(name, schema, settings, rorm.pool);
    function model(doc, docSettings) {
        doc = doc || {};
        
        docSettings = docSettings || {};
        var enforce = (docSettings.enforce != null)? docSettings.enforce: modelProto.settings.enforce;

        result = {}
        modelProto.createBasedOnSchema(result, doc, doc, enforce);
        result.__proto__ = new Document(modelProto);
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





// Called on the model
Model.prototype.get = function(id, callback) {
    var self = this;
    var model = this.__proto__;
    model.pool.acquire( function(error, connection) {
        r.table(model.name).get(id).run( connection, function(error, result) {
            var doc = null;
            if ((error == null) && (result != null)) {
                doc = new self(result);
            }
            callback(error, doc);
        });
    });
}


// Called by the document
Model.prototype.getDocument = function() {
    return this.__proto__;
}
Model.prototype.getModel = function() {
    return this.__proto__.__proto__;
}

Model.prototype.defineOnModel = function(name, fn) {
    this.getModel()[name] = fn;
}

Model.prototype.insert = function(callback) {
    var self = this;
    var model = this.getModel();
    model.pool.acquire( function(error, connection) {
        if (error) throw error; // TODO don't throw
        r.table(model.name).insert(self).run(connection, function(error, result) {
            if ((result != null) && (result.generated_keys != null)) {
                var primaryKey = model.primaryKey || 'id';
                self[primaryKey] = result.generated_keys[0];
            }
            if ((callback) && (typeof callback === 'function')) callback(error, self);
            // We can release the connection because we get back an object
            model.pool.release(connection);
        });
    });
    return this;
};

Model.prototype.save = function(data, callback) {
    var self = this;
    var model = this.__proto__;
    if (doc[model.primaryKey]) {
        var primaKeyValue = (doc[model.primaryKey])
    }
    else {
    }
    model.pool.acquire( function(error, connection) {
        if (error) throw error; // TODO don't throw
        r.table(model.name).get(primaryKeyValue).update(self).run(connection, function(error, result) {
            if ((result != null) && (result.generated_keys != null)) {
                var primaryKey = model.primaryKey || 'id';
                self[primaryKey] = result.generated_keys[0];
            }
            if ((callback) && (typeof callback === 'function')) callback(error, self);
            // We can release the connection because we get back an object
            model.pool.release(connection);
        });
    });
    return this;
};

var model = module.exports = exports = Model;
