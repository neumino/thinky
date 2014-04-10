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
            return (error instanceof Error) && (error.message === "Value for [field] must be a string.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a string or null.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be defined.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a string.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a number.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a number or null.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a boolean.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a boolean or null.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a date.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a date or null.")
        });
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
            return (error instanceof Error) && (error.message === "The raw date object for [field] is missing the required field timezone.")
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
            return (error instanceof Error) && (error.message === "The raw date object for [field] is missing the required field epoch_time.")
        });

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
            return (error instanceof Error) && (error.message === "Value for [field] must be defined.")
        });
    });
    it('Array - undefined - enforce_type: "strict"', function(){
        var name = util.s8();
        var str = util.s8();

        var Model = thinky.createModel(name, {
            id: String,
            field: [Number] 
        }, {init: false, enforce_type: 'strict'})

        doc = new Model({
            id: str
        })

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a array.")
        });
    });
    it('Array - undefined - enforce_type: "loose"', function(){
        var name = util.s8();
        var str = util.s8();

        var Model = thinky.createModel(name, {
            id: String,
            field: [Number] 
        }, {init: false, enforce_type: 'loose'})

        doc = new Model({
            id: str
        })

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a array or null.")
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
            field: 2
        })

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a array or null.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a array or null.")
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
            return (error instanceof Error) && (error.message === "Value for [field][0] must be a number.")
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
            return (error instanceof Error) && (error.message === "Value for [field][0] must be a number or null.")
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
    it('Array - wrong type inside - not first - enforce_type: "strict"', function(){
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
            return (error instanceof Error) && (error.message === "Value for [field][3] must be a number.")
        });
    });
    it('Array - wrong type inside - not first - enforce_type: "strict"', function(){
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
            return (error instanceof Error) && (error.message === "The element in the array [field] (position 3) cannot be `undefined`.")
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
            return (error instanceof Error) && (error.message === "The element in the array [field] (position 3) cannot be `undefined`.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be defined.")
        });
    });
    it('Object - undefined - enforce_type: "strict"', function(){
        var name = util.s8();
        var str = util.s8();

        var Model = thinky.createModel(name, {
            id: String,
            field: {}
        }, {init: false, enforce_type: 'strict'})

        doc = new Model({
            id: str
        })

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a object.")
        });
    });
    it('Object - undefined - enforce_type: "loose"', function(){
        var name = util.s8();
        var str = util.s8();

        var Model = thinky.createModel(name, {
            id: String,
            field: {}
        }, {init: false, enforce_type: "loose"})

        doc = new Model({
            id: str
        })

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a object or null.")
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
            id: str
        })

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a object.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a object.")
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
            return (error instanceof Error) && (error.message === "Value for [field][foo] must be a number.")
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
            return (error instanceof Error) && (error.message === "Value for [field][foo] must be a number or null.")
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
            return (error instanceof Error) && (error.message === "Value for [field][foo] must be defined.")
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
            return (error instanceof Error) && (error.message === "Value for [field][foo] must be a number or null.")
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
    it('it should check joined Document too', function(done) {
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

        Model.hasOne(OtherModel, "otherDoc", "otherId", "id");

        doc = new Model({
            id: str1,
            field: str2,
            otherDoc: {
                id: str3,
                field: 1
            }
        })

        try{
            doc.validate();
        }
        catch(err) {
            assert.equal(err.message, "Value for [otherDoc][field] must be a string or null.");
            done();
        }
    });

});



