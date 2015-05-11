'use strict';

var TypeAny = require('./any.js'),
    TypeArray = require('./array.js'),
    TypeBoolean = require('./boolean.js'),
    TypeBuffer = require('./buffer.js'),
    TypeDate = require('./date.js'),
    TypeNumber = require('./number.js'),
    TypeObject = require('./object.js'),
    TypePoint = require('./point.js'),
    TypeString = require('./string.js'),
    TypeVirtual = require('./virtual.js');


/**
 * Create a new Type that let users create sub-types.
 * @return {Type}
 */
function Type() { }


/**
 * Create a new TypeAny object
 * @return {TypeAny}
 */

Type.prototype.any = function() {
  return new TypeAny();
};


/**
 * Create a new TypeString object.
 * @return {TypeString}
 */
Type.prototype.string = function() {
  return new TypeString();
};


/**
 * Create a new TypeNumber object.
 * @return {TypeNumber}
 */
Type.prototype.number = function() {
  return new TypeNumber();
};


/**
 * Create a new TypeBoolean object.
 * @return {TypeBoolean}
 */
Type.prototype.boolean = function() {
  return new TypeBoolean();
};


/**
 * Create a new TypeDate object.
 * @return {TypeDate}
 */
Type.prototype.date = function() {
  return new TypeDate();
};


/**
 * Create a new TypeBuffer object.
 * @return {TypeBuffer}
 */
Type.prototype.buffer = function() {
  return new TypeBuffer();
};


/**
 * Create a new TypePoint object.
 * @return {TypePoint}
 */
Type.prototype.point = function() {
  return new TypePoint();
};


/**
 * Create a new TypeObject object.
 * @return {TypeObject}
 */
Type.prototype.object = function() {
  return new TypeObject();
};


/**
 * Create a new TypeArray object.
 * @return {TypeArray}
 */
Type.prototype.array = function() {
  return new TypeArray();
};


/**
 * Create a new TypeVirtual object.
 * @return {TypeVirtual}
 */
Type.prototype.virtual = function() {
  return new TypeVirtual();
};


/**
 * Create a new TypeString object to use as an id.
 * @return {TypeString}
 */
Type.prototype.id = function() {
  return new TypeString().optional();
};


/**
 * Check if the first argument is a TypeString object or not
 * @param {Object} obj The object to check against TypeString.
 * @return {boolean}
 */
Type.prototype.isString = function(obj) {
  return obj instanceof TypeString;
};


/**
 * Check if the first argument is a TypeNumber object or not
 * @param {Object} obj The object to check against TypeNumber.
 * @return {boolean}
 */
Type.prototype.isNumber = function(obj) {
  return obj instanceof TypeNumber;
};


/**
 * Check if the first argument is a TypeBoolean object or not
 * @param {Object} obj The object to check against TypeBoolean.
 * @return {boolean}
 */
Type.prototype.isBoolean = function(obj) {
  return obj instanceof TypeBoolean;
};


/**
 * Check if the first argument is a TypeDate object or not
 * @param {Object} obj The object to check against TypeDate.
 * @return {boolean}
 */
Type.prototype.isDate = function(obj) {
  return obj instanceof TypeDate;
};


/**
 * Check if the first argument is a TypeBuffer object or not
 * @param {Object} obj The object to check against TypeBuffer.
 * @return {boolean}
 */
Type.prototype.isBuffer = function(obj) {
  return obj instanceof TypeBuffer;
};


/**
 * Check if the first argument is a TypePoint object or not
 * @param {Object} obj The object to check against TypePoint.
 * @return {boolean}
 */
Type.prototype.isPoint = function(obj) {
  return obj instanceof TypePoint;
};


/**
 * Check if the first argument is a TypeObject object or not
 * @param {Object} obj The object to check against TypeObject.
 * @return {boolean}
 */
Type.prototype.isObject = function(obj) {
  return obj instanceof TypeObject;
};


/**
 * Check if the first argument is a TypeArray object or not
 * @param {Object} obj The object to check against TypeArray.
 * @return {boolean}
 */
Type.prototype.isArray = function(obj) {
  return obj instanceof TypeArray;
};


/**
 * Check if the first argument is a TypeVirtual object or not
 * @param {Object} obj The object to check against TypeVirtual.
 * @return {boolean}
 */
Type.prototype.isVirtual = function(obj) {
  return obj instanceof TypeVirtual;
};


/**
 * Check if the first argument is a TypeAny object or not
 * @param {Object} obj The object to check against TypeAny.
 * @return {boolean}
 */
Type.prototype.isAny = function(obj) {
  return obj instanceof TypeAny;
};


module.exports = new Type();
