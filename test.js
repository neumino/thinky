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
    num: Number,
    nested: {
        foo: Number,
        bar: Number
    }
})

var str = util.s8();
var num = util.random();

doc = new Model({
    str: str,
    num: num,
    nested: { foo: 1, bar: 2}
})
doc.save().then(function(result) {
    console.log('saved');
    assert.equal(typeof doc.id, 'string');
    assert.equal(doc.isSaved(), true);

    doc.str = "lalala";
    doc.nested.bar = 3;
    console.log(doc.getOldValue());
    console.log(doc);

}).error(console.log);
