var genFunc = require('generate-function');
var genObj = require('generate-object-property');
var util = require(__dirname+'/util.js');


function validatePrimitive(doc, localOptions, typeOf, prefix, Enum, _Enum) {
    if (doc === undefined) {
        if (localOptions.enforce_missing === true) {
            util.undefinedField(prefix);
        }
    }
    else if (doc === null) {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, typeOf);
        }
    }
    else if (typeof doc !== typeOf) { // doc is not null/undefined
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, typeOf);
        }
        else if (localOptions.enforce_type === "loose") {
            util.looseType(prefix, typeOf);
        }
    }
    else if (Enum && _Enum) {
        if (_Enum[doc] !== true) {
            var validValues = Object.keys(_Enum);
            var message = "The field "+prefix+" must be one of these values: ";

            for(var i=0; i<validValues.length; i++) {
                if (i === 10) { break; }
                if ((i === validValues.length-1) || (i === 9)) {
                    message = message+validValues[i];
                }
                else {
                    message = message+validValues[i]+", ";
                }
            }
            if (validValues.length > 10) {
                message = message+"...";
            }
            else {
                message = message+".";
            }

            throw new Error(message);
        }
    }
}

function validateDate(doc, localOptions, prefix) {
    if (doc === undefined) {
        if (localOptions.enforce_missing === true) {
            util.undefinedField(prefix);
        }
    }
    else if (doc === null) {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, "date");
        }
    }
    else if (localOptions.enforce_type !== "none") {
        if (util.isPlainObject(doc) && (doc["$reql_type$"] === "TIME")) {
            if (doc.epoch_time === undefined) {
                util.pseudoTypeError("date", "epoch_time", prefix);
            }
            else if (doc.timezone === undefined) {
                util.pseudoTypeError("date", "timezone", prefix);
            }
        }
        else if ((typeof doc === 'function') && (Array.isArray(doc._query))) {
            // TOIMPROvE -- we currently just check if it's a term from the driver
            // We suppose for now that this is enough and we don't throw an error
        }
        else if (typeof doc === 'string') {
            var date = new Date(doc);
            if (date.getTime() !== date.getTime()) {
                if (localOptions.enforce_type === "strict") {
                    util.strictType(prefix, "date or a valid string");
                }
                else if (localOptions.enforce_type !== "none") {
                    util.looseType(prefix, "date or a valid string");
                }
            }
        }
        else if ((doc instanceof Date) === false)  {
            if (localOptions.enforce_type === "strict") {
                util.strictType(prefix, "date");
            }
            else if (localOptions.enforce_type !== "none") {
                util.looseType(prefix, "date");
            }
        }
    }
}

function validateBuffer(doc, localOptions, prefix) {
    if (doc === undefined) {
        if (localOptions.enforce_missing === true) {
            util.undefinedField(prefix);
        }
    }
    else if (doc === null) {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, "date");
        }
    }
    else if (util.isPlainObject(doc) && (doc["$reql_type$"] === "BINARY")) {
        if (doc.data === undefined) {
            util.pseudoTypeError("binary", "data", prefix);
        }
    }
    else if ((typeof doc === 'function') && (Array.isArray(doc._query))) {
        // TOIMPROvE -- we currently just check if it's a term from the driver
        // We suppose for now that this is enough and we don't throw an error
    }
    else if ((doc instanceof Buffer) === false)  {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, "buffer");
        }
        else if (localOptions.enforce_type !== "none") {
            util.looseType(prefix, "buffer");
        }
    }
}

function validatePoint(doc, localOptions, prefix) {
    if (doc === undefined) {
        if (localOptions.enforce_missing === true) {
            util.undefinedField(prefix);
        }
    }
    else if (doc === null) {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, "date");
        }
    }
    else if (localOptions.enforce_type !== "none") {
        if (util.isPlainObject(doc) && (doc["$reql_type$"] === "GEOMETRY")) {
            if (doc.type === undefined) {
                util.pseudoTypeError("Point", "type", prefix);
            }
            else if (doc.type !== "Point") {
                throw new Error("The field `type` for "+prefix+" must be `'Point'`.");
            }
            else if (doc.coordinates === undefined) {
                util.pseudoTypeError("date", "coordinates", prefix);
            }
            else if ((!Array.isArray(doc.coordinates)) || (doc.coordinates.length !== 2)) {
                throw new Error("The field `coordinates` for "+prefix+" must be an Array of two numbers.");
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
}

function validateDocNotNull(doc, localOptions, prefix) {
    if (doc === undefined) {
        if (localOptions.enforce_missing === true) {
            util.undefinedField(prefix);
        }
    }
    else if (doc === null) {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, "object");
        }
    }
    else if (!util.isPlainObject(doc)) {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, "object");
        }
        else if (localOptions.enforce_type === "loose") {
            util.looseType(prefix, "object");
        }
    }
}

function validateDocIsArray(doc, localOptions, prefix) {
    if (doc === undefined) {
        if (localOptions.enforce_missing === true) {
            util.undefinedField(prefix);
        }
    }
    else if (doc === null) {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, "array");
        }
    }
    else if (!Array.isArray(doc)) {
        if (localOptions.enforce_type === "strict") {
            util.strictType(prefix, "array");
        }
        else if (localOptions.enforce_type === "loose") {
            util.looseType(prefix, "array");
        }
    }
}

function validateExtraFields(doc, schema, localOptions, prefix) {
    if ((localOptions.enforce_extra !== "none")) {
        for(var key in doc) {
            if (((doc._getModel == null) || (doc._getModel()._joins.hasOwnProperty(key) === false)) && (doc.hasOwnProperty(key)) &&
                (util.isPlainObject(schema) && (schema._type === undefined) && (schema.hasOwnProperty(key) === false))
                || (util.isPlainObject(schema) && (schema._type === Object) && (util.isPlainObject(schema.schema)) && (schema.schema.hasOwnProperty(key) === false))) {

                if (localOptions.enforce_extra === 'remove') {
                    delete doc[key];
                }
                else if (localOptions.enforce_extra === 'strict') {
                    util.extraField(prefix, key);
                }
            }
        }
    }
}

function getType(schema) {
    if (util.isPlainObject(schema) && schema._type){
        return schema._type;
    }
    else {
        return schema;
    }
}

function isSchema(object) {
    return util.isPlainObject(object) && object._type === undefined;
}

function getSchema(node) {
    if (getType(node) === Object || getType(node) === Array) {
        return node.schema;
    }
    else if (Array.isArray(node)) {
        return getSchema(node[0]);
    }
    else {
        return node;
    }
}

function mergeSchemaOption(base, local) {
    if (local) {
        base = util.deepCopy(base);
        base.enforce_missing = local.enforce_missing == null ? base.enforce_missing : local.enforce_missing;
        base.enforce_extra = local.enforce_extra == null ? base.enforce_extra : local.enforce_extra;
        base.enforce_type = local.enforce_type == null ? base.enforce_type : local.enforce_type;
    }
    return base;
}

function visit(validate, key, node, path, validateContext) {
    var nodeType = getType(node);
    path = key === "[i]" ? path + key : genObj(path, key);
    var field = "doc" + path;
    var subSchema;

    if (node && (typeof node.validator === 'function')) {
        validateContext.schemas[path] = node;
        validate("if (%s.validator(%s) === false) throw new Error(\"Validator for the field %s returned `false`.\")",
            genObj("schemas", path), field, path);
    }

    if (nodeType === Number) {
        var Enum, _Enum;
        if (Array.isArray(node.enum) && (util.isPlainObject(node._enum))) {
            Enum = node.enum;
            _Enum = node._enum;
        }
        validate("validatePrimitive(%s, %s, 'number', prefix+'%s', %s, %s);",
            field,
            node.options ? "mergeSchemaOption(options, " + JSON.stringify(node.options) + ")" : 'options',
            path,
            Enum ? JSON.stringify(Enum) : 'undefined',
            _Enum ? JSON.stringify(_Enum) : 'undefined'
        );
    }
    else if (nodeType === String) {
        var Enum, _Enum;
        if (Array.isArray(node.enum) && (util.isPlainObject(node._enum))) {
            Enum = node.enum;
            _Enum = node._enum;
        }
        validate("validatePrimitive(%s, %s, 'string', prefix+'%s', %s, %s);",
            field,
            node.options ? "mergeSchemaOption(options, " + JSON.stringify(node.options) + ")" : 'options',
            path,
            Enum ? JSON.stringify(Enum) : 'undefined',
            _Enum ? JSON.stringify(_Enum) : 'undefined'
        );
    }
    else if (nodeType === Boolean) {
        var Enum, _Enum;
        if (Array.isArray(node.enum) && (util.isPlainObject(node._enum))) {
            Enum = node.enum;
            _Enum = node._enum;
        }
        validate("validatePrimitive(%s, %s, 'boolean', prefix+'%s', %s, %s);",
            field,
            node.options ? "mergeSchemaOption(options, " + JSON.stringify(node.options) + ")" : 'options',
            path,
            Enum ? JSON.stringify(Enum) : 'undefined',
            _Enum ? JSON.stringify(_Enum) : 'undefined'
        );
    }
    else if (nodeType === Date) {
        validate("validateDate(%s, %s, prefix+'%s');",
            field,
            node.options ? "mergeSchemaOption(options, " + JSON.stringify(node.options) + ")" : 'options',
            path);
    }
    else if (nodeType === Buffer) {
        validate("validateBuffer(%s, %s, prefix+'%s');",
            field,
            node.options ? "mergeSchemaOption(options, " + JSON.stringify(node.options) + ")" : 'options',
            path);
    }
    else if (nodeType === "Point") {
        validate("validatePoint(%s, %s, prefix+'%s');",
            field,
            node.options ? "mergeSchemaOption(options, " + JSON.stringify(node.options) + ")" : 'options',
            path);
    }
    else if (nodeType === Array || Array.isArray(node)) {
        validate("validateDocIsArray(%s, options, prefix+'%s');", field, path);
        subSchema = getSchema(node);
        if (subSchema) {
            if (node.options) {
                validate("optionStack.push(mergeSchemaOption(options, " + JSON.stringify(node.options) + ");");
                validate("options = optionStack[optionStack.length - 1];");
            }
            validate("if (Array.isArray(%s)) {", field);
            validate("for (var i=0;i<%s.length;i++) {", field);
            validate('if (%s === undefined) throw new Error("The element in the array %s (position "+i+") cannot be `undefined`.");', field + "[i]", path);
            visit(validate, "[i]", subSchema, path, validateContext);
            validate("}");
            validate("}");
            if (node.options) {
                validate("optionStack.pop();");
                validate("options = optionStack[optionStack.length - 1];");
            }
        }
    }
    else if (nodeType === Object || isSchema(node)) {
        validate("validateDocNotNull(%s, options, prefix+'%s');", field, path);
        subSchema = getSchema(node);
        if (subSchema) {
            if (node.options) {
                validate("optionStack.push(mergeSchemaOption(options, " + JSON.stringify(node.options) + "));");
                validate("options = optionStack[optionStack.length - 1];");
            }
            validate("if (util.isPlainObject(%s)) {", field);
            var subKeys = Object.keys(subSchema);
            for (var i=0;i<subKeys.length;i++) {
                var subKey = subKeys[i];
                var subNode = subSchema[subKey];

                visit(validate, subKey, subNode, path, validateContext);
            }
            validate("}");
            validateContext.schemas[path] = subSchema;
            validate('validateExtraFields(%s, schemas["%s"], %s, prefix+"%s");',
                field,
                path,
                node.options ? "mergeSchemaOption(options, " + JSON.stringify(node.options) + ")" : 'options',
                path);
            if (node.options) {
                validate("optionStack.pop();");
                validate("options = optionStack[optionStack.length - 1];");
            }
        }
    }
    else if (nodeType === "virtual") {
    }
}

var compile = module.exports = function (name, schema) {
    var validate =  genFunc()("function _validate_%s(doc, prefix, options) {", name)
    ("var optionStack = [options];");
    var schemaKeys = Object.keys(schema);
    var validateContext = {
        validatePrimitive: validatePrimitive,
        validateDate: validateDate,
        validatePoint: validatePoint,
        validateBuffer: validateBuffer,
        validateDocNotNull: validateDocNotNull,
        validateDocIsArray: validateDocIsArray,
        validateExtraFields: validateExtraFields,

        mergeSchemaOption: mergeSchemaOption,
        util: util,
        schemas: {"root": schema}
    };

    for (var i=0;i<schemaKeys.length;i++) {
        var key = schemaKeys[i];
        var node = schema[key];

        visit(validate, key, node, "", validateContext);
    }

    validate('validateExtraFields(doc, schemas.root, options, prefix);');

    validate("}");

    return validate.toFunction(validateContext);
};
