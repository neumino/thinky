var Promise = require('bluebird');
var config = require('./config');
var r = require('rethinkdbdash')(config.rethinkdb);

var run = Promise.coroutine(function* () {
    try{
        yield r.dbCreate("dashex").run();
        console.log("Database `dashex` created");
    }
    catch(e) {
        console.log(e.message);
        console.log(e);
    }

    try{
        yield r.db("dashex").tableCreate("todo").run();
        console.log("Table `todo` created");
    }
    catch(e) {
        console.log(e.message);
        console.log(e);
    }

    try{
        yield r.db("dashex").table("todo").indexCreate("createdAt").run();
        console.log("Index `createdAt` created.");
    }
    catch(e) {
        console.log(e.message);
        console.log(e);
    }
    yield r.getPool().drain();
})()

