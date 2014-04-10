var config = require(__dirname+'/../config.js');
var thinky = require(__dirname+'/../lib/thinky.js')(config);
var r = thinky.r;

var util = require(__dirname+'/util.js');
var assert = require('assert');


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

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a string.")
        });
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

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field] must be a string or null.")
        });
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
            return (error instanceof Error) && (error.message === "Value for [field][3] must be a number.")
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
            return (error instanceof Error) && (error.message === "Value for [field][3] must be a number or null.")
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
            field: {}
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
            field: {}
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

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [id] must be a string.")
        });
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
    it('Object - nested wrong type 3 - enforce_type: "loose"', function(){
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

        assert.throws(function() {
            doc.validate();
        }, function(error) {
            return (error instanceof Error) && (error.message === "Value for [field][foo] must be a number or null.")
        });
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


describe('save', function() {
     
    describe('Basic', function() {
        var Model;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })
        });
        it('Save should change the status of the doc', function(done){
            var str = util.s8();
            var num = util.random();

            doc = new Model({
                str: str,
                num: num
            })
            assert.equal(doc.isSaved(), false);
            doc.save().then(function(result) {
                assert.equal(doc.isSaved(), true);
                done();
            }).error(done);
        });

        it('Save when the table is not yet ready', function(done){
            var str = util.s8();
            var num = util.random();

            doc = new Model({
                str: str,
                num: num
            })
            doc.save().then(function(result) {
                done();

            }).error(done);
        });
        it('Save then the table is ready', function(done){
            var str = util.s8();
            var num = util.random();

            doc = new Model({
                str: str,
                num: num
            })
            doc.save().then(function(result) {
                done();
            }).error(done);
        });
        it('Save the document should be updated on place', function(done){
            var str = util.s8();
            var num = util.random();

            doc = new Model({
                str: str,
                num: num
            })
            doc.save().then(function(result) {
                assert.strictEqual(doc, result);
                assert.equal(doc.str, str);
                assert.equal(doc.num, num);
                assert.notEqual(doc.id, undefined);
                done();
            }).error(done);
        });
    });
    describe("Joins - hasOne", function() {
        var Model, OtherModel;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })
            Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey")
        });

        it('save should save only one doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.save().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                assert.equal(doc.otherDoc.isSaved(), false);
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);
                done();
            }).error(done);
        });
        it('new should create instances of Document for joined documents too', function() {
            var docValues = {str: util.s8(), num: util.random(), otherDoc: {str: util.s8(), num: util.random()}}
            doc = new Model(docValues);
            assert.equal(doc._getModel()._name, Model.getName())
            assert.equal(doc.otherDoc._getModel()._name, OtherModel.getName())
        });
        it('save should not change the joined document', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.save().then(function(doc) {
                assert.strictEqual(doc.otherDoc, otherDoc)
                done();
            }).error(done);
        })
        it('saveAll should save everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                assert.equal(doc.otherDoc.isSaved(), true);
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);

                assert.strictEqual(doc.otherDoc, otherDoc)
                assert.strictEqual(doc.otherDoc.foreignKey, doc.id)
                done();
            }).error(done);
        })
    });
    describe("Joins - belongsTo", function() {
        var Model, OtherModel;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number
            })
            Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id")
        });

        it('save should save only one doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.save().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                assert.equal(doc.otherDoc.isSaved(), false);
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);
                done();
            }).error(done);
        })
        it('save should not change the joined document', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.save().then(function(doc) {
                assert.strictEqual(doc.otherDoc, otherDoc)
                done();
            }).error(done);
        })
        it('saveAll should save everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc2) {
                assert.equal(doc.isSaved(), true);
                assert.equal(doc.otherDoc.isSaved(), true);
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);

                assert.strictEqual(doc.otherDoc, otherDoc)
                assert.strictEqual(doc.foreignKey, doc.otherDoc.id)
                done();
            }).error(done);
        })
        it('saveAll should save a referene to this in the belongsTo doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc2) {
                assert.equal(doc.otherDoc.__proto__._parents._belongsTo[Model.getName()][0].doc, doc);
                done();
            }).error(done);
        })

    });

    describe("Joins - hasMany", function() {
        var Model, OtherModel;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })
            Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey")
        });

        it('save shouls save only one doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.save().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), false);
                }
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);
                done();
            }).error(done);
        })
        it('save should not change the joined document', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.save().then(function(doc) {
                assert.strictEqual(doc.otherDocs, otherDocs)
                done();
            }).error(done);
        })
        it('saveAll should save everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), true);
                }
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);

                assert.strictEqual(doc.otherDocs, otherDocs)
                for(var i=0; i<otherDocs.length; i++) {
                    assert.strictEqual(doc.otherDocs[i].foreignKey, doc.id)
                }
                done();
            }).error(done);
        })
    });
    describe("Joins - hasAndBelongsToMany", function() {
        var Model, OtherModel;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number
            })
            Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id")
        });
        it('save shouls save only one doc', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.save().then(function(doc) {
                assert.equal(doc.isSaved(), true);
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), false);
                }
                assert.equal(typeof doc.id, 'string')
                assert.equal(doc.str, docValues.str);
                assert.equal(doc.num, docValues.num);
                done();
            }).error(done);
        })
        it('save should not change the joined document', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()})
            ];
            doc.otherDocs = otherDocs;

            doc.save().then(function(doc) {
                assert.strictEqual(doc.otherDocs, otherDocs)
                done();
            }).error(done);
        })
        it('saveAll should save everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()})
            ];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), true);
                    assert.equal(typeof doc.otherDocs[i].id, 'string');
                }

                var linkName;
                if(Model.getName() < OtherModel.getName()) {
                    linkName = Model.getName()+"_"+OtherModel.getName();
                }
                else {
                    linkName = OtherModel.getName()+"_"+Model.getName();
                }

                r.table(linkName).run().then(function(cursor) {
                    cursor.toArray().then(function(result) {
                        assert.equal(result.length, 3)

                        assert.equal(doc.isSaved(), true);
                        assert.equal(typeof doc.id, 'string')
                        assert.equal(doc.str, docValues.str);
                        assert.equal(doc.num, docValues.num);

                        assert.strictEqual(doc.otherDocs, otherDocs)
                        done();
                    })
                })

            }).error(done);
        })
        it('saveAll should create new links with the good id', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()})
            ];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                var linkName, found;

                if(Model.getName() < OtherModel.getName()) {
                    linkName = Model.getName()+"_"+OtherModel.getName();
                }
                else {
                    linkName = OtherModel.getName()+"_"+Model.getName();
                }
                r.table(linkName).run().then(function(cursor) {
                    cursor.toArray().then(function(result) {
                        var total = 0;
                        // Check id
                        for(var i=0; i<result.length; i++) {
                            found = false
                            for(var j=0; j<otherDocs.length; j++) {
                                if (Model.getName() < OtherModel.getName()) {
                                    if (result[i].id === doc.id+"_"+otherDocs[j].id) {
                                        total++;
                                        found = true;
                                        break;
                                    }
                                }
                                else {
                                    if (result[i].id === otherDocs[j].id+"_"+doc.id) {
                                        total++;
                                        found = true;
                                        break;
                                    }
                                }
                            }
                        }
                        assert.equal(total, 3);

                        done();
                    })
                }).error(done);

                
            }).error(done);
        })
        it('saveAll should create new links with the secondary value', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()}),
                new OtherModel({str: util.s8(), num: util.random()})
            ];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                for(var i=0; i<otherDocs.length; i++) {
                    assert.equal(doc.otherDocs[i].isSaved(), true);
                    assert.equal(typeof doc.otherDocs[i].id, 'string');
                }

                var linkName, found;

                if(Model.getName() < OtherModel.getName()) {
                    linkName = Model.getName()+"_"+OtherModel.getName();
                }
                else {
                    linkName = OtherModel.getName()+"_"+Model.getName();
                }
                r.table(linkName).run().then(function(cursor) {
                    cursor.toArray().then(function(result) {
                        var total = 0;
                        // Testing the values of the primary key
                        for(var i=0; i<result.length; i++) {
                            if (result[i][Model.getName()+"_id"] ===  doc.id) {
                                found = false;
                                for(var j=0; j<otherDocs.length; j++) {
                                    if (result[i][OtherModel.getName()+"_id"] === otherDocs[j].id) {
                                        total++;
                                        found = true;
                                        break;
                                    }
                                }
                                assert(found);
                            }
                        }

                        assert.equal(total, 3);
                        done();
                    })
                }).error(done);

                
            }).error(done);
        })
    });
    
    describe('saveAll with missing docs for hasOne', function() {
        var Model, OtherModel;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey")
        });
        it('Should update link', function(done) {
            var doc = new Model({
                id: util.s8(),
                str: util.s8(),
                num: util.random()
            })
            var otherDoc = new OtherModel({
                id: util.s8(),
                str: util.s8(),
                num: util.random()
            })
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function() {
                assert(doc.isSaved())
                assert(doc.otherDoc.isSaved())
                doc.otherDoc = null;
                doc.saveAll().then(function() {
                    OtherModel.get(otherDoc.id).run().then(function(result) {
                        assert.equal(result.foreignKey, undefined);
                        done();
                    });
                });
            }).error(done);

        })
    });
    describe('saveAll with missing docs for hasMany', function() {
        var Model, OtherModel;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey")
        });
        it('Should update link', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function() {
                assert(doc.isSaved())
                for(var i=0; i<doc.otherDocs.length; i++) {
                    assert(doc.otherDocs[i].isSaved())
                }
                var removedDoc = doc.otherDocs.splice(1, 1);
                doc.saveAll().then(function() {
                    OtherModel.getAll(doc.id, {index: "foreignKey"}).run().then(function(result) {
                        assert.equal(result.length, 2);
                        OtherModel.run().then(function(result) {
                            assert.equal(result.length, 3);
                            done();
                        });

                    });
                });
            }).error(done);

        })
    });
    describe('saveAll with missing docs for belongsTo', function() {
        var Model, OtherModel;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number
            })

            Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id")
        });
        it('Should update link', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDoc = new OtherModel({str: util.s8(), num: util.random()});
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function() {
                assert(doc.isSaved())
                assert.equal(typeof doc.foreignKey, 'string')
                doc.otherDoc = null;
                doc.saveAll().then(function() {
                    assert(doc.foreignKey, undefined);
                    OtherModel.run().then(function(result) {
                        assert.equal(result.length, 1);
                        done();
                    });
                });
            }).error(done);

        })
    });
    
    
    describe('saveAll with missing docs for hasAndBelongsToMany', function() {
        var Model, OtherModel;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number
            })

            Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id")
        });
        it('Should remove link', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function() {
                assert(doc.isSaved())
                for(var i=0; i<otherDocs.length; i++) {
                    assert(doc.otherDocs[i].isSaved())
                }
                var removedDoc = doc.otherDocs.splice(1, 1);
                doc.saveAll().then(function(result) {
                    assert.equal(doc.otherDocs.length, 2);
                    assert.equal(result.otherDocs.length, 2);

                    var linkName;
                    if(Model.getName() < OtherModel.getName()) {
                        linkName = Model.getName()+"_"+OtherModel.getName();
                    }
                    else {
                        linkName = OtherModel.getName()+"_"+Model.getName();
                    }
                    r.table(linkName).count().run().then(function(result) {
                        assert.equal(result, 2);

                        Model.get(doc.id).getJoin().run().then(function(result) {
                            assert.equal(result.otherDocs.length, 2);
                            done();
                        }).error(done);
                    }).error(done);
                }).error(done);
            }).error(done);
        })
    });
});


describe('delete', function() {
    describe('Basic', function() {
        var Model, doc;
        before(function(done) {
            var name = util.s8();
            Model = thinky.createModel(name, {
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
            assert.equal(doc.isSaved(), false);
            doc.save().then(function(result) {
                assert.equal(typeof doc.id, 'string');
                assert.equal(doc.isSaved(), true);
                done();
            }).error(done);
        });
        it('should delete the document', function(done) {
            doc.delete().then(function() {
                Model.run().then(function(result) {
                    assert.equal(result.length, 0);
                    done();
                });
            }).error(done);
        });
        it('should set the doc unsaved', function(done) {
            doc.save().then(function(result) {
                assert.equal(typeof doc.id, 'string');
                assert.equal(doc.isSaved(), true);
                doc.delete().then(function() {
                    Model.run().then(function(result) {
                        assert.equal(doc.isSaved(), false);
                        done();
                    });
                }).error(done);
            }).error(done);
        });
    });
    describe('hasOne', function() {
        var Model, doc;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            Model.hasOne(OtherModel, "otherDoc", "id", "foreignKey")
        });
        it('delete should delete only the document and update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.delete().then(function() {
                    Model.run().then(function(result) {
                        assert.equal(result.length, 0);
                        assert.equal(otherDoc.foreignKey, undefined);

                        OtherModel.run().then(function(result) {
                            assert.equal(result.length, 1);
                            assert.deepEqual(result[0], otherDoc);
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll().then(function() {
                    assert.equal(doc.isSaved(), false);
                    assert.equal(otherDoc.isSaved(), false);
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);
                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.equal(result, null);
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({otherDoc: true}).then(function() {
                    assert.equal(doc.isSaved(), false);
                    assert.equal(otherDoc.isSaved(), false);
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);
                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.equal(result, null);
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll with wrong modelToDelete should delete only the document and update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;
            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({foo: "bar"}).then(function() {
                    Model.run().then(function(result) {
                        assert.equal(result.length, 0);
                        assert.equal(otherDoc.foreignKey, undefined);

                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.deepEqual(result, otherDoc);
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });

    });
    describe('belongsTo', function() {
        var Model, doc;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number
            })

            Model.belongsTo(OtherModel, "otherDoc", "foreignKey", "id")
        });
        it('delete should delete only the document and not update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                otherDocCopy = util.deepCopy(doc.otherDoc);

                doc.delete().then(function() {
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);

                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.deepEqual(result, otherDoc);
                            assert.deepEqual(result, otherDocCopy);

                            done();
                        }).error(done);

                    });
                }).error(done);
            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll().then(function(result) {
                    assert.equal(doc.isSaved(), false);
                    assert.equal(doc.otherDoc.isSaved(), false);

                    assert.equal(result.isSaved(), false);
                    assert.equal(result.otherDoc.isSaved(), false);
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);

                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.deepEqual(result, null);
                            done();
                        }).error(done);

                    });
                }).error(done);
            })
        });
        it('deleteAll should delete everything when given the appropriate modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({otherDoc: true}).then(function(result) {
                    assert.equal(doc.isSaved(), false);
                    assert.equal(doc.otherDoc.isSaved(), false);

                    assert.equal(result.isSaved(), false);
                    assert.equal(result.otherDoc.isSaved(), false);
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);

                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.deepEqual(result, null);
                            done();
                        }).error(done);

                    });
                }).error(done);
            })
        });
        it('delete should delete only the document with non matching modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var otherDocValues = {str: util.s8(), num: util.random()}

            var doc = new Model(docValues);
            var otherDoc = new OtherModel(otherDocValues);
            doc.otherDoc = otherDoc;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                otherDocCopy = util.deepCopy(doc.otherDoc);

                doc.deleteAll({foo: true}).then(function() {
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);

                        OtherModel.get(otherDoc.id).run().then(function(result) {
                            assert.deepEqual(result, otherDoc);
                            assert.deepEqual(result, otherDocCopy);

                            done();
                        }).error(done);

                    });
                }).error(done);
            })
        });
    });
    describe('hasMany', function() {
        var Model, doc;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number,
                foreignKey: String
            })

            Model.hasMany(OtherModel, "otherDocs", "id", "foreignKey")
        });
        it('delete should delete only the document and update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.delete().then(function() {
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);1
                        assert.equal(doc.isSaved(), false);
                        for(var i=0; i<otherDocs.length; i++) {
                            assert.equal(otherDocs[i].foreignKey, undefined);
                            assert.equal(otherDocs[i].isSaved(), true);
                        }

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 3);
                            assert.deepEqual(util.sortById(result), util.sortById(otherDocs));
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('delete should delete only the document and update the other -- non matching modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({foo: true}).then(function() {
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);1
                        assert.equal(doc.isSaved(), false);
                        for(var i=0; i<otherDocs.length; i++) {
                            assert.equal(otherDocs[i].foreignKey, undefined);
                            assert.equal(otherDocs[i].isSaved(), true);
                        }

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 3);
                            assert.deepEqual(util.sortById(result), util.sortById(otherDocs));
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll().then(function(result) {
                    assert.strictEqual(result, doc);
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);
                        assert.equal(doc.isSaved(), false);
                        for(var i=0; i<otherDocs.length; i++) {
                            assert.equal(otherDocs[i].isSaved(), false);
                            // We want to keep the foreign key -- consistent yet unsaved data
                            assert.notEqual(otherDocs[i].foreignKey, undefined);
                        }

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 0);
                            done();
                        }).error(done);

                    });
                }).error(done);
            })
        });
        it('deleteAll should delete everything -- with modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                assert.equal(doc.isSaved(), true);

                doc.deleteAll({otherDocs: true}).then(function(result) {
                    assert.strictEqual(result, doc);
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);
                        assert.equal(doc.isSaved(), false);
                        for(var i=0; i<otherDocs.length; i++) {
                            assert.equal(otherDocs[i].isSaved(), false);
                            // We want to keep the foreign key -- consistent yet unsaved data
                            assert.notEqual(otherDocs[i].foreignKey, undefined);
                        }

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 0);
                            done();
                        }).error(done);

                    });
                }).error(done);

            })
        });
    });
    describe('hasAndBelongsToMany', function() {
        var Model, doc;
        before(function() {
            var name = util.s8();
            Model = thinky.createModel(name, {
                id: String,
                str: String,
                num: Number
            })

            var otherName = util.s8();
            OtherModel = thinky.createModel(otherName, {
                id: String,
                str: String,
                num: Number
            })

            Model.hasAndBelongsToMany(OtherModel, "otherDocs", "id", "id")
        });
        it('delete should delete only the document and update the other', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                doc.delete().then(function(result) {
                    assert.strictEqual(doc, result);
                    assert.equal(doc.isSaved(), false);
                    for(var i=0; i<otherDocs.length; i++) {
                        assert.equal(doc.otherDocs[i].isSaved(), true)
                    }
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 3);
                            assert.deepEqual(util.sortById(result), util.sortById(otherDocs));
                            r.table(Model._joins.otherDocs.link).run().then(function(cursor) {
                                cursor.toArray().then(function(result) {
                                    assert.equal(result.length, 0);
                                    done();
                                }).error(done);
                            }).error(done);
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete only the document and update the other -- with non matching modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                doc.deleteAll({foo: true}).then(function() {
                    assert.equal(doc.isSaved(), false);
                    for(var i=0; i<otherDocs.length; i++) {
                        assert.equal(doc.otherDocs[i].isSaved(), true)
                    }
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 3);
                            assert.deepEqual(util.sortById(result), util.sortById(otherDocs));
                            r.table(Model._joins.otherDocs.link).run().then(function(cursor) {
                                cursor.toArray().then(function(result) {
                                    assert.equal(result.length, 0);
                                    done();
                                }).error(done);
                            }).error(done);
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                doc.deleteAll().then(function() {
                    assert.equal(doc.isSaved(), false);
                    for(var i=0; i<otherDocs.length; i++) {
                        assert.equal(doc.otherDocs[i].isSaved(), false)
                    }
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 0);

                            r.table(Model._joins.otherDocs.link).run().then(function(cursor) {
                                cursor.toArray().then(function(result) {
                                    assert.equal(result.length, 0);
                                    done();
                                }).error(done);
                            }).error(done);
                        }).error(done);

                    });
                }).error(done);

            })
        });
        it('deleteAll should delete everything -- with the appropriate modelToDelete', function(done) {
            var docValues = {str: util.s8(), num: util.random()}
            var doc = new Model(docValues);
            var otherDocs = [new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()}), new OtherModel({str: util.s8(), num: util.random()})];
            doc.otherDocs = otherDocs;

            doc.saveAll().then(function(doc) {
                doc.deleteAll({otherDocs: true}).then(function() {
                    assert.equal(doc.isSaved(), false);
                    for(var i=0; i<otherDocs.length; i++) {
                        assert.equal(doc.otherDocs[i].isSaved(), false)
                    }
                    Model.get(doc.id).run().then(function(result) {
                        assert.equal(result, null);

                        OtherModel.getAll(otherDocs[0].id, otherDocs[1].id, otherDocs[2].id).run().then(function(result) {
                            assert.equal(result.length, 0);

                            r.table(Model._joins.otherDocs.link).run().then(function(cursor) {
                                cursor.toArray().then(function(result) {
                                    assert.equal(result.length, 0);
                                    done();
                                }).error(done);
                            }).error(done);
                        }).error(done);

                    });
                }).error(done);

            })
        });

    });
});

