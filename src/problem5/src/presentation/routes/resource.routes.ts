import { NextFunction, Request, Response, Router } from 'express'

import { ResourceController } from '../controllers'
import { validateCreateResource, validateUpdateResource } from '../validators'

/**
 * Wraps an async route handler so rejected promises are forwarded to Express error middleware.
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

/**
 * Creates an Express router for resource CRUD endpoints.
 * @param controller - The resource controller handling requests.
 * @returns Configured Express router.
 */
export function createResourceRouter(controller: ResourceController): Router {
  const router = Router()

  router.post(
    '/',
    validateCreateResource,
    asyncHandler((req, res) => controller.create(req, res))
  )
  router.get(
    '/',
    asyncHandler((req, res) => controller.list(req, res))
  )
  router.get(
    '/:id',
    asyncHandler((req, res) => controller.get(req, res))
  )
  router.put(
    '/:id',
    validateUpdateResource,
    asyncHandler((req, res) => controller.update(req, res))
  )
  router.delete(
    '/:id',
    asyncHandler((req, res) => controller.delete(req, res))
  )

  return router
}
