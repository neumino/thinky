Array.isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
};

Object.isPlainObject = function(obj) {
    return (Object.prototype.toString.call(obj) === '[object Object]');
};

Date.isDate = function(obj) {
    return ((obj instanceof Date) ||
            ((Object.isPlainObject(obj))
            && (obj.$reql_type$ === 'TIME')
            && typeof (obj.epoch_time === 'number')
            && typeof (obj.timezone === 'string')));
};

var utils = module.exports = exports = {}
