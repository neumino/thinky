var config = require(__dirname+'/config.js');
var thinky = require(__dirname+'/lib/thinky.js')(config);
var r = thinky.r;
var Errors = thinky.Errors;

var util = require(__dirname+'/test/util.js');
var assert = require('assert');

var tableName = util.s8();
var Test = thinky.createModel(tableName, {
    id: Number,
    'f': {
        _type: Number,
        validator: function(value) {
            return value == undefined || value == 42;
        }
    }
});

/*
var t = new Test({id: 1, f: 2});
t.save().then(console.log).error(console.log).finally(function() {
    r.table(tableName).run().then(console.log)
})
*/

var t = new Test({id: 1});
t.save().then(function() {
    console.log("saved")
    t.f = 1;
    t.save().then(function() {
        console.log("updated")

    }).catch(console.log).finally(function() {
        r.table(tableName).run().then(console.log)
    })
}).catch(console.log)
