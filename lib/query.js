var Promise = require('bluebird');

function Query(model, query, type) {
    this._model = model; // constructor
    this._r = model._getModel()._thinky.r;

    if (query != null) {
        this._query = query;
    }
    else {
        this._query = this._r.table(model.getName());
    }
}

Query.prototype.run = function(options) {
    return this._execute(options, true);
}
Query.prototype.execute = function(options) {
    return this._execute(options, false);
}

Query.prototype._execute = function(options, parse) {
    options = options || {};
    fullOptions = {groupFormat: 'raw'}
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
    else if (self._model._tableReady === true) {
        p = new Promise(function(resolve, reject) {
            self._query.run(fullOptions).then(function(result) {
                self._model._parse(result, parse).then(resolve).error(reject);
            }).error(reject)
        })
    }
    else {
        p = new Promise(function(resolve, reject) {
            self._model.on('ready', function() {
                self._query.run(fullOptions).then(function(result) {
                    resolve(self._model._parse(result, parse))
                }).error(reject);
            });
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
        if (((joins[key].model.getName() in modelToGet) || (getAll === true)) && (joins[key].type === 'hasOne')) {
            self._query = self._query.merge(function(doc) {
                return r.table(joins[key].model.getName()).getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}).coerceTo("ARRAY").do(function(result) {
                    return r.branch(
                        result.count().eq(1),
                        r.object(key, result.nth(0)),
                        r.branch(
                            result.count().eq(0),
                            {},
                            r.error(r.expr("More than one element found for ").add(doc.coerceTo("STRING")).add(r.expr("for the field ").add(key)))
                        )
                    )
                })
            });
        }

        if (((joins[key].model.getName() in modelToGet) || (getAll === true)) && (joins[key].type === 'belongsTo')) {
            self._query = self._query.merge(function(doc) {
                return r.table(joins[key].model.getName()).getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}).coerceTo("ARRAY").do(function(result) {
                    return r.branch(
                        result.count().eq(1),
                        r.object(key, result.nth(0)),
                        r.branch(
                            result.count().eq(0),
                            {},
                            r.error(r.expr("More than one element found for ").add(doc.coerceTo("STRING")).add(r.expr("for the field ").add(key)))
                        )
                    )
                })
            });
        }
        if (((joins[key].model.getName() in modelToGet) || (getAll === true)) && (joins[key].type === 'hasMany')) {
            self._query = self._query.merge(function(doc) {
                return r.object(key, r.table(joins[key].model.getName()).getAll(doc(joins[key].leftKey), {index: joins[key].rightKey}).coerceTo("ARRAY"))
            });
        }

        if (((joins[key].model.getName() in modelToGet) || (getAll === true)) && (joins[key].type === 'hasAndBelongsToMany')) {
            self._query = self._query.merge(function(doc) {
                return r.object(key, r.table(joins[key].link).getAll(doc(joins[key].leftKey), {index: model.getName()+"_"+joins[key].leftKey}).concatMap(function(link) {
                    return r.table(joins[key].model.getName()).getAll(link(joins[key].model.getName()+"_"+joins[key].rightKey), {index: joins[key].rightKey})
                }).coerceTo("ARRAY"))
                
            });
        }
    }

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
