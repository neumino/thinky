var Promise = require('bluebird');

function Query(model, query) {
    this._model = model;
    this._r = model._getModel()._thinky.r;

    if (query != null) {
        this._query = query;
    }
    else {
        this._query = this._r.table(model.getName());
    }
}


Query.prototype.run = function() {
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
                 resolve(self._model._parse(result))
            }).error(reject)
        })
    }
    else {
        p = new Promise(function(resolve, reject) {
            self._model._onTableReady.push({
                query: self._query,
                resolve: resolve,
                reject: reject
            })
        })
    }
    return p;
}

/*
Query.prototype.get = function(arg) {
    this._query = this._query.get.apply(this._query, arguments);
    return this;
}
*/



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

for(var key in Query.prototype) { }
module.exports = Query;
