var Promise = require('bluebird');
var util = require(__dirname+'/util.js');
var Errors = require(__dirname+'/errors.js');

function Query(model, query) {
    this._model = model; // constructor

    if (model !== undefined) {
        this._r = model._getModel()._thinky.r;
    }

    if (query !== undefined) {
        this._query = query;
    }
    else if (model !== undefined) {
        this._query = this._r.table(model.getTableName());
    }
}

Query.prototype.run = function(options, callback) {
    if (typeof options === 'function') {
        return this._execute({}, true, options);
    }
    else {
        return this._execute(options, true, callback);
    }
}
Query.prototype.execute = function(options, callback) {

    if (typeof options === 'function') {
        return this._execute({}, false, options);
    }
    else {
        return this._execute(options, false, callback);
    }
}

Query.prototype._execute = function(options, parse, callback) {
    options = options || {};
    var fullOptions = {groupFormat: 'raw'}
    for(var key in options) {
        if (options.hasOwnProperty(key)) {
            fullOptions[key] = options[key]
        }
    }

    var self = this;
    var p;
    if (self._model._error !== null) {
        p = new Promise(function(resolve, reject) {
            reject(self._model._error);
        })
    }
    else if (self._model._getModel()._tableReady === true) {
        p = new Promise(function(resolve, reject) {
            self._query.run(fullOptions).then(function(result) {
                if (parse === true) {
                    if (result === null) {
                        reject(new Errors.DocumentNotFound())
                    }
                    else {
                        self._model._parse(result).then(resolve).error(reject);
                    }
                }
                else {
                    if (options.groupFormat !== 'raw') {
                        resolve(Query.prototype._convertGroupedData(result));
                    }
                    else {
                        resolve(result);
                    }
                }
            }).error(reject)
        });
    }
    else {
        p = new Promise(function(resolve, reject) {
            self._model.once('ready', function() {
                self._query.run(fullOptions).then(function(result) {
                    if (parse === true) {
                        if (result === null) {
                            reject(new Errors.DocumentNotFound())
                        }
                        else {
                            resolve(self._model._parse(result))
                        }
                    }
                    else {
                        if (options.groupFormat !== 'raw') {
                            resolve(Query.prototype._convertGroupedData(result));
                        }
                        else {
                            resolve(result);
                        }
                    }
                }).error(reject);
            });
        });
    }
    if (typeof callback === 'function') {
        p.then(function(result) {
            callback(null, result);
        }).error(function(error) {
            callback(error);
        });
    }
    return p;
}

Query.prototype._convertGroupedData = function(data) {
    if (util.isPlainObject(data) && (data.$reql_type$ === "GROUPED_DATA")) {
        var result = [];
        var reduction;
        for(var i=0; i<data.data.length; i++) {
            result.push({
                group: data.data[i][0],
                reduction: data.data[i][1]
            });
        }
        return result;
    }
    else {
        return data;
    }
}

// By default fetch all joins until it hits a circular reference
// options are passed in modelToGet
Query.prototype.getJoin = function(modelToGet, getAll, gotModel) {
    var self = this;
    var r = self._model._getModel()._thinky.r;

    var model = this._model;
    var joins = this._model._getModel()._joins;

    var getAll = (modelToGet === undefined) ? true: false;
    if (util.isPlainObject(modelToGet) === false) {
        modelToGet = {};
    }
    var innerQuery;

    gotModel = gotModel || {};
    gotModel[model.getTableName()] = true;

    for(var key in joins) {
        if (((getAll === true) || (key in modelToGet)) && ((getAll === false) || (gotModel[joins[key].model.getTableName()] !== true))) {
            if (joins[key].type === 'hasOne') {
                self._query = self._query.merge(function(doc) {
                    return r.branch(
                        doc.hasFields(joins[key].leftKey),
                        r.table(joins[key].model.getTableName()).getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}).coerceTo("ARRAY").do(function(result) {
                            return r.branch(
                                result.count().eq(1),
                                r.object(key, new Query(joins[key].model, result.nth(0)).getJoin(modelToGet[key], getAll, gotModel)._query),
                                r.branch(
                                    result.count().eq(0),
                                    {},
                                    r.error(r.expr("More than one element found for ").add(doc.coerceTo("STRING")).add(r.expr("for the field ").add(key)))
                                )
                            )
                        }),
                        {}
                    )
                });
            }
            else if (joins[key].type === 'belongsTo') {
                self._query = self._query.merge(function(doc) {
                    return r.branch(
                        doc.hasFields(joins[key].leftKey),
                        r.table(joins[key].model.getTableName()).getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}).coerceTo("ARRAY").do(function(result) {
                            return r.branch(
                                result.count().eq(1),
                                r.object(key, new Query(joins[key].model, result.nth(0)).getJoin(modelToGet[key], getAll, gotModel)._query),
                                r.branch(
                                    result.count().eq(0),
                                    {},
                                    r.error(r.expr("More than one element found for ").add(doc.coerceTo("STRING")).add(r.expr("for the field ").add(key)))
                                )
                            )
                        }),
                        {}
                    )
                });
            }
            else if (joins[key].type === 'hasMany') {
                self._query = self._query.merge(function(doc) {
                    innerQuery = new Query(joins[key].model,
                                         r.table(joins[key].model.getTableName())
                                        .getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}))

                    if ((modelToGet[key] != null) && (typeof modelToGet[key]._apply === 'function')) {
                        innerQuery = modelToGet[key]._apply(innerQuery);
                    }
                    innerQuery = innerQuery.getJoin(modelToGet[key], getAll, gotModel).coerceTo("ARRAY")._query
                    return r.branch(
                        doc.hasFields(joins[key].leftKey),
                        r.object(key, innerQuery),
                        {}
                    )
                });
            }
            else if (joins[key].type === 'hasAndBelongsToMany') {
                self._query = self._query.merge(function(doc) {
                    if ((model.getTableName() === joins[key].model.getTableName()) && (joins[key].leftKey === joins[key].rightKey)) {
                        // In case the model is linked with itself on the same key

                        innerQuery = r.table(joins[key].link).getAll(doc(joins[key].leftKey), {index: joins[key].leftKey+"_"+joins[key].leftKey}).concatMap(function(link) {
                            return r.table(joins[key].model.getTableName()).getAll(
                                r.branch(
                                    doc(joins[key].leftKey).eq(link(joins[key].leftKey+"_"+joins[key].leftKey).nth(0)),
                                    link(joins[key].leftKey+"_"+joins[key].leftKey).nth(1),
                                    link(joins[key].leftKey+"_"+joins[key].leftKey).nth(0)
                                )
                            , {index: joins[key].rightKey})
                        });

                        if ((modelToGet[key] != null) && (typeof modelToGet[key]._apply === 'function')) {
                            innerQuery = modelToGet[key]._apply(innerQuery);
                        }
                        innerQuery = innerQuery.coerceTo("ARRAY");
                        return r.branch(
                            doc.hasFields(joins[key].leftKey),
                            r.object(key, new Query(joins[key].model, innerQuery).getJoin(modelToGet[key], getAll, gotModel)._query),
                            {}
                        )
                    }
                    else {
                        innerQuery = r.table(joins[key].link).getAll(doc(joins[key].leftKey), {index: model.getTableName()+"_"+joins[key].leftKey}).concatMap(function(link) {
                            return r.table(joins[key].model.getTableName()).getAll(link(joins[key].model.getTableName()+"_"+joins[key].rightKey), {index: joins[key].rightKey})
                        }).coerceTo("ARRAY")

                        if ((modelToGet[key] != null) && (typeof modelToGet[key]._apply === 'function')) {
                            innerQuery = modelToGet[key]._apply(innerQuery)
                        }
                        return r.branch(
                            doc.hasFields(joins[key].leftKey),
                            r.object(key,
                                new Query(joins[key].model, innerQuery).getJoin(modelToGet[key], getAll, gotModel)._query),
                            {}
                        )
                    }
                });
            }
        }
    }

    return self;
}

Query.prototype.then = function() {
    throw new Error("The method `then` is not defined on Query. Did you forgot `.run()` or `.execute()`?")
}

// Import rethinkdbdash methods
var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
for(var key in Term) {
    if ((Term.hasOwnProperty(key)) && (key !== 'run') && (key[0] !== '_')) {
        (function(key) {
            Query.prototype[key] = function() {
                return new Query(this._model, this._query[key].apply(this._query, arguments));
            }
        })(key);
    }
}

Query.prototype.toString = function() {
    return this._query.toString();
}

module.exports = Query;
