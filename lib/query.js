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
    if (self._table._error !== null) {
        p = new Promise(function(resolve, reject) {
            reject(self._table._error);
        })
    }
    else if (self._table._tableReady === true) {
        p = new Promise(function(resolve, reject) {
            self.query.run().then(function(result) {
                //TODO do stuff
            }).error(reject)
        })
    }
    else {
        p = new Promise(function(resolve, reject) {
            self._table._onTableReady.push({
                query: self,
                resolve: resolve,
                reject: reject;
            })
        })
    }
    return p;
}

var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
for(var key in term) {
    if (term.hasOwnProperty(key)) {
        Query.prototype[key] = function() {
            var query = new Query(this);
            query = query[key].apply(query, arguments);
            return query;
        }
    }
}

module.exports = Query;
