var util = require(__dirname+'/../util.js');
var Errors = require(__dirname+'/../errors.js');

function TypeObject() {
  this._default = undefined;
  this._validator = undefined;
  this._options = {};
  this._schema = {};
}


TypeObject.prototype._setModel = function(model) {
  this._model = model;
  return this;
}


TypeObject.prototype.options = function(options) {
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


TypeObject.prototype.optional = function() {
  this._options.enforce_missing = false;
  return this;
}


TypeObject.prototype.required = function() {
  this._options.enforce_missing = true;
  return this;
}


TypeObject.prototype.allowNull = function(value) {
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


TypeObject.prototype.allowExtra = function(allowed) {
  if (allowed === true) {
    this._options.enforce_extra = 'none';
  }
  else if (allowed === false) {
    this._options.enforce_extra = 'strict';
  }
  return this;
}


TypeObject.prototype.removeExtra = function() {
  this._options.enforce_extra = 'remove';
  return this;
}


TypeObject.prototype.schema = function(schema) {
  // Users shouldn't use the deprecated syntax with the chainable one
  // We do not parse the schema as we don't have the current prefix, options etc.
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
    throw new Errors.ValidationError("Validator for the field "+prefix+" returned `false`.");
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
      if (typeof _schema[key]._getDefaultFields !== 'function') {
        console.log(_schema);
        console.log(key);
        console.log(_schema[key]);
      }
      _schema[key]._getDefaultFields(prefix.concat(key), defaultFields, virtualFields);
    })
  }
}


module.exports = TypeObject;
