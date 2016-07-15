var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;
var type = thinky.type;
var Errors = thinky.Errors;

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
      assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for [id]");
      done();
    }
  });
  it('Non valid value - undefined', function(done){
    var name = util.s8();
    try {
      thinky.createModel(name, {id: undefined}, {init: false})
    }
    catch(err) {
      assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for [id]");
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
      assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for [id][bar]");
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
  it('Object in Object - non valid type - 1', function(done){
    var name = util.s8();
    try{
      thinky.createModel(name, {id: {foo: {bar: 1}}}, {init: false})
      done(new Error("Expecting error"));
    }
    catch(err) {
      assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for [id][foo][bar]")
      done();
    }
  });
  it('Object in Object - non valid type - 2', function(done){
    var name = util.s8();
    try{
      thinky.createModel(name, {id: {foo: {bar: {_type: 1}}}}, {init: false})
      done(new Error("Expecting error"));
    }
    catch(err) {
      assert.equal(err.message, "The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for [id][foo][bar]")
      done();
    }
  });
  it('Object in Object - non valid type - 3', function(done){
    var name = util.s8();
    try{
      thinky.createModel(name, 1, {init: false})
      done(new Error("Expecting error"));
    }
    catch(err) {
      assert.equal(err.message, "The schema must be a plain object.")
      done();
    }
  });
});
describe('Chainable types', function(){
  // Chainable types were added in 1.15.3, prior tests still validates options and such.
  // These tests are mostly for new validators like `min`/`max`/`alphanum`/etc.
  it('General - chainable types in nested schemas', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
     {id: type.string(),
      objectArray: [{ myAttribute: thinky.type.object() }]})
    var doc = new Model({ id: util.s8(), objectArray : {} })
  });
  it('String - basic - valid string', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string()},
      {init: false})
    var doc = new Model({ id: util.s8() })
  });
  it('String - basic - wrong type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 1 });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a string or null.")
    });
  });
  it('String - basic - null', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string()},
      {init: false})
    var doc = new Model({});
    doc.validate();
  });
  it('String - basic - null and strict - deprecated', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().options({enforce_type: "strict"})},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: null});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a string.")
    });
  });
  it('String - basic - null and strict', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().allowNull(false)},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: null});
      doc.validate();
    }, function(error) {
      return (error instanceof Error) && (error.message === "Value for [id] must be a string.")
    });
  });
  it('String - basic - null and strict', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().allowNull(false)},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: null});
      doc.validate();
    }, function(error) {
      return (error instanceof Error) && (error.message === "Value for [id] must be a string.")
    });
  });
  it('String - basic - undefined', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().allowNull(false)},
      {init: false})
    var doc = new Model({});
    doc.validate();
  });
  it('String - basic - undefined - enforce_missing: strict', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().required()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be defined.")
    });
  });
  it('String - r.uuid', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().default(r.uuid())},
      {init: false})
    var doc = new Model({});
    doc.validate();
  });
  it('String - min - too short', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().min(2) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'a'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must not be shorter than 2.");
    });
  });
  it('String - min - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().min(2) },
      {init: false})
    var doc = new Model({ id: 'abc'});
    doc.validate();
  });
  it('String - max - too long', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().max(5) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'abcdefgh'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must not be longer than 5.");
    });
  });
  it('String - max - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().max(5) },
      {init: false})
    var doc = new Model({ id: 'abc'});
    doc.validate();
  });
  it('String - length - too long', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().length(5) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'abcdef'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a string with 5 characters.");
    });
  });
  it('String - length - too short', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().length(5) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'abc'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a string with 5 characters.");
    });
  });
  it('String - length - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().max(5) },
      {init: false})
    var doc = new Model({ id: 'abcde'});
    doc.validate();
  });
  it('String - regex - not matching', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().regex('^foo') },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'bar'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must match the regex.");
    });
  });
  it('String - regex - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().regex('^foo') },
      {init: false})
    var doc = new Model({ id: 'foobar'});
    doc.validate();
  });
  it('String - regex with flags - not matching', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().regex('^foo', 'i') },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'bar'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must match the regex.");
    });
  });
  it('String - regex with flags - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().regex('^foo', 'i') },
      {init: false})
    var doc = new Model({ id: 'FOObar'});
    var doc = new Model({ id: 'Foobar'});
    var doc = new Model({ id: 'fOObar'});
    doc.validate();
  });
  it('String - alphanum - not alphanum', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().alphanum() },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'élégant'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be an alphanumeric string.");
    });
  });
  it('String - alphanum - match', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().alphanum() },
      {init: false})
    var doc = new Model({ id: 'fOOb12ar'});
    doc.validate();
  });
  it('String - email - not an email', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().email() },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'fooATbar.com'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a valid email.");
    });
  });
  it('String - email - match', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().email() },
      {init: false})
    var doc = new Model({ id: 'foo@bar.com'});
    doc.validate();
  });
  it('String - lowercase - not lowercase', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().lowercase() },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'fooBar'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a lowercase string.");
    });
  });
  it('String - lowercase - match', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().lowercase() },
      {init: false})
    var doc = new Model({ id: 'foobar'});
    doc.validate();
  });
  it('String - uppercase - not uppercase', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().uppercase() },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'fooBar'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a uppercase string.");
    });
  });
  it('String - uppercase - match', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().uppercase() },
      {init: false})
    var doc = new Model({ id: 'FOOBAR'});
    doc.validate();
  });
  it('String - uuid - not uuid v3', function (){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().uuid(3) },
      {init: false})
    var doc = new Model({id: "xxxA987FBC9-4BED-3078-CF07-9141BA07C9F3"})
  });
  it('String - uuid - is uuid v3', function (){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().uuid(3) },
      {init: false})
    var doc = new Model({id: "A987FBC9-4BED-3078-CF07-9141BA07C9F3"})
  });
  it('String - uuid - not uuid v4', function (){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().uuid(4) },
      {init: false})
    var doc = new Model({id: "A987FBC9-4BED-5078-AF07-9141BA07C9F3"})
  });
  it('String - uuid - is uuid v4', function (){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().uuid(4) },
      {init: false})
    var doc = new Model({id: "713ae7e3-cb32-45f9-adcb-7c4fa86b90c1"})
  });
  it('String - uuid - not uuid v5', function (){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().uuid(5) },
      {init: false})
    var doc = new Model({id: "9c858901-8a57-4791-81fe-4c455b099bc9"})
  });
  it('String - uuid - is uuid v5', function (){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().uuid(5) },
      {init: false})
    var doc = new Model({id: "987FBC97-4BED-5078-BF07-9141BA07C9F3"})
  });
  it('String - validator - return false', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().validator(function() { return false }) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'fooBar'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Validator for the field [id] returned `false`.");
    });
  });
  it('String - validator - return true', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().validator(function() { return true }) },
      {init: false})
    var doc = new Model({ id: 'FOOBAR'});
    doc.validate();
  });
  it('String - validator - throw', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().validator(function() { throw new Errors.ValidationError("Not good") }) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'fooBar'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Not good");
    });
  });
  it('String - enum - unknown value - 1', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().enum("foo", "bar") },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'buzz'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The field [id] must be one of these values: foo, bar.");
    });
  });
  it('String - enum - unknown value - 2', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().enum(["foo", "bar"]) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'buzz'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The field [id] must be one of these values: foo, bar.");
    });
  });
  it('String - enum - unknown value - 3', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().enum(["foo"]) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'buzz'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The field [id] must be one of these values: foo.");
    });
  });
  it('String - enum - unknown value - 4', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().enum("foo") },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 'buzz'});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The field [id] must be one of these values: foo.");
    });
  });

  it('String - enum - known value - 1', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().enum("foo", "bar") },
      {init: false})
    var doc = new Model({ id: 'foo'});
    doc.validate();
  });
  it('String - enum - known value - 2', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().enum(["foo", "bar"]) },
      {init: false})
    var doc = new Model({ id: 'foo'});
    doc.validate();
  });
  it('String - enum - known value - 3', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().enum(["foo"]) },
      {init: false})
    var doc = new Model({ id: 'foo'});
    doc.validate();
  });
  it('String - enum - known value - 4', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.string().enum("foo") },
      {init: false})
    var doc = new Model({ id: 'foo'});
    doc.validate();
  });

  it('Number - basic - valid number', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number()},
      {init: false})
    var doc = new Model({ id: 1 })
  });
  it('Number - basic - wrong type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: "foo" });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a finite number or null.")
    });
  });
  it('Number - basic - NaN', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: NaN });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a finite number or null.")
    });
  });
  it('Number - r.random()', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().default(r.uuid())},
      {init: false})
    var doc = new Model({});
    doc.validate();
  });
  it('Number - basic - Infinity', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: Infinity });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a finite number or null.")
    });
  });
  it('Number - basic - -Infinity', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: -Infinity });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a finite number or null.")
    });
  });
  it('Number - min - too small', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().min(2) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 1});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be greater than or equal to 2.");
    });
  });
  it('Number - min - negative', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().min(-2) },
      {init: false})
    var doc = new Model({ id: -1});
    doc.validate();
  });
  it('Number - min - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().min(2) },
      {init: false})
    var doc = new Model({ id: 3});
    doc.validate();
  });
  it('Number - min - just right', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().min(2) },
      {init: false})
    var doc = new Model({ id: 2});
    doc.validate();
  });
  it('Number - max - too big', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().max(5) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 8});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be less than or equal to 5.");
    });
  });
  it('Number - max - negative', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().max(-5) },
      {init: false})
    var doc = new Model({ id: -8});
    doc.validate();
  });
  it('Number - max - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().max(5) },
      {init: false})
    var doc = new Model({ id: 3});
    doc.validate();
  });
  it('Number - max - just right', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().max(5) },
      {init: false})
    var doc = new Model({ id: 5});
    doc.validate();
  });
  it('Number - integer - float', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().integer() },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 3.14});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be an integer.");
    });
  });
  it('Number - integer - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().integer() },
      {init: false})
    var doc = new Model({ id: 3});
    doc.validate();
  });
  it('Number - validator - return false', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().validator(function() { return false }) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 2});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Validator for the field [id] returned `false`.");
    });
  });
  it('Number - validator - return true', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().validator(function() { return true }) },
      {init: false})
    var doc = new Model({ id: 3});
    doc.validate();
  });
  it('Number - validator - throw', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().validator(function() { throw new Errors.ValidationError("Not good") }) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: 4});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Not good");
    });
  });

  it('Boolean - basic - valid boolean', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.boolean()},
      {init: false})
    var doc = new Model({ id: true })
  });
  it('Boolean - basic - wrong type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.boolean()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: "foo" });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a boolean or null.")
    });
  });
  it('Boolean - validator - return false', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.boolean().validator(function() { return false }) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: true});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Validator for the field [id] returned `false`.");
    });
  });
  it('Boolean - validator - return true', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.boolean().validator(function() { return true }) },
      {init: false})
    var doc = new Model({ id: true});
    doc.validate();
  });
  it('Boolean - validator - throw', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.number().validator(function() { throw new Errors.ValidationError("Not good") }) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: true});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Not good");
    });
  });

  it('Date - basic - valid date', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date()},
      {init: false})
    var doc = new Model({ id: new Date() })
    doc.validate();
  });
  it('Date - null', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date().allowNull(true)},
      {init: false})
    var doc = new Model({ id: null })
    doc.validate();
  });
  it('Date - number', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date()},
      {init: false})
    var doc = new Model({ id: Date.now() })
    doc.validate();
  });
  it('Date - basic - wrong type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: "foo" });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a date or a valid string or null.")
    });
  });
  it('Date - min - too small', function(){
    var minDate = new Date(0);
    minDate.setUTCSeconds(60*60*24*2);
    var valueDate = new Date(0);
    valueDate.setUTCSeconds(60*60*24);

    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date().min(minDate) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: valueDate});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && ((error.message.match("Value for .id. must be after")) !== null);
    });
  });
  it('Date - min - good', function(){
    var minDate = new Date(0);
    minDate.setUTCSeconds(60*60*24);
    var valueDate = new Date(0);
    valueDate.setUTCSeconds(60*60*24*2);

    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date().min(minDate) },
      {init: false})
    var doc = new Model({ id: valueDate});
    doc.validate();
  });
  it('Date - max - too big', function(){
    var maxDate = new Date(0);
    maxDate.setUTCSeconds(60*60*24);
    var valueDate = new Date(0);
    valueDate.setUTCSeconds(60*60*24*2);

    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date().max(maxDate) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: valueDate});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && ((error.message.match("Value for .id. must be before")) !== null);
    });
  });
  it('Date - max - good', function(){
    var maxDate = new Date(0);
    maxDate.setUTCSeconds(60*60*24*2);
    var valueDate = new Date(0);
    valueDate.setUTCSeconds(60*60*24);

    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date().max(maxDate) },
      {init: false})
    var doc = new Model({ id: valueDate});
    doc.validate();
  });
  it('Date - validator - return false', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date().validator(function() { return false }) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: new Date()});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Validator for the field [id] returned `false`.");
    });
  });
  it('Date - validator - return true', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date().validator(function() { return true }) },
      {init: false})
    var doc = new Model({ id: new Date()});
    doc.validate();
  });
  it('Date - validator - throw', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.date().validator(function() { throw new Errors.ValidationError("Not good") }) },
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: new Date()});
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Not good");
    });
  });

  it('Buffer - basic - valid buffer', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.buffer()},
      {init: false})
    var doc = new Model({ id: new Buffer("foobar") });
    doc.validate();
  });
  it('Buffer - basic - valid buffer', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.buffer()},
      {init: false})
    var doc = new Model({ id: null});
    doc.validate();
  });
  it('Buffer - basic - wrong type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.buffer()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: "foo" });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a buffer or null.")
    });
  });

  it('Point - basic - valid point - 1', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.point()},
      {init: false})
    var doc = new Model({ id: [10, 2] })
  });
  it('Point - basic - valid point - 2', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.point()},
      {init: false})
    var doc = new Model({ id: r.point(2, 10) });
  });
  it('Point - basic - wrong type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.point()},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: "foo" });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be a Point or null.")
    });
  });
  it('Object - basic - valid object', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.object().schema({
        foo: type.string()
      })},
      {init: false})
    var doc = new Model({ id: {foo: "bar" }})
  });
  it('Object - basic - wrong type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.object().schema({
        foo: type.string()
      })},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: "foo" });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be an object or null.")
    });
  });

  it('Array - basic - valid array', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string())},
      {init: false})
    var doc = new Model({ id: ['bar']})
  });
  it('Array - basic - wrong type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string())},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: "foo" });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be an array or null.")
    });
  });
  it('Array - basic - wrong nested type - 1', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string())},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: [2] });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id][0] must be a string or null.")
    });
  });
  it('Array - basic - wrong nested type - 2', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(String)},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: [2] });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id][0] must be a string or null.")
    });
  });
  it('Array - no schema - valid array - 1', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array()},
      {init: false})
    var doc = new Model({ id: ['bar']})
    doc.validate();
  });
  it('Array - no schema - valid array - 2', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array()},
      {init: false})
    var doc = new Model({ id: [{foo: "bar"}]})
    doc.validate();
  });
  it('Array - no schema - non valid array', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array()},
      {init: false})
    var doc = new Model({ id: 'bar'})
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be an array or null.")
    });
  });

  it('Array - basic - wrong nested type - 3', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema({_type: String})},
      {init: false})
    assert.throws(function() {
      var doc = new Model({ id: [2] });
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id][0] must be a string or null.")
    });
  });
  it('Array - min - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string()).min(2)},
      {init: false})
    var doc = new Model({ id: ['foo', 'bar', 'buzz']});
    doc.validate();
  });
  it('Array - min - error', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string()).min(2)},
      {init: false})
    var doc = new Model({ id: ['foo']});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must have at least 2 elements.")
    });
  });
  it('Array - max - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string()).max(2)},
      {init: false})
    var doc = new Model({ id: ['foo']});
    doc.validate();
  });
  it('Array - max - error', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string()).max(2)},
      {init: false})
    var doc = new Model({ id: ['foo', 'bar', 'buzz']});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must have at most 2 elements.")
    });
  });
  it('Array - length - good', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string()).length(2)},
      {init: false})
    var doc = new Model({ id: ['foo', 'bar']});
    doc.validate();
  });
  it('Array - length - error', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {id: type.array().schema(type.string()).length(2)},
      {init: false})
    var doc = new Model({ id: ['foo', 'bar', 'buzz']});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [id] must be an array with 2 elements.")
    });
  });
  it('Virtual - basic', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {
        id: type.string(),
        foo: type.virtual()
      },
      {init: false})
    var doc = new Model({ id: 'bar', foo: "bar"})
  });
  it('Any - basic', function(){
    var name = util.s8();
    var Model = thinky.createModel(name,
      {
        id: type.string(),
        foo: type.any()
      },
      {init: false})
    var doc = new Model({ id: 'bar', foo: "bar"})
    doc.validate();
    doc = new Model({ id: 'bar', foo: 2})
    doc.validate();
    doc = new Model({ id: 'bar', foo: undefined})
    doc.validate();
    doc = new Model({ id: 'bar', foo: null})
    doc.validate();
  });
})

describe('generateDefault', function(){
  it('String - constant', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: String, default: defaultValue}
    }, {init: false})

    doc = new Model({
      id: str
    })
    assert.equal(doc.id, str);
    assert.equal(doc.field, defaultValue);
  });
  it('String - function', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: String, default: function() {
        return defaultValue;
      }}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.equal(doc.field, defaultValue);
  });

  it('String - function - Test binding', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: String, default: function() {
        return this.id;
      }}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.equal(doc.field, str);
  });

  it('Number - constant', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = util.random();

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Number, default: defaultValue}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.equal(doc.field, defaultValue);
  });
  it('Number - function', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = util.random();

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Number, default: function() {
        return defaultValue;
      }}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.equal(doc.field, defaultValue);
  });

  it('Bool - constant', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = util.bool();

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Boolean, default: defaultValue}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.equal(doc.field, defaultValue);
  });
  it('Bool - function', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = util.bool();

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Boolean, default: function() {
        return defaultValue;
      }}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.equal(doc.field, defaultValue);
  });

  it('Array - constant', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = [1,2,3];

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Array, default: defaultValue}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.field, defaultValue);
  });
  it('Array - function', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = [1,2,3];

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Array, default: function() {
        return defaultValue;
      }}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.field, defaultValue);
  });
  it('Object - constant', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = {foo: "bar"};

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Object, default: defaultValue}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.field, defaultValue);
  });
  it('Object - function', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = {foo: "bar"};

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Object, default: function() {
        return defaultValue;
      }}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.field, defaultValue);
  });
  it('Object - constant', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = {foo: "bar"};

    var Model = thinky.createModel(name, {
      id: String,
      field: {_type: Object, default: defaultValue}
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.field, defaultValue);
    assert.notStrictEqual(doc.field, defaultValue);
  });

  it('Number - nested value', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = util.random();

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        _type: Object,
        schema: {
          field: {_type: Number, default: defaultValue}
        },
        default: {}
      }
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.equal(doc.nested.field, defaultValue);
  });

  it('Array - nested value - 1', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultArray = [1,2,3];
    var defaultValue = util.random();

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        _type: Array,
        schema: {
          field: {_type: Number, default: defaultValue}
        },
        default: defaultArray
      }
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.nested, defaultArray);
  });
  it('Array - nested value - 2', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultArray = [1,2,3];
    var defaultValue = util.random();

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        _type: Array,
        schema: {
          field: {
            _type: Object,
            schema: {value: {_type: Number, default: defaultValue} }
          }
        },
        default: defaultArray
      }
    }, {init: false})

    doc = new Model({
      id: str,
      nested: []
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.nested, []);
  });
  it('Array - nested value - 3', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultArray = [1,2,3];
    var defaultValue = util.random();

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        _type: Array,
        schema: {
          _type: Object,
          schema: {
            field: {_type: Number, default: defaultValue}
          }
        },
        default: defaultArray
      }
    }, {init: false})

    doc = new Model({
      id: str,
      nested: [{}]

    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.nested, [{field: defaultValue}]);
  });
  it('Array - nested value - 4', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultArray = [1,2,3];
    var defaultValue = util.random();

    var Model = thinky.createModel(name, {
      id: String,
      nested: [{
        _type: Object,
        schema: {
          field: {_type: Number, default: defaultValue}
        }
      }]
    }, {init: false})

    doc = new Model({
      id: str,
      nested: [{}]

    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.nested, [{field: defaultValue}]);
  });
  it('Array - nested value - 5', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultArray = [1,2,3];
    var defaultValue = util.random();

    var Model = thinky.createModel(name, {
      id: String,
      nested: [{
        _type: Object,
        schema: {
          field: {_type: Number, default: defaultValue}
        }
      }]
    }, {init: false})

    doc = new Model({
      id: str,
      nested: [{}, {field: 4}, {}]

    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.nested, [{field: defaultValue}, {field: 4}, {field: defaultValue}]);
  });

  it('Object - deep nested - 1', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = {foo: "bar"};

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        _type: Object,
        schema: {
          field1: {_type: Number, default: 1},
          field2: {_type: String, default: "hello"}
        }
      }
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc, { id: str });
  });
  it('Object - deep nested - 2', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = {foo: "bar"};

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        _type: Object,
        schema: {
          field1: {_type: Number, default: 1},
          field2: {_type: String, default: "hello"}
        },
        default: {}
      }
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc, { id: str, nested: { field1: 1, field2: 'hello' } });
  });
  it('Object - deep nested - 3', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = {foo: "bar"};

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        field1: {_type: Number, default: 1},
        field2: {_type: String, default: "hello"}
      }
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc, { id: str});
  });
  it('Object - deep nested - 4', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = {foo: "bar"};

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        field1: {_type: Number, default: 1},
        field2: {_type: String, default: "hello"}
      }
    }, {init: false})

    doc = new Model({
      id: str,
      nested: {}
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc, { id: str, nested: {field1: 1, field2: "hello"}});
  });
  it('Default array', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = {foo: "bar"};

    var Model = thinky.createModel(name, {
      id: String,
      ar: {
        _type: Array,
        default: function() { return [1,2,3] }
      }
    }, {init: false})

    doc = new Model({
      id: str
    })

    assert.equal(doc.id, str);
    assert.deepEqual(doc.ar, [1,2,3]);
  });
  it('Object - default should make a deep copy', function(){
    var name = util.s8();
    var Model = thinky.createModel(name, {
      field: type.object().default({foo: "bar"}).schema({
        foo: type.string()
      })
    }, {init: false})
    var doc1 = new Model({});
    var doc2 = new Model({});
    assert.equal(doc1.field.foo, "bar");
    assert.equal(doc2.field.foo, "bar");
    assert.notEqual(doc1.field, doc2.field)
    assert.deepEqual(doc1.field, doc2.field)
  });
  it('Array - default should make a deep copy', function(){
    var name = util.s8();
    var Model = thinky.createModel(name, {
      field: type.array().default([{foo: "bar"}]).schema({
        foo: type.string()
      })
    }, {init: false})
    var doc1 = new Model({});
    var doc2 = new Model({});
    assert.equal(doc1.field.length, 1);
    assert.equal(doc2.field.length, 1);
    assert.equal(doc1.field[0].foo, "bar");
    assert.equal(doc2.field[0].foo, "bar");
    assert.notEqual(doc1.field, doc2.field)
    assert.deepEqual(doc1.field, doc2.field)
  });
  it('Nested object should not throw with a null value - #314', function(){
    var name = util.s8();
    var str = util.s8();
    var defaultValue = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      nested: {
        field: type.string().default(2)
      }
    }, {init: false})

    doc = new Model({
      id: str,
      nested: null
    })
    doc.validate()
  });

});
describe('validate', function(){
  it('String - wrong type - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: 1
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a string.")
    });
  });
  it('String - wrong type  - type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: 1
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a string or null.")
    });

  });
  it('String - wrong type  - type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str,
      field: 1
    })

    doc.validate();
  });
  it('String - undefined - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: undefined
    })

    doc.validate();
  });
  it('String - undefined  - type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: undefined
    })

    doc.validate();
  });
  it('String - undefined  - type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str,
      field: undefined
    })

    doc.validate();
  });
  it('String - undefined  - type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'none', enforce_missing: true})

    doc = new Model({
      id: str,
      field: undefined
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be defined.")
    });
  });
  it('String - null - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: null
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a string.")
    });
  });
  it('String - null  - type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: null
    })

    doc.validate();
  });
  it('String - null  - type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str,
      field: null
    })

    doc.validate();
  });
  it('Number - wrong type - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Number
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a finite number.")
    });
  });
  it('Number - wrong type  - type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Number
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a finite number or null.")
    });

  });
  it('Number - wrong type  - type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Number
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    doc.validate();
  });
  it('Number - not wrong type - numeric string', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Number
    }, {init: false})

    doc = new Model({
      id: str,
      field: "123456"
    })

    doc.validate();
  });
  it('Boolean - wrong type - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Boolean
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a boolean.")
    });
  });
  it('Boolean - wrong type  - type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Boolean
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a boolean or null.")
    });

  });
  it('Boolean - wrong type  - type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Boolean
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    doc.validate();
  });
  it('Date - string type - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: (new Date()).toJSON()
    })

    doc.validate();
  });
  it('Date - wrong type - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a date or a valid string.")
    });
  });
  it('Date - wrong type  - type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field:  Date
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a date or a valid string or null.")
    });
  });
  it('Date - string type - type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: (new Date()).toJSON()
    })
    doc.validate();
  });

  it('Date - wrong type  - type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    doc.validate();
  });
  it('Date - raw type - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: {$reql_type$: "TIME", epoch_time: 1231, timezone: "+10:00" }
    })

    doc.validate();
  });
  it('Date - raw type - missing timezone - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: {$reql_type$: "TIME", epoch_time: 1231}
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The raw date object for [field] is missing the required field timezone.")
    });
  });
  it('Date - raw type - missing epoch_time - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: {$reql_type$: "TIME", timezone: "+00:00"}
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The raw date object for [field] is missing the required field epoch_time.")
    });
  });
  it('Date - r.now', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false})

    doc = new Model({
      id: str,
      field: r.now()
    })
    doc.validate();
  });
  it('Date - undefined - enforce_missing: true', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_missing: true})

    doc = new Model({
      id: str
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be defined.")
    });
  });
  it('Date - undefined - enforce_missing: false', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Date
    }, {init: false, enforce_missing: false})

    doc = new Model({
      id: str
    })
    doc.validate();
  });
  it('Buffer - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: new Buffer([1,2,3])
    })

    doc.validate();
  });
  it('Buffer - wrong type - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a buffer.")
    });
  });
  it('Buffer - wrong type  - type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a buffer or null.")
    });
  });

  it('Buffer - wrong type  - type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str,
      field: "hello"
    })

    doc.validate();
  });
  it('Buffer - raw type - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: {$reql_type$: "BINARY", data: (new Buffer("hello")).toString("base64") }
    })

    doc.validate();
  });
  it('Buffer - raw type - missing data - type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: { $reql_type$: "BINARY" }
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The raw binary object for [field] is missing the required field data.")
    });
  });
  it('Buffer - r.http', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false})

    doc = new Model({
      id: str,
      field: r.http('http://some/domain/com/some/binary/file')
    })
    doc.validate();
  });
  it('Buffer - undefined - enforce_missing: true', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false, enforce_missing: true})

    doc = new Model({
      id: str
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be defined.")
    });
  });
  it('Buffer - undefined - enforce_missing: false', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: Buffer
    }, {init: false, enforce_missing: false})

    doc = new Model({
      id: str
    })
    doc.validate();
  });
  it('Array - missing - enforce_missing: true', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_missing: true})

    doc = new Model({
      id: str
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be defined.")
    });
  });
  it('Array - undefined - enforce_missing: true', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_missing: true})

    doc = new Model({
      id: str
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be defined.")
    });
  });
  it('Array - undefined - enforce_missing: false', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_missing: false})

    doc = new Model({
      id: str
    })

    doc.validate();
  });
  it('Array - wrong type - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: 2
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be an array or null.")
    });
  });
  it('Array - wrong type - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: {}
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be an array or null.")
    });
  });
  it('Array - wrong type - enforce_type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str
    })

    doc.validate();
  });
  it('Array - wrong type inside - enforce_type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: ["hello"]
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field][0] must be a finite number.")
    });
  });
  it('Array - wrong type inside - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: ["hello"]
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field][0] must be a finite number or null.")
    });
  });
  it('Array - wrong type inside - enforce_type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'none'})

    doc = new Model({
      id: str,
      field: ["hello"]
    })

    doc.validate();
  });
  it('Array - wrong type inside - not first - enforce_type: "strict" - 1', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: [1, 2, 3, "hello"]
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field][3] must be a finite number.")
    });
  });
  it('Array - wrong type inside - not first - enforce_type: "strict" - 2', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'strict'})

    doc = new Model({
      id: str,
      field: [1, 2, 3, undefined]
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The element in the array [field] (position 3) cannot be `undefined`.")
    });
  });
  it('Array - wrong type inside - not first - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: [1, 2, 3, undefined]
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "The element in the array [field] (position 3) cannot be `undefined`.")
    });


  });
  it('Array - null - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: [Number]
    }, {init: false, enforce_type: 'loose'})

    doc = new Model({
      id: str,
      field: [1, 2, 3, null]
    })

    doc.validate();
  });
  it('Object - undefined - enforce_missing: true', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {}
    }, {init: false, enforce_missing: true})

    doc = new Model({
      id: str
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be defined.")
    });
  });
  it('Object - undefined - enforce_missing: false', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {}
    }, {init: false, enforce_missing: false})

    doc = new Model({
      id: str
    })

    doc.validate();
  });
  it('Object - undefined - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {}
    }, {init: false, enforce_type: "loose"})

    doc = new Model({
      id: str,
      field: "foo"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be an object or null.")
    });
  });
  it('Object - undefined - enforce_type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {}
    }, {init: false, enforce_type: "none"})

    doc = new Model({
      id: str
    })

    doc.validate();
  });
  it('Object - undefined - enforce_type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {}
    }, {init: false, enforce_type: "none"})

    doc = new Model({
      id: str
    })

    doc.validate();
  });
  it('Object - nested - enforce_type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {
        foo: Number
      }
    }, {init: false, enforce_type: "strict"})

    doc = new Model({
      id: str,
      field: "bar"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be an object.")
    });
  });
  it('Object - nested wrong type - enforce_type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {
        foo: Number
      }
    }, {init: false, enforce_type: "strict"})

    doc = new Model({
      id: str,
      field: "hello"
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be an object.")
    });
  });
  it('Object - nested wrong type - enforce_type: "strict" - 2', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {
        foo: Number
      }
    }, {init: false, enforce_type: "strict"})

    doc = new Model({
      id: str,
      field: {
        foo: "str"
      }
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field][foo] must be a finite number.")
    });
  });
  it('Object - nested wrong type - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {
        foo: Number
      }
    }, {init: false, enforce_type: "loose"})

    doc = new Model({
      id: str,
      field: {
        foo: "str"
      }
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field][foo] must be a finite number or null.")
    });
  });
  it('Object - Empty - enforce_type: "strict"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String
    }, {init: false, enforce_type: "strict"})

    doc = new Model({})

    doc.validate();
  });

  it('Object - nested wrong type 2 - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {
        foo: {_type: Number}
      }
    }, {init: false, enforce_missing: true, enforce_type: "loose"})

    doc = new Model({
      id: str,
      field: {}
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field][foo] must be defined.")
    });
  });
  it('Object - undefined - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {
        foo: {_type: Number}
      }
    }, {init: false, enforce_missing: false, enforce_type: "loose"})

    doc = new Model({
      id: str,
      field: {}
    })

    doc.validate();
  });
  it('Object - nested wrong type 4 - enforce_type: "loose"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {
        foo: {_type: Number, default: "foo"}
      }
    }, {init: false, enforce_missing: false, enforce_type: "loose"})

    doc = new Model({
      id: str,
      field: {}
    })

    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field][foo] must be a finite number or null.")
    });
  });
  it('Object - nested wrong type 5 - enforce_type: "none"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: {
        foo: {_type: Number}
      }
    }, {init: false, enforce_missing: false, enforce_type: "none"})

    doc = new Model({
      id: str,
      field: {}
    })

    doc.validate();
  });
  it('Extra field - 1', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String
    }, {init: false, enforce_extra: 'strict'})

    doc = new Model({
      id: str,
      foo: "hello"
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return error.message === "Extra field `foo` not allowed.";
    });
  });
  it('Extra field - 2', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      foo: [{bar: String}]
    }, {init: false, enforce_extra: 'strict'})

    doc = new Model({
      id: str,
      foo: [{bar: "Hello", buzz: "World"}]
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return error.message === "Extra field `buzz` in [foo][0] not allowed.";
    });
  });
  it('Extra field - 3', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      foo: {bar: String}
    }, {init: false, enforce_extra: 'strict'})

    doc = new Model({
      id: str,
      foo: {bar: "Hello", buzz: "World"}
    })
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return error.message === "Extra field `buzz` in [foo] not allowed.";
    });
  });
  it('Extra field - enforce_extra:"remove" - global option', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      foo: {fizz: String},
    }, {init: false, enforce_extra: 'remove'})

    doc = new Model({
      id: str,
      foo: {fizz: "Hello", buzz: "OMIT"},
      bar: "OMIT"
    })
    doc.validate();

    assert.equal(false, doc.foo.hasOwnProperty('buzz'));
    assert.deepEqual(doc, {
      id: str,
      foo: { fizz: 'Hello' }
    });
  });
  it('Extra field - enforce_extra:"remove" - deprecated', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      foo: {
        _type: Object,
        schema: {
          fizz: String
        },
        options: {enforce_extra: 'remove'}
      }
    }, {init: false})

    doc = new Model({
      id: str,
      foo: {fizz: "Hello", buzz: "OMIT"},
      bar: "keep"
    })
    doc.validate();

    assert.equal(false, doc.foo.hasOwnProperty('buzz'));
    assert.deepEqual(doc, {
      id: str,
      foo: { fizz: 'Hello' },
      bar: "keep"
    });
  });
  it('Extra field - enforce_extra:"remove"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      foo: type.object().schema({
        fizz: type.string()
      }).removeExtra()
    }, {init: false})

    doc = new Model({
      id: str,
      foo: {fizz: "Hello", buzz: "OMIT"},
      bar: "keep"
    })
    doc.validate();
    assert.equal(false, doc.foo.hasOwnProperty('buzz'));
    assert.deepEqual(doc, {
      id: str,
      foo: { fizz: 'Hello' },
      bar: "keep"
    });
  });

  it('Extra field - enforce_extra:"remove" - should not removed joined documents', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
    }, {init: false, enforce_extra: "remove"})


    var OtherModel = thinky.createModel(util.s8(), {
      id: String,
      otherId: String
    }, {init: false, enforce_extra: "remove"})

    Model.hasOne(OtherModel, "otherDoc", "id", "otherId", {init: false});

    var value = { id: util.s8() }
    var value2 = { id: util.s8(), otherId: value.id }
    doc = new Model(value)
    var otherDoc = new OtherModel(value2)
    doc.otherDoc = otherDoc;

    doc.validateAll();

    assert.deepEqual(doc, {id: value.id, otherDoc: {id: otherDoc.id, otherId: otherDoc.otherId}});

  });

  it('Test option validate="oncreate"', function(){
    var name = util.s8();
    var str = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'strict', enforce_missing: true, enforce_extra: 'strict', validate: 'oncreate'})


    assert.throws(function() {
      doc = new Model({
        id: str,
        field: 1
      })

    }, function(error) {
      return (error instanceof Errors.ValidationError) && (error.message === "Value for [field] must be a string.")
    });
  });
});

describe('validateAll', function() {
  it('it should check joined Document too -- hasOne - 1', function() {
    var name = util.s8();
    var otherName = util.s8();

    var str1 = util.s8();
    var str2 = util.s8();
    var str3 = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'strict'})

    var OtherModel = thinky.createModel(otherName, {
      id: String,
      field: String,
      otherId: String
    }, {init: false, enforce_type: 'loose'})

    Model.hasOne(OtherModel, "otherDoc", "otherId", "id", {init: false});

    doc = new Model({
      id: str1,
      field: str2,
      otherDoc: {
        id: str3,
        field: 1
      }
    })
    assert.throws(function() {
      doc.validateAll();
    }, function(error) {
      return error.message === "Value for [otherDoc][field] must be a string or null.";
    });
  });
  it('it should check joined Document too -- hasOne - 2', function() {
    var name = util.s8();
    var otherName = util.s8();

    var str1 = util.s8();
    var str2 = util.s8();
    var str3 = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'strict'})

    var OtherModel = thinky.createModel(otherName, {
      id: String,
      field: String,
      otherId: String
    }, {init: false, enforce_type: 'loose'})

    Model.hasOne(OtherModel, "otherDoc", "otherId", "id", {init: false});

    doc = new Model({
      id: str1,
      field: str2,
      otherDoc: {
        id: str3,
        field: 1
      }
    })
    assert.throws(function() {
      doc.validateAll({otherDoc: true});
    }, function(error) {
      return error.message === "Value for [otherDoc][field] must be a string or null.";
    });
  });
  it('it should check joined Document too -- belongsTo - 1', function() {
    var name = util.s8();
    var otherName = util.s8();

    var str1 = util.s8();
    var str2 = util.s8();
    var str3 = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String,
      otherId: String
    }, {init: false, enforce_type: 'strict'})

    var OtherModel = thinky.createModel(otherName, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'loose'})

    Model.hasOne(OtherModel, "otherDoc", "otherId", "id", {init: false});

    doc = new Model({
      id: str1,
      field: str2,
      otherDoc: {
        id: str3,
        field: 1
      }
    })

    assert.throws(function() {
      doc.validateAll();
    }, function(error) {
      return error.message === "Value for [otherDoc][field] must be a string or null.";
    });
  });
  it('it should check joined Document too -- belongsTo - 2', function() {
    var name = util.s8();
    var otherName = util.s8();

    var str1 = util.s8();
    var str2 = util.s8();
    var str3 = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String,
      otherId: String
    }, {init: false, enforce_type: 'strict'})

    var OtherModel = thinky.createModel(otherName, {
      id: String,
      field: String
    }, {init: false, enforce_type: 'loose'})

    Model.hasOne(OtherModel, "otherDoc", "otherId", "id", {init: false});

    doc = new Model({
      id: str1,
      field: str2,
      otherDoc: {
        id: str3,
        field: 1
      }
    })

    assert.throws(function() {
      doc.validateAll({otherDoc: true});
    }, function(error) {
      return error.message === "Value for [otherDoc][field] must be a string or null.";
    });
  });
  it('it should check joined Document too -- hasMany - 1', function() {
    var name = util.s8();
    var otherName = util.s8();

    var str1 = util.s8();
    var str2 = util.s8();
    var str3 = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String,
    }, {init: false, enforce_type: 'strict'})

    var OtherModel = thinky.createModel(otherName, {
      id: String,
      field: String,
      otherId: String
    }, {init: false, enforce_type: 'loose'})

    Model.hasMany(OtherModel, "otherDocs", "id", "otherId", {init: false});

    doc = new Model({
      id: str1,
      field: str2,
      otherDocs: [{
        id: str3,
        field: 1
      }]
    })

    assert.throws(function() {
      doc.validateAll();
    }, function(error) {
      return error.message === "Value for [otherDocs][0][field] must be a string or null.";
    });
  });
  it('it should check joined Document too -- hasMany - 2', function() {
    var name = util.s8();
    var otherName = util.s8();

    var str1 = util.s8();
    var str2 = util.s8();
    var str3 = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String,
    }, {init: false, enforce_type: 'strict'})

    var OtherModel = thinky.createModel(otherName, {
      id: String,
      field: String,
      otherId: String
    }, {init: false, enforce_type: 'loose'})

    Model.hasMany(OtherModel, "otherDocs", "id", "otherId", {init: false});

    doc = new Model({
      id: str1,
      field: str2,
      otherDocs: [{
        id: str3,
        field: 1
      }]
    })

    assert.throws(function() {
      doc.validateAll({otherDocs: true});
    }, function(error) {
      return error.message === "Value for [otherDocs][0][field] must be a string or null.";
    });
  });
  it('it should check joined Document too -- hasAndBelongsToMany - 1', function() {
    var name = util.s8();
    var otherName = util.s8();

    var str1 = util.s8();
    var str2 = util.s8();
    var str3 = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String,
    }, {init: false, enforce_type: 'strict'})

    var OtherModel = thinky.createModel(otherName, {
      id: String,
      field: String,
      otherId: String
    }, {init: false, enforce_type: 'loose'})

    Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "otherId", {init: false});

    doc = new Model({
      id: str1,
      field: str2,
      otherDocs: [{
        id: str3,
        field: 1
      }]
    })

    assert.throws(function() {
      doc.validateAll();
    }, function(error) {
      return error.message === "Value for [otherDocs][0][field] must be a string or null.";
    });
  });
  it('it should check joined Document too -- hasAndBelongsToMany - 2', function() {
    var name = util.s8();
    var otherName = util.s8();

    var str1 = util.s8();
    var str2 = util.s8();
    var str3 = util.s8();

    var Model = thinky.createModel(name, {
      id: String,
      field: String,
    }, {init: false, enforce_type: 'strict'})

    var OtherModel = thinky.createModel(otherName, {
      id: String,
      field: String,
      otherId: String
    }, {init: false, enforce_type: 'loose'})

    Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "otherId", {init: false});

    doc = new Model({
      id: str1,
      field: str2,
      otherDocs: [{
        id: str3,
        field: 1
      }]
    })

    assert.throws(function() {
      doc.validateAll({otherDocs: true});
    }, function(error) {
      return error.message === "Value for [otherDocs][0][field] must be a string or null.";
    });
  });
  it('hasOne with a circular reference', function() {
    var Model = thinky.createModel(util.s8(), { id: String});
    var OtherModel = thinky.createModel(util.s8(), { id: String, otherId: String });

    Model.hasOne(OtherModel, "has", "id", "otherId");
    OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

    var doc = new Model({});
    var otherDoc = new Model({});
    doc.has = otherDoc;
    otherDoc.belongsTo = doc;
    doc.validate();
    otherDoc.validate();
  });
  it('hasOne with a circular reference - second reference should not be checked', function() {
    var Model = thinky.createModel(util.s8(), { id: String});
    var OtherModel = thinky.createModel(util.s8(), { id: String, otherId: String });

    Model.hasOne(OtherModel, "has", "id", "otherId");
    OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

    var doc = new Model({});
    var otherDoc = new Model({});
    var wrongDoc = new Model({id: 1});
    doc.has = otherDoc;
    otherDoc.belongsTo = wrongDoc;
    doc.validateAll();
  });
  it('hasOne with a circular reference - second reference should be checked if manually asked', function() {
    var Model = thinky.createModel(util.s8(), { id: String});
    var OtherModel = thinky.createModel(util.s8(), { id: String, otherId: String });

    Model.hasOne(OtherModel, "has", "id", "otherId");
    OtherModel.belongsTo(Model, "belongsTo", "otherId", "id");

    var doc = new Model({});
    var otherDoc = new OtherModel({});
    var wrongDoc = new Model({id: 1});
    doc.has = otherDoc;
    otherDoc.belongsTo = wrongDoc;
    assert.throws(function() {
      doc.validateAll({}, {has: {belongsTo: true}});
    }, function(error) {
      return error.message === "Value for [has][belongsTo][id] must be a string or null.";
    });
  });
});
describe('_validator', function(){
  it('validate on the whole document - bind with the doc - 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String},
      foreignKey: String
    }, {init: false, validator: function() {
        if (this.id !== this.field) {
          throw new Errors.ValidationError("Expecting `id` value to be `field` value.")
        }
      }
    })
    var doc = new Model({id: "abc", field: "abc"});
    doc.validate();
  });

  it('validate on the whole document - bind with the doc - 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String},
      foreignKey: String
    }, {init: false, validator: function() {
        if (this.id !== this.field) {
          throw new Errors.ValidationError("Expecting `id` value to be `field` value.")
        }
      }
    })
    var doc = new Model({id: "", field: "abc"});

    assert.throws(function() {
      doc.validate()
    }, function(error) {
      return error.message === "Expecting `id` value to be `field` value.";
    });
  });

  it('validate on the whole document - make sure a relation is defined ', function(done){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: String
    }, {validator: function() {
      if (this.otherDoc == null) {
        throw new Errors.ValidationError("Relation must be defined.")
      }
    }})
    var doc = new Model({id: "abc", field: "abc"});

    Model.once('ready', function() {
      assert.throws(function() {
        doc.validate();
      }, function(error) {
        return (error instanceof Errors.ValidationError) && (error.message === "Relation must be defined.")
      });

      Model.hasOne(Model, 'otherDoc', 'id', 'foreignKey');
      var otherDoc = new Model({});

      doc.otherDoc = otherDoc;

      doc.validate();
      doc.saveAll().then(function() {
        done();
      });
    });
  });
  it('validate on the whole document - bind with the doc - return false - 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String}
    }, {init: false, validator: function() {
        return this.id === this.field;
      }
    })
    var doc = new Model({id: "abc", field: "abc"});
    doc.validate();
  });
  it('validate on the whole document - bind with the doc - return false with arg - 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String}
    }, {init: false, validator: function(doc) {
        return doc.id === this.field;
      }
    })
    var doc = new Model({id: "abc", field: "abc"});
    doc.validate();
  });
  it('validate on the whole document - bind with the doc - return false with arg (error)- 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String}
    }, {init: false, validator: function(doc) {
        return doc.id === this.field;
      }
    })
    var doc = new Model({id: "abc", field: ""});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Document's validator returned `false`.")
    });
  });
  it('validate on the whole document - bind with the doc - 2', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String}
    }, {init: false, validator: function() {
        if (this.id !== this.field) {
          throw new Errors.ValidationError("Expecting `id` value to be `field` value.")
        }
      }
    })

    var doc = new Model({id: "abc", field: ""});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Expecting `id` value to be `field` value.")
    });
  });
  it('validate on the whole document - bind with the doc - return false - 2', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String}
    }, {init: false, validator: function() {
        return this.id === this.field;
      }
    })

    var doc = new Model({id: "abc", field: ""});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Document's validator returned `false`.")
    });
  });
  it('validate on the whole document - nested field - 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String}
    }, {init: false, validator: function() {
        if (this.id !== this.nested.field) {
          throw new Errors.ValidationError("Expecting `id` value to be `field` value.")
        }
      }
    })

    var doc = new Model({id: "abc", nested: {field: "abc"}});
    doc.validate();
  });
  it('validate on the whole document - nested field - 2', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String}
    }, {init: false, validator: function() {
        if (this.id !== this.nested.field) {
          throw new Errors.ValidationError("Expecting `field` value to be `field` value.")
        }
      }
    })

    var doc = new Model({id: "abc", nested: { field: ""}});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Expecting `field` value to be `field` value.")
    });
  });
  it('validate on a field - 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String, validator: function(value) {
        if (value !== "abc") {
          throw new Errors.ValidationError("Expecting `field` value to be 'abc'.")
        }
      }}
    }, {init: false})
    var doc = new Model({id: "abc", field: "abc"});
    doc.validate();
  });
  it('validate on a field - 2', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String, validator: function(value) {
        if (value !== "abc") {
          throw new Errors.ValidationError("Expecting `field` value to be 'abc'.")
        }
      }}
    }, {init: false})
    var doc = new Model({id: "abc", field: ""});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Expecting `field` value to be 'abc'.")
    });
  });
  it('validate on a field - 3', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String, validator: function(value) {
        return value === "abc";
      }}
    }, {init: false})
    var doc = new Model({id: "abc", field: ""});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Validator for the field [field] returned `false`.")
    });
  });
  it('validate on a field - 4', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String, validator: function(value) {
        return this === "abc";
      }}
    }, {init: false})
    var doc = new Model({id: "abc", field: ""});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Validator for the field [field] returned `false`.")
    });
  });
  it('validate on the whole document - nested field - 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      nested: {
        field: {_type: String, validator: function(value) {
          if (value !== "abc") {
            throw new Errors.ValidationError("Expecting `field` value to be 'abc'.")
          }
        }
      }}
    }, {init: false})


    var doc = new Model({id: "abc", nested: {field: "abc"}});
    doc.validate();
  });
  it('validate on the whole document - nested field - 2', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      nested: {
        field: {_type: String, validator: function(value) {
          if (value !== "abc") {
            throw new Errors.ValidationError("Expecting `field` value to be 'abc'.")
          }
        }
      }}
    }, {init: false})

    var doc = new Model({id: "abc", nested: { field: ""}});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Expecting `field` value to be 'abc'.")
    });
  });
  it('validate with _type: Array - 1', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      arr: {_type: Array, schema: Number}
    }, {init: false})

    var doc = new Model({id: "abc", arr: [2, 3]});
    doc.validate();
  });
  it('validate with _type: Array - 2', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      arr: {_type: Array, schema: Number}
    }, {init: false})

    var doc = new Model({id: "abc", arr: [2, "ikk", 4]});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Value for [arr][1] must be a finite number or null.")
    });
  });
  it('validate with _type: Object - 1', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      ob: {_type: Object, schema: {foo: String}}
    }, {init: false})

    var doc = new Model({id: "abc", ob: {foo: "bar"}});
    doc.validate();
  });
  it('validate with _type: Object - 2', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      ob: {_type: Object, schema: {foo: String}}
    }, {init: false})

    var doc = new Model({id: "abc", ob: {foo: 1}});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "Value for [ob][foo] must be a string or null.")
    });
  });
  it('Check extra fields only if the schema is an object without the _type field', function(){
    var User = thinky.createModel('users', {
      email: {
        _type: String,
        validator: function() { return true }
      }
    }, {
      enforce_extra: 'strict',
      enforce_type: 'strict',
      init: false
    });

    var user = new User({});
    user.email = 'hello@world.com';
    user.validate();
  });
  it('Enum - success ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String, enum: ["foo", "bar", "buzz"]},
    }, {init: false})
    var doc = new Model({id: "abc", field: "bar"});
    doc.validate();
  });
  it('Enum - throw - 1 ', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String, enum: ["foo", "bar", "buzz"]},
    }, {init: false})
    var doc = new Model({id: "abc", field: "notavalidvalue"});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "The field [field] must be one of these values: foo, bar, buzz.")
    });
  });
  it('Enum - throw - 2', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String, enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]},
    }, {init: false})
    var doc = new Model({id: "abc", field: "notavalidvalue"});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "The field [field] must be one of these values: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.")
    });
  });
  it('Enum - throw - 3', function(){
    var Model = thinky.createModel(util.s8(), {
      id: String,
      field: {_type: String, enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]},
    }, {init: false})
    var doc = new Model({id: "abc", field: "notavalidvalue"});
    assert.throws(function() {
      doc.validate();
    }, function(error) {
      return (error instanceof Errors.ValidationError)
        && (error.message === "The field [field] must be one of these values: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10...")
    });
  });

  it('Array without type', function(){
    var name = util.s8();
    var Model = thinky.createModel(name, {id: Array}, {init: false})
    doc = new Model({id: [1,2,3]});
    doc.validate();
  });
});
