'use strict';
var Promise = require('bluebird'),
    chai = require('chai'),
    config = require('../config'),
    thinky = require('../lib/thinky')(config),
    r = thinky.r;

// chai.config.truncateThreshold = 0;
chai.config.includeStack = true;

function TestFixture() {
  this._tablesToCleanup = [];
}

TestFixture.prototype.createModel = function(name, options) {
  this._tablesToCleanup.push(name);
  return thinky.createModel(name, options);
};

TestFixture.prototype.dropTables = function() {
  var promises = [];
  this._tablesToCleanup.forEach(function(tableName) {
    promises.push(r.table(tableName).delete().run().then(function() {
      return r.tableDrop(tableName).run();
    }));
  });

  this._tablesToCleanup = [];
  return Promise.all(promises)
    .then(function() {
      thinky._clean();
    });
};

module.exports = TestFixture;
