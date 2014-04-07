var Promise = require('bluebird');

function Query(model, query) {
    this._model = model; // constructor
    this._r = model._getModel()._thinky.r;

    if (query != null) {
        this._query = query;
    }
    else {
        this._query = this._r.table(model.getName());
    }
}

//TODO refactor run and execute
Query.prototype.run = function() {
    var self = this;
    var p;
    if (self._model._error !== null) {
        p = new Promise(function(resolve, reject) {
            reject(self._model._error);
        })
    }
    else if (self._model._getModel()._tableReady === true) {
        console.log('table ready')
        p = new Promise(function(resolve, reject) {
            self._query.run().then(function(result) {
                 self._model._parse(result).then(resolve).error(reject);
            }).error(reject)
        })
    }
    else {
        console.log('table not ready')
        p = new Promise(function(resolve, reject) {
            self._model._getModel()._onTableReady.push({
                query: self._query,
                resolve: resolve,
                reject: reject
            })
        })
    }
    return p;
}
Query.prototype.execute = function() {
    var self = this;
    var p;
    if (self._model._error !== null) {
        p = new Promise(function(resolve, reject) {
            reject(self._model._error);
        })
    }
    else if (self._model._tableReady === true) {
        p = new Promise(function(resolve, reject) {
            self._query.run().then(function(result) {
                 self._model._parse(result, false).then(resolve).error(reject);
            }).error(reject)
        })
    }
    else {
        p = new Promise(function(resolve, reject) {
            self._model._onTableReady.push({
                query: self._query,
                resolve: function(result) {
                    resolve(self._model._parse(result, false))
                },
                reject: reject,
                execute: true
            })
        })
    }
    return p;
}

Query.prototype.getJoin = function(modelToGet) {
    var self = this;
    var r = self._model._getModel()._thinky.r;

    var getAll = (modelToGet === undefined) ? true: false;
    modelToGet = modelToGet || {};
    var model = this._model;
    var joins = this._model._getModel()._joins;

    for(var key in joins) {
        if (((model._joins[key].model.getName() in modelToGet) || (getAll === true)) && (model._joins[key].type === 'hasOne')) {
            self._query = r.branch(
                r.expr([
                    "TABLE",
                    "ARRAY",
                    "SELECTION<STREAM>",
                    "STREAM"
                ]).contains(self._query.typeOf()),
                self._query.map(function(doc) {
                    return r.table(joins[key].model.getName()).getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}).coerceTo("ARRAY").do(function(result) {
                        return r.branch(
                            result.count().eq(1),
                            result.merge(r.object(key, result.nth(0))),
                            r.branch(
                                result.count().eq(0),
                                doc,
                                r.error(r.expr("More than one element found for ").add(doc.coerceTo("STRING")).add(r.expr("for the field ").add(key)))
                            )
                        )
                    })
                }),
                // self._query is an object (if it's a primitive, the server will throw)
                r.table(joins[key].model.getName()).getAll(this._query(joins[key].leftKey), {index: joins[key].rightKey}).do(function(result) {
                    return r.branch(
                        result.count().eq(1),
                        self._query.merge(r.object(key, result.nth(0))),
                        r.branch(
                            result.count().eq(0),
                            self._query,
                            r.error(r.expr("More than one element found for ").add(self._query.coerceTo("STRING")).add(r.expr("for the field ").add(key)))
                        )
                    )
                })
            )
        }
    }

    console.log(self._query.toString());

    //hasOne
    //belongsTo
    //hasMany
    //hasAndBelongsToMany


    return self;
}


// Import rethinkdbdash methods
var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
for(var key in Term) {
    if ((Term.hasOwnProperty(key)) && (key !== 'run') && (key[0] !== '_')) {
        (function(key) {
            Query.prototype[key] = function() {
                this._query = this._query[key].apply(this._query, arguments);
                return this;
            }
        })(key);
    }
}

module.exports = Query;
