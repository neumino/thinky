var r = require('rethinkdb');
var config = require('./config.js');
var util = require('util');

r.connect({
    host: config.host,
    port: config.port,
    db: config.db
}, function(error, connection) {
    if (error) throw error;
    r.db(config.db).tableCreate('Todo').run(connection, function(error, result) {
        if (error) throw error;
        if ((result != null) && (result.created === 1)) {
            console.log('Table `Todo` created');
        }
        else {
            console.log('Error: Table not created');
        }
        connection.close();
        process.exit();
    });
});
