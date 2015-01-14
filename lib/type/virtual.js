function TypeVirtual() {}


TypeVirtual.prototype.default = function(fnOrValue) {
  this._default = fnOrValue;
  return this;
}


// Dummy functions
TypeVirtual.prototype.validate = function() {}


TypeVirtual.prototype.options = function() {}


TypeVirtual.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
  // We keep track of virtual fields even if there is no default value
  virtualFields.push({
    path: prefix,
    value: this._default,
  });
}

module.exports = TypeVirtual;
