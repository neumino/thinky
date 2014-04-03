var util = require(__dirname+'/util.js');
var Document = require(__dirname+'/document.js');
var EventEmitter = require('events').EventEmitter;
var Query = require(__dirname+'/query.js');
var Promise = require('bluebird');

/*
 * document -> {} -> Document.prototype <-cp- model -> Model.prototype
 *
 */
function Model(name, schema, options, thinky) {
    this._name = name;

    //util.validateSchema(schema)
    this._schema = schema;

    // We want a deep copy
    options = options || {};
    this._options = {};
    this._options.enforce_missing = (typeof options.enforce_missing != null) ? options.enforce_missing : thinky._options.enforce_missing;
    this._options.enforce_extra = (typeof options.enforce_extra != null) ? options.enforce_extra : thinky._options.enforce_extra;
    this._options.enforce_type = (typeof options.enforce_type != null) ? options.enforce_type : thinky._options.enforce_type;
    this._options.timeFormat = (typeof options.timeFormat != null) ? options.timeFormat : thinky._options.timeFormat;
    this._options.validate = (typeof options.validate != null) ? options.validate : thinky._options.validate;

    this._thinky = thinky;

    this._tableCreated = false;
    this._tableReady = false;
    this._indexesToCreate = 0;
    this._onTableCreated = []; // query
    this._onTableReady = []; // {query, resolve, reject}

    this._error = null; // If an error occured, we won't let people save things

    this._listeners = [];
    this._joins = {};
}
util.inherits(Model, EventEmitter);

Model.new = function(name, schema, options, thinky) {

    var proto = new Model(name, schema, options, thinky);

    var model = function model(doc, options) {
        if (!util.isPlainObject(doc)) {
            //TODO Improve this error message
            throw new Error("To create a new instance, you must pass an object")
        }
        doc.__proto__ = new Document(model, options);
        doc.__proto__._generateDefault.apply(doc)

        return doc;
    }

    model.__proto__ = proto;
    return model
}

Model.prototype._setReady = function() {
    this._getModel()._tableReady = true;
    this.emit('ready');
}

Model.prototype._indexWasCreated = function() {
    this._getModel()._indexesToCreate--;
    if (this._getModel()._indexesToCreate <= 0) {
        this._setReady();
        for(var i = 0; i<this._onTableReady.length; i++) {
            this._onTableReady[i].query.run().then(this._onTableReady[i].resolve).error(this._onTableReady[i].reject);
        }
    }

}

Model.prototype._tableWasCreated = function() {
    var self = this;

    self._getModel()._tableCreated = true;
    if (self._onTableCreated.length > 0) {
        // Create indexes
        self._getModel()._indexesToCreate += self._onTableCreated.length
        for(var i = 0; i<self._onTableCreated.length; i++) {
            self._onTableCreated[i].run().then(function(result) {
                self._indexWasCreated();
            }).error(function(error) {
                self._getModel()._error = error;
            });
        }
    }
    else {
        // Will trigger the queries waiting
        this._indexWasCreated();
    }
};

/*
 * Make a shallow copy of docValues in doc
 */
Model.prototype.create = function(docValues) {
    var doc = {};
    for(var key in docValues) {
        doc[key] = docValues[key];
    }
    return doc;
}

/*
 * Return the options of the model
 */
Model.prototype.getOptions = function() {
    return this._options;
}


/*
 * Return the instance of Model **when called on the function**
 */
Model.prototype._getModel = function() {
    //TODO write test
    return this.__proto__;
}

/*
 * Return the instance of Model
 */
Model.prototype.getName = function() {
    //TODO write test
    return this._getModel()._name;
}




//TODO Nested fields?
//TODO Sanitize fields
/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * The foreign key is stores in the joinedModel
 *
 * Post.hasOne(Author, "author", "id", "postId"
 *                                ^- post.id
 */
Model.prototype.hasOne = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    var self  = this;

    if ((joinedModel instanceof Model) === false) {
        throw new Error("First argument of `hasOne` must be a Model")
    }

    self._getModel()._joins[joinedModel.getName()] = {
        model: joinedModel,
        fieldDoc: fieldDoc,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasOne'
    }

    options = options || {};
    if (options.init !== false) {
        var tableName = joinedModel.getName();
        var r = self._getModel()._thinky.r;

        if (joinedModel._getModel()._tableCreated === true) {
            r.table(tableName).indexList().contains(rightKey).do(function(result) {
                return r.branch(
                    result,
                    r.table(tableName).indexWait(rightKey),
                    r.branch(
                        r.table(tableName).info()("primary_key").eq(rightKey),
                        {index: rightKey, ready: true},
                        r.table(tableName).indexCreate(rightKey).do(function() {
                            return r.table(tableName).indexWait(rightKey)
                        })
                    )
                )
            }).run().then(function(result) {
                self._indexWasCreated();
            }).error(function(error) {
                self._getModel()._error = error;
            })
        }
        else {
            self._getModel()._onTableCreated.push(
                r.table(tableName).indexList().contains(rightKey).do(function(result) {
                    return r.branch(
                        result,
                        r.table(tableName).indexWait(rightKey),
                        r.branch(
                            r.table(tableName).info()("primary_key").eq(rightKey),
                            {index: rightKey, ready: true},
                            r.table(tableName).indexCreate(rightKey).do(function() {
                                return r.table(tableName).indexWait(rightKey)
                            })
                        )
                    )
                })
            )
        }
    }
}

/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * The foreign key is store in the model calling belongsTo
 *
 * Post.belongsTo(Author, "author", "authorId", "id"
 *                                                ^- author.id
 */
Model.prototype.belongsTo = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    //TODO
    var self  = this;

    if ((joinedModel instanceof Model) === false) {
        throw new Error("First argument of `belongsTo` must be a Model")
    }

    self._getModel()._joins[joinedModel.getName()] = {
        model: joinedModel,
        fieldDoc: fieldDoc,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'belongsTo'
    }

    options = options || {};
    if (options.init !== false) {
        var tableName = self.getName();
        var r = self._getModel()._thinky.r;

        if (self._getModel()._tableCreated === true) {
            r.table(tableName).indexList().contains(leftKey).do(function(result) {
                return r.branch(
                    result,
                    r.table(tableName).indexWait(leftKey),
                    r.branch(
                        r.table(tableName).info()("primary_key").eq(leftKey),
                        {index: leftKey, ready: true},
                        r.table(tableName).indexCreate(leftKey).do(function() {
                            return r.table(tableName).indexWait(leftKey)
                        })
                    )
                )
            }).run().then(function(result) {
                self._indexWasCreated();
            }).error(function(error) {
                self._getModel()._error = error;
            })
        }
        else {
            self._getModel()._onTableCreated.push(
                r.table(tableName).indexList().contains(leftKey).do(function(result) {
                    return r.branch(
                        result,
                        r.table(tableName).indexWait(leftKey),
                        r.branch(
                            r.table(tableName).info()("primary_key").eq(leftKey),
                            {index: leftKey, ready: true},
                            r.table(tableName).indexCreate(leftKey).do(function() {
                                return r.table(tableName).indexWait(leftKey)
                            })
                        )
                    )
                })
            )
        }
    }
}


/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * A post has one author, and an author can write multiple posts
 * Author.hasMany(Post, "posts", "id", "authorId"
 *                                 ^- author.id
 */
Model.prototype.hasMany = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    var self  = this;

    if ((joinedModel instanceof Model) === false) {
        throw new Error("First argument of `hasMany` must be a Model")
    }

    this._getModel()._joins[joinedModel.getName()] = {
        model: joinedModel,
        fieldDoc: fieldDoc,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasMany'
    }

    options = options || {};
    if (options.init !== false) {
        var tableName = joinedModel.getName();
        var r = self._getModel()._thinky.r;

        var query = r.table(tableName).indexList().contains(rightKey).do(function(result) {
            return r.branch(
                result,
                r.table(tableName).indexWait(rightKey),
                r.branch(
                    r.table(tableName).info()("primary_key").eq(rightKey),
                    {index: rightKey, ready: true},
                    r.table(tableName).indexCreate(rightKey).do(function() {
                        return r.table(tableName).indexWait(rightKey)
                    })
                )
            )
        })

        if (joinedModel._getModel()._tableCreated === true) {
            query.run().then(function(result) {
                self._indexWasCreated();
            }).error(function(error) {
                self._getModel()._error = error;
            })
        }
        else {
            self._getModel()._onTableCreated.push(query)
        }
    }
}


/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * Patient.hasAndBelongsToMany(Doctor, "doctors", "id", "id"
 *                                       patient.id-^    ^-doctor.id
 *
 * It automatically creates a table <modelName>_<otherModelName> or <otherModelName>_<modelName> (alphabetic order)
 */
Model.prototype.hasAndBelongsToMany = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    //TODO create the symmetric relations so we don't try to create twice the table
    var link;
    if (this._getModel()._name < joinedModel._getModel()._name) {
        link = this._getModel()._name+"_"+joinedModel._getModel()._name;
    }
    else {
        link = joinedModel._getModel()._name+"_"+this._getModel()._name;
    }
    this._getModel()._joins[fieldDoc] = {
        model: joinedModel,
        fieldDoc: fieldDoc,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasAndBelongsToMany',
        link: link
    }

    query = r.branch(
        r.tableList().contains(link),
        r.branch(
            r.table(link).indexList().contains(self.getName()+'_'+leftKey),
            r.branch(
                r.table(link).indexList().contains(joinedModel.getName()+'_'+rightKey),
                r.table(link).indexWait(self.getName()+'_'+leftKey, joinedModel.getName()+'_'+rightKey),
                r.table(link).indexCreate(joinedModel.getName()+'_'+rightKey).do(function(result) {
                    return r.table(link).indexWait(self.getName()+'_'+leftKey, joinedModel.getName()+'_'+rightKey)
                })
            ),
            r.table(link).indexCreate(self.getName()+'_'+leftKey).do(function() {
                return r.branch(
                    r.table(link).indexList().contains(joinedModel.getName()+'_'+rightKey),
                    r.table(link).indexWait(self.getName()+'_'+leftKey, joinedModel.getName()+'_'+rightKey),
                    r.table(link).indexCreate(joinedModel.getName()+'_'+rightKey).do(function(result) {
                        return r.table(link).indexWait(self.getName()+'_'+leftKey, joinedModel.getName()+'_'+rightKey)
                    })
                )
            })
        ),
        r.tableCreate(link).do(function(result) {
            return r.branch(
                r.table(link).indexList().contains(self.getName()+'_'+leftKey),
                r.branch(
                    r.table(link).indexList().contains(joinedModel.getName()+'_'+rightKey),
                    r.table(link).indexWait(self.getName()+'_'+leftKey, joinedModel.getName()+'_'+rightKey),
                    r.table(link).indexCreate(joinedModel.getName()+'_'+rightKey).do(function(result) {
                        return r.table(link).indexWait(self.getName()+'_'+leftKey, joinedModel.getName()+'_'+rightKey)
                    })
                ),
                r.table(link).indexCreate(self.getName()+'_'+leftKey).do(function() {
                    return r.branch(
                        r.table(link).indexList().contains(joinedModel.getName()+'_'+rightKey),
                        r.table(link).indexWait(self.getName()+'_'+leftKey, joinedModel.getName()+'_'+rightKey),
                        r.table(link).indexCreate(joinedModel.getName()+'_'+rightKey).do(function(result) {
                            return r.table(link).indexWait(self.getName()+'_'+leftKey, joinedModel.getName()+'_'+rightKey)
                        })
                    )
                })
            )
        })
    )


    if (options.init !== false) {
        //TODO Increments indexToCreate?
        model._getModel()._indexesToCreate++;
        joinedModel._getModel()._indexesToCreate++;

        query.run().then(function(result) {
            model._getModel()._wasCreated();
            joinedModel._getModel()._wasCreated();
        }).error(function(error) {
            model._getModel()._error = error;
            joinedModel.getModel()._error = error;
        })
    }

    //TODO create other indexes
}

/*
// Import rethinkdbdash methods
var Term = require('rethinkdbdash')({pool: false}).expr(1).__proto__;
for(var key in Term) {
    if ((Term.hasOwnProperty(key)) && (key !== 'run')) {
        Model.prototype[key] = function() {
            var query = new Query(this);
            query = query[key].apply(query, arguments);
            return query;
        }
    }
}
*/

Model.prototype.run = function() {
    var query = new Query(this);
    return query.run();
}

Model.prototype._parse = function(data) {
    var self = this;
    var p = new Promise(function(resolve, reject) {
        if (data.__proto__.next !== undefined) { // Checking if a cursor
            data.toArray().then(function(result) {
                for(var i=0; i<result.length; i++) {
                    result[i] = new self(result[i])
                }

                try{
                    for(var i=0; i<result.length; i++) {
                        result[i].validate();
                    }
                    resolve(result);
                }
                catch(error) {
                    return reject(error);
                }
            }).error(reject)
        }
        else {
            resolve(data)
        }
    })
    return p;
}


module.exports = Model;


