var rethinkdbdash = require('rethinkdbdash');
var Model = require(__dirname+'/model.js');
var util = require(__dirname+'/util.js');
var type = require(__dirname+'/type/index.js');
var Query = require(__dirname+'/query.js');
var Errors = require(__dirname+'/errors.js');

/**
 * Main method, create the default database.
 *
 * @param {Object} options the options for the driver and the future models created.
 *  - `max` {number} The maximum number of connections in the pool, default 1000
 *  - `buffer` {number} The minimum number of connections available in the pool, default 50
 *  - `timeoutError` {number} The wait time before reconnecting in case of an error (in ms), default 1000
 *  - `timeoutGb` {number} How long the pool keep a connection that hasn't been used (in ms), default 60*60*1000
 *  - `enforce_missing` {boolean}, default `false`
 *  - `enforce_extra` {"strict"|"remove"|"none"}, default `"none"`
 *  - `enforce_type` {"strict"|"loose"|"none"}, default `"loose"`
 *  - `timeFormat` {"raw"|"native"}
 */
function Thinky(config) {
  var self = this;

  config = config || {};
  config.db = config.db || 'test'; // We need the default db to create it.
  
  self._options = {};
  // Option passed to each model we are going to create.
  self._options.enforce_missing =
    (config.enforce_missing != null) ? config.enforce_missing : false;
  self._options.enforce_extra =
    (config.enforce_extra != null) ? config.enforce_extra : "none";
  self._options.enforce_type =
    (config.enforce_type != null) ? config.enforce_type : 'loose';

  // Format of time objects returned by the database, by default we convert
  // them to JavaScript Dates.
  self._options.timeFormat =
    (config.timeFormat != null) ? config.timeFormat : 'native';
  // Option passed to each model we are going to create.
  self._options.validate =
    (config.validate != null) ? config.validate : 'onsave';

  self.r = rethinkdbdash(config);
  self.type = type;
  self.Query = Query;
  self.models = {};

  // Whether the database is available or not.
  self._dbReady = false;
  // Functions to execute once the database is ready.
  // We do not use listeners as this used to crash node when too many listeners
  // were added.
  self._onDbReady = [];

  // Export errors
  self.Errors = Errors;

  var r = self.r;
  // Callback when the database has been created or is available.
  var onDatabaseReady = function() {
    self._dbReady = true;
    for(var i=0; i<self._onDbReady.length; i++) {
      self._onDbReady[i]();
    }
  }
  r.dbList().contains(config.db).do(function(result) {
    return r.branch(
      result,
      {created: 0},
      r.dbCreate(config.db)
    )
  }).run().then(onDatabaseReady).error(function(error) {
    // The `do` is not atomic, we a concurrent query could create the database
    // between the time `dbList` is ran and `dbCreate` is.
    if (error.message.match(/^Database `.*` already exists in/)) {
      onDatabaseReady();
    }
    else {
      // In case something went wrong here, we do not recover and throw.
      throw error;
    }
  }); 
}

/**
 * Return the current option used.
 * @return {object} The global options of the library
 */
Thinky.prototype.getOptions = function() {
  return this._options;
}


/**
 * Create a model
 *
 * @param {string} name The name of the table used behind this model.
 * @param {object|Type} schema The schema of this model.
 * @param {object=} options Options for this model. The fields can be:
 *  - `init` {boolean} Whether the table should be created or not. The value
 *  `false` is used to speed up testing, and should probably be `true` in
 *  other use cases.
 *  - `timeFormat` {"raw"|"native"} Format of ReQL dates.
 *  - `enforce_missing` {boolean}, default `false`.
 *  - `enforce_extra` {"strict"|"remove"|"none"}, default `"none"`.
 *  - `enforce_type` {"strict"|"loose"|"none"}, default `"loose"`.
 *  - `validate` {"oncreate"|"onsave"}, default "onsave".
 */
Thinky.prototype.createModel = function(name, schema, options) {
  var self = this;

  // Make a deep copy of the options as the model may overwrite them.
  var fullOptions = util.deepCopy(this._options);
  options = options || {};
  util.loopKeys(options, function(options, key) {
    fullOptions[key] = options[key];
  });

  // Two models cannot share the same name.
  if (self.models[name] !== undefined) {
    throw new Error("Cannot redefine a Model");
  }

  // Create the constructor returned. This will also validate the schema.
  var model = Model.new(name, schema, fullOptions, self);

  // Keep a reference of this model.
  self.models[name] = model;

  if (fullOptions.init !== false) {
    // Create the table, or push the table name in the queue.
    var r = self.r;
    var onDatabaseReady = function() {
      r.tableList().contains(name).do(function(result) {
        return r.branch(
          result,
          {created: 0},
          r.tableCreate(name, {primaryKey: model._pk})
        )
      }).run().then(function(result) {
        model._tableWasCreated();
      }).error(function(error) {
        model._error = error;
      })
    };
    if (self._dbReady === true) {
      onDatabaseReady();
    }
    else {
      self._onDbReady.push(onDatabaseReady);
    }
  }
  else {
    // We do not initialize the table and suppose that it already exists and
    // is ready.
    model._getModel()._tableCreated = true;
    model.emit('created');
    model._getModel()._tableReady = true;
    model.emit('ready');
  }
  return model;
}


/**
 * Method to clean all the references to the models. This is used to speed up
 * testing and should not be used in other use cases.
 */
Thinky.prototype._clean = function() {
  this.models = {};
}


// Export the module.
module.exports = function(config) {
  return new Thinky(config);
}
