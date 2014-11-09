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
    if (Array.isArray(preHooks) === false) {
        preHooks = [];
    }
    var postHooks = options.postHooks;
    if (Array.isArray(postHooks) === false) {
        postHooks = [];
    }
    var doc = options.doc; // We need the doc to set the context of the hooks
    var async = options.async || false;
    var fn = options.fn; // The function that we are hook

    if (async === true) {
        return new Promise(function(resolve, reject) {
            _asyncHook({
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
        return _syncHook({
            preHooks: preHooks,
            postHooks: postHooks,
            doc: doc,
            fn: fn
        });

    }
}
function _syncHook(args) {
    var preHooks = args.preHooks;
    var postHooks = args.postHooks;
    var fn = args.fn;
    var doc = args.doc;
    var args = args.args;

    for(var i=0; i<preHooks.length; i++) {
        preHooks[i].call(doc);
    }
    var result = fn.apply(doc, args);
    for(var i=0; i<postHooks.length; i++) {
        postHooks[i].call(doc);
    }
    return result;
}
function _asyncHook(args) {
    // One of the hook, or the function is asynchronous, so we will
    // always return a promise
    // We only need to keep track of the result return/resolved for fn

    var preHooks = args.preHooks;
    var postHooks = args.postHooks;
    var fn = args.fn;
    var doc = args.doc;
    var resolve = args.resolve;
    var reject = args.reject;
    var args = args.args;

    var result;

    var nextPost = function() {
        if (typeof resolve === "function") {
            resolve(result);
        }
        return result;
    }

    var executeMain = function() {
        result = fn.apply(doc, args);
        if (result instanceof Promise) {
            return result.then(function(res) {
                result = res;
                executeHooks(0, postHooks, doc, reject, nextPost);
            }).error(reject);
        }
        else {
            return executeHooks(0, postHooks, doc, reject, nextPost);
        }
    }

    var nextPre = function() {
        tryCatch(executeMain, function (err) {
            return reject(err);
        });
    }
    return executeHooks(0, preHooks, doc, reject, nextPre);
}
util.hook = hook;

function executeHooks(hookIndex, hooks, doc, reject, next) {
    if (hookIndex < hooks.length) {
        if (hooks[hookIndex].length === 1) {
            hooks[hookIndex].call(doc, function(err) {
                if (err) return reject(err);
                executeHooks(hookIndex+1, hooks, doc, reject, next)
            });
        }
        else {
            hooks[hookIndex](doc);
            executeHooks(hookIndex+1, hooks, doc, reject, next)
        }
    }
    else {
        next();
    }
}

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

function changeProto(object, newProto) {
    object.__proto__ = newProto;
}
util.changeProto = changeProto;

function recurse(key, joins, modelTo, all, done) {
    return (util.isPlainObject(modelTo) && modelTo.hasOwnProperty(key))
        || ((all === true) && (done[joins[key].model.getTableName()] !== true))
}
util.recurse = recurse;

module.exports = util;
