import { Request, Response } from 'express'

import {
  CreateResourceUseCase,
  DeleteResourceUseCase,
  GetResourceUseCase,
  ListResourcesUseCase,
  UpdateResourceUseCase,
} from '../../application/use-cases'
import { HttpStatus } from '../../common/constants'

/** Express controller handling HTTP requests for resource CRUD operations. */
export class ResourceController {
  constructor(
    private readonly createUseCase: CreateResourceUseCase,
    private readonly listUseCase: ListResourcesUseCase,
    private readonly getUseCase: GetResourceUseCase,
    private readonly updateUseCase: UpdateResourceUseCase,
    private readonly deleteUseCase: DeleteResourceUseCase
  ) {}

  /**
   * Handles POST /api/resources — creates a new resource.
   * @param req - Express request with `name` and `description` in the body.
   * @param res - Express response (201 on success).
   */
  async create(req: Request, res: Response): Promise<void> {
    const { name, description } = req.body
    const resource = await this.createUseCase.execute({ name, description })
    res.status(HttpStatus.CREATED).json(resource)
  }

  /**
   * Handles GET /api/resources — lists resources with optional name filter.
   * @param req - Express request with optional `name` query parameter.
   * @param res - Express response (200 with resource array).
   */
  async list(req: Request, res: Response): Promise<void> {
    const name = typeof req.query.name === 'string' ? req.query.name : undefined
    const resources = await this.listUseCase.execute({ name })
    res.json(resources)
  }

  /**
   * Handles GET /api/resources/:id — retrieves a single resource.
   * @param req - Express request with `id` route parameter.
   * @param res - Express response (200 on success).
   */
  async get(req: Request, res: Response): Promise<void> {
    const resource = await this.getUseCase.execute(req.params.id as string)
    res.json(resource)
  }

  /**
   * Handles PUT /api/resources/:id — updates an existing resource.
   * @param req - Express request with `id` param and update fields in the body.
   * @param res - Express response (200 on success).
   */
  async update(req: Request, res: Response): Promise<void> {
    const { name, description } = req.body
    const resource = await this.updateUseCase.execute(req.params.id as string, {
      name,
      description,
    })
    res.json(resource)
  }

  /**
   * Handles DELETE /api/resources/:id — deletes a resource.
   * @param req - Express request with `id` route parameter.
   * @param res - Express response (204 on success).
   */
  async delete(req: Request, res: Response): Promise<void> {
    await this.deleteUseCase.execute(req.params.id as string)
    res.status(HttpStatus.NO_CONTENT).send()
  }
}
