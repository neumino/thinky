var util = require(__dirname+'/util.js');
var schema = require(__dirname+'/schema.js');
var validator = require("validator");
var arrayPrefix = schema.arrayPrefix;

function Type() {
}

Type.prototype.string = function() {
    return new TypeString();
}
Type.prototype.number = function() {
    return new TypeNumber();
}
Type.prototype.boolean = function() {
    return new TypeBoolean();
}
Type.prototype.date = function() {
    return new TypeDate();
}
Type.prototype.buffer = function() {
    return new TypeBuffer();
}
Type.prototype.point = function() {
    return new TypePoint();
}
Type.prototype.object = function() {
    return new TypeObject();
}
Type.prototype.array = function() {
    return new TypeArray();
}
Type.prototype.virtual = function() {
    return new TypeVirtual();
}

Type.prototype.isString = function(obj) {
    return obj instanceof TypeString;
}
Type.prototype.isNumber = function(obj) {
    return obj instanceof TypeNumber;
}
Type.prototype.isBoolean = function(obj) {
    return obj instanceof TypeBoolean;
}
Type.prototype.isDate = function(obj) {
    return obj instanceof TypeDate;
}
Type.prototype.isBuffer = function(obj) {
    return obj instanceof TypeBuffer;
}
Type.prototype.isPoint = function(obj) {
    return obj instanceof TypePoint;
}
Type.prototype.isObject = function(obj) {
    return obj instanceof TypeObject;
}
Type.prototype.isArray = function(obj) {
    return obj instanceof TypeArray;
}
Type.prototype.isVirtual = function(obj) {
    return obj instanceof TypeVirtual;
}

function TypeString() {
    this._options = undefined;
    this._min = -1;
    this._max = -1;
    this._length = -1;
    this._alphanum = false;
    this._uppercase = false;
    this._lowercase = false;
    this._regex = undefined;
    this._validator = undefined;
    this._enum = undefined;
}
TypeString.prototype.options = function(options) {
    this._options = options;
    return this;
}
TypeString.prototype.min = function(min) {
    if (min < 0) {
        throw new Error("The value for `min` must be a positive integer");
    }
    this._min = min;
    return this;
}
TypeString.prototype.max = function(max) {
    if (max < 0) {
        throw new Error("The value for `max` must be a positive integer");
    }
    this._max = max;
    return this;
}
TypeString.prototype.length = function(length) {
    if (length < 0) {
        throw new Error("The value for `length` must be a positive integer");
    }
    this._length = length;
    return this;
}
TypeString.prototype.regex = function(regex, flags) {
    if (typeof flags === "string") {
        this._regex = new RegExp(regex, flags);
    }
    else {
        this._regex = new RegExp(regex);
    }
    return this;
}
TypeString.prototype.alphanum = function() {
    this._alphanum = true;
    return this;
}
TypeString.prototype.email = function() {
    this._email = true;
    return this;
}
TypeString.prototype.lowercase = function() {
    this._lowercase = true;
    return this;
}
TypeString.prototype.uppercase = function() {
    this._uppercase = true;
    return this;
}
TypeString.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
TypeString.prototype.validator = function(fn) {
    if (typeof fn === "function") {
        this._validator = fn;
    }
    return this;
}
TypeString.prototype.enum = function() {
    if ((arguments.length === 1) && (Array.isArray(arguments[0]))) {
        this._enum = {};
        for(var i=0; i<arguments[0].length; i++) {
            this._enum[arguments[0][i]] = true;
        }
    }
    else if ((arguments.length !== 1) || (arguments[0] !== undefined)) {
        this._enum = {};
        for(var i=0; i<arguments.length; i++) {
            this._enum[arguments[i]] = true;
        }
    }
    return this;
}
TypeString.prototype.validate = function(str, prefix, options) {
    options = util.mergeOptions(this._options, options);


    if (validateIfUndefined(str, prefix, "string", options)) return;

    if ((typeof this._validator === "function") && (this._validator(str) === false)) {
        throw new Error("Validator for the field "+prefix+" returned `false`.");
    }

    if (typeof str !== "string") {
        if (options.enforce_type === "strict") {
            strictType(prefix, "string");
        }
        else if ((options.enforce_type === "loose") && (str !== null)) {
            looseType(prefix, "string");
        }
    }
    else {
        if ((this._min !== -1) && (this._min > str.length)){
            throw new Error("Value for "+prefix+" must be longer than "+this._min+".") 
        }
        if ((this._max !== -1) && (this._max < str.length)){
            throw new Error("Value for "+prefix+" must be shorter than "+this._max+".") 
        }
        if ((this._length !== -1) && (this._length !== str.length)){
            throw new Error("Value for "+prefix+" must be a string with "+this._length+" characters.") 
        }
        if ((this._regex instanceof RegExp) && (this._regex.test(str) === false)) {
            throw new Error("Value for "+prefix+" must match the regex.") 
        }
        if ((this._alphanum === true) && (validator.isAlphanumeric(str) === false)) {
            throw new Error("Value for "+prefix+" must be an alphanumeric string.") 
        }
        if ((this._email === true) && (validator.isEmail(str) === false)) {
            throw new Error("Value for "+prefix+" must be a valid email.") 
        }
        if ((this._lowercase === true) && (validator.isLowercase(str) === false)) {
            throw new Error("Value for "+prefix+" must be a lowercase string.") 
        }
        if ((this._uppercase === true) && (validator.isUppercase(str) === false)) {
            throw new Error("Value for "+prefix+" must be a uppercase string.") 
        }
        if ((this._enum !== undefined) && (this._enum[str] !== true)) {
            var validValues = Object.keys(this._enum);
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
}
TypeString.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    if (this._default !== undefined) {
        defaultFields.push({
            path: prefix,
            value: this._default,
        });
    }
    return this;
}


function TypeNumber() {
    this._options = undefined;
    this._min = -1;
    this._max = -1;
    this._integer = false;
    this._validator = undefined;
}
TypeNumber.prototype.options = function(options) {
    this._options = options;
    return this;
}
TypeNumber.prototype.min = function(min) {
    if (min < 0) {
        throw new Error("The value for `min` must be a positive integer");
    }
    this._min = min;
    return this;
}
TypeNumber.prototype.max = function(max) {
    if (max < 0) {
        throw new Error("The value for `max` must be a positive integer");
    }
    this._max = max;
    return this;
}
TypeNumber.prototype.integer = function() {
    this._integer = true;
    return this;
}
TypeNumber.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
TypeNumber.prototype.validator = function(fn) {
    if (typeof fn === "function") {
        this._validator = fn;
    }
    return this;
}
TypeNumber.prototype.validate = function(number, prefix, options) {
    options = util.mergeOptions(this._options, options);

    if (validateIfUndefined(number, prefix, "number", options)) return;
    
    if ((typeof this._validator === "function") && (this._validator(number) === false)) {
        throw new Error("Validator for the field "+prefix+" returned `false`.");
    }

    if ((typeof number !== "number") || (isFinite(number) === false)) {
        if (options.enforce_type === "strict") {
            strictType(prefix, "finite number");
        }
        else if ((options.enforce_type === "loose") && (number !== null)) {
            looseType(prefix, "finite number");
        }
    }
    else {
        if ((this._min !== -1) && (this._min > number)){
            throw new Error("Value for "+prefix+" must be greater than "+this._min+".") 
        }
        if ((this._max !== -1) && (this._max < number)){
            throw new Error("Value for "+prefix+" must be less than "+this._max+".") 
        }
        if ((this._integer === true) && (number%1 !== 0)){
            throw new Error("Value for "+prefix+" must be an integer.") 
        }
    }
}
TypeNumber.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    if (this._default !== undefined) {
        defaultFields.push({
            path: prefix,
            value: this._default,
        });
    }
}


function TypeBoolean() {
    this._validator = undefined;
}

TypeBoolean.prototype.options = function(options) {
    this._options = options;
    return this;
}
TypeBoolean.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
TypeBoolean.prototype.validator = function(fn) {
    if (typeof fn === "function") {
        this._validator = fn;
    }
    return this;
}
TypeBoolean.prototype.validate = function(bool, prefix, options) {
    options = util.mergeOptions(this._options, options);

    if (validateIfUndefined(bool, prefix, "boolean", options)) return;

    if ((typeof this._validator === "function") && (this._validator(bool) === false)) {
        throw new Error("Validator for the field "+prefix+" returned `false`.");
    }

    if (typeof bool !== "boolean") {
        if (options.enforce_type === "strict") {
            strictType(prefix, "boolean");
        }
        else if ((options.enforce_type === "loose") && (bool !== null)) {
            looseType(prefix, "boolean");
        }
    }
}
TypeBoolean.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    if (this._default !== undefined) {
        defaultFields.push({
            path: prefix,
            value: this._default,
        });
    }
}



function TypeDate() {
    this._options = undefined;
    this._min = undefined;
    this._max = undefined;
    this._validator = undefined;
}

TypeDate.prototype.options = function(options) {
    this._options = options;
    return this;
}
TypeDate.prototype.min = function(min) {
    this._min = min;
    return this;
}
TypeDate.prototype.max = function(max) {
    this._max = max;
    return this;
}
TypeDate.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
TypeDate.prototype.validator = function(fn) {
    if (typeof fn === "function") {
        this._validator = fn;
    }
    return this;
}
TypeDate.prototype.validate = function(date, prefix, options) {
    options = util.mergeOptions(this._options, options);

    if (validateIfUndefined(date, prefix, "number", options)) return;

    if ((typeof this._validator === "function") && (this._validator(date) === false)) {
        throw new Error("Validator for the field "+prefix+" returned `false`.");
    }

    var jsDate;
    if (util.isPlainObject(date) && (date["$reql_type$"] === "TIME")) {
        if (date.epoch_time === undefined) {
            pseudoTypeError("date", "epoch_time", prefix);
        }
        else if (date.timezone === undefined) {
            pseudoTypeError("date", "timezone", prefix);
        }

        jsDate = new Date(0);
        jsDate.setUTCSeconds(date.epoch_time)
    }
    else if ((typeof date === 'function') && (Array.isArray(date._query))) {
        // TOIMPROVE -- we currently just check if it's a term from the driver
        // We suppose for now that this is enough and we don't throw an error
    }
    else if (typeof date === 'string') {
        jsDate = new Date(date);
        if (jsDate.getTime() !== jsDate.getTime()) {
            if (options.enforce_type === "strict") {
                strictType(prefix, "date or a valid string");
            }
            else if (options.enforce_type !== "none") {
                looseType(prefix, "date or a valid string");
            }
        }
    }
    else if ((date instanceof Date) === false) { // We have a non valid date
        if (options.enforce_type === "strict") {
            strictType(prefix, "date");
        }
        else if (options.enforce_type !== "none") {
            looseType(prefix, "date");
        }
    }
    else {
        jsDate = date;
    }

    // We check for min/max only if we could create a javascript date from the value
    if (jsDate !== undefined) {
        if ((this._min instanceof Date) && (this._min > jsDate)){
            throw new Error("Value for "+prefix+" must be after "+this._min+".") 
        }
        if ((this._max instanceof Date) && (this._max < jsDate)){
            throw new Error("Value for "+prefix+" must be before "+this._max+".") 
        }
    }
}
TypeDate.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    if (this._default !== undefined) {
        defaultFields.push({
            path: prefix,
            value: this._default,
        });
    }
}


function TypeBuffer() {
    this._options = undefined;
    this._validator = undefined;
}

TypeBuffer.prototype.options = function(options) {
    this._options = options;
    return this;
}
TypeBuffer.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
TypeBuffer.prototype.validator = function(fn) {
    if (typeof fn === "function") {
        this._validator = fn;
    }
    return this;
}
TypeBuffer.prototype.validate = function(buffer, prefix, options) {
    options = util.mergeOptions(this._options, options);

    if (validateIfUndefined(buffer, prefix, "buffer", options)) return;

    if ((typeof this._validator === "function") && (this._validator(buffer) === false)) {
        throw new Error("Validator for the field "+prefix+" returned `false`.");
    }

    if (util.isPlainObject(buffer) && (buffer["$reql_type$"] === "BINARY")) {
        if (buffer.data === undefined) {
            pseudoTypeError("binary", "data", prefix);
        }
    }
    else if ((typeof buffer === 'function') && (Array.isArray(buffer._query))) {
        // TOIMPROvE -- we currently just check if it's a term from the driver
        // We suppose for now that this is enough and we don't throw an error
    }
    else if ((buffer instanceof Buffer) === false)  { // We don't have a buffer
        if (options.enforce_type === "strict") {
            strictType(prefix, "buffer");
        }
        else if (options.enforce_type !== "none") {
            looseType(prefix, "buffer");
        }
    }
}
TypeBuffer.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    if (this._default !== undefined) {
        defaultFields.push({
            path: prefix,
            value: this._default,
        });
    }
}


function TypePoint() {
    this._options = undefined;
    this._validator = undefined;
}

TypePoint.prototype.options = function(options) {
    this._options = options;
    return this;
}
TypePoint.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
TypePoint.prototype.validator = function(fn) {
    if (typeof fn === "function") {
     this._validator = fn;
    }
    return this;
}
TypePoint.prototype.validate = function(point, prefix, options) {
    options = util.mergeOptions(this._options, options);

    if (validateIfUndefined(point, prefix, "point", options)) return;

    if ((typeof this._validator === "function") && (this._validator(point) === false)) {
        throw new Error("Validator for the field "+prefix+" returned `false`.");
    }

    if (util.isPlainObject(point) && (point["$reql_type$"] === "GEOMETRY")) {
        if (point.type === undefined) {
            pseudoTypeError("Point", "type", prefix);
        }
        else if (point.type !== "Point") {
            throw new Error("The field `type` for "+prefix+" must be `'Point'`.")
        }
        else if (point.coordinates === undefined) {
            pseudoTypeError("date", "coordinates", prefix);
        }
        else if ((!Array.isArray(point.coordinates)) || (point.coordinates.length !== 2)) {
            throw new Error("The field `coordinates` for "+prefix+" must be an Array of two numbers.")
        }
    }
    else if (util.isPlainObject(point) && (point.type === "Point") && (Array.isArray(point.coordinates)) && (point.coordinates.length === 2)) { // Geojson
        // Geojson format
    }
    else if ((typeof point === 'function') && (Array.isArray(point._query))) {
        // TOIMPROvE -- we currently just check if it's a term from the driver
        // We suppose for now that this is enough and we don't throw an error
    }
    else if (util.isPlainObject(point)) {
        var keys = Object.keys(point).sort();
        if (((keys.length !== 2) || keys[0] !== 'latitude') || (keys[1] !== 'longitude') || (typeof point.latitude !== "number") || (typeof point.longitude !== "number")) {
            throw new Error("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
        }
        else if ((typeof point.latitude !== 'number') || (typeof point.latitude !== 'number')) {
            throw new Error("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
        }
    }
    else if (Array.isArray(point)) {
        if ((point.length !== 2) || (typeof point[0] !== "number") || (typeof point[1] !== "number")) {
            throw new Error("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
        }
    }
    else { // We don't have a point
        if (options.enforce_type === "strict") {
            strictType(prefix, "Point");
        }
        else if ((options.enforce_type === "loose") && (point !== null)) {
            looseType(prefix, "Point");
        }
    }
}
TypePoint.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    if (this._default !== undefined) {
        defaultFields.push({
            path: prefix,
            value: this._default,
        });
    }
}


function TypeObject() {
    this._options = undefined;
    this._validator = undefined;
    this._schema = {};
}

TypeObject.prototype._setModel = function(model) {
    this._model = model;
    return this;
}

TypeObject.prototype.options = function(options) {
    this._options = options;
    return this;
}
TypeObject.prototype.schema = function(schema) {
    this._schema = schema;
    return this;
}
TypeObject.prototype.setKey = function(key, schema) {
    this._schema[key] = schema;
    return this;
}
TypeObject.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
TypeObject.prototype.validator = function(fn) {
    if (typeof fn === "function") {
        this._validator = fn;
    }
    return this;
}
TypeObject.prototype.validate = function(object, prefix, options) {
    var self = this;
    var localOptions = util.mergeOptions(this._options, options);

    if (validateIfUndefined(object, prefix, "object", localOptions)) return;

    if ((typeof self._validator === "function") && (self._validator(object) === false)) {
        throw new Error("Validator for the field "+prefix+" returned `false`.");
    }

    if (util.isPlainObject(object) === false) {
        if (localOptions.enforce_type === "strict") {
            strictType(prefix, "object");
        }
        else if ((localOptions.enforce_type === "loose") && (object !== null)) {
            looseType(prefix, "object");
        }
    }
    else {
        util.loopKeys(self._schema, function(schema, key) {
            schema[key].validate(object[key], prefix+"["+key+"]", options);
        });

        // We clean extra fields in validate, for a use case, see:
        // https://github.com/neumino/thinky/pull/123#issuecomment-56254682
        if (localOptions.enforce_extra === "remove") {
            util.loopKeys(object, function(object, key) {
                if ((self._model === undefined || self._model._joins.hasOwnProperty(key) === false)
                        && (self._schema[key] === undefined)) {
                    delete object[key];
                }
            });
        }
        else if (localOptions.enforce_extra === "strict") {
            util.loopKeys(object, function(object, key) {
                if ((self._model === undefined || self._model._joins.hasOwnProperty(key) === false)
                        && (self._schema[key] === undefined)) {
                    extraField(prefix, key);
                }
            });
        }
    }
}
TypeObject.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    if (this._default !== undefined) {
        defaultFields.push({
            path: prefix,
            value: this._default,
        });
    }
    if (this._schema !== undefined) {
        util.loopKeys(this._schema, function(_schema, key) {
            _schema[key]._getDefaultFields(prefix.concat(key), defaultFields, virtualFields);
        })
    }
}



function TypeArray() {
    this._min = -1;
    this._max = -1;
    this._length = -1;
    this._schema = undefined;
    this._validator = undefined;
}


TypeArray.prototype.options = function(options) {
    this._options = options;
    return this;
}
TypeArray.prototype.min = function(min) {
    if (min < 0) {
        throw new Error("The value for `min` must be a positive integer");
    }
    this._min = min;
    return this;
}
TypeArray.prototype.max = function(max) {
    if (max < 0) {
        throw new Error("The value for `max` must be a positive integer");
    }
    this._max = max;
    return this;
}
TypeArray.prototype.length = function(length) {
    if (length < 0) {
        throw new Error("The value for `length` must be a positive integer");
    }
    this._length = length;
    return this;
}
TypeArray.prototype.schema = function(schema) {
    this._schema = schema;
    return this;
}
TypeArray.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
TypeArray.prototype.validator = function(fn) {
    this._validator = fn;
    return this;
}
TypeArray.prototype.validate = function(array, prefix, options) {
    var self = this;
    options = util.mergeOptions(this._options, options);

    if (validateIfUndefined(array, prefix, "array", options)) return;

    if ((typeof self._validator === "function") && (self._validator(array) === false)) {
        throw new Error("Validator for the field "+prefix+" returned `false`.");
    }

    if (Array.isArray(array) === false) {
        if (options.enforce_type === "strict") {
            strictType(prefix, "array");
        }
        else if ((options.enforce_type === "loose") && (array !== null)) {
            looseType(prefix, "array");
        }
    }
    else {
        if ((this._min !== -1) && (this._min > array.length)){
            throw new Error("Value for "+prefix+" must have at least "+this._min+" elements.") 
        }
        if ((this._max !== -1) && (this._max < array.length)){
            throw new Error("Value for "+prefix+" must have at most "+this._max+" elements.") 
        }
        if ((this._length !== -1) && (this._length !== array.length)){
            throw new Error("Value for "+prefix+" must be an array with "+this._length+" elements.") 
        }

        for(var i=0; i<array.length; i++) {
            if (array[i] === undefined) {
                throw new Error("The element in the array "+prefix+" (position "+i+") cannot be `undefined`.");
            }
            if (this._schema !== undefined) {
                this._schema.validate(array[i], prefix+"["+i+"]", options);
            }
        }
    }
}
TypeArray.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    if (this._default !== undefined) {
        defaultFields.push({
            path: prefix,
            value: this._default,
        });
    }
    if (this._schema !== undefined) {
        this._schema._getDefaultFields(prefix.concat(arrayPrefix), defaultFields, virtualFields);
    }
}


function TypeVirtual() {}
TypeVirtual.prototype.default = function(fnOrValue) {
    this._default = fnOrValue;
    return this;
}
// Dummy functions
TypeVirtual.prototype.validate = function() {}
TypeVirtual.prototype.options = function() {}
TypeVirtual.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
    // We keep track of virtual fields even if there is no default value
    virtualFields.push({
        path: prefix,
        value: this._default,
    });
}


// Helpers
function undefinedField(prefix) {
    throw new Error("Value for "+prefix+" must be defined.")
}
var vowels = {a: true, e: true, i: true, o: true, u: true};

function strictType(prefix, expected) {
    if ((expected.length > 0) && (vowels[expected[0]])) {
        throw new Error("Value for "+prefix+" must be an "+expected+".")
    }
    else {
        throw new Error("Value for "+prefix+" must be a "+expected+".")
    }
}
function extraField(prefix, key) {
    if (prefix === '') {
        throw new Error("Extra field `"+key+"` not allowed.")
    }
    else {
        throw new Error("Extra field `"+key+"` in "+prefix+" not allowed.")
    }
}
function looseType(prefix, expected) {
    if ((expected.length > 0) && (vowels[expected[0]])) {
        throw new Error("Value for "+prefix+" must be an "+expected+" or null.")
    }
    else {
        throw new Error("Value for "+prefix+" must be a "+expected+" or null.")
    }
}
function pseudoTypeError(type, missingField, prefix) {
    throw new Error("The raw "+type+" object for "+prefix+" is missing the required field "+missingField+".")
}

// Return true if doc is undefined or null, else false
// Can throw
function validateIfUndefined(value, prefix, type, options) {
    if (value === undefined) {
        if (options.enforce_missing === true) {
            undefinedField(prefix);
        }
        return true;
    }
    return false;
}

module.exports = new Type();
