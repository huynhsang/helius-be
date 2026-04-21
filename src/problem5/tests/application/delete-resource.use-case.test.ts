import { DeleteResourceUseCase } from '../../src/application/use-cases/delete-resource.use-case'
import { Resource } from '../../src/domain/entities'
import { NotFoundException } from '../../src/domain/exceptions'
import { ResourceRepository } from '../../src/domain/repositories'

describe('DeleteResourceUseCase', () => {
  let repository: jest.Mocked<ResourceRepository>
  let useCase: DeleteResourceUseCase

  const existing: Resource = {
    id: '1',
    name: 'Test',
    description: 'A test',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  }

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
    useCase = new DeleteResourceUseCase(repository)
  })

  it('should delete an existing resource', async () => {
    repository.findById.mockResolvedValue(existing)
    repository.delete.mockResolvedValue(true)

    await expect(useCase.execute('1')).resolves.toBeUndefined()
    expect(repository.delete).toHaveBeenCalledWith('1')
  })

  it('should throw NotFoundException if resource not found', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      NotFoundException
    )
    expect(repository.delete).not.toHaveBeenCalled()
  })
})
