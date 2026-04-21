import { Resource, UpdateResourceInput } from '../../domain/entities'
import { NotFoundException, ValidationException } from '../../domain/exceptions'
import { ResourceRepository } from '../../domain/repositories'

/** Use case for updating an existing resource. */
export class UpdateResourceUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  /**
   * Updates a resource with the provided fields.
   * @param id - The resource UUID to update.
   * @param input - Partial update payload (only provided fields are changed).
   * @returns The updated resource.
   * @throws {NotFoundException} If no resource exists with the given ID.
   * @throws {ValidationException} If the resulting name is empty.
   */
  async execute(id: string, input: UpdateResourceInput): Promise<Resource> {
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw new NotFoundException('Resource not found')
    }

    const updated: Resource = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      description:
        input.description !== undefined
          ? input.description.trim()
          : existing.description,
      updatedAt: new Date().toISOString(),
    }

    if (!updated.name || updated.name.length === 0) {
      throw new ValidationException('Resource name is required')
    }

    return this.repository.update(updated)
  }
}
