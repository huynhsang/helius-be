import * as fs from 'fs'
import * as path from 'path'

import { Resource, ResourceFilter } from '../../domain/entities'
import { NotFoundException } from '../../domain/exceptions'
import { ResourceRepository } from '../../domain/repositories'

/** JSON file-based implementation of {@link ResourceRepository}. */
export class JsonResourceRepository implements ResourceRepository {
  private readonly filePath: string
  private mutationQueue: Promise<void> = Promise.resolve()

  /**
   * @param filePath - Path to the JSON data file. Defaults to `data/resource.json` in the working directory.
   */
  constructor(filePath?: string) {
    this.filePath =
      filePath ?? path.join(process.cwd(), 'data', 'resource.json')
  }

  /**
   * Reads all resources from the JSON file.
   * @returns Array of all stored resources.
   */
  private async readAll(): Promise<Resource[]> {
    const data = await fs.promises.readFile(this.filePath, 'utf-8')
    return JSON.parse(data) as Resource[]
  }

  /**
   * Writes the full resource array to the JSON file.
   * @param resources - The complete resource list to persist.
   */
  private async writeAll(resources: Resource[]): Promise<void> {
    await fs.promises.writeFile(
      this.filePath,
      JSON.stringify(resources, null, 2),
      'utf-8'
    )
  }

  /**
   * Serialises write operations through a promise queue to prevent
   * concurrent read-modify-write races on the JSON file.
   */
  private serialise<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.mutationQueue.then(fn)
    this.mutationQueue = result.then(
      () => {},
      () => {}
    )
    return result
  }

  /** {@inheritDoc ResourceRepository.findAll} */
  async findAll(filter?: ResourceFilter): Promise<Resource[]> {
    let resources = await this.readAll()

    if (filter?.name) {
      const term = filter.name.toLowerCase()
      resources = resources.filter((r) => r.name.toLowerCase().includes(term))
    }

    return resources
  }

  /** {@inheritDoc ResourceRepository.findById} */
  async findById(id: string): Promise<Resource | null> {
    const resources = await this.readAll()
    return resources.find((r) => r.id === id) ?? null
  }

  /** {@inheritDoc ResourceRepository.create} */
  async create(resource: Resource): Promise<Resource> {
    return this.serialise(async () => {
      const resources = await this.readAll()
      resources.push(resource)
      await this.writeAll(resources)
      return resource
    })
  }

  /** {@inheritDoc ResourceRepository.update} */
  async update(resource: Resource): Promise<Resource> {
    return this.serialise(async () => {
      const resources = await this.readAll()
      const index = resources.findIndex((r) => r.id === resource.id)
      if (index === -1) {
        throw new NotFoundException('Resource not found')
      }
      resources[index] = resource
      await this.writeAll(resources)
      return resource
    })
  }

  /** {@inheritDoc ResourceRepository.delete} */
  async delete(id: string): Promise<boolean> {
    return this.serialise(async () => {
      const resources = await this.readAll()
      const filtered = resources.filter((r) => r.id !== id)
      if (filtered.length === resources.length) {
        return false
      }
      await this.writeAll(filtered)
      return true
    })
  }
}
