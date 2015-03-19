var util = require(__dirname+'/../util.js');
var Errors = require(__dirname+'/../errors.js');

function TypeBuffer() {
  this._default = undefined;
  this._options = {};
  this._validator = undefined;
}


TypeBuffer.prototype.options = function(options) {
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


TypeBuffer.prototype.optional = function() {
  this._options.enforce_missing = false;
  return this;
}


TypeBuffer.prototype.required = function() {
  this._options.enforce_missing = true;
  return this;
}


TypeBuffer.prototype.allowNull = function(value) {
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

  if (util.validateIfUndefined(buffer, prefix, "buffer", options)) return;

  if ((typeof this._validator === "function") && (this._validator(buffer) === false)) {
    throw new Errors.ValidationError("Validator for the field "+prefix+" returned `false`.");
  }

  if (util.isPlainObject(buffer) && (buffer["$reql_type$"] === "BINARY")) {
    if (buffer.data === undefined) {
      util.pseudoTypeError("binary", "data", prefix);
    }
  }
  else if ((typeof buffer === 'function') && (buffer._query !== undefined)) {
    // TOIMPROvE -- we currently just check if it's a term from the driver
    // We suppose for now that this is enough and we don't throw an error
  }
  else if ((buffer instanceof Buffer) === false)  { // We don't have a buffer
    if (options.enforce_type === "strict") {
      util.strictType(prefix, "buffer");
    }
    else if ((options.enforce_type === "loose") && (buffer !== null)) {
      util.looseType(prefix, "buffer");
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


module.exports = TypeBuffer;
