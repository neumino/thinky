var util = require('util');
var Promise = require('bluebird');

function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}
util.isPlainObject = isPlainObject;

function validateSchema(schema, prefix) {
    // Validate a schema and add the field _enum if needed
    prefix = prefix || '';
    if (isPlainObject(schema)) {
        loopKeys(schema, function(_schema, key) {
            if (Array.isArray(_schema[key])) {
                validateSchema(_schema[key], prefix+'['+key+']');
            }
            else if (isPlainObject(_schema[key])) {
                if (_schema[key].hasOwnProperty('_type')) {
                    if ((_schema[key]._type !== String)
                        && (_schema[key]._type !== Number)
                        && (_schema[key]._type !== Boolean)
                        && (_schema[key]._type !== Date)
                        && (_schema[key]._type !== Buffer)
                        && (_schema[key]._type !== Object)
                        && (_schema[key]._type !== Array)
                        && (_schema[key]._type !== 'Point')
                        && (_schema[key]._type !== 'virtual')) {
                        throw new Error("The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for "+prefix+"["+key+"]");
                    }

                    // Add the set with the valid values for an enum
                    if (Array.isArray(_schema[key].enum)) {
                        _schema[key]._enum = {}
                        for(var i=0; i<_schema[key].enum.length; i++) {
                            _schema[key]._enum[_schema[key].enum[i]] = true;
                        }
                    }
                }
                else {
                    validateSchema(_schema[key], prefix+'['+key+']');
                }
            }
            else if ((_schema[key] !== String)
                && (_schema[key] !== Number)
                && (_schema[key] !== Boolean)
                && (_schema[key] !== Date)
                && (_schema[key] !== Buffer)
                && (_schema[key] !== Object)
                && (_schema[key] !== Array)
                && (_schema[key] !== 'Point')
                && (_schema[key] !== 'virtual')) {

                throw new Error("The value must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'virtual'`/`'Point'` for "+prefix+"["+key+"]");
            }
        });
    }
    else if (Array.isArray(schema)) {
        if (schema.length > 1) {
            throw new Error("An array in a schema can have at most one element. Found "+schema.length+" elements in "+prefix)
        }
        else if (schema.length === 1) {
            if (isPlainObject(schema[0])) {
                validateSchema(schema[0], prefix+'[0]');
            }
            else if (Array.isArray(schema[0])) {
                validateSchema(schema[0], prefix+'[0]');
            }
            else{
                if ((schema[0] !== String)
                    && (schema[0] !== Number)
                    && (schema[0] !== Boolean)
                    && (schema[0] !== Date)
                    && (schema[0] !== Buffer)
                    && (schema[0] !== Object)
                    && (schema[0] !== Array)
                    && (schema[0] !== 'Point')) {

                    throw new Error("The field `_type` must be `String`/`Number`/`Boolean`/`Date`/`Buffer`/`Object`/`Array`/`'Point'` in "+prefix);
                }
            }
        }
    }
    else {
        throw new Error("The schema must be a plain object.")
    }
}
util.validateSchema = validateSchema;

// Obviously not a real deep copy...
function deepCopy(value) {
    var result;
    if (value instanceof Buffer) {
        // We do a shallow copy here because buffer could in theory
        // be pretty big
        return new Buffer(value);
    }
    else if (isPlainObject(value) === true) {
        result = {};
        loopKeys(value, function(_value, key) {
            if (_value.hasOwnProperty(key)) {
                result[key] = deepCopy(_value[key]);
            }
        });
        return result;
    }
    else if (Array.isArray(value)) {
        result = []
        for(var i=0; i<value.length; i++) {
            result.push(deepCopy(value[i]));
        }
        return result;
    }
    else {
        return value;
    }
}
util.deepCopy = deepCopy;

function undefinedField(prefix) {
    throw new Error("Value for "+prefix+" must be defined.")
}
util.undefinedField = undefinedField;

function strictType(prefix, expected) {
    throw new Error("Value for "+prefix+" must be a "+expected+".")
}
util.strictType = strictType;

function extraField(prefix, key) {
    if (prefix === '') {
        throw new Error("Extra field `"+key+"` not allowed.")
    }
    else {
        throw new Error("Extra field `"+key+"` in "+prefix+" not allowed.")
    }
}
util.extraField = extraField;

function looseType(prefix, expected) {
    throw new Error("Value for "+prefix+" must be a "+expected+" or null.")
}
util.looseType = looseType;
function pseudoTypeError(type, missingField, prefix) {
    throw new Error("The raw "+type+" object for "+prefix+" is missing the required field "+missingField+".")
}
util.pseudoTypeError = pseudoTypeError;

function tryCatch(toTry, handleError) {
    try{
        toTry()
    }
    catch(err) {
        handleError(err)
    }
}
util.tryCatch = tryCatch;

function hook(options) {
    // Return a promise if a hook is asynchronous
    // If no hook is asynchronous, `fn` can still be asynchronous,
    // in which case we return a promise or undefined

    var preHooks = options.preHooks;
    var postHooks = options.postHooks;
    var doc = options.doc; // We need the doc to set the context of the hooks
    var async = options.async || false;
    var fn = options.fn; // The function that we are hook

    if (async === true) {
        return new Promise(function(resolve, reject) {
            _hook({
                resolve: resolve,
                reject: reject,
                preHooks: preHooks,
                postHooks: postHooks,
                doc: doc,
                fn: fn
            });
        });
    }
    else {
        return _hook(options);
    }
}
function _hook(options) {
    var doc = options.doc;

    var preHooks = options.preHooks;
    var postHooks = options.postHooks;

    var fn = options.fn;
    var resolve = options.resolve;
    var reject = options.reject;

    var promise, result;

    var hookIndex = 0;
    var executePostHooks = function() {
        if ((Array.isArray(postHooks)) && (hookIndex < postHooks.length)) {
            postHooks[hookIndex].call(doc, function(err) {
                if (err) {
                    if (typeof reject === 'function') {
                        return reject(err)
                    }
                    else {
                        throw err;
                    }
                }
                hookIndex++;
                executePostHooks()
            });
        }
        else {
            if (typeof resolve === 'function') {
                resolve(result); 
            }
        }
    }

    var executePreHooks = function() {
        if ((Array.isArray(preHooks)) && (hookIndex < preHooks.length)) {
            preHooks[hookIndex].call(doc, function(err) {
                if (err) {
                    if (typeof reject === 'function') {
                        return reject(err)
                    }
                    else {
                        throw err;
                    }
                }
                hookIndex++;
                executePreHooks()
            });
        }
        else {
            tryCatch(function() {
                promise = fn.bind(doc)();
            }, function(err) {
                if (typeof reject === 'function') {
                    reject(err); 
                }
                else {
                    throw err;
                }
            });
            if (promise instanceof Promise) {
                promise.then(function(res) {
                    result = res;
                    hookIndex = 0;
                    executePostHooks();
                }).error(reject);
            }
            else {
                result = promise;
                hookIndex = 0;
                executePostHooks();
            }
        }
    }
    executePreHooks();
    if ((typeof resolve !== 'function') && (promise instanceof Promise)) {
        // No hook is asynchronous, but `fn` returned a promise
        return promise;
    }
}
util.hook = hook;

function loopKeys(obj, fn) {
    if (isPlainObject(obj)) {
        var keys = Object.keys(obj);
        var result;
        for(var i=0; i<keys.length; i++) {
            result = fn(obj, keys[i]);
            if (result === false) return;
        }
    }
}
util.loopKeys = loopKeys;


module.exports = util;
