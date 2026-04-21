import { NextFunction, Request, Response } from 'express'

import { ValidationException } from '../../domain/exceptions'

/**
 * Validates the request body for creating a resource.
 * Ensures `name` is a non-empty string and `description` (if provided) is a string.
 */
export function validateCreateResource(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { name, description } = req.body ?? {}

  if (name === undefined || name === null) {
    return next(new ValidationException('Resource name is required'))
  }
  if (typeof name !== 'string') {
    return next(new ValidationException('Resource name must be a string'))
  }
  if (description !== undefined && typeof description !== 'string') {
    return next(
      new ValidationException('Resource description must be a string')
    )
  }

  next()
}

/**
 * Validates the request body for updating a resource.
 * Ensures `name` and `description` (if provided) are strings.
 */
export function validateUpdateResource(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { name, description } = req.body ?? {}

  if (name !== undefined && typeof name !== 'string') {
    return next(new ValidationException('Resource name must be a string'))
  }
  if (description !== undefined && typeof description !== 'string') {
    return next(
      new ValidationException('Resource description must be a string')
    )
  }

  next()
}
