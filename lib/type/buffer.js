var util = require(__dirname+'/../util.js');


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

  if (util.validateIfUndefined(buffer, prefix, "buffer", options)) return;

  if ((typeof this._validator === "function") && (this._validator(buffer) === false)) {
    throw new Error("Validator for the field "+prefix+" returned `false`.");
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
