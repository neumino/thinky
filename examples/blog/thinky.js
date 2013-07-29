var thinky = require('thinky');
var config = require('./config');


thinky.init({
    host: config.host,
    port: config.port,
    db: config.db
});

exports.thinky = thinky;
