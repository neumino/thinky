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
};


Thinky.prototype.connect = function(options) {
    var self = this;

    if (!(options instanceof Object)) options = {}
    this.host = options.host || 'localhost';
    this.port = options.port || 28015;
    this.db = options.db || 'test';
    this.options = {
        poolMax: options.poolMax || 10,
        poolMin: options.poolMin || 1
    }

    //TODO add option for not using a pool

    this.pool = gpool.Pool({
        name: 'rethinkdbPool',
        create: function(cb) {
            r.connect({
                host: self.host,
                port: self.port,
                db: self.db
            }, function(error, conn) {
                return cb(error, conn);
            })
        },
        destroy: function(connection) {
            connection.close();
        },
        max: self.poolMax,
        min: self.poolMin,
        idleTimeoutMillis: 30000,
        log: function(what, level) {
            if (level === 'error') {
                require('fs').appendFile('rethinkdb-pool.log', what+'\r\n');
            }
        }
    })
};

Thinky.prototype.getOptions = function () {
    return this.options;
};
Thinky.prototype.setOptions = function (options, overwrite) {
    //TODO if we change poolMax or poolMin, we have to recreate a pool
    if (overwrite) {
        this.options = options;
    }
    else {
        for(var key in options) {
            this.options[key] = options[key]
        }
    }
    return this.options;
};


Thinky.prototype.setOption = function (key, value) {
    //TODO if we change poolMax or poolMin, we have to recreate a pool
    this.options[key] = value;
    return this;
};

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
