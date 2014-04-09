var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');

describe('schema', function(){
    it('String', function(){
        var name = util.s8();
        thinky.createModel(name, {id: String}, {init: false})
    });
    it('Number', function(){
        var name = util.s8();
        thinky.createModel(name, {id: Number}, {init: false})
    });
    it('Boolean', function(){
        var name = util.s8();
        thinky.createModel(name, {id: Boolean}, {init: false})
    });
    it('Array', function(){
        var name = util.s8();
        thinky.createModel(name, {id: Array}, {init: false})
    });
    it('Object', function(){
        var name = util.s8();
        thinky.createModel(name, {id: Object}, {init: false})
    });
    it('String - 2', function(){
        var name = util.s8();
        thinky.createModel(name, {id: {_type: String}}, {init: false})
    });
    it('Number - 2', function(){
        var name = util.s8();
        thinky.createModel(name, {id: {_type: Number}}, {init: false})
    });
    it('Boolean', function(){
        var name = util.s8();
        thinky.createModel(name, {id: {_type: Boolean}}, {init: false})
    });
    it('Array', function(){
        var name = util.s8();
        thinky.createModel(name, {id: {_type: Array}}, {init: false})
    });
    it('Object', function(){
        var name = util.s8();
        thinky.createModel(name, {id: {_type: Object}}, {init: false})
    });
    it('Non valid value - 1', function(done){
        var name = util.s8();
        try {
            thinky.createModel(name, {id: 1}, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` for [id]");
            done();
        }
    });
    it('Non valid value - undefined', function(done){
        var name = util.s8();
        try {
            thinky.createModel(name, {id: undefined}, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` for [id]");
            done();
        }
    });
    it('Empty object is valid', function(){
        var name = util.s8();
        thinky.createModel(name, {id: {}}, {init: false})
    });
    it('Non valid value - nested 1', function(done){
        var name = util.s8();
        try {
            thinky.createModel(name, {id: {bar: 2}}, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` for [id][bar]");
            done();
        }
    });
    it('Empty array is valid', function(){
        var name = util.s8();
        thinky.createModel(name, {id: []}, {init: false})
    });
    it('Array of length > 1 should throw', function(done){
        var name = util.s8();
        try{
            thinky.createModel(name, {id: [{bar: String}, {foo: String}]}, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "An array in a schema can have at most one element. Found 2 elements in [id]")
            done();
        }
    });
    it('Array of length 1 with class is valid - String', function(){
        var name = util.s8();
        thinky.createModel(name, {id: [String]}, {init: false})
    });
    it('Array of length 1 with class is valid - Boolean', function(){
        var name = util.s8();
        thinky.createModel(name, {id: [Boolean]}, {init: false})
    });
    it('Array of length 1 with class is valid - Number', function(){
        var name = util.s8();
        thinky.createModel(name, {id: [Number]}, {init: false})
    });
    it('Array of length 1 with class is valid - Object', function(){
        var name = util.s8();
        thinky.createModel(name, {id: [Object]}, {init: false})
    });
    it('Array of length 1 with class is valid - Array', function(){
        var name = util.s8();
        thinky.createModel(name, {id: [Array]}, {init: false})
    });
    it('Array of Array', function(){
        var name = util.s8();
        thinky.createModel(name, {id: [[String]]}, {init: false})
    });
    it('Object in Object', function(){
        var name = util.s8();
        thinky.createModel(name, {id: {foo: {bar: String}}}, {init: false})
    });
    it('Object in Object - non valid type', function(done){
        var name = util.s8();
        try{
            thinky.createModel(name, {id: {foo: {bar: 1}}}, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` for [id][foo][bar]")
            done();
        }
    });
    it('Object in Object - non valid type', function(done){
        var name = util.s8();
        try{
            thinky.createModel(name, {id: {foo: {bar: {_type: 1}}}}, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Object`/`Array` for [id][foo][bar]")
            done();
        }
    });
    it('Object in Object - non valid type', function(done){
        var name = util.s8();
        try{
            thinky.createModel(name, 1, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "The schema must be a plain object.")
            done();
        }
    });
});
