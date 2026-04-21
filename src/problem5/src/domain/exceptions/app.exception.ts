import { HttpStatus } from '../../common/constants'
import { ErrorCode } from '../enums'

/**
 * Base application exception.
 * Carries an {@link ErrorCode} and an HTTP status for the presentation layer.
 */
export class AppException extends Error {
  /** Machine-readable error code. */
  readonly errorCode: ErrorCode
  /** Suggested HTTP status code. */
  readonly statusCode: number

  constructor(message: string, errorCode: ErrorCode, statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.errorCode = errorCode
    this.statusCode = statusCode
  }
}

/**
 * Thrown when a requested resource does not exist.
 */
export class NotFoundException extends AppException {
  constructor(message = 'Resource not found') {
    super(message, ErrorCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND)
  }
}

/**
 * Thrown when input validation fails.
 */
export class ValidationException extends AppException {
  constructor(message = 'Validation error') {
    super(message, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST)
  }
}
