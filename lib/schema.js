var util = require(__dirname+'/util.js');
var arrayPrefix = "__array"
module.exports.arrayPrefix = arrayPrefix;
// Return an array of paths with virtual fields
// Run on a valid schema
function getVirtualFields(schema, prefix, result) {
    if (util.isPlainObject(schema)) {
        if (schema._type !== undefined) {
            if (schema._type === "virtual") {
                result.push({
                    path: prefix,
                    value: schema.default,
                });
            }
            if (schema._type === Array) {
                getVirtualFields(schema.schema, prefix.concat(arrayPrefix), result);
            }
            else if (schema._type === Object) {
                getVirtualFields(schema.schema, prefix, result);
            }
        }
        else {
            util.loopKeys(schema, function(_schema, key) {
                getVirtualFields(_schema[key], prefix.concat(key), result);
            });
        }
    }
    else if (Array.isArray(schema)) {
        getVirtualFields(schema[0], prefix.concat(arrayPrefix), result);
    }

}
module.exports.getVirtualFields = getVirtualFields;

function generateVirtual(doc, defaultField, originalDoc, virtual) {
    var path = defaultField.path;
    var value = defaultField.value;
    var field = doc;

    var keepGoing = true;
    var virtualValue = virtual;

    for(var j=0; j<path.length-1; j++) {
        if (util.isPlainObject(virtualValue)) {
            virtualValue = virtualValue[path[j]];
        }
        else {
            virtualValue = undefined;
        }

        if (path[j] === arrayPrefix) {
            if (!Array.isArray(field)) {
                //TODO? Throw an error? Caught by validate?
            }
            else {
                for(var k=0; k<field.length; k++) {
                    generateVirtual(field[k], {path: defaultField.path.slice(j+1), value: defaultField.value}, this, virtual[k]);
                }
            }
            keepGoing = false;
        }
        else if (field === undefined) {
            //TODO?
        }
        else {
            field = field[path[j]];
            if (field === undefined) {
                // We do not populate parent of default fields by default
                return;
            }
        }
    }
    if (keepGoing) {
        if (value === undefined) {
            if (util.isPlainObject(virtualValue) && (virtualValue[[path[path.length-1]]] !== undefined)) {
                field[path[path.length-1]] = virtualValue[[path[path.length-1]]];
            }
        }
        else if ((typeof value === "function") && !Array.isArray(value._query)) {
            field[path[path.length-1]] = value.call(doc);
        }
        else {
            if (util.isPlainObject(value)) {
                field[path[path.length-1]] = util.deepCopy(value);
            }
            else if (value !== undefined) {
                field[path[path.length-1]] = value;
            }
        }
    }
    return doc;
}

module.exports.generateVirtual = generateVirtual;

function getDefaultFields(schema, prefix, result) {
    if (util.isPlainObject(schema)) {
        if (schema._type !== undefined) {
            if ((schema.default !== undefined) && (schema._type !== "virtual")) {
                result.push({
                    path: prefix,
                    value: schema.default,
                });
            }
            if (schema._type === Array) {
                getDefaultFields(schema.schema, prefix.concat(arrayPrefix), result);
            }
            else if (schema._type === Object) {
                getDefaultFields(schema.schema, prefix, result);
            }
        }
        else {
            util.loopKeys(schema, function(_schema, key) {
                getDefaultFields(_schema[key], prefix.concat(key), result);
            });
        }
    }
    else if (Array.isArray(schema)) {
        getDefaultFields(schema[0], prefix.concat(arrayPrefix), result);
    }
}
module.exports.getDefaultFields = getDefaultFields;

function generateDefault(doc, defaultField, originalDoc) {
    var path = defaultField.path;
    var value = defaultField.value;
    var field = doc;

    var keepGoing = true;
    for(var j=0; j<path.length-1; j++) {
        if (path[j] === arrayPrefix) {
            if (!Array.isArray(field)) {
                //TODO? Throw an error? Caught by validate?
            }
            else {
                for(var k=0; k<field.length; k++) {
                    generateDefault(field[k], {path: defaultField.path.slice(j+1), value: defaultField.value}, this);
                }
            }
            keepGoing = false;
        }
        else if (field === undefined) {
            //TODO?
        }
        else {
            field = field[path[j]];
            if (field === undefined) {
                // We do not populate parent of default fields by default
                return;
            }
        }
    }
    if (keepGoing && field[path[path.length-1]] === undefined) {
        if ((typeof value === "function") && !Array.isArray(value._query)) {
            field[path[path.length-1]] = value.call(doc);
        }
        else {
            if (util.isPlainObject(value)) {
                field[path[path.length-1]] = util.deepCopy(value);
            }
            else {
                field[path[path.length-1]] = value;
            }
        }
    }
    return doc;
}

module.exports.generateDefault = generateDefault;

function validateSchema(schema, prefix) {
    // Validate a schema and add the field _enum if needed
    prefix = prefix || '';
    if (util.isPlainObject(schema)) {
        util.loopKeys(schema, function(_schema, key) {
            if (Array.isArray(_schema[key])) {
                validateSchema(_schema[key], prefix+'['+key+']');
            }
            else if (util.isPlainObject(_schema[key])) {
                if (_schema[key].hasOwnProperty('_type')) {
                    if ((_schema[key]._type !== String)
                        && (_schema[key]._type !== Number)
                        && (_schema[key]._type !== Boolean)
                        && (_schema[key]._type !== Date)
                        && (_schema[key]._type !== Buffer)
                        && (_schema[key]._type !== Object)
                        && (_schema[key]._type !== Array)
                        && (_schema[key]._type !== 'Point')
                        && (_schema[key]._type !== 'virtual')) {
                        throw new Error("The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for "+prefix+"["+key+"]");
                    }

                    // Add the set with the valid values for an enum
                    if (Array.isArray(_schema[key].enum)) {
                        _schema[key]._enum = {}
                        for(var i=0; i<_schema[key].enum.length; i++) {
                            _schema[key]._enum[_schema[key].enum[i]] = true;
                        }
                    }
                }
                else {
                    validateSchema(_schema[key], prefix+'['+key+']');
                }
            }
            else if ((_schema[key] !== String)
                && (_schema[key] !== Number)
                && (_schema[key] !== Boolean)
                && (_schema[key] !== Date)
                && (_schema[key] !== Buffer)
                && (_schema[key] !== Object)
                && (_schema[key] !== Array)
                && (_schema[key] !== 'Point')
                && (_schema[key] !== 'virtual')) {

                throw new Error("The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for "+prefix+"["+key+"]");
            }
        });
    }
    else if (Array.isArray(schema)) {
        if (schema.length > 1) {
            throw new Error("An array in a schema can have at most one element. Found "+schema.length+" elements in "+prefix)
        }
        else if (schema.length === 1) {
            if (util.isPlainObject(schema[0])) {
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
                    && (schema[0] !== Buffer)
                    && (schema[0] !== Object)
                    && (schema[0] !== Array)
                    && (schema[0] !== 'Point')) {

                    throw new Error("The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'Point'` in "+prefix);
                }
            }
        }
    }
    else {
        throw new Error("The schema must be a plain object.")
    }
}
module.exports.validateSchema = validateSchema;

function undefinedField(prefix) {
    throw new Error("Value for "+prefix+" must be defined.")
}
module.exports.undefinedField = undefinedField;

function strictType(prefix, expected) {
    throw new Error("Value for "+prefix+" must be a "+expected+".")
}
module.exports.strictType = strictType;

function extraField(prefix, key) {
    if (prefix === '') {
        throw new Error("Extra field `"+key+"` not allowed.")
    }
    else {
        throw new Error("Extra field `"+key+"` in "+prefix+" not allowed.")
    }
}
module.exports.extraField = extraField;

function looseType(prefix, expected) {
    throw new Error("Value for "+prefix+" must be a "+expected+" or null.")
}
module.exports.looseType = looseType;

function pseudoTypeError(type, missingField, prefix) {
    throw new Error("The raw "+type+" object for "+prefix+" is missing the required field "+missingField+".")
}
module.exports.pseudoTypeError = pseudoTypeError;

// The schema doesn't contain joined docs
function validate(doc, schema, prefix, options, originalDoc) {
    // An element in an array can never be undefined because RethinkDB doesn't support such type
    var typeOf, className, key
    var fieldChecked = false;
    var localOptions;

    // Set the local settings
    if (util.isPlainObject(schema) && (schema._type !== undefined) && (util.isPlainObject(schema.options))) {
        // We need a deepcopy because we are going to pass the options around and overwrite them
        localOptions = {};
        localOptions.enforce_missing = (schema.options.enforce_missing != null) ? schema.options.enforce_missing : options.enforce_missing;
        localOptions.enforce_type = (schema.options.enforce_type != null) ? schema.options.enforce_type : options.enforce_type;
        localOptions.enforce_extra = (schema.options.enforce_extra != null) ? schema.options.enforce_extra : options.enforce_extra;
    }
    else {
         localOptions = options;
    }

    var schemaType = getType(schema);

    switch(schemaType) {
        case String:
            validateString(doc, schema, prefix, localOptions);
            break;
        case Number:
            validateNumber(doc, schema, prefix, localOptions);
            break;
        case Boolean:
            validateBoolean(doc, schema, prefix, localOptions);
            break;
        case Date:
            validateDate(doc, schema, prefix, localOptions);
            break;
        case "Point":
            validatePoint(doc, schema, prefix, localOptions)
            break;
        case Buffer:
            validateBuffer(doc, schema, prefix, localOptions);
            break;
        default:
            if (Array.isArray(schema) || (util.isPlainObject(schema) && schema._type === Array)) {
                if (validateNotNullUndefined(doc, prefix, "array", localOptions)) return;

                if (Array.isArray(doc)) {
                    for(var i=0; i<doc.length; i++) {
                        if (doc[i] === undefined) {
                            throw new Error("The element in the array "+prefix+" (position "+i+") cannot be `undefined`.");
                        }

                        if (Array.isArray(schema)) {
                            validate(doc[i], schema[0], prefix+'['+i+']', localOptions, originalDoc)
                        }
                        else {
                            validate(doc[i], schema.schema, prefix+'['+i+']', localOptions, originalDoc)
                        }
                    }
                }
                else {
                    if (localOptions.enforce_type === "strict") {
                        strictType(prefix, "array");
                    }
                    else if (localOptions.enforce_type === "loose") {
                        looseType(prefix, "array");
                    }
                }
            }
            else if (util.isPlainObject(schema) && schema._type === 'virtual') {
                // Since virtual fields are not saved, we do not enforce anything here
            }
            else if (util.isPlainObject(schema)) {
                if (validateNotNullUndefined(doc, prefix, "object", localOptions)) return;

                if (util.isPlainObject(doc)) {
                    if (schema._type !== undefined) {
                        util.loopKeys(schema.schema, function(nextSchema, key) {
                            validate(doc[key], nextSchema[key], prefix+'['+key+']', localOptions, originalDoc)
                        });
                    }
                    else {
                        util.loopKeys(schema, function(schema, key) {
                            validate(doc[key], schema[key], prefix+'['+key+']', localOptions, originalDoc)
                        });
                    }
                }
                else {
                    if (localOptions.enforce_type === "strict") {
                        strictType(prefix, "object");
                    }
                    else if (localOptions.enforce_type === "loose") {
                        looseType(prefix, "object");
                    }
                }

                validateCustomizedValidator(doc, schema, prefix);
            }
    }


    //if localOptions.enforce_extra is true or "remove", we may have work to do
    if ((localOptions.enforce_extra === "remove") || (localOptions.enforce_extra === "strict")) {
        util.loopKeys(doc, function(doc, key) {
            if (((doc._getModel == null) || (doc._getModel()._joins.hasOwnProperty(key) === false)) && (doc.hasOwnProperty(key)) &&
                (util.isPlainObject(schema) && (schema._type === undefined) && (schema.hasOwnProperty(key) === false))
                || (util.isPlainObject(schema) && (schema._type === Object) && (util.isPlainObject(schema.schema)) && (schema.schema.hasOwnProperty(key) === false))) {

                if (localOptions.enforce_extra === 'remove') {
                    delete doc[key]
                }
                else if (localOptions.enforce_extra === 'strict') {
                    extraField(prefix, key);
                }
            }
        });
    }
}
module.exports.validate = validate;

function getType(schema) {
    if (util.isPlainObject(schema) && (schema._type !== undefined)) {
        return schema._type;
    }
    return schema;
}

// Return true if doc is undefined or null, else false
// Can throw
function validateNotNullUndefined(doc, prefix, type, options) {
    if (doc === undefined) {
        if (options.enforce_missing === true) {
            undefinedField(prefix);
        }
        return true;
    }
    else if (doc === null) {
        if (options.enforce_type === "strict") {
            strictType(prefix, type);
        }
        return true;
    }
    return false;
}
function validateEnum(doc, schema, prefix) {
    if (Array.isArray(schema.enum) && (schema._enum[doc] !== true)) {
        var validValues = Object.keys(schema._enum);
        var message = "The field "+prefix+" must be one of these values: "

        for(var i=0; i<validValues.length; i++) {
            if (i === 10) { break; }
            if ((i === validValues.length-1) || (i === 9)) {
                message = message+validValues[i]
            }
            else {
                message = message+validValues[i]+", "
            }
        }
        if (validValues.length > 10) {
            message = message+"..."
        }
        else {
            message = message+"."
        }

        throw new Error(message);
    }
}
// Check that schema is a valid object first
function validateCustomizedValidator(doc, schema, prefix) {
    if (typeof schema.validator === 'function') {
        if (schema.validator(doc) === false) {
            throw new Error("Validator for the field "+prefix+" returned `false`.");
        }
    }
}

function validateString(doc, schema, prefix, options) {
    if (validateNotNullUndefined(doc, prefix, "string", options)) return;

    if (typeof doc !== "string") { // doc is not null/undefined
        if (options.enforce_type === "strict") {
            strictType(prefix, "string");
        }
        else if (options.enforce_type === "loose") {
            looseType(prefix, "string");
        }
    }

    if (util.isPlainObject(schema)) {
        validateCustomizedValidator(doc, schema, prefix);
        validateEnum(doc, schema, prefix);
    }
}

function validateNumber(doc, schema, prefix, options) {
    if (validateNotNullUndefined(doc, prefix, "number", options)) return;

    if (typeof doc !== "number") { // doc is not null/undefined
        if (options.enforce_type === "strict") {
            strictType(prefix, "number");
        }
        else if (options.enforce_type === "loose") {
            looseType(prefix, "number");
        }
    }

    if (util.isPlainObject(schema)) {
        validateCustomizedValidator(doc, schema, prefix);
        validateEnum(doc, schema, prefix);
    }

}

function validateBoolean(doc, schema, prefix, options) {
    if (validateNotNullUndefined(doc, prefix, "boolean", options)) return;

    if (typeof doc !== "boolean") { // doc is not null/undefined
        if (options.enforce_type === "strict") {
            strictType(prefix, "boolean");
        }
        else if (options.enforce_type === "loose") {
            looseType(prefix, "boolean");
        }
    }

    if (util.isPlainObject(schema)) {
        validateCustomizedValidator(doc, schema, prefix);
        validateEnum(doc, schema, prefix);
    }
}

function validateDate(doc, schema, prefix, options) {
    if (validateNotNullUndefined(doc, prefix, "date", options)) return;

    if (options.enforce_type !== "none") {
        if (util.isPlainObject(doc) && (doc["$reql_type$"] === "TIME")) {
            if (doc.epoch_time === undefined) {
                pseudoTypeError("date", "epoch_time", prefix);
            }
            else if (doc.timezone === undefined) {
                pseudoTypeError("date", "timezone", prefix);
            }
        }
        else if ((typeof doc === 'function') && (Array.isArray(doc._query))) {
            // TOIMPROVE -- we currently just check if it's a term from the driver
            // We suppose for now that this is enough and we don't throw an error
        }
        else if (typeof doc === 'string') {
            var date = new Date(doc);
            if (date.getTime() !== date.getTime()) {
                if (options.enforce_type === "strict") {
                    strictType(prefix, "date or a valid string");
                }
                else if (options.enforce_type !== "none") {
                    looseType(prefix, "date or a valid string");
                }
            }
        }
        else if ((doc instanceof Date) === false)  {
            if (options.enforce_type === "strict") {
                strictType(prefix, "date");
            }
            else if (options.enforce_type !== "none") {
                looseType(prefix, "date");
            }
        }
    }

    if (util.isPlainObject(schema)) {
        validateCustomizedValidator(doc, schema, prefix);
    }
}

function validatePoint(doc, schema, prefix, options) {
    if (validateNotNullUndefined(doc, prefix, "point", options)) return;

    if (options.enforce_type !== "none") {
        if (util.isPlainObject(doc) && (doc["$reql_type$"] === "GEOMETRY")) {
            if (doc.type === undefined) {
                pseudoTypeError("Point", "type", prefix);
            }
            else if (doc.type !== "Point") {
                throw new Error("The field `type` for "+prefix+" must be `'Point'`.")
            }
            else if (doc.coordinates === undefined) {
                pseudoTypeError("date", "coordinates", prefix);
            }
            else if ((!Array.isArray(doc.coordinates)) || (doc.coordinates.length !== 2)) {
                throw new Error("The field `coordinates` for "+prefix+" must be an Array of two numbers.")
            }
        }
        else if (util.isPlainObject(doc) && (doc.type === "Point") && (Array.isArray(doc.coordinates)) && (doc.coordinates.length === 2)) { // Geojson
            // Geojson format
        }
        else if ((typeof doc === 'function') && (Array.isArray(doc._query))) {
            // TOIMPROvE -- we currently just check if it's a term from the driver
            // We suppose for now that this is enough and we don't throw an error
        }
        else if (util.isPlainObject(doc)) {
            var keys = Object.keys(doc).sort();
            if (((keys.length !== 2) || keys[0] !== 'latitude') || (keys[1] !== 'longitude') || (typeof doc.latitude !== "number") || (typeof doc.longitude !== "number")) {
                throw new Error("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
            }
            else if ((typeof doc.latitude !== 'number') || (typeof doc.latitude !== 'number')) {
                throw new Error("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
            }
        }
        else if (Array.isArray(doc)) {
            if ((doc.length !== 2) || (typeof doc[0] !== "number") || (typeof doc[1] !== "number")) {
                throw new Error("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
            }
        }
    }
    if (util.isPlainObject(schema)) {
        validateCustomizedValidator(doc, schema, prefix);
    }
}

function validateBuffer(doc, schema, prefix, options) {
    if (validateNotNullUndefined(doc, prefix, "buffer", options)) return;

    if (util.isPlainObject(doc) && (doc["$reql_type$"] === "BINARY")) {
        if (doc.data === undefined) {
            pseudoTypeError("binary", "data", prefix);
        }
    }
    else if ((typeof doc === 'function') && (Array.isArray(doc._query))) {
        // TOIMPROvE -- we currently just check if it's a term from the driver
        // We suppose for now that this is enough and we don't throw an error
    }
    else if ((doc instanceof Buffer) === false)  {
        if (options.enforce_type === "strict") {
            strictType(prefix, "buffer");
        }
        else if (options.enforce_type !== "none") {
            looseType(prefix, "buffer");
        }
    }

    if (util.isPlainObject(schema)) {
        validateCustomizedValidator(doc, schema, prefix);
    }
}
