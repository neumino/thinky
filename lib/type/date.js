var util = require(__dirname+'/../util.js');


function TypeDate() {
  this._options = undefined;
  this._min = undefined;
  this._max = undefined;
  this._validator = undefined;
}


TypeDate.prototype.options = function(options) {
  this._options = options;
  return this;
}


TypeDate.prototype.min = function(min) {
  this._min = min;
  return this;
}


TypeDate.prototype.max = function(max) {
  this._max = max;
  return this;
}


TypeDate.prototype.default = function(fnOrValue) {
  this._default = fnOrValue;
  return this;
}


TypeDate.prototype.validator = function(fn) {
  if (typeof fn === "function") {
    this._validator = fn;
  }
  return this;
}


TypeDate.prototype.validate = function(date, prefix, options) {
  options = util.mergeOptions(this._options, options);

  if (util.validateIfUndefined(date, prefix, "date", options)) return;

  if ((typeof this._validator === "function") && (this._validator(date) === false)) {
    throw new Error("Validator for the field "+prefix+" returned `false`.");
  }

  var jsDate;
  if (util.isPlainObject(date) && (date["$reql_type$"] === "TIME")) {
    if (date.epoch_time === undefined) {
      util.pseudoTypeError("date", "epoch_time", prefix);
    }
    else if (date.timezone === undefined) {
      util.pseudoTypeError("date", "timezone", prefix);
    }

    jsDate = new Date(0);
    jsDate.setUTCSeconds(date.epoch_time)
  }
  else if ((typeof date === 'function') && (date._query !== undefined)) {
    // TOIMPROVE -- we currently just check if it's a term from the driver
    // We suppose for now that this is enough and we don't throw an error
  }
  else if (typeof date === 'string') {
    jsDate = new Date(date);
    if (jsDate.getTime() !== jsDate.getTime()) {
      if (options.enforce_type === "strict") {
        util.strictType(prefix, "date or a valid string");
      }
      else if (options.enforce_type !== "none") {
        util.looseType(prefix, "date or a valid string");
      }
    }
  }
  else if ((date instanceof Date) === false) { // We have a non valid date
    if (options.enforce_type === "strict") {
      util.strictType(prefix, "date");
    }
    else if ((options.enforce_type === "loose") && (date !== null)) {
      util.looseType(prefix, "date");
    }
  }
  else {
    jsDate = date;
  }

  // We check for min/max only if we could create a javascript date from the value
  if (jsDate !== undefined) {
    if ((this._min instanceof Date) && (this._min > jsDate)){
      throw new Error("Value for "+prefix+" must be after "+this._min+".") 
    }
    if ((this._max instanceof Date) && (this._max < jsDate)){
      throw new Error("Value for "+prefix+" must be before "+this._max+".") 
    }
  }
}


TypeDate.prototype._getDefaultFields = function(prefix, defaultFields, virtualFields) {
  if (this._default !== undefined) {
    defaultFields.push({
      path: prefix,
      value: this._default,
    });
  }
}


module.exports = TypeDate;
