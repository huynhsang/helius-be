import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { createApp } from '../../src/app'
import { createTestClient, TestClient } from '../helpers/test-client'

describe('Resource API (integration)', () => {
  let tmpFile: string
  let client: TestClient

  beforeEach(async () => {
    tmpFile = path.join(os.tmpdir(), `resource-api-test-${Date.now()}.json`)
    fs.writeFileSync(tmpFile, '[]', 'utf-8')
    const app = createApp(tmpFile)
    client = createTestClient(app)
    await client.start()
  })

  afterEach(async () => {
    await client.stop()
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile)
    }
  })

  describe('POST /api/resources', () => {
    it('should create a resource', async () => {
      const res = await client.post('/api/resources', {
        name: 'Widget',
        description: 'A widget',
      })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Widget')
      expect(res.body.description).toBe('A widget')
      expect(res.body.id).toBeDefined()
    })

    it('should return 400 when name is missing', async () => {
      const res = await client.post('/api/resources', {
        description: 'No name',
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Resource name is required')
      expect(res.body.errorCode).toBe('VALIDATION_ERROR')
    })

    it('should return 400 when name is not a string', async () => {
      const res = await client.post('/api/resources', {
        name: 123,
        description: 'bad',
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Resource name must be a string')
      expect(res.body.errorCode).toBe('VALIDATION_ERROR')
    })

    it('should return 400 when description is not a string', async () => {
      const res = await client.post('/api/resources', {
        name: 'Valid',
        description: 42,
      })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Resource description must be a string')
      expect(res.body.errorCode).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/resources', () => {
    it('should list all resources', async () => {
      await client.post('/api/resources', {
        name: 'A',
        description: 'First',
      })
      await client.post('/api/resources', {
        name: 'B',
        description: 'Second',
      })

      const res = await client.get('/api/resources')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
    })

    it('should filter by name', async () => {
      await client.post('/api/resources', {
        name: 'Alpha',
        description: 'First',
      })
      await client.post('/api/resources', {
        name: 'Beta',
        description: 'Second',
      })

      const res = await client.get('/api/resources?name=alpha')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].name).toBe('Alpha')
    })
  })

  describe('GET /api/resources/:id', () => {
    it('should return a resource by id', async () => {
      const created = await client.post('/api/resources', {
        name: 'Widget',
        description: 'desc',
      })
      const id = created.body.id

      const res = await client.get(`/api/resources/${id}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(id)
    })

    it('should return 404 for nonexistent id', async () => {
      const res = await client.get('/api/resources/nonexistent')

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Resource not found')
      expect(res.body.errorCode).toBe('RESOURCE_NOT_FOUND')
    })
  })

  describe('PUT /api/resources/:id', () => {
    it('should update a resource', async () => {
      const created = await client.post('/api/resources', {
        name: 'Old',
        description: 'Old desc',
      })
      const id = created.body.id

      const res = await client.put(`/api/resources/${id}`, {
        name: 'New',
        description: 'New desc',
      })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('New')
      expect(res.body.description).toBe('New desc')
    })

    it('should return 404 for nonexistent id', async () => {
      const res = await client.put('/api/resources/nonexistent', {
        name: 'X',
      })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/resources/:id', () => {
    it('should delete a resource', async () => {
      const created = await client.post('/api/resources', {
        name: 'ToDelete',
        description: 'desc',
      })
      const id = created.body.id

      const res = await client.delete(`/api/resources/${id}`)

      expect(res.status).toBe(204)

      const getRes = await client.get(`/api/resources/${id}`)
      expect(getRes.status).toBe(404)
    })

    it('should return 404 for nonexistent id', async () => {
      const res = await client.delete('/api/resources/nonexistent')

      expect(res.status).toBe(404)
    })
  })

  describe('GET /health', () => {
    it('should return ok', async () => {
      const res = await client.get('/health')

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })
  })
})
