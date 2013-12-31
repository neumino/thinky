Array.isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
};
Object.isPlainObject = function(obj) {
    return ((obj != null) && (Object.prototype.toString.call(obj) === '[object Object]'));
}

var utils = module.exports = exports = {}
