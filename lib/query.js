var r = require('rethinkdb');

function Query(model, query, type) {
    this.model = model;

    var modelProto = model.getModel();
    if (query != null) {
        this.query = query;
        if (type == null) {
            throw new Error("`type` has to be defined when creating an arbitrary query")
        }
        this.type = type;
    }
    else {
        this.query = r.db(modelProto.thinkyOptions.db).table(modelProto.name);
        this.type = 'stream'
    }
};


Query.prototype.get = function(id, callback) {
    // chain with get
    if (Object.prototype.toString.call(id) === '[object Array]') {
        this.query = this.query.getAll.apply(this.query, id);
    }
    else {
        this.query = this.query.get(id);
    }
    this.type = 'object'

    // Execute if we have a callback
    if (typeof callback === 'function') {
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
    this.type = 'stream'

    // Execute if a callback is passed
    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this
}

Query.prototype.filter = function(filter, callback) {
    // Chain with filter
    this.query = this.query.filter(filter);
    this.type = 'stream'

    // Execute if a callback is passed
    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this
}


Query.prototype.limit = function(limit, callback) {
    this.query = this.query.limit(limit);
    this.type = 'stream'

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}
Query.prototype.skip = function(skipValue, callback) {
    this.query = this.query.skip(skipValue);
    this.type = 'stream';

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}
Query.prototype.orderBy = function(field, callback) {
    if (Object.prototype.toString.call(field) === '[object Array]') {
        var reqlField = [];
        for(var i=0; i<field.length; i++) {
            if (typeof field[i] === 'string') {
                if ((field[i].length > 0) && (field[i][0] === '-')) {
                    reqlField.push(r.desc(field[i].slice(1)))
                }
                else {
                    reqlField.push(field[i])
                }
            }
        }
        this.query = this.query.orderBy.apply(this.query, field);
    }
    else {
        if (typeof field === 'string') {
            if ((field.length > 0) && (field[0] === '-')) {
                this.query = this.query.orderBy(r.desc(field.slice(1)));
            }
            else {
                this.query = this.query.orderBy(field);
            }
        }
    }
    this.type = 'stream';
    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}
Query.prototype.between = function(start, end, options, callback) {
    options = options || {};
    var index = options.index || this.model.getPrimaryKey();
    this.query = this.query.between(start, end, {index: index});

    this.type = 'stream';


    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}

Query.prototype.nth = function(nth, callback) {
    this.query = this.query.nth(nth);
    this.type = 'object';

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}




Query.prototype.count = function(callback) {
    this.query = this.query.count();
    this.type = 'value'
    if (typeof callback === 'function') {
        this.execute(callback);
    }
    return this;
}


// Chain the query with its joined tables.
// TODO Implement arbitrary functions and hasMany relation
// TODO Clean...
//Query.prototype.getJoin = function(model, type) {
Query.prototype.getJoin = function(callback) {
    var model = this.model;
    var type = this.type;
    /*
    if (model == null) {
        model = this.model;
    }
    if (type == null) {
        type = this.type;
    }
    */
    for(var fieldName in model.joins) {
        var otherModel = model.joins[fieldName].model;
        var joinClause = model.joins[fieldName].joinClause;
        var joinType = model.joins[fieldName].type;
        var joinOptions = model.joins[fieldName].options;
        if (typeof joinClause === 'object') {
            if (type === 'object') {
                if (joinType === 'hasOne') {
                    this.query = this.query.do( function(doc) {
                        return r.branch(
                            doc.hasFields(joinClause["leftKey"]),
                            r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                                .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}).coerceTo('array').do( function(stream) {
                                    return r.branch( stream.count().gt(1),
                                        r.error("Found more than one match"), // TODO Improve error
                                        r.branch( stream.count().eq(0),
                                            r.expr(doc),
                                            doc.merge(
                                                r.expr([[fieldName, new Query(otherModel, stream.nth(0), 'object').getJoin().query]]).coerceTo('object')
                                            )
                                        )
                                    )
                                }),
                            doc)

                    });
                }
                else if (joinType === 'hasMany') {
                    // TODO refactor the if/else
                    if (joinOptions.orderBy != null) {
                        this.query = this.query.do( function(doc) {
                            return r.branch(
                                doc.hasFields(joinClause["leftKey"]),
                                new Query(otherModel, r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                                    .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}), 'stream').orderBy(joinOptions.orderBy).query.coerceTo('array').do( function(stream) {
                                        return doc.merge(
                                            r.expr([[fieldName, new Query(otherModel, stream, 'stream').getJoin().query]]).coerceTo('object')
                                        )
                                    }),
                                doc)
                        });
                    }
                    else {
                        this.query = this.query.do( function(doc) {
                            return r.branch(
                                doc.hasFields(joinClause["leftKey"]),
                                r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                                    .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}).coerceTo('array').do( function(stream) {
                                        return doc.merge(
                                            r.expr([[fieldName, new Query(otherModel, stream, 'stream').getJoin().query]]).coerceTo('object')
                                        )
                                    }),
                                doc)
                        });
                    }
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
                                                r.expr([[fieldName, new Query(otherModel, stream.nth(0), 'object').getJoin().query]]).coerceTo('object')
                                            )
                                        )
                                    )
                                }),
                            doc)
                    });
                }
                else if (joinType === 'hasMany') {
                    if (joinOptions.orderBy != null) {
                        this.query = this.query.map( function(doc) {
                            return r.branch(
                                doc.hasFields(joinClause["leftKey"]),
                                new Query(otherModel, r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                                    .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}), 'stream').orderBy(joinOptions.orderBy).query.coerceTo('array').do( function(stream) {
                                        return doc.merge(
                                            r.expr([[fieldName, new Query(otherModel, stream, 'stream').getJoin().query]]).coerceTo('object')
                                        )
                                    }),
                                doc)
                        });
                    }
                    else {
                        this.query = this.query.map( function(doc) {
                            return r.branch(
                                doc.hasFields(joinClause["leftKey"]),
                                r.db(otherModel.getModel().thinkyOptions.db).table(otherModel.getModel().name)
                                    .getAll( doc(joinClause["leftKey"]), {index: joinClause["rightKey"]}).coerceTo('array').do( function(stream) {
                                        return doc.merge(
                                            r.expr([[fieldName, new Query(otherModel, stream, 'stream').getJoin().query]]).coerceTo('object')
                                        )
                                    }),
                                doc)
                        });
                    }
                }
            }
        }
        else if (typeof joinClause === 'function') { // the joinClause is a function
            //TODO
        }
    }
    //this.type doens't change
    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this
}

Query.prototype.delete = function(callback) {
    //TODO Implement a way to delete joins? -- Note: That seems hard to do in one query...
    this.query = this.query.delete();
    this.type = 'object';

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;

}

// Specifies fields that should be returned as query result
// http://www.rethinkdb.com/api/#js:document_manipulation-pluck

Query.prototype.pluck = function(field, callback) {
    if (Object.prototype.toString.call(field) === '[object Array]') {
        this.query = this.query.pluck.apply(this.query, field);
    } else {
        this.query = this.query.pluck(field);
    }

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}

// Opposite to pluck, query result returned without specified fields
// http://www.rethinkdb.com/api/#js:document_manipulation-without

Query.prototype.without = function(field, callback) {
    if (Object.prototype.toString.call(field) === '[object Array]') {
        this.query = this.query.without.apply(this.query, field);
    } else {
        this.query = this.query.without(field);
    }

    if (typeof callback === 'function') {
        this.run(callback);
    }
    return this;
}

// Execute the query and return instance(s) of the model
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

// Execute the query but doesn't return instances of the model
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
