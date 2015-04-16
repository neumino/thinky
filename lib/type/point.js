var util = require(__dirname+'/../util.js');
var Errors = require(__dirname+'/../errors.js');

function TypePoint() {
  this._default = undefined;
  this._validator = undefined;
  this._options = {};
}


TypePoint.prototype.options = function(options) {
  if (util.isPlainObject(options)) {
    if (options.enforce_missing != null) {
      this._options.enforce_missing =  options.enforce_missing
    }
    if (options.enforce_type != null) {
      this._options.enforce_type = options.enforce_type;
    }
    if (options.enforce_extra != null) {
      this._options.enforce_extra = options.enforce_extra
    }
  }
  return this;
}


TypePoint.prototype.optional = function() {
  this._options.enforce_missing = false;
  return this;
}


TypePoint.prototype.required = function() {
  this._options.enforce_missing = true;
  return this;
}


TypePoint.prototype.allowNull = function(value) {
  if (this._options.enforce_type === 'strict') {
    if (value === true) {
      this._options.enforce_type = 'loose'
    }
    // else a no-op, strict -> strict
  }
  else if (this._options.enforce_type !== 'none') {
    // The value is loose or undefined
    if (value === true) {
      this._options.enforce_type = 'loose'
    }
    else {
      // The default value is loose, so if we call allowNull(false), it becomes strict
      this._options.enforce_type = 'strict'
    }
  }
  // else no op, type.any() is the same as type.any().allowNull(<bool>)
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

  if (util.validateIfUndefined(point, prefix, "point", options)) return;

  if ((typeof this._validator === "function") && (this._validator(point) === false)) {
    throw new Errors.ValidationError("Validator for the field "+prefix+" returned `false`.");
  }

  if (util.isPlainObject(point) && (point["$reql_type$"] === "GEOMETRY")) {
    if (point.type === undefined) {
      util.pseudoTypeError("Point", "type", prefix);
    }
    else if (point.type !== "Point") {
      throw new Errors.ValidationError("The field `type` for "+prefix+" must be `'Point'`.")
    }
    else if (point.coordinates === undefined) {
      util.pseudoTypeError("date", "coordinates", prefix);
    }
    else if ((!Array.isArray(point.coordinates)) || (point.coordinates.length !== 2)) {
      throw new Errors.ValidationError("The field `coordinates` for "+prefix+" must be an Array of two numbers.")
    }
  }
  else if (util.isPlainObject(point) && (point.type === "Point") && (Array.isArray(point.coordinates)) && (point.coordinates.length === 2)) { // Geojson
    // Geojson format
  }
  else if ((typeof point === 'function') && (point._query !== undefined)) {
    // TOIMPROvE -- we currently just check if it's a term from the driver
    // We suppose for now that this is enough and we don't throw an error
  }
  else if (util.isPlainObject(point)) {
    var keys = Object.keys(point).sort();
    if (((keys.length !== 2) || keys[0] !== 'latitude') || (keys[1] !== 'longitude') || (typeof point.latitude !== "number") || (typeof point.longitude !== "number")) {
      throw new Errors.ValidationError("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
    }
    else if ((typeof point.latitude !== 'number') || (typeof point.latitude !== 'number')) {
      throw new Errors.ValidationError("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
    }
  }
  else if (Array.isArray(point)) {
    if ((point.length !== 2) || (typeof point[0] !== "number") || (typeof point[1] !== "number")) {
      throw new Errors.ValidationError("The value for "+prefix+" must be a ReQL Point (`r.point(<longitude>, <latitude>)`), an object `{longitude: <number>, latitude: <number>}`, or an array [<longitude>, <latitude>].")
    }
  }
  else { // We don't have a point
    if (options.enforce_type === "strict") {
      util.strictType(prefix, "Point");
    }
    else if ((options.enforce_type === "loose") && (point !== null)) {
      util.looseType(prefix, "Point");
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

module.exports = TypePoint;
