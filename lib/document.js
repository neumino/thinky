var eventEmitter = require('events').EventEmitter;
var r = require('rethinkdb');

function Document(modelProto, settings) {
    var self = this;
    //this.__proto__.__proto__ = modelProto;
    this.__proto__.model = modelProto;
    settings = settings || {};
    this.__proto__.docSettings = {
        saved: settings.saved || false
    }

    for(key in eventEmitter.prototype) {
        this[key] = eventEmitter.prototype[key].bind(self);
    }
    for(key in modelProto) {
        if (this[key] == null) {
            this[key] = modelProto[key];
        }
    }


    var listeners = modelProto._listeners;
    for(var eventKey in listeners){
        for(var i in listeners[eventKey]) {
            if (typeof listeners[eventKey][i] === 'function') {
                this.addListener(eventKey, listeners[eventKey][i]);
            }
            else if (listeners[eventKey][i].once === true) {
                this.once(eventKey, listeners[eventKey][i].listener);
            }
        }
    }
}

Document.prototype.getDocument = function() {
    return this.__proto__;
}
Document.prototype.getModel = function() {
    return this.__proto__.__proto__.model;
}

Document.prototype.getDocSettings = function() {
    return this.__proto__.docSettings;
}

Document.prototype.definePrivate = function(name, fn) {
    this.__proto__[name] = fn;
}

// In place update
Document.prototype.merge = function(newDoc, replace) {
    replace = replace || false;

    var docCopy = {}; // Contains the checked newDoc
    if (replace === true) {
        this.createBasedOnSchema(docCopy, newDoc, newDoc, this.getModel().settings.enforce);
    }
    else {
        newFullDoc = {}
        for (var key in this) {
            if (this.hasOwnProperty(key)) {
                newFullDoc[key] = this[key];
            }
        }
        for (var key in newDoc) {
            if (newDoc.hasOwnProperty(key)) {
                newFullDoc[key] = newDoc[key];
            }
        }
        this.createBasedOnSchema(docCopy, newFullDoc, newFullDoc, this.getModel().settings.enforce);
    }

    var oldDoc = {}
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            oldDoc[key] = this[key];
            delete this[key];
        }
    }

    for (var key in docCopy) {
        if (docCopy.hasOwnProperty(key)) {
            this[key] = docCopy[key];
        }
    }
    this.emit('change', this, oldDoc);
    return this;
}

Document.prototype.save = function(callback) {
    //TODO Implement replace
    var self = this; // The document
    var model = this.getModel();

    var docSettings = self.getDocSettings();
    var query;
    if (docSettings.saved === true) {
        query = r.db(model.thinkyOptions.db).table(model.name)
            .get(self[model.getPrimaryKey()])
            .update(r.expr(self), {returnVals: true})
    }
    else {
        query = r.db(model.thinkyOptions.db).table(model.name)
                .insert(r.expr(self), {returnVals: true})
    }
    callbackArg = function(error, result) {
        if (error) {
            if ((callback) && (typeof callback === 'function')) callback(error, null);;
        }
        else if ((result) && (result.errors > 0)) {
            if ((callback) && (typeof callback === 'function')) callback(result, null);
        }
        else {
            self.merge(result.new_val, true);
            if (docSettings.saved !== true) {
                self.getDocSettings().saved = true;
            }
            if ((callback) && (typeof callback === 'function')) callback(null, self);

            self.emit('save', self, result.old_val);
        }
    }

    this.execute.call(self, query, callbackArg);
    return this;
};

Document.prototype.off = function(eventKey, listener) {
    if (arguments.length <= 1) {
        this.removeAllListeners(eventKey);
    }
    else {
        this.removeListener(eventKey, listener);
    }
}


var document = module.exports = exports = Document;
