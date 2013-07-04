var eventEmitter = require('events').EventEmitter;

function Document(modelProto, settings) {
    var self = this;
    this.__proto__.__proto__ = modelProto;
    settings = settings || {};
    this.__proto__.settings = {
        saved: settings.saved || false
    }


    /*
    for(key in eventEmitter.prototype) {
        this[key] = eventEmitter.prototype[key];
    }
    */
    /*
    for(key in eventEmitter.prototype) {
        this[key] = function() {
            eventEmitter.prototype[key].call(self, arguments);
        }
    }
    */
    for(key in eventEmitter.prototype) {
        this[key] = eventEmitter.prototype[key].bind(self);
    }
    this.off = this.removeListener; // because `off` is so much more sexy

}

Document.prototype.getDocument = function() {
    return this.__proto__;
}
Document.prototype.getModel = function() {
    return this.__proto__.__proto__.__proto__;
}


Document.prototype.getSettings = function() {
    return this.__proto__.settings;
}

Document.prototype.define = function(name, fn) {
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


var document = module.exports = exports = Document;
