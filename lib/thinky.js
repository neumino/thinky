var rethinkdbdash = require('rethinkdbdash');
var Model = require(__dirname+'/model.js');
var util = require(__dirname+'/util.js');
var Query = require(__dirname+'/query.js');

/*
 * Main method
 * Create the default database
 *
 * Fields in `options` can be:
 *  - `min`: <number> - minimum number of connections in the pool, default 50
 *  - `max`: <number> -  maximum number of connections in the pool, default 1000
 *  - `bufferSize`: <number> - minimum number of connections available in the pool, default 50
 *  - `timeoutError`: <number> - wait time before reconnecting in case of an error (in ms), default 1000
 *  - `timeoutGb`: <number> - how long the pool keep a connection that hasn't been used (in ms), default 60*60*1000
 *  - `enforce`: {missing: <boolean>, extra: <boolean>, type: <boolean>}
 *  - `timeFormat`: "raw" or "native"
 *
 */
function Thinky(config) {
    var self = this;

    config = config || {};
    config.db = config.db || 'test'; // We need the default db to create it.
    
    this._options = {}
    this._options.enforce_missing = (config.enforce_missing != null) ? config.enforce_missing : false;
    this._options.enforce_extra = (config.enforce_extra != null) ? config.enforce_extra : false;
    this._options.enforce_type = (config.enforce_type != null) ? config.enforce_type : 'loose'; // loose, strict, none
    this._options.timeFormat = (config.timeFormat != null) ? config.timeFormat : 'native';
    this._options.validate = (config.validate != null) ? config.validate : 'onsave'; // 'onsave' or 'oncreate'

    this.r = rethinkdbdash(config);
    this.Query = Query;
    this.models = {};

    // Can we start using the database?
    this._dbReady = false;
    this._onDbReady = []; // functions to execute once the database is ready

    // Create the default database
    var r = this.r;
    r.dbList().contains(config.db).do(function(result) {
        return r.branch(
            result,
            {created: 1},
            r.dbCreate(config.db)
        )
    }).run().then(function(result) {
        self._dbReady = true; 
        for(var i=0; i<self._onDbReady.length; i++) {
            self._onDbReady[i]();
        }
    }).error(function(error) {
        throw error;
    }); 
}

Thinky.prototype.getOptions = function() {
    return this._options;
}


// options can be
// - init: Boolean (create a table or not)
// - timeFormat: 'raw'/'native'
// - enforce_extra: Boolean
// - enforce_missing: Boolean
// - enforce_type: 'strict'/'loose'/'none'
// - validate: 'oncreate'/'onsave' (default 'onsave')
Thinky.prototype.createModel = function(name, schema, options) {
    var self = this;

    var fullOptions = util.deepCopy(this._options);
    options = options || {};
    for(var key in options) {
        fullOptions[key] = options[key];
    }

    if (self.models[name] !== undefined) {
        throw new Error("Cannot redefine a Model");
    }

    var model = Model.new(name, schema, fullOptions, self);
    self.models[name] = model;

    if (fullOptions.init !== false) {
        // Create the table, or push the table name in the queue.
        var r = self.r;
        if (self._dbReady) {
            r.tableList().contains(name).do(function(result) {
                return r.branch(
                    result,
                    {created: 1},
                    r.tableCreate(name, {primaryKey: model._pk})
                )
            }).run().then(function(result) {
                model._tableWasCreated();
            }).error(function(error) {
                model._error = error;
            })
        }
        else {
            self._onDbReady.push(function() {
                r.tableList().contains(name).do(function(result) {
                    return r.branch(
                        result,
                        {created: 1},
                        r.tableCreate(name, {primaryKey: model._pk})
                    )
                }).run().then(function(result) {
                    model._tableWasCreated();
                }).error(function(error) {
                    model._error = error;
                })
            });
        }
    }
    else {
        model._getModel()._tableCreated = true;
    }
    return model;
}


module.exports = function(config) {
    return new Thinky(config);
}
