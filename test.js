var config = require(__dirname+'/config.js');
var thinky = require(__dirname+'/lib/thinky.js')(config);
var r = thinky.r;
var Errors = thinky.Errors;

var util = require(__dirname+'/test/util.js');
var assert = require('assert');



var name = util.s8();
var Model = thinky.createModel(name, {
    id: String,
    str: String,
    num: Number
})

var str = util.s8();
var num = util.random();

doc = new Model({
    str: str,
    num: num
})
doc.save().then(function(result) {
    console.log('saved');
    assert.equal(typeof doc.id, 'string');
    assert.equal(doc.isSaved(), true);

    return doc.delete()
}).then(function() {
    console.log('deleted');
    assert.equal(typeof doc.id, 'string');
    return Model.run()
}).then(function(result) {
    console.log('retrieved all');
    assert.equal(result.length, 0);
});

