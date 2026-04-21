import express from 'express'
import * as http from 'http'

export interface TestResponse {
  status: number
  body: any
}

export interface TestClient {
  start(): Promise<void>
  stop(): Promise<void>
  get(url: string): Promise<TestResponse>
  post(url: string, body: unknown): Promise<TestResponse>
  put(url: string, body: unknown): Promise<TestResponse>
  delete(url: string): Promise<TestResponse>
}

/**
 * Lightweight supertest-like helper that reuses a single server
 * for every request returned by the factory, avoiding the overhead
 * of binding a new port per HTTP call.
 */
export function createTestClient(app: express.Application): TestClient {
  let server: http.Server

  function start(): Promise<void> {
    return new Promise((resolve, reject) => {
      server = http.createServer(app)
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        if (!address || typeof address === 'string') {
          return reject(new Error('Failed to get server address'))
        }
        resolve()
      })
    })
  }

  function stop(): Promise<void> {
    return new Promise((resolve) => {
      if (server) server.close(() => resolve())
      else resolve()
    })
  }

  function makeRequest(
    method: string,
    urlPath: string,
    body?: unknown
  ): Promise<TestResponse> {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : undefined
      const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port: (server.address() as { port: number }).port,
        path: urlPath,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      }

      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          let parsed: any
          try {
            parsed = data ? JSON.parse(data) : null
          } catch {
            parsed = data
          }
          resolve({ status: res.statusCode ?? 500, body: parsed })
        })
      })

      req.on('error', reject)
      if (payload) req.write(payload)
      req.end()
    })
  }

  return {
    start,
    stop,
    get: (url: string) => makeRequest('GET', url),
    post: (url: string, body: unknown) => makeRequest('POST', url, body),
    put: (url: string, body: unknown) => makeRequest('PUT', url, body),
    delete: (url: string) => makeRequest('DELETE', url),
  }
}
