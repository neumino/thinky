var util =       require(__dirname+'/../util.js');
var validator =  require("validator");
var Errors = require(__dirname+'/../errors.js');

/**
 * Create a new TypeString object
 */
function TypeString() {
  /**
   * Minimum length of the string, negative if no minimum length is required.
   * @type {number}
   */
  this._min = -1;
  /**
   * Maximum length of the string, negative if no maximum length is required.
   * @type {number}
   */
  this._max = -1;
  /**
   * Length of the string, negative if no length is required.
   * @type {number}
   */
  this._length = -1;
  /**
   * Whether the string must be alphanumeric or not. We used the npm validator
   * package, and as 2014/12/14, it check against the regex [a-zA-Z0-9]
   * @type {boolean}
   */
  this._alphanum = false;
  /**
   * Whether this string must be uppercase or not.
   * @type {boolean}
   */
  this._uppercase = false;
  /**
   * Whether this string must be lowercase or not.
   * @type {boolean}
   */
  this._lowercase = false;
  /*
   * The regex against which the string must conform. Undefined if the string
   * does not have to conform to a RegExp.
   * @type {RegExp=}
   */
  this._regex = undefined;
  /**
   * The validator called with the string must return {true} if the string is valid,
   * {false} if the string is not.
   * @type {function(string)=}
   */
  this._enum = undefined;
  /**
   * The default value for this field or a function to generate the default value.
   * @type {function|string}
   */
  this._default = undefined;
  /**
   * Options for this type "enforce_missing", "enforce_type", "enforce_extra"
   * @type {Object=}
   */
  this._validator = undefined;
  /**
   * An object whose keys are the acceptable values for the string. Undefined if this
   * is not a requirement.
   * @type {Object=}
   */
  this._options = {};
}


/**
 * Set the options for this field.
 * @param {!object} options The options for this field. The valid fields are:
 *  - `enforce_missing` {boolean}, default `false`
 *  - `enforce_extra` {"strict"|"remove"|"none"}, default `"none"`
 *  - `enforce_type` {"strict"|"loose"|"none"}, default `"loose"`
 * @return {TypeString}
 */
TypeString.prototype.options = function(options) {
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


/**
 * Set the property as optional (enforce_missing = false).
 * Leaves other existing options unchanged.
 * @return {TypeString}
 */
TypeString.prototype.optional = function() {
  this._options.enforce_missing = false;
  return this;
}


/**
 * Set the property as required (enforce_missing = true).
 * Leaves other existing options unchanged.
 * @return {TypeString}
 */
TypeString.prototype.required = function() {
  this._options.enforce_missing = true;
  return this;
}


/**
 * Set the property as not strict (null allowed, enforce_missing = true).
 * Leaves other existing options unchanged.
 * @return {TypeString}
 */
TypeString.prototype.allowNull = function(value) {
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


/**
 * Set the minimum length allowed for a string.
 * @param {number} min Minimum length for the string
 * @return {TypeString}
 */
TypeString.prototype.min = function(min) {
  if (min < 0) {
    throw new Errors.ValidationError("The value for `min` must be a positive integer");
  }
  this._min = min;
  return this;
}


/**
 * Set the maximum length allowed for a string.
 * @param {number} min Minimum length for the string
 * @return {TypeString}
 */
TypeString.prototype.max = function(max) {
  if (max < 0) {
    throw new Errors.ValidationError("The value for `max` must be a positive integer");
  }
  this._max = max;
  return this;
}


/**
 * Set the length allowed for a string.
 * @param {number} min Minimum length for the string
 * @return {TypeString}
 */
TypeString.prototype.length = function(length) {
  if (length < 0) {
    throw new Errors.ValidationError("The value for `length` must be a positive integer");
  }
  this._length = length;
  return this;
}


/**
 * Set the regex that the string must match.
 * @param {string} regex The string representation of the regex
 * @param {string} flags The flags used when calling new RegExp(...)
 * @return {TypeString}
 */
TypeString.prototype.regex = function(regex, flags) {
  if (typeof flags === "string") {
    this._regex = new RegExp(regex, flags);
  }
  else {
    this._regex = new RegExp(regex);
  }
  return this;
}


/**
 * Set the string to be alphanumeric.
 * @return {TypeString}
 */
TypeString.prototype.alphanum = function() {
  this._alphanum = true;
  return this;
}


/**
 * Set the string to be an email.
 * @return {TypeString}
 */
TypeString.prototype.email = function() {
  this._email = true;
  return this;
}


/**
 * Set the string to be lowercase.
 * @return {TypeString}
 */
TypeString.prototype.lowercase = function() {
  this._lowercase = true;
  return this;
}


/**
 * Set the string to be uppercase.
 * @return {TypeString}
 */
TypeString.prototype.uppercase = function() {
  this._uppercase = true;
  return this;
}


/**
 * Set the default value for this string, or the function that will generate
 * the default value
 * @param {string|function} fnOrValue
 * @return {TypeString}
 */
TypeString.prototype.default = function(fnOrValue) {
  this._default = fnOrValue;
  return this;
}


/**
 * Set a custom validator that will be called with the string. The validator
 * should return a boolean whether the field is valid or not.
 * @param {function} fn 
 * @return {TypeString}
 */
TypeString.prototype.validator = function(fn) {
  if (typeof fn === "function") {
    this._validator = fn;
  }
  return this;
}


/**
 * Set the valid values for this field. The arguments must be strings
 * or an array of strings.
 * @param {...string|Array.<string>} fn 
 * @return {TypeString}
 */
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


/**
 * Validate the string given optional options, and throw an error in case
 * the field is not valid.
 * @param {string} str The string to validate.
 * @param {string} prefix The prefix leading to `str`.
 * @param {object=} options Options to overwrite the one defined for the field.
 * @throws {Error}
 */
TypeString.prototype.validate = function(str, prefix, options) {
  var _options = util.mergeOptions(this._options, options);

  if (util.validateIfUndefined(str, prefix, "string", _options)) return;

  if ((typeof this._validator === "function") && (this._validator(str) === false)) {
    throw new Errors.ValidationError("Validator for the field "+prefix+" returned `false`.");
  }


  if ((typeof str === 'function') && (str._query !== undefined)) {
    // We do not check ReQL terms
  }
  else if (typeof str !== "string") {
    if (_options.enforce_type === "strict") {
      util.strictType(prefix, "string");
    }
    else if ((_options.enforce_type === "loose") && (str !== null)) {
      util.looseType(prefix, "string");
    }
  }
  else {
    if ((this._min !== -1) && (this._min > str.length)){
      throw new Errors.ValidationError("Value for "+prefix+" must be longer than "+this._min+".") 
    }
    if ((this._max !== -1) && (this._max < str.length)){
      throw new Errors.ValidationError("Value for "+prefix+" must be shorter than "+this._max+".") 
    }
    if ((this._length !== -1) && (this._length !== str.length)){
      throw new Errors.ValidationError("Value for "+prefix+" must be a string with "+this._length+" characters.") 
    }
    if ((this._regex instanceof RegExp) && (this._regex.test(str) === false)) {
      throw new Errors.ValidationError("Value for "+prefix+" must match the regex.") 
    }
    if ((this._alphanum === true) && (validator.isAlphanumeric(str) === false)) {
      throw new Errors.ValidationError("Value for "+prefix+" must be an alphanumeric string.") 
    }
    if ((this._email === true) && (validator.isEmail(str) === false)) {
      throw new Errors.ValidationError("Value for "+prefix+" must be a valid email.") 
    }
    if ((this._lowercase === true) && (validator.isLowercase(str) === false)) {
      throw new Errors.ValidationError("Value for "+prefix+" must be a lowercase string.") 
    }
    if ((this._uppercase === true) && (validator.isUppercase(str) === false)) {
      throw new Errors.ValidationError("Value for "+prefix+" must be a uppercase string.") 
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

      throw new Errors.ValidationError(message);
    }
  }
}


/**
 * Look for a default value or default function, and append an object to `defaultFields`.
 * @param {string} prefix The prefix leading to `str`.
 * @param {Array.<Object>} defaultFields The default fields to generate
 * @param {Array.<Object>} virtualFields The virtual fields to generate
 * @return {TypeString}
 */
TypeString.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
  if (this._default !== undefined) {
    defaultFields.push({
      path: prefix,
      value: this._default,
    });
  }
  return this;
}


module.exports = TypeString;
