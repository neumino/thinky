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

    this._ready = false; // Is the table ready to use?
    this._error = null; // If an error occured, we won't let people save things
    this._onTableReady = []; // {query, resolve, reject}

    this._listeners = [];
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


Model.prototype._setReady = function() {
    this._ready = true;
    for(var i = 0; i<this._onTableReady.length; i++) {
        this._onTableReady[i].query().then(this._onTableReady[i].resolve).error(this._onTableReady[i].reject);
    }
}

Model.prototype.getName = function() {
    return this._name;
}

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
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 *
 * Post.hasOne(Author, "author", "authorId", "id"
 *                                             ^- author.id
 */
Module.prototype.hasOne = function(joinedModel, fieldDoc, leftKey, rightKey) {
    this.joins[fieldName] = {
        model: joinedModel,
        fieldDoc: fieldDoc,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasOne'
    }
}

/*
 * joinedModel: the joined model
 * fieldDoc: the field where the joined document will be kept
 * leftKey: the key in the model used for the join
 * rightKey: the key in the joined model used for the join
 */
Module.prototype.hasMany = function() {
    this.joins[fieldName] = {
        model: joinedModel,
        fieldDoc: fieldDoc,
        leftKey: leftKey,
        rightKey: rightKey,
        type: 'hasMany'
    }
}
Module.prototype.hasAndBelongToMany = function() {
}


module.exports = Model;


