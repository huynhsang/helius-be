import { v4 as uuidv4 } from 'uuid'

import { CreateResourceInput, Resource } from '../../domain/entities'
import { ValidationException } from '../../domain/exceptions'
import { ResourceRepository } from '../../domain/repositories'

/** Use case for creating a new resource. */
export class CreateResourceUseCase {
  constructor(private readonly repository: ResourceRepository) {}

  /**
   * Creates a new resource with a generated UUID and timestamps.
   * @param input - The resource creation payload.
   * @returns The newly created resource.
   * @throws {ValidationException} If the name is empty or whitespace-only.
   */
  async execute(input: CreateResourceInput): Promise<Resource> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationException('Resource name is required')
    }

    const now = new Date().toISOString()
    const resource: Resource = {
      id: uuidv4(),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      createdAt: now,
      updatedAt: now,
    }

    return this.repository.create(resource)
  }
}
