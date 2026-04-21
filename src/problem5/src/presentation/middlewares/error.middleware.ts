import { NextFunction, Request, Response } from 'express'

import { HttpStatus } from '../../common/constants'
import { ErrorCode } from '../../domain/enums'
import { AppException } from '../../domain/exceptions'

/**
 * Global Express error-handling middleware.
 * Catches {@link AppException} instances and returns structured JSON errors.
 * Unknown errors are mapped to a 500 Internal Server Error.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppException) {
    res.status(err.statusCode).json({
      errorCode: err.errorCode,
      error: err.message,
    })
    return
  }

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    errorCode: ErrorCode.INTERNAL_ERROR,
    error: 'Internal server error',
  })
}
