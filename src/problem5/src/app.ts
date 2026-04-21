import express, { Application } from 'express'

import {
  CreateResourceUseCase,
  DeleteResourceUseCase,
  GetResourceUseCase,
  ListResourcesUseCase,
  UpdateResourceUseCase,
} from './application/use-cases'
import { JsonResourceRepository } from './infrastructure/repositories'
import { ResourceController } from './presentation/controllers'
import { errorMiddleware } from './presentation/middlewares'
import { createResourceRouter } from './presentation/routes'

/**
 * Creates and configures the Express application.
 * @param dataFilePath - Optional path to the JSON data file for persistence.
 * @returns Configured Express application.
 */
export function createApp(dataFilePath?: string): Application {
  const app = express()

  app.use(express.json())

  // Infrastructure
  const repository = new JsonResourceRepository(dataFilePath)

  // Use cases
  const createUseCase = new CreateResourceUseCase(repository)
  const listUseCase = new ListResourcesUseCase(repository)
  const getUseCase = new GetResourceUseCase(repository)
  const updateUseCase = new UpdateResourceUseCase(repository)
  const deleteUseCase = new DeleteResourceUseCase(repository)

  // Presentation
  const controller = new ResourceController(
    createUseCase,
    listUseCase,
    getUseCase,
    updateUseCase,
    deleteUseCase
  )
  const resourceRouter = createResourceRouter(controller)

  app.use('/api/resources', resourceRouter)

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // Error handling (must be registered after routes)
  app.use(errorMiddleware)

  return app
}
