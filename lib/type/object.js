var util = require(__dirname+'/../util.js');


function TypeObject() {
  this._options = undefined;
  this._validator = undefined;
  this._schema = {};
}


TypeObject.prototype._setModel = function(model) {
  this._model = model;
  return this;
}


TypeObject.prototype.options = function(options) {
  this._options = options;
  return this;
}


TypeObject.prototype.schema = function(schema) {
  this._schema = schema;
  return this;
}


TypeObject.prototype.setKey = function(key, schema) {
  this._schema[key] = schema;
  return this;
}


TypeObject.prototype.default = function(fnOrValue) {
  this._default = fnOrValue;
  return this;
}


TypeObject.prototype.validator = function(fn) {
  if (typeof fn === "function") {
    this._validator = fn;
  }
  return this;
}


TypeObject.prototype.validate = function(object, prefix, options) {
  var self = this;
  var localOptions = util.mergeOptions(this._options, options);

  if (util.validateIfUndefined(object, prefix, "object", localOptions)) return;

  if ((typeof self._validator === "function") && (self._validator(object) === false)) {
    throw new Error("Validator for the field "+prefix+" returned `false`.");
  }

  if ((typeof object === 'function') && (object._query !== undefined)) {
    // We do not check ReQL terms
  }
  else if (util.isPlainObject(object) === false) {
    if (localOptions.enforce_type === "strict") {
      util.strictType(prefix, "object");
    }
    else if ((localOptions.enforce_type === "loose") && (object !== null)) {
      util.looseType(prefix, "object");
    }
  }
  else {
    util.loopKeys(self._schema, function(schema, key) {
      schema[key].validate(object[key], prefix+"["+key+"]", options);
    });

    // We clean extra fields in validate, for a use case, see:
    // https://github.com/neumino/thinky/pull/123#issuecomment-56254682
    if (localOptions.enforce_extra === "remove") {
      util.loopKeys(object, function(object, key) {
        if ((self._model === undefined || self._model._joins.hasOwnProperty(key) === false)
            && (self._schema[key] === undefined)) {
          delete object[key];
        }
      });
    }
    else if (localOptions.enforce_extra === "strict") {
      util.loopKeys(object, function(object, key) {
        if ((self._model === undefined || self._model._joins.hasOwnProperty(key) === false)
            && (self._schema[key] === undefined)) {
          util.extraField(prefix, key);
        }
      });
    }
  }
}


TypeObject.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
  if (this._default !== undefined) {
    defaultFields.push({
      path: prefix,
      value: this._default,
    });
  }
  if (this._schema !== undefined) {
    util.loopKeys(this._schema, function(_schema, key) {
      _schema[key]._getDefaultFields(prefix.concat(key), defaultFields, virtualFields);
    })
  }
}


module.exports = TypeObject;
