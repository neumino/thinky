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
        authKey: '',
        poolMax: 10,
        poolMin: 1,
        enforce: { type: true, missing: false, extra: false },
        timeFormat: 'native'
    };

    this.options = {};
};

Thinky.prototype.init = function(options) {
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

    this.setOptions({
        host: options.host || this.defaultSettings.host,
        port: options.port || this.defaultSettings.port,
        db: options.db || this.defaultSettings.db,
        authKey: options.authKey || this.defaultSettings.authKey,
        poolMax: options.poolMax || 10,
        poolMin: options.poolMin || 1,
        enforce: this.options.enforce || this.defaultSettings.enforce,
        timeFormat: this.options.timeFormat || this.defaultSettings.timeFormat
    });

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
                var stack = new Error().stack
                //console.log( stack )

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
    else if ((newValue != null) && (typeof newValue === 'object') && (Object.prototype.toString.call(newValue) === '[object Object]')) {
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

Thinky.prototype.getOption = function (key) {
    return this.options[key];
};

Thinky.prototype.disconnect = function() {
    var self = this;
    if (self.pool) {
        self.pool.drain(function() {
            self.pool.destroyAllNow();
        });
    }
}

Thinky.prototype.Model = require('./model.js');
Thinky.prototype.createModel = function(name, schema, settings) {
    model = Thinky.prototype.Model.compile(name, schema, settings, this);
    this.models[name] = model;
    return model;
};

var thinky = module.exports = exports = new Thinky;
