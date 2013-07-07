var eventEmitter = require('events').EventEmitter;

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

    this.off = this.removeListener; // because `off` is so much more sexy

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
Document.prototype.replace = function(newDoc) {
    var oldDoc = {}
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            oldDoc[key] = this[key];
            delete this[key];
        }
    }

    for (var key in newDoc) {
        if (newDoc.hasOwnProperty(key)) {
            this[key] = newDoc[key];
        }
    }
    this.emit('change', this, oldDoc);
    return this;
}

Document.prototype.update = function(newDoc) {
    //TODO
}


var document = module.exports = exports = Document;
