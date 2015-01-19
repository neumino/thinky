var util = require(__dirname+'/../util.js');
var schema =      require(__dirname+'/../schema.js');
var arrayPrefix = schema.arrayPrefix;

function TypeArray() {
  this._min = -1;
  this._max = -1;
  this._length = -1;
  this._schema = undefined;
  this._validator = undefined;
}


TypeArray.prototype.options = function(options) {
  this._options = options;
  return this;
}


TypeArray.prototype.min = function(min) {
  if (min < 0) {
    throw new Error("The value for `min` must be a positive integer");
  }
  this._min = min;
  return this;
}


TypeArray.prototype.max = function(max) {
  if (max < 0) {
    throw new Error("The value for `max` must be a positive integer");
  }
  this._max = max;
  return this;
}


TypeArray.prototype.length = function(length) {
  if (length < 0) {
    throw new Error("The value for `length` must be a positive integer");
  }
  this._length = length;
  return this;
}


TypeArray.prototype.schema = function(schema) {
  this._schema = schema;
  return this;
}


TypeArray.prototype.default = function(fnOrValue) {
  this._default = fnOrValue;
  return this;
}


TypeArray.prototype.validator = function(fn) {
  this._validator = fn;
  return this;
}


TypeArray.prototype.validate = function(array, prefix, options) {
  var self = this;
  options = util.mergeOptions(this._options, options);

  if (util.validateIfUndefined(array, prefix, "array", options)) return;

  if ((typeof self._validator === "function") && (self._validator(array) === false)) {
    throw new Error("Validator for the field "+prefix+" returned `false`.");
  }

  if ((typeof array === 'function') && (array._query !== undefined)) {
    // We do not check ReQL terms
  }
  else if (Array.isArray(array) === false) {
    if (options.enforce_type === "strict") {
      util.strictType(prefix, "array");
    }
    else if ((options.enforce_type === "loose") && (array !== null)) {
      util.looseType(prefix, "array");
    }
  }
  else {
    if ((this._min !== -1) && (this._min > array.length)){
      throw new Error("Value for "+prefix+" must have at least "+this._min+" elements.") 
    }
    if ((this._max !== -1) && (this._max < array.length)){
      throw new Error("Value for "+prefix+" must have at most "+this._max+" elements.") 
    }
    if ((this._length !== -1) && (this._length !== array.length)){
      throw new Error("Value for "+prefix+" must be an array with "+this._length+" elements.") 
    }

    for(var i=0; i<array.length; i++) {
      if (array[i] === undefined) {
        throw new Error("The element in the array "+prefix+" (position "+i+") cannot be `undefined`.");
      }
      if (this._schema !== undefined) {
        this._schema.validate(array[i], prefix+"["+i+"]", options);
      }
    }
  }
}


TypeArray.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
  if (this._default !== undefined) {
    defaultFields.push({
      path: prefix,
      value: this._default,
    });
  }
  if (this._schema !== undefined) {
    this._schema._getDefaultFields(prefix.concat(arrayPrefix), defaultFields, virtualFields);
  }
}


module.exports = TypeArray;
