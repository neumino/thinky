var util = require(__dirname+'/util.js');
var Document = require(__dirname+'/document.js');

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

Model.new = function(name, schema, options, thinky) {

    var proto = new Model(name, schema, options, thinky);

    var model = function (doc, options) {
        if (!util.isPlainObject(doc)) {
            //TODO Improve this error message
            throw new Error("To create a new instance, you must pass an object")
        }
        doc.__proto__ = new Document(proto, options);
        doc.__proto__._generateDefault.apply(doc)

        return doc;
    }

    model.__proto__ = proto;
    return model
}


Model.prototype._addIndex = function() {
    model._getModel()._indexesToCreate++;
}
Model.prototype._indexWasCreated = function() {
    console.log('index created');
    model._getModel()._indexesToCreate--;
    if (model._getModel()._indexesToCreate <= 0) {
        this._getModel()._tableReady = true;
        for(var i = 0; i<this._onTableReady.length; i++) {
            this._onTableReady[i][query].run().then(this._onTableReady[i].resolve).error(this._onTableReady[i].reject);
        }
    }

}

Model.prototype._tableWasCreated = function() {
    console.log('table created');
    var self = this;

    model._getModel()._tableCreated = true
    if (model._getModel()._indexesToCreate > 0) {
        // Create indexes
        for(var i = 0; i<self._onTableCreated.length; i++) {
            self._onTableCreated[i].run().then(function(result) {
                console.log('-----');
                console.log(result);
                self._indexWasCreated();
            }).error(function(error) {
                console.log(error);
                self._error = error;
            });
        }
    }
    else if (model._getModel()._indexesToCreate === 0) {
        // Will trigger the queries waiting
        console.log('no index for '+self.getName())
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



/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * Post.hasOne(Author, "author", "authorId", "id"
 *                                             ^- author.id
 */
Model.prototype.hasOne = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    //TODO nested fields?
    var self  = this;

    if ((joinedModel instanceof Model) === false) {
        throw new Error("First argument of `hasOne` must be a Model")
    }

    //TODO Sanitize
    self._getModel()._joins[joinedModel.getName()] = {
        model: joinedModel,
        fieldDoc: fieldDoc,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasOne'
    }

    options = options || {};
    if (options.noIndex !== true) {
        var tableName = joinedModel.getName();
        var r = self._getModel()._thinky.r;

        if (model._getModel()._tableCreated === true) {
            console.log('direct');
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
            console.log('push');
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
 * Author.hasMany(Post, "posts", "id", "authorId"
 *                                 ^- author.id
 */
Model.prototype.hasMany = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
    this._getModel()._joins[joinedModel._getModel()._name] = {
        model: joinedModel,
        fieldDoc: fieldDoc,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasMany'
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
 * A hasAndBelongsToMany is symmetric and the symmetrical relation is automatically created
 *
 * It automatically creates a table <modelName>_<otherModelName> or <otherModelName>_<modelName> (alphabetic order)
 */
Model.prototype.hasAndBelongsToMany = function(joinedModel, fieldDoc, leftKey, rightKey, options) {
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
}


module.exports = Model;


