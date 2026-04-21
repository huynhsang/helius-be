import { NextFunction, Request, Response } from 'express'

import { ValidationException } from '../../src/domain/exceptions'
import {
  validateCreateResource,
  validateUpdateResource,
} from '../../src/presentation/validators'

function mockReq(body: any): Request {
  return { body } as Request
}

function mockRes(): Response {
  return {} as Response
}

describe('validateCreateResource', () => {
  const res = mockRes()
  let next: jest.Mock

  beforeEach(() => {
    next = jest.fn()
  })

  it('should call next for valid input', () => {
    validateCreateResource(
      mockReq({ name: 'Test', description: 'desc' }),
      res,
      next
    )
    expect(next).toHaveBeenCalledWith()
  })

  it('should call next when description is omitted', () => {
    validateCreateResource(mockReq({ name: 'Test' }), res, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('should call next with ValidationException when name is missing', () => {
    validateCreateResource(mockReq({ description: 'x' }), res, next)
    expect(next).toHaveBeenCalledWith(expect.any(ValidationException))
  })

  it('should call next with ValidationException when name is not a string', () => {
    validateCreateResource(mockReq({ name: 123 }), res, next)
    expect(next).toHaveBeenCalledWith(expect.any(ValidationException))
  })

  it('should call next with ValidationException when description is not a string', () => {
    validateCreateResource(mockReq({ name: 'OK', description: 42 }), res, next)
    expect(next).toHaveBeenCalledWith(expect.any(ValidationException))
  })
})

describe('validateUpdateResource', () => {
  const res = mockRes()
  let next: jest.Mock

  beforeEach(() => {
    next = jest.fn()
  })

  it('should call next for valid input', () => {
    validateUpdateResource(
      mockReq({ name: 'New', description: 'New desc' }),
      res,
      next
    )
    expect(next).toHaveBeenCalledWith()
  })

  it('should call next when body is empty', () => {
    validateUpdateResource(mockReq({}), res, next)
    expect(next).toHaveBeenCalledWith()
  })

  it('should call next with ValidationException when name is not a string', () => {
    validateUpdateResource(mockReq({ name: true }), res, next)
    expect(next).toHaveBeenCalledWith(expect.any(ValidationException))
  })

  it('should call next with ValidationException when description is not a string', () => {
    validateUpdateResource(mockReq({ description: [] }), res, next)
    expect(next).toHaveBeenCalledWith(expect.any(ValidationException))
  })
})
