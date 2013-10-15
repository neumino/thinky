var r = require('rethinkdb');
var config = require('./config.js');
var util = require('util');

var connection;
var indexCreated = 0;
var indexToCreate = 4;
r.connect({
    host: config.host,
    port: config.port,
    db: config.db
}, function(error, conn) {
    if (error) throw error;

    connection = conn;
    dropDb(config.db, function() {
        createDb(config.db, function() {
            createTable('Cat', function() { createIndex('Cat', 'name', done) })
            createTable('Dog')
            createTable('Human')
            createTable('Task', function() { createIndex('Task', 'catId', done) })
            createTable('Mother')
            createTable('CatTaskLink', function() { createIndex('CatTaskLink', 'catId', done); createIndex('CatTaskLink', 'taskId', done) })
        })
    })
});

function dropDb(name, cb) {
    r.dbDrop(name).run(connection, function(error, result) {
        if (error) console.log(error);
        if ((result != null) && (result.created === 1)) {
            console.log('Db `'+name+'` created');
        }
        else {
            console.log('Error: Database `'+config.db+'` was not deleted.');
        }

        if (typeof cb === 'function') {
            cb()
        }

    });
}

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
            console.log('Error: Database `'+name+'` not created');
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
            console.log('Error: Table `'+name+'` not created');
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

function done() {
    indexCreated++;
    if (indexCreated === indexToCreate) {
        console.log('Init script complete, please check for errors.')
        connection.close()
    }
}
