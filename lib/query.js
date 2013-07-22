var r = require('rethinkdb');

function Query(model, query) {
    this.model = model;

    var modelProto = model.getModel(); 
    if (query != null) {
        this.query = query;
    }
    else {
        this.query = r.db(modelProto.thinkyOptions.db).table(modelProto.name);
    }
};


Query.prototype.get = function(id, options, callback) {
    options = options || {};
    // chain with get
    if (Object.prototype.toString.call(id) === '[object Array]') {
        this.query = this.query.getAll.apply(this.query, id);
        // Get joined documents
        if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
            this.query = this.getJoin(this.model, 'stream');
        }
    }
    else {
        this.query = this.query.get(id);
        // Get joined documents
        if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
            this.getJoin(this.model, 'object');
        }
    }

    // Execute if we have a callback
    if (typeof callback === 'function') {

        if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
        }
        this.run(callback);
    }
    return this;
}


Query.prototype.getAll = function(id, options, callback) {
    options = options || {};
    var index = options.index || this.model.getPrimaryKey();

    // Chain with getAll
    if (Object.prototype.toString.call(id) === '[object Array]') {
        var args = [];
        for(var i=0; i<id.length; i++) {
            args.push(id[i]);
        }
        args.push({index: index});
        this.query = this.query.getAll.apply(this.query, args);
    }
    else {
        this.query = this.query.getAll(id, {index: index})
    }
    
    // Get joined documents
    if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
        this.getJoin(this.model, 'stream');
    }

    // Execute if a callback is passed
    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this
}

Query.prototype.filter = function(filter, options, callback) {
    options = options || {};

    // Chain with filter
    this.query = this.query.filter(filter);

    // Get joined documents
    if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
        this.getJoin(this.model, 'stream');
    }
    
    // Execute if a callback is passed
    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this
}


Query.prototype.limit = function(limit, options, callback) {
    this.query = this.query.limit(limit);

    // Get joined documents
    if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
        this.getJoin(this.model, 'stream');
    }

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}
Query.prototype.skip = function(skipValue, options, callback) {
    this.query = this.query.skip(skipValue);

    // Get joined documents
    if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
        this.getJoin(this.model, 'stream');
    }

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}
Query.prototype.orderBy = function(field, options, callback) {

    if (Object.prototype.toString.call(field) === '[object Array]') {
        this.query = this.query.orderBy.apply(this.query, field);
    }
    else {
        this.query = this.query.orderBy(field);
    }

    // Get joined documents
    if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
        this.getJoin(this.model, 'stream');
    }

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}
Query.prototype.between = function(start, end, options, callback) {
    options = options || {};
    var index = options.index || this.model.getPrimaryKey();
    this.query = this.query.between(start, end, {index: index});

    // Get joined documents
    if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
        this.getJoin(this.model, 'stream');
    }

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}

Query.prototype.nth = function(nth, options, callback) {
    options = options || {};
    var index = options.index || this.model.getPrimaryKey();
    this.query = this.query.nth(nth);

    // Get joined documents
    if ((typeof options === 'object') && (options !== null) && (options.getJoin === true)) {
        this.getJoin(this.model, 'object');
    }

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}




Query.prototype.count = function(callback) {
    this.query = this.query.count();
    if (typeof callback === 'function') {
        this.execute(callback);
    }
    return this;
}


// Chain the query with its joined tables.
// TODO Implement arbitrary functions and hasMany relation
Query.prototype.getJoin = function(model, type) {
    for(var fieldName in model.joins) {
        var otherModel = model.joins[fieldName].model;
        var joinClause = model.joins[fieldName].joinClause;
        var joinType = model.joins[fieldName].type;
        if (typeof joinClause === 'object') {
            if (type === 'object') {
                if (joinType === 'hasOne') {
                    this.query = this.query.do( function(doc) {
                        return r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                            .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}).coerceTo('array').do( function(stream) {
                                return r.branch( stream.count().gt(1),
                                    r.error("Found more than one match"), // TODO Improve error
                                    r.branch( stream.count().eq(0),
                                        r.expr(doc),
                                        doc.merge(
                                            r.expr([[fieldName, new Query(otherModel, stream.nth(0)).getJoin(otherModel, 'object').query]]).coerceTo('object')
                                        )
                                    )
                                )
                            });
                    });
                }
                else if (joinType === 'hasMany') {
                    this.query = this.query.do( function(doc) {
                        return doc(joinClause["leftKey"]).concatMap( function(value) {
                            return r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                                .getAll( value, {index: joinClause["rightKey"]})
                        }).coerceTo('array').do( function(stream) {
                            return doc.merge(
                                r.expr([[fieldName, new Query(otherModel, stream).getJoin(otherModel, 'stream').query]]).coerceTo('object')
                            )
                        });
                    });
                }
            }
            else if (type === 'stream') {
                if (joinType === 'hasOne') {
                    this.query = this.query.map( function(doc) {
                        return r.branch(
                            doc.hasFields(joinClause["leftKey"]),
                            r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                                .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}).coerceTo('array').do( function(stream) {
                                    return r.branch( stream.count().gt(1),
                                        r.error("Found more than one match"), // TODO Improve error
                                        r.branch( stream.count().eq(0),
                                            r.expr(doc),
                                            doc.merge(
                                                r.expr([[fieldName, new Query(otherModel, stream.nth(0)).getJoin(otherModel, 'object').query]]).coerceTo('object')
                                            )
                                        )
                                    )
                                }),
                            doc)
                    });
                }
                else if (joinType === 'hasMany') {
                    this.query = this.query.map( function(doc) {
                        return r.branch(
                            doc.hasFields(joinClause["leftKey"]),
                            doc(joinClause["leftKey"]).concatMap( function(joinValue) {
                                return r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                                    .getAll( joinValue, {index: joinClause["rightKey"]} ).coerceTo('array')
                            }).do( function(stream) {
                                return doc.merge(
                                    r.expr([[fieldName, new Query(otherModel, stream).getJoin(otherModel, 'stream').query]]).coerceTo('object')
                                )
                            }),
                            doc)
                    });
                }
            }
        }
        else if (typeof joinClause === 'function') { // the joinClause is a function
            //TODO
        }
    }
    return this
}


Query.prototype.run = function(callback) {
    var self = this;
    var wrappedCallback = self.model.callbacks.any(self.model, callback);

    var model = self.model.getModel();
    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        self.query.run(connection, function(error, result) {
            wrappedCallback(error, result);
            model.pool.release(connection);
        });
    });
}

Query.prototype.execute = function(callback) {
    var self = this;

    var model = self.model.getModel();
    model.pool.acquire( function(error, connection) {
        if (error) {
            return callback(error, null);
        }
        self.query.run(connection, function(error, result) {
            callback(error, result);
            model.pool.release(connection);
        });
    });
}


var query = module.exports = exports = Query;
