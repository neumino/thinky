var util = require(__dirname+'/../util.js');


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

  if (util.validateIfUndefined(bool, prefix, "boolean", options)) return;

  if ((typeof this._validator === "function") && (this._validator(bool) === false)) {
    throw new Error("Validator for the field "+prefix+" returned `false`.");
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
