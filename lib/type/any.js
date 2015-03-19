var util = require(__dirname+'/../util.js');
var schema =      require(__dirname+'/../schema.js');

function TypeAny() {
  this._default = undefined;
  this._validator = undefined;
  this._options = {};
}

TypeAny.prototype.default = function(fnOrValue) {
  this._default = fnOrValue;
}
TypeAny.prototype.validator = function(min) {
  this._validator = fn;
}
TypeAny.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
}

// Dummy methods, just to allow users to easily switch from a valid type to any
TypeAny.prototype.options = function(options) {
  return this;
}
TypeAny.prototype.optional = function() {
  return this;
}
TypeAny.prototype.required = function() {
  return this;
}
TypeAny.prototype.allowNull = function() {
  return this;
}
TypeAny.prototype.min = function() {
  return this;
}
TypeAny.prototype.max = function() {
  return this;
}
TypeAny.prototype.length = function() {
  return this;
}
TypeAny.prototype.schema = function() {
  return this;
}
TypeAny.prototype.validate = function() {
  return this;
}

module.exports = TypeAny;
