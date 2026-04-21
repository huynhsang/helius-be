import { Resource } from '../../domain/entities'
import { NotFoundException } from '../../domain/exceptions'
import { ResourceRepository } from '../../domain/repositories'

/** Use case for retrieving a single resource by ID. */
export class GetResourceUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  /**
   * Fetches a resource by its unique identifier.
   * @param id - The resource UUID.
   * @returns The found resource.
   * @throws {NotFoundException} If no resource exists with the given ID.
   */
  async execute(id: string): Promise<Resource> {
    const resource = await this.repository.findById(id)
    if (!resource) {
      throw new NotFoundException('Resource not found')
    }
    return resource
  }
}
