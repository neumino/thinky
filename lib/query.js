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
        console.log(1)
        console.log(self._query.toString())
        p = new Promise(function(resolve, reject) {
            self._query.run().then(function(result) {
                 self._model._parse(result).then(function(result) {
                    resolve(result);
                }).error(reject)
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
var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
for(var key in Term) {
    if (Term.hasOwnProperty(key)) {
        Query.prototype[key] = function() {
            var query = new Query(this);
            query = query[key].apply(query, arguments);
            return query;
        }
    }
}
*/

module.exports = Query;
