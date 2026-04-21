import { Resource, ResourceFilter } from '../../domain/entities'
import { ResourceRepository } from '../../domain/repositories'

/** Use case for listing resources with optional filtering. */
export class ListResourcesUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  /**
   * Retrieves all resources matching the optional filter.
   * @param filter - Optional filter criteria (e.g. name search).
   * @returns A list of matching resources.
   */
  async execute(filter?: ResourceFilter): Promise<Resource[]> {
    return this.repository.findAll(filter)
  }
}
