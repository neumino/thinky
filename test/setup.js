'use strict';

// implement this: https://mochajs.org/#global-teardown-fixtures

var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);

// exports.mochaGlobalSetup = async function () {};

exports.mochaGlobalTeardown = async function () {
  // close down thinky
  return thinky.r.getPoolMaster().drain().finally(() => {
    // print mocha stats
    console.log(this.stats)
    // close down nodejs with an exit code corresponding to number of failures (non-zero indicates an error)
    process.exit(this.failures);
  });
};