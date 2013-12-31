var gpool = require('generic-pool');
var r = require('rethinkdb');
var util = require('./utils.js');

/*
 * Main constructor
 */
function Thinky () {
    this.models = {};

    // Default settings
    this.defaultSettings = {
        host: 'localhost',
        port: 28015,
        db: 'test',
        authKey: '',
        poolMax: 10,
        poolMin: 1,
        enforce: { type: true, missing: false, extra: false },
        timeFormat: 'native',
        timeoutConnection: 20000 // Default timeout for r.connect is 20 seconds in the JS driver
    };

    this.options = {};
};

/*
 * Initialize settings + pool
 * Valid options are:
 *   - host: host of the RethinkDB instance
 *   - port: port used by RethinkDB
 *   - db: default database
 *   - authKey: authentification key for RethinkDB
 *   - poolMax: maximum number of connections in the pool
 *   - poolMin: minimum number of connections in the pool
 *   - enforce: {missing: <bool>, extra: <bool>, type: <bool>}
 *       Default value: {missing: true, extra: false, type: false}
 *   - timeFormat: format of ReQL date
 *       "raw" or "native" like in the JS driver
 */
Thinky.prototype.init = function(options) {
    var self = this;

    if ((!Object.isPlainObject(options)) || (Array.isArray(options))) {
        options = {};
    }

    this.setOptions({
        host: options.host || this.defaultSettings.host,
        port: options.port || this.defaultSettings.port,
        db: options.db || this.defaultSettings.db,
        authKey: options.authKey || this.defaultSettings.authKey,
        poolMax: options.poolMax || this.defaultSettings.poolMax,
        poolMin: options.poolMin || this.defaultSettings.poolMin,
        enforce: this.options.enforce || this.defaultSettings.enforce,
        timeFormat: this.options.timeFormat || this.defaultSettings.timeFormat
    });

    this.createPool();
    //TODO add option for not using a pool
};

/*
 * Create the pool of connections
 */
Thinky.prototype.createPool = function () {
    var self = this;

    this.pool = gpool.Pool({
        name: 'rethinkdbPool',
        create: function(cb) {
            r.connect({
                host: self.options.host,
                port: self.options.port,
                authKey: self.options.authKey
            }, function(error, conn) {
                return cb(error, conn);
            })
        },
        destroy: function(connection) {
            connection.close();
        },
        max: self.options.poolMax,
        min: self.options.poolMin,
        idleTimeoutMillis: self.options.timeoutConnection,
        log: function(what, level) {
            if (level === 'error') {
                require('fs').appendFile('rethinkdb-pool.log', what+'\r\n');
            }
        }
    })
}

/*
 * Return all options
 */
Thinky.prototype.getOptions = function () {
    return this.options;
};

/*
 * Set a group of options
 * Changing host/port/poolMax/poolMin will reset the pool of connections 
 */
Thinky.prototype.setOptions = function (options) {
    var shouldDrain = false;
    for(var key in options) {
        if ((key === 'host') || (key === 'port') || (key === 'poolMax') || (key === 'poolMin')) shouldDrain = true;
        this.setOption(key, options[key], false);
    }
    if (shouldDrain === true) {
        this.disconnect();
        this.createPool();
    }
    return this.options;
};

/*
 * Set a single option
 * Changing host/port/poolMax/poolMin will reset the pool of connections 
 */
Thinky.prototype.setOption = function (key, value, drainPool) {
    drainPool = drainPool || true;
    //TODO Update generic pool to be able to change the pool size without creating a new one.
    if (key === 'enforce') {
        this.options.enforce = this.checkEnforce(value, this.defaultSettings.enforce);
    }
    else {
        if (value === null) {
            this.options[key] = this.defaultSettings[key];
        }
        else {
            this.options[key] = value;
        }
        if (drainPool === true) {
            if ((key === 'host') || (key === 'port') || (key === 'poolMin') || (key === 'poolMax')) {
                this.disconnect();
                this.createPool();
            }
        }
    }
    return this.options;
};

/*
 * Check the value of enforce and return its complete value
 */
Thinky.prototype.checkEnforce = function(newValue, defaultValue) {
    if (newValue === true) {
        return {missing: true, extra: true, type: true}
    }
    else if (newValue === false) {
        return {missing: false, extra: false, type: false}
    }
    else if (Object.isPlainObject(newValue)) {
        var result = {
            extra: defaultValue.extra,
            type: defaultValue.type,
            missing: defaultValue.missing
        }
        if (typeof newValue.extra === 'boolean') {
            result.extra = newValue.extra;
        }
        if (typeof newValue.missing === 'boolean') {
            result.missing = newValue.missing;
        }
        if (typeof newValue.type === 'boolean') {
            result.type = newValue.type;
        }
        return result
    }
    else {
        return defaultValue
    }
}

/*
 * Return a single option
 */
Thinky.prototype.getOption = function (key) {
    return this.options[key];
};

/*
 * Destroy the pool of connections
 */
Thinky.prototype.disconnect = function() {
    var self = this;
    if (self.pool) {
        self.pool.drain(function() {
            self.pool.destroyAllNow();
        });
    }
}

/*
 * Bind Model to Thinky.prototype.Model
 */
Thinky.prototype.Model = require('./model.js');

/*
 * Method to create a new model
 */
Thinky.prototype.createModel = function(name, schema, settings) {
    model = Thinky.prototype.Model.compile(name, schema, settings, this);
    this.models[name] = model;
    return model;
};

/*
 * Export a new Thinky object
 */
var thinky = module.exports = exports = new Thinky;
