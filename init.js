var r = require('rethinkdb');
var config = require('./config.js');
var util = require('util');
var async = require('async');

var connection;

function log() {
    var args = Array.prototype.slice.apply(arguments);
    console.log.apply(console, args);
}

function connect(cb) {
    r.connect({
        host: config.host,
        port: config.port,
        db: config.db
    }, function(error, conn) {
        if (error) throw error;
        log("Connection initialized.");
        connection = conn;
        cb();
    });
};

function createEmptyDb(cb) {
    r.dbDrop(config.db).run(connection, function(error, result) {
        // The error that matters it the one thrown by dbCreate
        r.dbCreate(config.db).run(connection, function(error, result) {
            if (error) throw error;
            log("  Database", config.db, "created");
            cb();
        });
    });
};

function createTable(tableName, cb) {
    r.tableCreate(tableName).run(connection, function(error, result) {
        if (error) throw error;
        log("    ", tableName, "created.");
        cb();
    });
};


function createIndex(args, cb) {
    var tableName = args[0];
    var indexName = args[1];
    r.table(tableName).indexCreate(indexName).run( connection, function(error, result) {
        if (error) throw error;
        log("      ", indexName, "for the table", tableName, "created.");
        cb();
    });
};


connect(function() {
    createEmptyDb(function() {
        async.map(["Cat", "Dog", "Human", "Task", "Mother", "CatTaskLink"], createTable, function() {
            async.map([["Cat", "name"], ["Task", "catId"], ["CatTaskLink", "catId"], ["CatTaskLink", "taskId"]], createIndex, function() {
                log("");
                log("All databases/tables/indexes created.")
                log("Run `mocha` to execute the tests.")
                log("");
                connection.close();
            });
        });
    });
});
