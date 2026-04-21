import { HttpStatus } from '../../src/common/constants'
import { ErrorCode } from '../../src/domain/enums'
import {
  AppException,
  NotFoundException,
  ValidationException,
} from '../../src/domain/exceptions'

describe('AppException', () => {
  it('should create an exception with message, errorCode and statusCode', () => {
    const ex = new AppException('test', ErrorCode.INTERNAL_ERROR, 500)

    expect(ex.message).toBe('test')
    expect(ex.errorCode).toBe(ErrorCode.INTERNAL_ERROR)
    expect(ex.statusCode).toBe(500)
    expect(ex.name).toBe('AppException')
    expect(ex).toBeInstanceOf(Error)
  })
})

describe('NotFoundException', () => {
  it('should have correct defaults', () => {
    const ex = new NotFoundException()

    expect(ex.message).toBe('Resource not found')
    expect(ex.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND)
    expect(ex.statusCode).toBe(HttpStatus.NOT_FOUND)
    expect(ex.name).toBe('NotFoundException')
  })

  it('should accept a custom message', () => {
    const ex = new NotFoundException('User not found')
    expect(ex.message).toBe('User not found')
  })
})

describe('ValidationException', () => {
  it('should have correct defaults', () => {
    const ex = new ValidationException()

    expect(ex.message).toBe('Validation error')
    expect(ex.errorCode).toBe(ErrorCode.VALIDATION_ERROR)
    expect(ex.statusCode).toBe(HttpStatus.BAD_REQUEST)
    expect(ex.name).toBe('ValidationException')
  })

  it('should accept a custom message', () => {
    const ex = new ValidationException('Name is required')
    expect(ex.message).toBe('Name is required')
  })
})
