var schema =      require(__dirname+'/../schema.js');
var util =        require(__dirname+'/../util.js');
var TypeArray =   require(__dirname+'/array.js');
var TypeBoolean = require(__dirname+'/boolean.js');
var TypeBuffer =  require(__dirname+'/buffer.js');
var TypeDate =    require(__dirname+'/date.js');
var TypeNumber =  require(__dirname+'/number.js');
var TypeObject =  require(__dirname+'/object.js');
var TypePoint =   require(__dirname+'/point.js');
var TypeString =  require(__dirname+'/string.js');
var TypeVirtual = require(__dirname+'/virtual.js');


/**
 * Create a new Type that let users create sub-types.
 * @return {Type}
 */
function Type() {
}

/**
 * Create a new TypeString object.
 * @return {TypeString}
 */
Type.prototype.string = function() {
  return new TypeString();
}
Type.prototype.number = function() {
  return new TypeNumber();
}
Type.prototype.boolean = function() {
  return new TypeBoolean();
}
Type.prototype.date = function() {
  return new TypeDate();
}
Type.prototype.buffer = function() {
  return new TypeBuffer();
}
Type.prototype.point = function() {
  return new TypePoint();
}
Type.prototype.object = function() {
  return new TypeObject();
}
Type.prototype.array = function() {
  return new TypeArray();
}
Type.prototype.virtual = function() {
  return new TypeVirtual();
}


/**
 * Check if the first argument is a TypeString object or not
 * @param {Object} obj The object to check against TypeString.
 * @return {boolean} Whether `obj` is a TypeString or not.
 */
Type.prototype.isString = function(obj) {
  return obj instanceof TypeString;
}
Type.prototype.isNumber = function(obj) {
  return obj instanceof TypeNumber;
}
Type.prototype.isBoolean = function(obj) {
  return obj instanceof TypeBoolean;
}
Type.prototype.isDate = function(obj) {
  return obj instanceof TypeDate;
}
Type.prototype.isBuffer = function(obj) {
  return obj instanceof TypeBuffer;
}
Type.prototype.isPoint = function(obj) {
  return obj instanceof TypePoint;
}
Type.prototype.isObject = function(obj) {
  return obj instanceof TypeObject;
}
Type.prototype.isArray = function(obj) {
  return obj instanceof TypeArray;
}
Type.prototype.isVirtual = function(obj) {
  return obj instanceof TypeVirtual;
}


module.exports = new Type();
