/*!
 * Module dependencies.
 */

//var Schema = require('./schema');
var gpool = require('generic-pool');
var r = require('rethinkdb');
/**
 * Let's roll out things 
 */

function Thinky () {
    this.models = {};

    this.defaultSettings = {
        host: 'localhost',
        port: 28015,
        db: 'test',
        poolMax: 10,
        poolMin: 1,
        enforce: { type: true, missing: false, extra: false }
    };

    this.options = {};
};

Thinky.prototype.connect = function(options) {
    var self = this;

    if (!(options instanceof Object)) {
        options = {};
    }
    else if (options === null) {
        options = {};
    }
    else if (Object.prototype.toString.call(options) === '[object Array]') {
        options = {};
    }

    //TODO use this.setOptions and add checks
    this.options = {
        host: options.host || this.defaultSettings.host,
        port: options.port || this.defaultSettings.port,
        db: options.db || this.defaultSettings.db,
        poolMax: options.poolMax || 10,
        poolMin: options.poolMin || 1,
        enforce: this.options.enforce || this.defaultSettings.enforce
    }

    this.createPool();

    //TODO add option for not using a pool
};

Thinky.prototype.createPool = function () {
    var self = this;
    this.pool = gpool.Pool({
        name: 'rethinkdbPool',
        create: function(cb) {
            r.connect({
                host: self.options.host,
                port: self.options.port
            }, function(error, conn) {
                return cb(error, conn);
            })
        },
        destroy: function(connection) {
            connection.close();
        },
        max: self.options.poolMax,
        min: self.options.poolMin,
        idleTimeoutMillis: 30000,
        log: function(what, level) {
            if (level === 'error') {
                require('fs').appendFile('rethinkdb-pool.log', what+'\r\n');
            }
        }
    })
}

Thinky.prototype.getOptions = function () {
    return this.options;
};
Thinky.prototype.setOptions = function (options) {
    shouldDrain = false;
    for(var key in options) {
        if ((key === 'host') || (key === 'port')) shouldDrain = true;
        this.setOption(key, options[key], false);
    }
    if (shouldDrain === true) {
        this.disconnect();
        this.createPool();
    }
    return this.options;
};


Thinky.prototype.setOption = function (key, value, drainPool) {
    drainPool = drainPool || true;
    //TODO Update generic pool to be able to change the pool size.
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
            if ((key === 'host') || (key === 'port')) {
                this.disconnect();
                this.createPool();
            }
        }
    }
    return this.options;
};

Thinky.prototype.checkEnforce = function(newValue, defaultValue) {
    if (newValue === true) {
        return {missing: true, extra: true, type: true}
    }
    else if (newValue === false) {
        return {missing: false, extra: false, type: false}
    }
    else if ((newValue != null) && (typeof newValue === 'object')
        && (typeof settings.enforce.extra === 'boolean')
        && (typeof settings.enforce.type === 'boolean')
        && (typeof settings.enforce.missing === 'boolean')) {
            return newValue
    }
    else {
        return defaultValue
    }

}

Thinky.prototype.getOption = function (key) {
    return this.options[key];
};

Thinky.prototype.disconnect = function() {
    var self = this;
    self.pool.drain(function() {
        self.pool.destroyAllNow();
    });
}

Thinky.prototype.Model = require('./model.js');
Thinky.prototype.createModel = function(name, schema, settings) {
    model = Thinky.prototype.Model.compile(name, schema, settings, this);
    this.models[name] = model;
    return model;
};

var thinky = module.exports = exports = new Thinky;
