import { NotFoundException } from '../../domain/exceptions'
import { ResourceRepository } from '../../domain/repositories'

/** Use case for deleting a resource. */
export class DeleteResourceUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  /**
   * Deletes a resource by its unique identifier.
   * @param id - The resource UUID to delete.
   * @throws {NotFoundException} If no resource exists with the given ID.
   */
  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Resource not found')
    }
    await this.repository.delete(id)
  }
}
