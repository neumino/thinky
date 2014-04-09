var util = require('util');
function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}
util.isPlainObject = isPlainObject;

function validateSchema(schema, prefix) {
    prefix = prefix || '';
    if (isPlainObject(schema)) {
        for(key in schema) {
            if (Array.isArray(schema[key])) {
                validateSchema(schema[key], prefix+'['+key+']');
            }
            else if (isPlainObject(schema[key])) {
                if (schema[key].hasOwnProperty('_type')) {
                    if ((schema[key]._type !== String)
                        && (schema[key]._type !== Number)
                        && (schema[key]._type !== Boolean)
                        && (schema[key]._type !== Date)
                        && (schema[key]._type !== Object)
                        && (schema[key]._type !== Array)) {
                        throw new Error("The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` for "+prefix+"["+key+"]");
                    }
                }
                else {
                    validateSchema(schema[key], prefix+'['+key+']');
                }
            }
            else if ((schema[key] !== String)
                && (schema[key] !== Number)
                && (schema[key] !== Boolean)
                && (schema[key] !== Date)
                && (schema[key] !== Object)
                && (schema[key] !== Array)) {

                throw new Error("The value must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` for "+prefix+"["+key+"]");
            }
        }
    }
    else if (Array.isArray(schema)) {
        if (schema.length > 1) {
            throw new Error("An array in a schema can have at most one element. Found "+schema.length+" elements in "+prefix)
        }
        else if (schema.length === 1) {
            if (isPlainObject(schema[0])) {
                validateSchema(schema[0], prefix+'[0]');
            }
            else if (Array.isArray(schema[0])) {
                validateSchema(schema[0], prefix+'[0]');
            }
            else{
                if ((schema[0] !== String)
                    && (schema[0] !== Number)
                    && (schema[0] !== Boolean)
                    && (schema[0] !== Date)
                    && (schema[0] !== Object)
                    && (schema[0] !== Array)) {

                    throw new Error("The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` in "+prefix);
                }
            }
        }
    }
    else {
        throw new Error("The schema must be a plain object.")
    }
}
util.validateSchema = validateSchema;

// Obviously not a real deep copy...
function deepCopy(value) {
    var result;
    if (isPlainObject(value) === true) {
        result = {};
        for(var key in value) {
            result[key] = deepCopy(value[key]);
        }
        return result;
    }
    else if (Array.isArray(value)) {
        result = []
        for(var i=0; i<value.length; i++) {
            result.push(deepCopy(value[i]));
        }
        return result;
    }
    else {
        return value;
    }
}
util.deepCopy = deepCopy;

function undefinedField(prefix, key) {
    throw new Error("Value for "+prefix+"["+key+"] must be defined.")
}
util.undefinedField = undefinedField;

function strictType(prefix, key, expected) {
    throw new Error("Value for "+prefix+"["+key+"] must be a "+expected+".")
}
util.strictType = strictType;

function looseType(prefix, key, expected) {
    throw new Error("Value for "+prefix+"["+key+"] must be a "+expected+" or null.")
}
util.looseType = looseType;
function pseudoTimeError(missingField, prefix, key) {
    throw new Error("The raw date object for "+prefix+"["+key+"] is missing the required field "+missingField+".")
}
util.pseudoTimeError = pseudoTimeError;

module.exports = util;

