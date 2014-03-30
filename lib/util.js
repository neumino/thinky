function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}
module.exports.isPlainObject = isPlainObject;

function validateSchema(schema) {
    if (isPlainObject(schema)) {
        for(key in schema) {
            //TODO
        }
    }
    else {
        throw new Error("The schema must be a plain object.")
    }
}
module.exports.validateSchema = validateSchema;

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
module.exports.deepCopy = deepCopy;

function undefinedField(prefix, key) {
    throw new Error("Value for "+prefix+"["+key+"] must be defined.")
}
module.exports.undefinedField = undefinedField;

function strictType(prefix, key, expected) {
    throw new Error("Value for "+prefix+"["+key+"] must be a "+expected+".")
}
module.exports.strictType = strictType;

function looseType(prefix, key, expected) {
    throw new Error("Value for "+prefix+"["+key+"] must be a "+expected+" or null.")
}
module.exports.looseType = looseType;
