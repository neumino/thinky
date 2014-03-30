var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');

/*
describe('generateDefault', function(){
    it('String - constant', function(){
        var name = util.s4();
        var str = util.s4();
        var defaultValue = util.s4();

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
        var name = util.s4();
        var str = util.s4();
        var defaultValue = util.s4();

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
        var name = util.s4();
        var str = util.s4();

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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
    it('Object - deep nested - 1', function(){
        var name = util.s4();
        var str = util.s4();
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
        var name = util.s4();
        var str = util.s4();
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
});
*/

describe('validate', function(){
    it('String - wrong type - type: "strict"', function(){
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a string.")
        });
    });
    it('String - wrong type  - type: "loose"', function(){
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a string or null.")
        });

    });
    it('String - wrong type  - type: "none"', function(){
        var name = util.s4();
        var str = util.s4();

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
        var name = util.s4();
        var str = util.s4();

        var Model = thinky.createModel(name, {
            id: String,
            field: String
        }, {init: false, enforce_type: 'strict'})

        doc = new Model({
            id: str,
            field: undefined
        })

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a string.")
        });
    });
    it('String - undefined  - type: "loose"', function(){
        var name = util.s4();
        var str = util.s4();

        var Model = thinky.createModel(name, {
            id: String,
            field: String
        }, {init: false, enforce_type: 'loose'})

        doc = new Model({
            id: str,
            field: undefined
        })

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a string or null.")
        });
    });
    it('String - undefined  - type: "none"', function(){
        var name = util.s4();
        var str = util.s4();

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
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be defined.")
        });

    });
    it('String - null - type: "strict"', function(){
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a string.")
        });
    });
    it('String - null  - type: "loose"', function(){
        var name = util.s4();
        var str = util.s4();

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
        var name = util.s4();
        var str = util.s4();

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
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a number.")
        });
    });
    it('Number - wrong type  - type: "loose"', function(){
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a number or null.")
        });

    });
    it('Number - wrong type  - type: "none"', function(){
        var name = util.s4();
        var str = util.s4();

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
    it('Boolean - wrong type - type: "strict"', function(){
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a boolean.")
        });
    });
    it('Boolean - wrong type  - type: "loose"', function(){
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a boolean or null.")
        });

    });
    it('Boolean - wrong type  - type: "none"', function(){
        var name = util.s4();
        var str = util.s4();

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
    it('Date - wrong type - type: "strict"', function(){
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a date.")
        });
    });
    it('Date - wrong type  - type: "loose"', function(){
        var name = util.s4();
        var str = util.s4();

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
            return (error instanceof Error) && (error.message === "Value for [field] must be a date or null.")
        });

    });
    it('Date - wrong type  - type: "none"', function(){
        var name = util.s4();
        var str = util.s4();

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


});

