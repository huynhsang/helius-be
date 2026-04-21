import { NextFunction, Request, Response } from 'express'

import { ErrorCode } from '../../src/domain/enums'
import {
  AppException,
  NotFoundException,
  ValidationException,
} from '../../src/domain/exceptions'
import { errorMiddleware } from '../../src/presentation/middlewares'

function mockRes() {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res as Response
}

describe('errorMiddleware', () => {
  const req = {} as Request
  const next = jest.fn() as NextFunction

  it('should handle NotFoundException', () => {
    const res = mockRes()
    const err = new NotFoundException('Not found')

    errorMiddleware(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      errorCode: ErrorCode.RESOURCE_NOT_FOUND,
      error: 'Not found',
    })
  })

  it('should handle ValidationException', () => {
    const res = mockRes()
    const err = new ValidationException('Bad input')

    errorMiddleware(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      errorCode: ErrorCode.VALIDATION_ERROR,
      error: 'Bad input',
    })
  })

  it('should handle unknown errors as 500', () => {
    const res = mockRes()
    const err = new Error('something broke')

    errorMiddleware(err, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      errorCode: ErrorCode.INTERNAL_ERROR,
      error: 'Internal server error',
    })
  })
})
