import { CreateResourceUseCase } from '../../src/application/use-cases/create-resource.use-case'
import { Resource } from '../../src/domain/entities'
import { ValidationException } from '../../src/domain/exceptions'
import { ResourceRepository } from '../../src/domain/repositories'

describe('CreateResourceUseCase', () => {
  let repository: jest.Mocked<ResourceRepository>
  let useCase: CreateResourceUseCase

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
    useCase = new CreateResourceUseCase(repository)
  })

  it('should create a resource with valid input', async () => {
    repository.create.mockImplementation(async (r: Resource) => r)

    const result = await useCase.execute({
      name: 'Test',
      description: 'A test resource',
    })

    expect(result.id).toBeDefined()
    expect(result.name).toBe('Test')
    expect(result.description).toBe('A test resource')
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()
    expect(repository.create).toHaveBeenCalledTimes(1)
  })

  it('should trim name and description', async () => {
    repository.create.mockImplementation(async (r: Resource) => r)

    const result = await useCase.execute({
      name: '  Trimmed  ',
      description: '  desc  ',
    })

    expect(result.name).toBe('Trimmed')
    expect(result.description).toBe('desc')
  })

  it('should throw ValidationException if name is empty', async () => {
    await expect(
      useCase.execute({ name: '', description: 'desc' })
    ).rejects.toThrow(ValidationException)
    await expect(
      useCase.execute({ name: '', description: 'desc' })
    ).rejects.toThrow('Resource name is required')
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('should throw ValidationException if name is only whitespace', async () => {
    await expect(
      useCase.execute({ name: '   ', description: 'desc' })
    ).rejects.toThrow(ValidationException)
  })
})
