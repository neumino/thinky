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
                if (schema[key].length != 1) {
                    throw new Error("An array in schema can have only one element. Found "+schema[key].length+" element(s) in "+prefix+"["+key+"]")
                }
                else {
                    validateSchema(schema[key][0], prefix+'['+key+'][0]');
                }
            }
            else if (isPlainObject(schema[key])) {
                if (schema[key].hasOwnProperty('_type')) {
                    if ((schema[key] === String)
                        || (schema[key] === Number)
                        || (schema[key] === Boolean)
                        || (schema[key] === Date)
                        || (schema[key] === Object)
                        || (schema[key] === Array)) {
                    }
                    else {
                        throw new Error("The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` in "+prefix);
                    }
                }
                else {
                    validateSchema(schema[key], prefix+'['+key+']');
                }
            }
            else if ((schema[key] === String)
                || (schema[key] === Number)
                || (schema[key] === Boolean)
                || (schema[key] === Date)) {
                    // Well, everything's ok here 
            }
            else {
                throw new Error("The value must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` for "+prefix);
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

