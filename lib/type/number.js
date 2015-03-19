var util = require(__dirname+'/../util.js');
var Errors = require(__dirname+'/../errors.js');

function TypeNumber() {
  this._min = -1;
  this._max = -1;
  this._integer = false;
  this._default = undefined;
  this._validator = undefined;
  this._options = {};
}


TypeNumber.prototype.options = function(options) {
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


TypeNumber.prototype.optional = function() {
  this._options.enforce_missing = false;
  return this;
}


TypeNumber.prototype.required = function() {
  this._options.enforce_missing = true;
  return this;
}


TypeNumber.prototype.allowNull = function(value) {
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



TypeNumber.prototype.min = function(min) {
  if (min < 0) {
    throw new Errors.ValidationError("The value for `min` must be a positive integer");
  }
  this._min = min;
  return this;
}


TypeNumber.prototype.max = function(max) {
  if (max < 0) {
    throw new Errors.ValidationError("The value for `max` must be a positive integer");
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

  if (util.validateIfUndefined(number, prefix, "number", options)) return;
  
  if ((typeof this._validator === "function") && (this._validator(number) === false)) {
    throw new Errors.ValidationError("Validator for the field "+prefix+" returned `false`.");
  }

  if ((typeof number === 'function') && (number._query !== undefined)) {
    // We do not check ReQL terms
  }
  else if ((typeof number !== "number") || (isFinite(number) === false)) {
    if (options.enforce_type === "strict") {
      util.strictType(prefix, "finite number");
    }
    else if ((options.enforce_type === "loose") && (number !== null)) {
      util.looseType(prefix, "finite number");
    }
  }
  else {
    if ((this._min !== -1) && (this._min > number)){
      throw new Errors.ValidationError("Value for "+prefix+" must be greater than "+this._min+".") 
    }
    if ((this._max !== -1) && (this._max < number)){
      throw new Errors.ValidationError("Value for "+prefix+" must be less than "+this._max+".") 
    }
    if ((this._integer === true) && (number%1 !== 0)){
      throw new Errors.ValidationError("Value for "+prefix+" must be an integer.") 
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


module.exports = TypeNumber;
