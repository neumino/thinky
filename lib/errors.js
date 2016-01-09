"use strict";

var util = require('util');
var errors = module.exports = {};

/**
 * The base error that all thinky related errors derive from
 *
 * @constructor
 * @alias Error
 */
errors.ThinkyError = function() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = 'ThinkyError';

  this.message = tmp.message;
  if (Error.captureStackTrace)
    Error.captureStackTrace(this, this.constructor);
};
util.inherits(errors.ThinkyError, Error);

/**
 * Thrown or returned when `get` returns `null`.
 * @extends ThinkyError
 */
errors.DocumentNotFound = function(message) {
  var errorMessage = message || "The query did not find a document and returned null.";
  errors.ThinkyError.call(this, errorMessage);
  this.name = 'DocumentNotFoundError';
};
util.inherits(errors.DocumentNotFound, errors.ThinkyError);

/**
 * Thrown or returned when an in place update/replace returns an invalid document.
 * @extends ThinkyError
 */
errors.InvalidWrite = function(message, raw) {
  errors.ThinkyError.call(this, message);
  this.name = 'InvalidWriteError';
  this.raw = raw;
};
util.inherits(errors.InvalidWrite, errors.ThinkyError);

/**
 * Thrown or returned when validation of a document fails.
 * @extends ThinkyError
 */
errors.ValidationError = function(message) {
  errors.ThinkyError.call(this, message);
  this.name = 'ValidationError';
};
util.inherits(errors.ValidationError, errors.ThinkyError);

/**
 * Thrown or returned when the primary key unique document constraint fails.
 * @extends ThinkyError
 */
errors.DuplicatePrimaryKey = function(message, primaryKey) {
  errors.ThinkyError.call(this, message);
  this.name = 'DuplicatePrimaryKeyError';
  if (primaryKey !== undefined) {
    this.primaryKey = primaryKey;
  }
};
util.inherits(errors.DuplicatePrimaryKey, errors.ThinkyError);

/**
 * regular expressions used to determine which errors should be thrown
 */
errors.DOCUMENT_NOT_FOUND_REGEX = new RegExp('^The query did not find a document and returned null.*');
errors.DUPLICATE_PRIMARY_KEY_REGEX = new RegExp('^Duplicate primary key `(.*)`.*');

/**
 * Creates an appropriate error given either an instance of Error or a message
 * from the RethinkDB driver
 */
errors.create = function(errorOrMessage) {
  var message = (errorOrMessage instanceof Error) ? errorOrMessage.message : errorOrMessage;
  if (message.match(errors.DOCUMENT_NOT_FOUND_REGEX)) {
    return new errors.DocumentNotFound(message);
  } else if (message.match(errors.DUPLICATE_PRIMARY_KEY_REGEX)) {
    var primaryKey = message.match(errors.DUPLICATE_PRIMARY_KEY_REGEX)[1];
    return new errors.DuplicatePrimaryKey(message, primaryKey);
  } else if (errorOrMessage instanceof Error) {
    return errorOrMessage;
  }

  return new errors.ThinkyError(errorOrMessage);
};
