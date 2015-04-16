var util = require(__dirname+'/../util.js');
var Errors = require(__dirname+'/../errors.js');

function TypeBoolean() {
  this._default = undefined;
  this._validator = undefined;
  this._options = {};
}


TypeBoolean.prototype.options = function(options) {
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


TypeBoolean.prototype.optional = function() {
  this._options.enforce_missing = false;
  return this;
}


TypeBoolean.prototype.required = function() {
  this._options.enforce_missing = true;
  return this;
}


TypeBoolean.prototype.allowNull = function(value) {
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

  if (util.validateIfUndefined(bool, prefix, "boolean", options)) return;

  if ((typeof this._validator === "function") && (this._validator(bool) === false)) {
    throw new Errors.ValidationError("Validator for the field "+prefix+" returned `false`.");
  }

  if (typeof bool !== "boolean") {
    if (options.enforce_type === "strict") {
      util.strictType(prefix, "boolean");
    }
    else if ((options.enforce_type === "loose") && (bool !== null)) {
      util.looseType(prefix, "boolean");
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


module.exports = TypeBoolean;
