'use strict';

var util = require('util');

/**
 * The base class for all thinky errors
 *
 * @constructor
 * @alias Error
 */
function ThinkyError(message) {
  this.name = 'ThinkyError';
  this.message = message || 'ThinkyError';
  Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
};
util.inherits(ThinkyError, Error);

/**
 * DocumentNotFound error which is returned when `get` returns `null`.
 * "Extends" Error
 */
function DocumentNotFound(message) {
  ThinkyError.call(this, message);
  this.name = "DocumentNotFound";
  this.message = message || "The query did not find a document and returned null.";
};
util.inherits(DocumentNotFound, ThinkyError);

/**
 * InvalidWrite error which is returned when an inplace update/replace return
 * anon valid document.
 * "Extends" Error
 */
function InvalidWriteError(message, raw) {
  ThinkyError.call(this, message);
  this.name = "InvalidWriteError";
  this.raw = raw;
};
util.inherits(InvalidWriteError, ThinkyError);

/**
 * ValidationError error which is returned when validation of a document fails.
 * "Extends" Error
 */
function ValidationError(message, errors) {
  ThinkyError.call(this, message || 'Validation Error');
  this.name = "ValidationError";
  this.errors = errors || [];
};
util.inherits(ValidationError, ThinkyError);

/**
 * Validation Error Item
 * Instances of this class are included in the `ValidationError.errors` property.
 *
 * @param {string} field    The field that triggered the validation error
 * @param {string} value    The value that generated the error
 * @param {string} message  An error message
 * @constructor
 */
function ValidationErrorItem(field, value, message) {
  this.field = field || null;
  this.value = value || null;
  this.message = message || '';
};

module.exports = {
  ThinkyError: ThinkyError,
  DocumentNotFound: DocumentNotFound,
  InvalidWriteError: InvalidWriteError,
  ValidationError: ValidationError,
  ValidationErrorItem: ValidationErrorItem
};
