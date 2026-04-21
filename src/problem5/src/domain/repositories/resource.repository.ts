import { Resource, ResourceFilter } from '../entities'

/** Repository interface for resource persistence operations. */
export interface ResourceRepository {
  /**
   * Retrieves all resources, optionally filtered.
   * @param filter - Optional filter criteria.
   * @returns A list of matching resources.
   */
  findAll(filter?: ResourceFilter): Promise<Resource[]>

  /**
   * Finds a single resource by its unique identifier.
   * @param id - The resource UUID.
   * @returns The resource if found, otherwise `null`.
   */
  findById(id: string): Promise<Resource | null>

  /**
   * Persists a new resource.
   * @param resource - The resource entity to create.
   * @returns The created resource.
   */
  create(resource: Resource): Promise<Resource>

  /**
   * Updates an existing resource.
   * @param resource - The resource entity with updated fields.
   * @returns The updated resource.
   */
  update(resource: Resource): Promise<Resource>

  /**
   * Deletes a resource by its unique identifier.
   * @param id - The resource UUID.
   * @returns `true` if the resource was deleted, `false` otherwise.
   */
  delete(id: string): Promise<boolean>
}
