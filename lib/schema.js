var arrayPrefix = "__array"
module.exports.arrayPrefix = arrayPrefix;

var util = require(__dirname+'/util.js');
var type = require(__dirname+'/type/index.js');
var Errors = require(__dirname+'/errors.js');


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
        // This is caught by validate, except if there is an `enforce_type: "none"`.
        return;
      }
      else {
        for(var k=0; k<field.length; k++) {
          generateVirtual(field[k], {path: defaultField.path.slice(j+1), value: defaultField.value}, this, virtual[k]);
        }
      }
      keepGoing = false;
    }
    else {
      // field cannot be undefined (doc is not undefined on the first iteration, and we'll return if it becomes undefined
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

function generateDefault(doc, defaultField, originalDoc) {
  var path = defaultField.path;
  var value = defaultField.value;
  var field = doc;

  var keepGoing = true;
  for(var j=0; j<path.length-1; j++) {
    if (path[j] === arrayPrefix) {
      if (!Array.isArray(field)) {
        // This is caught by validate, except if there is an `enforce_type: "none"`.
        return;
      }
      else {
        for(var k=0; k<field.length; k++) {
          generateDefault(field[k], {path: defaultField.path.slice(j+1), value: defaultField.value}, this);
        }
      }
      keepGoing = false;
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
      if (util.isPlainObject(value) || Array.isArray(value)) {
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

function parse(schema, prefix, options, model) {
  var result;

  if ((prefix === '') && (type.isObject(schema) === false) && (util.isPlainObject(schema) === false)) {
    throw new Errors.ValidationError("The schema must be a plain object.")
  }

  // Validate a schema and add the field _enum if needed
  if (util.isPlainObject(schema)) {
    if (schema._type !== undefined) {
      options = util.mergeOptions(options, schema.options);
      var result;
      switch(schema._type) {
        case String:
          result = type.string().options(options).validator(schema.validator).enum(schema.enum);
          if (schema.default !== undefined) { result.default(schema.default); }
          if (typeof schema.min === "number") { result.min(schema.min); }
          if (typeof schema.max === "number") { result.max(schema.max); }
          if (typeof schema.length === "number") { result.length(schema.length); }
          if (schema.alphanum === true) { result.alphanum(); }
          if (schema.lowercase === true) { result.lowercase(); }
          if (schema.uppercase === true) { result.uppercase(); }
          if (typeof schema.regex === "string") { result.regex(regex, schema.flags); }
          return result;
        case Number:
          result = type.number().options(options).validator(schema.validator);
          if (schema.default !== undefined) { result.default(schema.default); }
          if (typeof schema.min === "number") { result.min(schema.min); }
          if (typeof schema.max === "number") { result.max(schema.max); }
          if (typeof schema.length === "number") { result.length(schema.length); }
          if (schema.integer === true) { result.integer(); }
          return result;
        case Boolean:
          result = type.boolean().options(options).validator(schema.validator);
          if (schema.default !== undefined) { result.default(schema.default); }
          return result;
        case Date:
          var result = type.date().options(options).validator(schema.validator);
          if (schema.default !== undefined) { result.default(schema.default); }
          if (schema.min instanceof Date) { result.min(schema.min); }
          if (schema.max instanceof Date) { result.max(schema.max); }
          return result;
        case Buffer:
          result = type.buffer().options(options).validator(schema.validator);
          if (schema.default !== undefined) { result.default(schema.default); }
          return result
        case Object:
          result = type.object().options(options).validator(schema.validator);
          if (schema.default !== undefined) { result.default(schema.default); }
          util.loopKeys(schema.schema, function(_schema, key) {
            result.setKey(key, parse(_schema[key], prefix+"["+key+"]", options));
          })
          if (prefix === '') {
            result._setModel(model)
          }
          return result;
        case Array:
          var result = type.array().options(options).validator(schema.validator);
          if (schema.default !== undefined) { result.default(schema.default); }
          if (schema.schema !== undefined) {
            result.schema(parse(schema.schema, prefix+"[0]", options));
          }
          if (typeof schema.min === "number") { result.min(schema.min); }
          if (typeof schema.max === "number") { result.max(schema.max); }
          if (typeof schema.length === "number") { result.length(schema.length); }
          return result;
        case 'Point':
          result = type.point().options(options).validator(schema.validator);
          if (schema.default !== undefined) { result.default(schema.default); }
          return result;
        case 'virtual':
          result = type.virtual();
          if (schema.default !== undefined) { result.default(schema.default); }
          return result
        default: // Unknown type
          throw new Errors.ValidationError("The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for "+prefix);
      }
    }
    else if (type.isString(schema)
        || type.isString(schema)
        || type.isNumber(schema)
        || type.isBoolean(schema)
        || type.isDate(schema)
        || type.isBuffer(schema)
        || type.isPoint(schema)
        || type.isObject(schema)
        || type.isArray(schema)
        || type.isAny(schema)
        || type.isVirtual(schema)){ // Unknown type
      // Nothing to do here
      if (type.isObject(schema)) {
        parse(schema._schema, prefix, options);
      }
      else if (type.isArray(schema)) {
        schema._schema = parse(schema._schema, prefix, options);
      }

      // We want to copy the model object here
      if (util.isPlainObject(schema._options) === false) {
        schema.options(options);
      }
      else if ((schema._options.enforce_extra === undefined)
          || (schema._options.enforce_missing === undefined)
          || (schema._options.enforce_type === undefined)) {
        var newOptions = {};
        newOptions.enforce_missing = (schema._options.enforce_missing != null) ? schema._options.enforce_missing : options.enforce_missing;
        newOptions.enforce_extra = (schema._options.enforce_extra != null) ? schema._options.enforce_extra : options.enforce_extra;
        newOptions.enforce_type = (schema._options.enforce_type != null) ? schema._options.enforce_type : options.enforce_type;
        schema.options(newOptions);
      }
      return schema;
    }
    else {
      result = type.object().options(options);
      util.loopKeys(schema, function(_schema, key) {
        result.setKey(key, parse(_schema[key], prefix+"["+key+"]", options));
      })
      if (prefix === '') {
        result._setModel(model)
      }
      return result;
    }
  }
  else if (Array.isArray(schema)) {
    result = type.array().options(options);
    if (schema.length > 1) {
      throw new Errors.ValidationError("An array in a schema can have at most one element. Found "+schema.length+" elements in "+prefix)
    }

    if (schema.length > 0) {
      result.schema(parse(schema[0], prefix+"[0]", options));
    }
    return result;

  }
  else if (schema === String) {
    return type.string().options(options);
  }
  else if (schema === Number) {
    return type.number().options(options);
  }
  else if (schema === Boolean) {
    return type.boolean().options(options);
  }
  else if (schema === Date) {
    return type.date().options(options);
  }
  else if (schema === Buffer) {
    return type.buffer().options(options);
  }
  else if (schema === Object) {
    return type.object().options(options);
  }
  else if (schema === Array) {
    return type.array().options(options);
  }
  else if (schema === 'Point') {
    return type.point().options(options);
  }
  else if (schema === 'virtual') {
    return type.virtual().options(options);
  }
  else {
    throw new Errors.ValidationError("The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for "+prefix);
  }
}
module.exports.parse = parse;

// The schema doesn't contain joined docs
function validate(doc, schema, prefix, options) {
  schema.validate(doc, prefix, options);
}
module.exports.validate = validate;

function getType(schema) {
  if (util.isPlainObject(schema) && (schema._type !== undefined)) {
    return schema._type;
  }
  return schema;
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

    throw new Errors.ValidationError(message);
  }
}
// Check that schema is a valid object first
function validateCustomizedValidator(doc, schema, prefix) {
  if (typeof schema.validator === 'function') {
    if (schema.validator(doc) === false) {
      throw new Errors.ValidationErrors.ValidationError("Validator for the field "+prefix+" returned `false`.");
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
        throw new Errors.ValidationError("The field `type` for "+prefix+" must be `'Point'`.")
      }
      else if (doc.coordinates === undefined) {
        pseudoTypeError("date", "coordinates", prefix);
      }
      else if ((!Array.isArray(doc.coordinates)) || (doc.coordinates.length !== 2)) {
        throw new Errors.ValidationError("The field `coordinates` for "+prefix+" must be an Array of two numbers.")
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
        throw new Errors.ValidationError("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
      }
      else if ((typeof doc.latitude !== 'number') || (typeof doc.latitude !== 'number')) {
        throw new Errors.ValidationError("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
      }
    }
    else if (Array.isArray(doc)) {
      if ((doc.length !== 2) || (typeof doc[0] !== "number") || (typeof doc[1] !== "number")) {
        throw new Errors.ValidationError("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
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
