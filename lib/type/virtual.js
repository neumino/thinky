function TypeVirtual() {
  this._default = undefined;
  this._validator = undefined;
  this._options = {};
}


TypeVirtual.prototype.default = function(fnOrValue) {
  this._default = fnOrValue;
  return this;
}


// Dummy functions
TypeVirtual.prototype.validate = function() {}


TypeVirtual.prototype.options = function() {}


TypeVirtual.prototype.optional = function() {}


TypeVirtual.prototype.required = function() {}


TypeVirtual.prototype.allowNull = function() {}


TypeVirtual.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
  // We keep track of virtual fields even if there is no default value
  virtualFields.push({
    path: prefix,
    value: this._default,
  });
}

module.exports = TypeVirtual;
