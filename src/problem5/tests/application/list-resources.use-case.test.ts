import { ListResourcesUseCase } from '../../src/application/use-cases/list-resources.use-case'
import { Resource } from '../../src/domain/entities'
import { ResourceRepository } from '../../src/domain/repositories'

describe('ListResourcesUseCase', () => {
  let repository: jest.Mocked<ResourceRepository>
  let useCase: ListResourcesUseCase

  const mockResources: Resource[] = [
    {
      id: '1',
      name: 'Alpha',
      description: 'First',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: '2',
      name: 'Beta',
      description: 'Second',
      createdAt: '2026-01-02',
      updatedAt: '2026-01-02',
    },
  ]

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
    useCase = new ListResourcesUseCase(repository)
  })

  it('should return all resources when no filter', async () => {
    repository.findAll.mockResolvedValue(mockResources)

    const result = await useCase.execute()

    expect(result).toEqual(mockResources)
    expect(repository.findAll).toHaveBeenCalledWith(undefined)
  })

  it('should pass filter to repository', async () => {
    repository.findAll.mockResolvedValue([mockResources[0]])

    const result = await useCase.execute({ name: 'Alpha' })

    expect(result).toEqual([mockResources[0]])
    expect(repository.findAll).toHaveBeenCalledWith({ name: 'Alpha' })
  })
})
