'use strict';
var Promise = require('bluebird'),
    config = require('../config'),
    thinky = require('../lib/thinky'),
    util = require('./util'),
    chai = require('chai');

chai.config.includeStack = true;
chai.use(require('chai-as-promised'));

function TestFixture() {
  this.models = {};
}

TestFixture.prototype.initializeDatabase = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.dbName = util.s8();
    self.thinky = thinky({
      db: self.dbName,
      host: config.host,
      port: config.port,
      silent: true
    });

    self.r = self.thinky.r;
    self.type = self.thinky.type;
    resolve();
  });
};

TestFixture.prototype.clearTables = function() {
  var self = this, promises = [];
  Object.keys(this.thinky.models).forEach(function(model) {
    if (self.thinky.models[model]._initModel) {
      promises.push(self.r.table(model).delete().run());
    }
  });

  return Promise.all(promises);
};

TestFixture.prototype.dropTables = function() {
  var self = this, promises = [];
  Object.keys(this.thinky.models).forEach(function(model) {
    if (self.thinky.models[model]._initModel) {
      promises.push(self.r.tableDrop(model).run());
    }
  });

  return Promise.all(promises)
    .then(function() { self.thinky._clean(); });
};


TestFixture.prototype.dropDatabase = function() {
  var self = this;
  return self.r
    .dbDrop(self.dbName)
    .then(function() {
      self.dbName = undefined;
      self.thinky = undefined;
      self.models = {};
    });
};

module.exports = TestFixture;
