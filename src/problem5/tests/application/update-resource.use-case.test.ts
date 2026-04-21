import { UpdateResourceUseCase } from '../../src/application/use-cases/update-resource.use-case'
import { Resource } from '../../src/domain/entities'
import {
  NotFoundException,
  ValidationException,
} from '../../src/domain/exceptions'
import { ResourceRepository } from '../../src/domain/repositories'

describe('UpdateResourceUseCase', () => {
  let repository: jest.Mocked<ResourceRepository>
  let useCase: UpdateResourceUseCase

  const existing: Resource = {
    id: '1',
    name: 'Original',
    description: 'Original desc',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
    useCase = new UpdateResourceUseCase(repository)
  })

  it('should update name and description', async () => {
    repository.findById.mockResolvedValue(existing)
    repository.update.mockImplementation(async (r: Resource) => r)

    const result = await useCase.execute('1', {
      name: 'Updated',
      description: 'New desc',
    })

    expect(result.name).toBe('Updated')
    expect(result.description).toBe('New desc')
    expect(result.updatedAt).not.toBe(existing.updatedAt)
    expect(repository.update).toHaveBeenCalledTimes(1)
  })

  it('should update only name when description not provided', async () => {
    repository.findById.mockResolvedValue(existing)
    repository.update.mockImplementation(async (r: Resource) => r)

    const result = await useCase.execute('1', { name: 'Updated' })

    expect(result.name).toBe('Updated')
    expect(result.description).toBe('Original desc')
  })

  it('should throw NotFoundException if resource not found', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(useCase.execute('nonexistent', { name: 'X' })).rejects.toThrow(
      NotFoundException
    )
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('should throw ValidationException if updated name is empty', async () => {
    repository.findById.mockResolvedValue(existing)

    await expect(useCase.execute('1', { name: '' })).rejects.toThrow(
      ValidationException
    )
    expect(repository.update).not.toHaveBeenCalled()
  })
})
