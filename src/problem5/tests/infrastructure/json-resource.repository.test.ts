import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { Resource } from '../../src/domain/entities'
import { NotFoundException } from '../../src/domain/exceptions'
import { JsonResourceRepository } from '../../src/infrastructure/repositories'

describe('JsonResourceRepository', () => {
  let tmpFile: string
  let repository: JsonResourceRepository

  const makeResource = (overrides: Partial<Resource> = {}): Resource => ({
    id: 'test-id',
    name: 'Test',
    description: 'A test resource',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  })

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `resource-test-${Date.now()}.json`)
    fs.writeFileSync(tmpFile, '[]', 'utf-8')
    repository = new JsonResourceRepository(tmpFile)
  })

  afterEach(() => {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile)
    }
  })

  it('should create a resource', async () => {
    const resource = makeResource()
    const result = await repository.create(resource)

    expect(result).toEqual(resource)

    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'))
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe('test-id')
  })

  it('should find all resources', async () => {
    const r1 = makeResource({ id: '1', name: 'Alpha' })
    const r2 = makeResource({ id: '2', name: 'Beta' })
    fs.writeFileSync(tmpFile, JSON.stringify([r1, r2]), 'utf-8')

    const results = await repository.findAll()

    expect(results).toHaveLength(2)
  })

  it('should filter resources by name', async () => {
    const r1 = makeResource({ id: '1', name: 'Alpha' })
    const r2 = makeResource({ id: '2', name: 'Beta' })
    fs.writeFileSync(tmpFile, JSON.stringify([r1, r2]), 'utf-8')

    const results = await repository.findAll({ name: 'alpha' })

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Alpha')
  })

  it('should find a resource by id', async () => {
    const resource = makeResource({ id: 'abc' })
    fs.writeFileSync(tmpFile, JSON.stringify([resource]), 'utf-8')

    const result = await repository.findById('abc')

    expect(result).toEqual(resource)
  })

  it('should return null when resource not found by id', async () => {
    const result = await repository.findById('nonexistent')
    expect(result).toBeNull()
  })

  it('should update a resource', async () => {
    const resource = makeResource({ id: '1' })
    fs.writeFileSync(tmpFile, JSON.stringify([resource]), 'utf-8')

    const updated = { ...resource, name: 'Updated' }
    const result = await repository.update(updated)

    expect(result.name).toBe('Updated')

    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'))
    expect(data[0].name).toBe('Updated')
  })

  it('should throw when updating nonexistent resource', async () => {
    const resource = makeResource({ id: 'nonexistent' })

    await expect(repository.update(resource)).rejects.toThrow(NotFoundException)
  })

  it('should delete a resource', async () => {
    const resource = makeResource({ id: '1' })
    fs.writeFileSync(tmpFile, JSON.stringify([resource]), 'utf-8')

    const result = await repository.delete('1')

    expect(result).toBe(true)

    const data = JSON.parse(fs.readFileSync(tmpFile, 'utf-8'))
    expect(data).toHaveLength(0)
  })

  it('should return false when deleting nonexistent resource', async () => {
    const result = await repository.delete('nonexistent')
    expect(result).toBe(false)
  })
})
