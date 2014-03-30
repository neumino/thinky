var Promise = require('bluebird');

function Query(table) {
    this._table = table;
}

Query.prototype.run = function() {
    var self = this;
    var p;
    if (self._table._error !== null) {
        // TODO throw
        p = new Promise(function(resolve, reject) {
            process.nexTick(function() {
                reject(self._table._error);
            });
        })
    }
    else if (self._table._ready === true) {
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

module.exports = Query;
