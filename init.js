var r = require('rethinkdb');
var config = require('./config.js');
var util = require('util');

var connection;
r.connect({
    host: config.host,
    port: config.port,
    db: config.db
}, function(error, conn) {
    if (error) throw error;

    connection = conn;
    createDb(config.db, function() {
        createTable('Cat', function() { createIndex('Cat', 'name') })
        createTable('Dog')
        createTable('Human')
        createTable('Task', function() { createIndex('Task', 'catId') })
        createTable('Mother')
    })
});

function createDb(name, cb) {
    r.dbCreate(config.db).run(connection, function(error, result) {
        if (error) throw error;
        if ((result != null) && (result.created === 1)) {
            console.log('Db `'+name+'` created');
            if (typeof cb === 'function') {
                cb()
            }
        }
        else {
            console.log('Error: Table Human not created');
        }
    });
}

function createTable(name, cb) {
    r.db(config.db).tableCreate(name).run(connection, function(error, result) {
        if (error) throw error;
        if ((result != null) && (result.created === 1)) {
            console.log('Table `'+name+'` created');
            if (typeof cb === 'function') {
                cb()
            }
        }
        else {
            console.log('Error: Table Human not created');
        }
    });
}

function createIndex(table, name, cb) {
    r.db(config.db).table(table).indexCreate(name).run(connection, function(error, result) {
        if (error) throw error;
        if ((result != null) && (result.created === 1)) {
            console.log('Index `'+name+'` created');
            if (typeof cb === 'function') {
                cb()
            }
        }
        else {
            console.log('Error: Index '+name+' not created');
        }
    });
}
