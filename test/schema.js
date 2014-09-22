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
            assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'` for [id]");
            done();
        }
    });
    it('Non valid value - undefined', function(done){
        var name = util.s8();
        try {
            thinky.createModel(name, {id: undefined}, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'` for [id]");
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
            assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'` for [id][bar]");
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
            assert.equal(err.message, "The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'` for [id][foo][bar]")
            done();
        }
    });
    it('Object in Object - non valid type', function(done){
        var name = util.s8();
        try{
            thinky.createModel(name, {id: {foo: {bar: {_type: 1}}}}, {init: false})
        }
        catch(err) {
            assert.equal(err.message, "The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'` for [id][foo][bar]")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a date or a valid string.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a date or a valid string or null.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be defined.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a buffer.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be a buffer or null.")
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
            return (error instanceof Error) && (error.message === "The raw binary object for [field] is missing the required field data.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be defined.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be defined.")
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
            return (error instanceof Error) && (error.message === "Value for [field] must be defined.")
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
            id: str,
            field: "bar"
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
    it('Extra field - 1', function(){
        var name = util.s8();
        var str = util.s8();

        var Model = thinky.createModel(name, {
            id: String
        }, {init: false, enforce_extra: true})

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
        }, {init: false, enforce_extra: true})

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
        }, {init: false, enforce_extra: true})

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
    it('Extra field - enforce_extra:"remove"', function(){
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
    it('Test option validate="oncreate"', function(){
        var name = util.s8();
        var str = util.s8();

        var Model = thinky.createModel(name, {
            id: String,
            field: String
        }, {init: false, enforce_type: 'strict', enforce_missing: true, enforce_extra: true, validate: 'oncreate'})


        assert.throws(function() {
            doc = new Model({
                id: str,
                field: 1
            })

        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a string.")
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
                    throw new Error("Expecting `id` value to be `field` value.")
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
                    throw new Error("Expecting `id` value to be `field` value.")
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
                throw new Error("Relation must be defined.")
            }
        }})
        var doc = new Model({id: "abc", field: "abc"});

        Model.once('ready', function() {
            assert.throws(function() {
                doc.validate();
            }, function(error) {
                return (error instanceof Error) && (error.message === "Relation must be defined.")
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
            return (error instanceof Error)
                && (error.message === "Document's validator returned `false`.")
        });
    });
    it('validate on the whole document - bind with the doc - 2', function(){
        var Model = thinky.createModel(util.s8(), {
            id: String,
            field: {_type: String}
        }, {init: false, validator: function() {
                if (this.id !== this.field) {
                    throw new Error("Expecting `id` value to be `field` value.")
                }
            }
        })

        var doc = new Model({id: "abc", field: ""});
        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error)
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
            return (error instanceof Error)
                && (error.message === "Document's validator returned `false`.")
        });
    });
    it('validate on the whole document - nested field - 1 ', function(){
        var Model = thinky.createModel(util.s8(), {
            id: String,
            field: {_type: String}
        }, {init: false, validator: function() {
                if (this.id !== this.nested.field) {
                    throw new Error("Expecting `id` value to be `field` value.")
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
                    throw new Error("Expecting `field` value to be `field` value.")
                }
            }
        })

        var doc = new Model({id: "abc", nested: { field: ""}});
        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error)
                && (error.message === "Expecting `field` value to be `field` value.")
        });
    });
    it('validate on a field - 1 ', function(){
        var Model = thinky.createModel(util.s8(), {
            id: String,
            field: {_type: String, validator: function(value) {
                if (value !== "abc") {
                    throw new Error("Expecting `field` value to be 'abc'.")
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
                    throw new Error("Expecting `field` value to be 'abc'.")
                }
            }}
        }, {init: false})
        var doc = new Model({id: "abc", field: ""});
        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error)
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
            return (error instanceof Error)
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
            return (error instanceof Error)
                && (error.message === "Validator for the field [field] returned `false`.")
        });
    });
    it('validate on the whole document - nested field - 1 ', function(){
        var Model = thinky.createModel(util.s8(), {
            id: String,
            nested: {
                field: {_type: String, validator: function(value) {
                    if (value !== "abc") {
                        throw new Error("Expecting `field` value to be 'abc'.")
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
                        throw new Error("Expecting `field` value to be 'abc'.")
                    }
                }
            }}
        }, {init: false})

        var doc = new Model({id: "abc", nested: { field: ""}});
        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error)
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
            return (error instanceof Error)
                && (error.message === "Value for [arr][1] must be a number or null.")
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
            return (error instanceof Error)
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
            enforce_extra: true,
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
            return (error instanceof Error)
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
            return (error instanceof Error)
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
            return (error instanceof Error)
                && (error.message === "The field [field] must be one of these values: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10...")
        });

    });


});
