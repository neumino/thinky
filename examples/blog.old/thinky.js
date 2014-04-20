var thinky = require('thinky');
var config = require('./config');

// Initialize thinky
// The most important thing is to initialize the pool of connection
thinky.init({
    host: config.host,
    port: config.port,
    db: config.db
});

exports.thinky = thinky;
