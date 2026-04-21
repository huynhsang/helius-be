# Scoreboard Module — Technical Specification

## 1. Overview

A standalone real-time scoreboard backend built with **NestJS**, **PostgreSQL**, and **TypeScript**. It maintains and broadcasts the top 10 user scores. Users earn points by completing actions; the scoreboard updates live across all connected clients via Server-Sent Events (SSE).

The project follows **Clean Architecture** principles with clear separation between domain logic, application use-cases, infrastructure, and presentation layers.

### Tech Stack

| Layer             | Technology                        |
| ----------------- | --------------------------------- |
| Framework         | NestJS 10+                        |
| Language          | TypeScript 5+                     |
| Database          | PostgreSQL 16                     |
| ORM               | Prisma                            |
| Cache / Realtime  | Redis (sorted sets, pub/sub)      |
| Auth              | JWT (Passport.js + `@nestjs/jwt`) |
| Containerization  | Docker + Docker Compose           |
| CI/CD             | GitHub Actions                    |
| API Documentation | Swagger (`@nestjs/swagger`)       |
| Testing           | Jest + Supertest                  |
| Runtime           | Node.js 20 LTS                    |

---

## 2. Requirements

### 2.1 Functional Requirements

| ID   | Requirement                                                                  |
| ---- | ---------------------------------------------------------------------------- |
| FR-1 | Display a leaderboard of the top 10 users by score                           |
| FR-2 | Live-update the leaderboard on all connected clients when scores change      |
| FR-3 | Accept score update requests from authenticated users upon action completion |
| FR-4 | Persist scores durably in the database                                       |

### 2.2 Non-Functional Requirements

| ID    | Requirement                                                           |
| ----- | --------------------------------------------------------------------- |
| NFR-1 | Score updates must be authenticated via JWT                           |
| NFR-2 | The system must prevent unauthorized or fraudulent score manipulation |
| NFR-3 | Leaderboard reads must respond in < 50 ms (served from cache)         |
| NFR-4 | The system must handle concurrent score updates without data loss     |
| NFR-5 | The application must be containerized and deployable via Docker       |
| NFR-6 | CI/CD pipeline must run lint, test, build, and deploy stages          |

### 2.3 Out of Scope

- Definition of what "actions" are — the module only receives a score-update signal.
- User registration UI or profile management frontend.
- Historical score tracking or analytics dashboards.
- Pagination beyond the top 10 (future enhancement).

### 2.4 Assumptions

- Each authenticated user has a unique `userId` available from the JWT payload.
- Score increments are always positive integers (a completed action adds points, never subtracts).
- The action-completion signal is dispatched by a trusted client-side flow.
- A simple user registration/login endpoint is included for self-contained operation.

---

## 3. Project Structure (Clean Architecture)

```
scoreboard-api/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Lint + Test + Build
│       └── deploy.yml                      # Build image + Push + Deploy
├── docker/
│   ├── Dockerfile                          # Multi-stage production build
│   └── docker-compose.yml                  # Local dev (app + postgres + redis)
├── prisma/
│   ├── schema.prisma                       # Database schema
│   └── migrations/                         # Generated migrations
├── src/
│   ├── main.ts                             # Bootstrap (NestFactory)
│   ├── app.module.ts                       # Root module
│   │
│   ├── config/                             # Configuration
│   │   ├── app.config.ts                   # Env-based config (validated)
│   │   └── config.module.ts                # ConfigModule setup
│   │
│   ├── domain/                             # ── Domain Layer (pure logic, no deps) ──
│   │   ├── entities/
│   │   │   ├── user.entity.ts              # User domain entity
│   │   │   └── score.entity.ts             # Score domain entity
│   │   ├── repositories/
│   │   │   ├── user.repository.ts          # Abstract repository interface
│   │   │   └── score.repository.ts         # Abstract repository interface
│   │   └── exceptions/
│   │       ├── duplicate-action.exception.ts
│   │       └── rate-limit-exceeded.exception.ts
│   │
│   ├── application/                        # ── Application Layer (use-cases) ──
│   │   ├── use-cases/
│   │   │   ├── update-score.use-case.ts    # Orchestrates score update
│   │   │   ├── get-leaderboard.use-case.ts # Reads leaderboard
│   │   │   ├── get-own-score.use-case.ts   # User's own score + rank
│   │   │   ├── register-user.use-case.ts   # User registration
│   │   │   └── login-user.use-case.ts      # User login
│   │   ├── dtos/
│   │   │   ├── update-score.dto.ts         # Input DTO
│   │   │   ├── leaderboard-entry.dto.ts    # Output DTO
│   │   │   └── auth.dto.ts                 # Login/register DTOs
│   │   └── ports/
│   │       ├── cache.port.ts               # Cache abstraction
│   │       └── event-emitter.port.ts       # Event broadcast abstraction
│   │
│   ├── infrastructure/                     # ── Infrastructure Layer (adapters) ──
│   │   ├── database/
│   │   │   ├── prisma.module.ts            # Prisma client provider
│   │   │   ├── prisma.service.ts           # Prisma lifecycle management
│   │   │   ├── repositories/
│   │   │   │   ├── prisma-user.repository.ts   # Implements IUserRepository
│   │   │   │   └── prisma-score.repository.ts  # Implements IScoreRepository
│   │   │   └── mappers/
│   │   │       ├── user.mapper.ts          # DB record ↔ Domain entity
│   │   │       └── score.mapper.ts         # DB record ↔ Domain entity
│   │   ├── cache/
│   │   │   ├── redis.module.ts             # Redis client provider
│   │   │   ├── redis-cache.adapter.ts      # Implements CachePort
│   │   │   ├── redis-leaderboard.service.ts # Sorted set operations
│   │   │   └── redis-rate-limiter.service.ts # Sliding window rate limiter
│   │   └── auth/
│   │       ├── auth.module.ts              # JWT + Passport setup
│   │       ├── jwt.strategy.ts             # Passport JWT strategy
│   │       ├── jwt-auth.guard.ts           # Route guard
│   │       └── auth.service.ts             # Sign/verify tokens, hash passwords
│   │
│   └── presentation/                       # ── Presentation Layer (controllers) ──
│       ├── controllers/
│       │   ├── score.controller.ts         # POST /scores, GET /scores/top
│       │   ├── score-stream.controller.ts  # GET /scores/stream (SSE)
│       │   └── auth.controller.ts          # POST /auth/register, POST /auth/login
│       ├── filters/
│       │   └── http-exception.filter.ts    # Global exception filter
│       ├── interceptors/
│       │   └── response-transform.interceptor.ts
│       └── guards/
│           └── throttle.guard.ts           # Rate-limit guard (wraps Redis limiter)
│
├── test/
│   ├── unit/
│   │   ├── application/
│   │   │   ├── update-score.use-case.spec.ts
│   │   │   └── get-leaderboard.use-case.spec.ts
│   │   └── infrastructure/
│   │       ├── redis-leaderboard.service.spec.ts
│   │       └── redis-rate-limiter.service.spec.ts
│   ├── integration/
│   │   ├── score.controller.spec.ts
│   │   └── auth.controller.spec.ts
│   └── e2e/
│       └── app.e2e-spec.ts
│
├── .env.example                            # Environment variable template
├── .eslintrc.js                            # ESLint config
├── .prettierrc                             # Prettier config
├── jest.config.ts                          # Jest config
├── tsconfig.json                           # TypeScript config
├── tsconfig.build.json                     # Build-only TS config
├── package.json
├── nest-cli.json
└── README.md                               # Developer setup guide
```

### Clean Architecture Dependency Rule

```
Presentation → Application → Domain
                   ↑
Infrastructure ────┘
```

- **Domain** has zero imports from other layers.
- **Application** depends only on Domain (entities, repository interfaces).
- **Infrastructure** implements Domain interfaces (Prisma repositories, Redis cache).
- **Presentation** calls Application use-cases only; never accesses infrastructure directly.
- NestJS DI binds infrastructure implementations to domain interfaces at module level.

---

## 4. Technical Approach

### 4.1 Architecture Components

![Component Architecture (Clean Architecture)](./diagram/flow-diagram-4.svg)

| Component                        | Responsibility                                         |
| -------------------------------- | ------------------------------------------------------ |
| **ScoreController**              | REST endpoints — score update, leaderboard read        |
| **ScoreStreamController**        | SSE endpoint — pushes leaderboard changes to clients   |
| **UpdateScoreUseCase**           | Validates, updates score, triggers leaderboard refresh |
| **GetLeaderboardUseCase**        | Reads top 10 from cache or DB                          |
| **GetOwnScoreUseCase**           | Reads a single user's score and rank                   |
| **IScoreRepository** (interface) | Abstract score persistence contract                    |
| **PrismaScoreRepository**        | Concrete PostgreSQL implementation via Prisma          |
| **RedisLeaderboardService**      | Redis sorted set: `ZINCRBY` / `ZREVRANGE`              |
| **RedisRateLimiterService**      | Sliding window rate limiter per user                   |
| **AuthService**                  | JWT signing, password hashing, token verification      |
| **ConnectionManagerService**     | Manages active SSE connections + broadcasts via RxJS   |

### 4.2 Why Server-Sent Events (SSE) over WebSocket

| Factor         | SSE                                                  | WebSocket                               |
| -------------- | ---------------------------------------------------- | --------------------------------------- |
| Direction      | Server → Client (sufficient for leaderboard push)    | Bidirectional (unnecessary here)        |
| Protocol       | Standard HTTP — NestJS has native `@Sse()` decorator | Requires `@nestjs/websockets` + gateway |
| Infrastructure | Compatible with standard ALB/Nginx                   | May need sticky sessions                |
| Reconnection   | Built-in automatic reconnect via `EventSource` API   | Must implement manually                 |
| Complexity     | Minimal                                              | Higher — socket lifecycle management    |

SSE is recommended. The leaderboard is a **read-only broadcast**; clients use the REST endpoint for score updates.

> **Important: `EventSource` API Limitation**
>
> The browser-native `EventSource` API does **not** support custom HTTP headers (including `Authorization`). The standard approach of passing a JWT via the `Authorization` header will not work for SSE connections initiated from browsers.
>
> **Recommended workaround — query parameter token:**
> ```
> GET /scores/stream?token=<JWT>
> ```
> The `JwtAuthGuard` must be extended to extract the token from the `token` query parameter when the `Authorization` header is absent. Alternatively, the frontend can use the [`@microsoft/fetch-event-source`](https://github.com/Azure/fetch-event-source) library, which supports custom headers via the Fetch API.
>
> **Security note:** When using query parameter tokens, ensure that:
> - Server access logs do not capture the full URL (or redact the token parameter).
> - Token TTL remains short (as already specified: 1 hour).
> - The query parameter approach is restricted to the SSE endpoint only.

### 4.3 Data Model

#### Prisma Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(uuid())
  displayName  String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  score Score?
}

model Score {
  id        String   @id @default(uuid())
  userId    String   @unique
  score     Int      @default(0)
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([score(sort: Desc)])
}
```

#### Redis Data Structures

| Key                             | Type             | Purpose                                                   |
| ------------------------------- | ---------------- | --------------------------------------------------------- |
| `scoreboard:top`                | Sorted Set       | Leaderboard — members are `userId`, scores are cumulative |
| `scoreboard:ratelimit:{userId}` | String (counter) | Sliding window rate limit, TTL 60s                        |
| `scoreboard:action:{actionId}`  | String           | Idempotency key, TTL 1 hour                               |
| `scoreboard:events`             | Pub/Sub channel  | Broadcast leaderboard updates across instances            |

### 4.4 API Endpoints

#### `POST /auth/register` — Register User

```
Body:     { "displayName": "string", "email": "string", "password": "string" }
Response: { "id": "string", "displayName": "string", "email": "string" }
Status:   201 Created
```

#### `POST /auth/login` — Login

```
Body:     { "email": "string", "password": "string" }
Response: { "accessToken": "string" }
Status:   200 OK
```

#### `POST /scores` — Update Score (Authenticated)

```
Headers:  Authorization: Bearer <JWT>
Body:     { "actionId": "uuid", "action"?: "string" }
Response: { "userId": "string", "score": number, "rank": number }
Status:   200 OK
```

**Validation rules:**

- JWT must be valid and not expired.
- `actionId`: UUID v4 (idempotency key generated by client — **required**).
- `action`: optional string (opaque identifier for audit logging). Not required per specification since the module does not define what actions are.
- Rate-limited: max **10 requests per minute** per user (configurable).

#### `GET /scores/top` — Get Leaderboard (Public)

```
Response: {
  "leaderboard": [
    { "userId": "string", "displayName": "string", "score": number, "rank": number }
  ],
  "updatedAt": "ISO-8601"
}
Status: 200 OK
```

**Public endpoint — no authentication required.** Served from Redis cache. Falls back to PostgreSQL if cache is cold.

#### `GET /scores/stream` — SSE Leaderboard Stream (Authenticated)

```
Option A (header):  Authorization: Bearer <JWT>
Option B (query):   GET /scores/stream?token=<JWT>
Accept:             text/event-stream
Response:           Content-Type: text/event-stream

event: leaderboard
data: { "leaderboard": [...], "updatedAt": "..." }
```

> **Note:** Browser `EventSource` does not support custom headers. Use Option B (query param) for browser clients, or use `@microsoft/fetch-event-source` for Option A. See Section 4.2 for details.

**Connection behavior:**

- Server sends current leaderboard snapshot immediately on connection.
- Subsequent events are pushed only when the top 10 changes.
- Heartbeat comment (`: ping`) every 30 seconds to keep the connection alive.
- Max connection duration: 5 minutes (client should auto-reconnect).
- Max 1 SSE connection per user — new connections replace the previous one.

#### `GET /scores/me` — Get Own Score (Authenticated)

```
Headers:  Authorization: Bearer <JWT>
Response: { "userId": "string", "displayName": "string", "score": number, "rank": number }
Status:   200 OK
```

Returns the authenticated user's current score and overall rank. Useful for users not in the top 10.

#### Error Response Format

All error responses follow a consistent shape:

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired JWT token"
}
```

| Status | Condition                                     |
| ------ | --------------------------------------------- |
| 400    | Invalid request body (validation failed)      |
| 401    | Missing or invalid JWT token                  |
| 409    | Duplicate `actionId` (idempotency violation)  |
| 429    | Rate limit exceeded (>10 updates per minute)  |
| 500    | Internal server error                         |

---

## 5. Execution Flow

> Mermaid source for all diagrams: [flow-diagram.md](./flow-diagram.md)

### 5.1 Score Update Flow (Happy Path)

![Score Update Flow](./diagram/flow-diagram-1.svg)

1. User completes an action on the frontend.
2. Client dispatches `POST /scores` with JWT and action identifier.
3. `JwtAuthGuard` validates the JWT → extracts `userId` from payload.
4. `ThrottleGuard` checks per-user rate limit via `RedisRateLimiterService`.
5. `ScoreController` delegates to `UpdateScoreUseCase.execute(userId, actionId)`.
6. Use-case checks idempotency: `SETNX scoreboard:action:{actionId}` in Redis.
7. Use-case calls `IScoreRepository.upsertAndIncrement(userId, +1)` → atomic Prisma upsert.
8. Use-case calls `RedisLeaderboardService.incrementScore(userId, +1)` → `ZINCRBY`.
9. Use-case fetches updated top 10 via `ZREVRANGE scoreboard:top 0 9 WITHSCORES`.
10. Use-case compares updated top 10 with the previous snapshot. **If the top 10 changed** (new entry, order shift, or score change within the top 10), publishes to Redis Pub/Sub channel `scoreboard:events`. If unchanged, the broadcast is skipped to avoid unnecessary SSE traffic.
11. All server instances receive the event and push to their local SSE connections.
12. Controller returns the user's updated score and rank.

### 5.2 Leaderboard Read Flow

![Leaderboard Read Flow](./diagram/flow-diagram-2.svg)

1. Client calls `GET /scores/top`.
2. `GetLeaderboardUseCase` reads from Redis sorted set (`ZREVRANGE`).
3. If cache is empty (cold start), query PostgreSQL `ORDER BY score DESC LIMIT 10`.
4. Hydrate user display names from User table (cacheable).
5. Return leaderboard response.

### 5.3 SSE Connection Flow

![SSE Connection Lifecycle](./diagram/flow-diagram-3.svg)

1. Client opens `GET /scores/stream` with JWT (via `Authorization` header or `?token=<JWT>` query parameter — see Section 4.2 for browser `EventSource` limitations).
2. `JwtAuthGuard` validates the token (extracted from header or query param).
3. NestJS `@Sse()` endpoint returns an `Observable<MessageEvent>`.
4. `ConnectionManagerService` registers the client and subscribes to Redis Pub/Sub.
5. On leaderboard change, the Pub/Sub listener emits to all local `Observable` subscribers.
6. Heartbeat comment (`:` ping) sent every 30 seconds.
7. On client disconnect, the subscription is cleaned up automatically (RxJS teardown).

---

## 6. Security Design

### 6.1 Authentication

- All score-mutating endpoints and the SSE stream are protected with `@UseGuards(JwtAuthGuard)`.
- The leaderboard read endpoint (`GET /scores/top`) is **public** — no authentication required.
- JWT is issued at login, verified via Passport.js JWT strategy.
- The `userId` for score updates is **extracted from the JWT payload** — never from the request body.
- Passwords are hashed with `bcrypt` (cost factor 12).
- JWT secret loaded from environment variable `JWT_SECRET`.
- Token expiry: 1 hour (configurable via `JWT_EXPIRES_IN`).
- **SSE endpoint authentication:** The `JwtAuthGuard` must support extracting tokens from the `token` query parameter as a fallback, since the browser `EventSource` API does not support custom headers. This fallback should only apply to the SSE endpoint.

### 6.2 Anti-Fraud Measures

![Anti-Fraud Decision Flow](./diagram/flow-diagram-5.svg)

| Threat                                    | Mitigation                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Replay attacks                            | **Idempotency key:** Each action generates a unique `actionId` (UUID v4). Server stores it in Redis with 1-hour TTL. Duplicates return 409 Conflict. |
| Brute-force score inflation               | **Rate limiting:** Max 10 updates per user per minute via Redis sliding window. Returns 429 Too Many Requests.                                       |
| Token theft                               | Short-lived JWT (1h). Refresh token rotation recommended as enhancement.                                                                             |
| Direct API call without completing action | **Server-side action validation (recommended enhancement):** See Section 11.1.                                                                       |
| Score tampering (custom increment)        | Score increment is a **fixed server-side constant** (+1). Client cannot control the increment.                                                       |
| Updating another user's score             | `userId` is derived from JWT, not the request body.                                                                                                  |

### 6.3 Infrastructure Security

- Helmet middleware for security headers.
- CORS configured with explicit allowed origins.
- Input validation via `class-validator` decorators on all DTOs.
- Rate limiting at guard level (not bypassable by route config).
- Database credentials via environment variables, never hardcoded.

---

## 7. Docker & Deployment

### 7.1 Dockerfile (Multi-Stage)

```dockerfile
# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 7.2 Docker Compose (Local Development)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://scoreboard:scoreboard@postgres:5432/scoreboard
      REDIS_URL: redis://redis:6379
      JWT_SECRET: local-dev-secret-change-in-production
      JWT_EXPIRES_IN: 3600
      SCORE_INCREMENT: 1
      RATE_LIMIT_MAX: 10
      RATE_LIMIT_WINDOW_SECONDS: 60
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: scoreboard
      POSTGRES_USER: scoreboard
      POSTGRES_PASSWORD: scoreboard
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U scoreboard']
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
```

### 7.3 Environment Variables

| Variable                    | Default       | Description                  |
| --------------------------- | ------------- | ---------------------------- |
| `DATABASE_URL`              | — (required)  | PostgreSQL connection string |
| `REDIS_URL`                 | — (required)  | Redis connection string      |
| `JWT_SECRET`                | — (required)  | Secret for JWT signing       |
| `JWT_EXPIRES_IN`            | `3600`        | Token expiry in seconds      |
| `PORT`                      | `3000`        | Server port                  |
| `SCORE_INCREMENT`           | `1`           | Points per action            |
| `RATE_LIMIT_MAX`            | `10`          | Max score updates per window |
| `RATE_LIMIT_WINDOW_SECONDS` | `60`          | Rate limit window            |
| `NODE_ENV`                  | `development` | Runtime environment          |

### 7.4 Deployment Options

| Platform                      | Approach                                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **AWS ECS / Fargate**         | Push Docker image to ECR, deploy as ECS service with RDS (PostgreSQL) + ElastiCache (Redis). ALB in front for HTTPS + SSE support. |
| **AWS EKS / Kubernetes**      | Helm chart with Deployment, Service, Ingress. PostgreSQL via RDS or in-cluster operator. Redis via ElastiCache or Bitnami chart.   |
| **Railway / Render**          | Connect GitHub repo, auto-deploy on push. Provision PostgreSQL and Redis add-ons.                                                  |
| **DigitalOcean App Platform** | Dockerfile-based deploy with managed PostgreSQL and Redis.                                                                         |
| **Self-hosted (VPS)**         | Docker Compose on the server with Nginx reverse proxy + Let's Encrypt.                                                             |

For production, use **managed PostgreSQL** and **managed Redis** rather than containerized databases.

### 7.5 Deployment Architecture

![Deployment Architecture](./diagram/flow-diagram-6.svg)

---

## 8. CI/CD Pipeline

### 8.1 CI — Continuous Integration (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: scoreboard_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd="pg_isready -U test"
          --health-interval=5s
          --health-timeout=3s
          --health-retries=5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=5s
          --health-timeout=3s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npx prisma generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/scoreboard_test
      - run: npm run test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/scoreboard_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: ci-test-secret
      - run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/scoreboard_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: ci-test-secret
      - run: npm run build
```

### 8.2 CD — Continuous Deployment (`.github/workflows/deploy.yml`)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    # Runs only if CI passes (use needs: or workflow_run)

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ vars.AWS_REGION }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & push image
        run: |
          IMAGE="${{ steps.ecr.outputs.registry }}/scoreboard-api:${{ github.sha }}"
          docker build -f docker/Dockerfile -t "$IMAGE" .
          docker push "$IMAGE"

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster scoreboard \
            --service scoreboard-api \
            --force-new-deployment
```

> Adjust the CD pipeline to your chosen deployment platform. The above is an AWS ECS example.

---

## 9. Implementation Steps

### Step 1: Project Scaffold

```bash
npm i -g @nestjs/cli
nest new scoreboard-api
cd scoreboard-api
npm i @nestjs/config @nestjs/swagger @nestjs/jwt @nestjs/passport
npm i passport passport-jwt bcrypt class-validator class-transformer
npm i @prisma/client ioredis rxjs helmet
npm i -D prisma @types/passport-jwt @types/bcrypt
```

**NestJS Module Dependency Graph:**

![NestJS Module Dependency Graph](./diagram/flow-diagram-7.svg)

### Step 2: Configuration Module

1. Create `src/config/app.config.ts` — validated config using `@nestjs/config` + Joi or class-validator.
2. Expose typed config: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `RATE_LIMIT_*`, etc.
3. Register `ConfigModule.forRoot({ isGlobal: true })` in `AppModule`.

### Step 3: Prisma Setup

1. Run `npx prisma init`.
2. Define `User` and `Score` models in `prisma/schema.prisma`.
3. Run `npx prisma migrate dev --name init`.
4. Create `PrismaService` extending `OnModuleInit` for connection lifecycle.
5. Create `PrismaModule` as a global module.

### Step 4: Domain Layer

1. Create domain entities: `UserEntity`, `ScoreEntity` (plain TypeScript classes, no framework decorators).
2. Create abstract repository interfaces: `IUserRepository`, `IScoreRepository`.
3. Create domain exceptions: `DuplicateActionException`, `RateLimitExceededException`.

### Step 5: Infrastructure — Database Repositories

1. Create `PrismaUserRepository` implementing `IUserRepository`.
2. Create `PrismaScoreRepository` implementing `IScoreRepository`:
   - `upsertAndIncrement(userId, points)` — atomic Prisma upsert with raw SQL increment.
   - `findTopN(limit)` — `ORDER BY score DESC LIMIT N`.
   - `findByUserId(userId)` — single user's score.
3. Create mappers: DB record → Domain entity.

### Step 6: Infrastructure — Redis

1. Create `RedisModule` with `ioredis` client provider.
2. Create `RedisLeaderboardService`:
   - `incrementScore(userId, points)` → `ZINCRBY`
   - `getTopN(limit)` → `ZREVRANGE ... WITHSCORES`
   - `getScore(userId)` → `ZSCORE`
   - `getRank(userId)` → `ZREVRANK`
   - `warmCache(entries)` → `ZADD`
   - Implement `OnModuleInit`: on startup, populate the Redis sorted set from PostgreSQL (`SELECT userId, score FROM Score ORDER BY score DESC`). This eliminates cold-start cache misses after deployments or Redis restarts.
3. Create `RedisRateLimiterService`:
   - `checkLimit(userId)` → sliding window counter, returns `{ allowed: boolean, remaining: number }`.
4. Idempotency check: `SETNX scoreboard:action:{actionId}` with 1-hour TTL.

### Step 7: Infrastructure — Auth

1. Create `AuthModule` importing `PassportModule` + `JwtModule.registerAsync(...)`.
2. Create `JwtStrategy` extending `PassportStrategy(Strategy)` — extracts `userId` from token payload.
3. Create `JwtAuthGuard` extending `AuthGuard('jwt')`.
4. Create `AuthService`: `register(dto)`, `login(dto)`, `hashPassword()`, `validateUser()`.

### Step 8: Application — Use-Cases

1. `UpdateScoreUseCase.execute(userId, actionId)`:
   - Check idempotency → Check rate limit → Upsert DB → Update Redis → Compare top 10 → Publish event if changed → Return score + rank.
2. `GetLeaderboardUseCase.execute()`:
   - Read Redis → fallback DB → hydrate display names → return.
3. `GetOwnScoreUseCase.execute(userId)`:
   - Read user score from Redis (`ZSCORE`) → get rank (`ZREVRANK`) → hydrate display name → return.
4. `RegisterUserUseCase.execute(dto)` / `LoginUserUseCase.execute(dto)`.

### Step 9: Presentation — Controllers

1. `AuthController`: `POST /auth/register`, `POST /auth/login`.
2. `ScoreController`: `POST /scores` (guarded), `GET /scores/top` (public), `GET /scores/me` (guarded).
3. `ScoreStreamController`: `GET /scores/stream` (guarded) using NestJS `@Sse()` decorator.
4. Apply `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()` for Swagger docs.

### Step 10: SSE + Connection Manager

1. Create `ConnectionManagerService` using RxJS `Subject`.
2. Subscribe to Redis Pub/Sub `scoreboard:events` channel on module init.
3. On message, emit to the Subject → all SSE Observable streams pick up the event.
4. `@Sse()` endpoint returns `connectionManager.getStream()` as `Observable<MessageEvent>`.
5. Heartbeat interval (30s) emits keepalive comments.
6. **Connection limit enforcement:** Max 1 SSE connection per `userId`. When a new connection arrives for the same user, close the previous one. Track connections in a `Map<string, Observable>`.
7. **Connection timeout:** Automatically close connections after 5 minutes. Clients rely on `EventSource` auto-reconnect.

### Step 11: Global Filters & Interceptors

1. `HttpExceptionFilter` — consistent error response shape.
2. `ResponseTransformInterceptor` — wraps success responses in `{ data, meta }`.
3. Register globally in `main.ts`: `app.useGlobalFilters(...)`, `app.useGlobalInterceptors(...)`.
4. Apply `helmet()` and `cors()` middleware.

### Step 12: Health Check Endpoint

1. Install `@nestjs/terminus`.
2. Create `HealthModule` with `GET /health` endpoint.
3. Check PostgreSQL connectivity via Prisma, Redis connectivity via `ioredis` ping, and memory usage.
4. Used by Docker healthcheck, load balancer probes, and Kubernetes liveness/readiness probes.

### Step 13: Docker & Compose

1. Write `docker/Dockerfile` (multi-stage build as specified in Section 7.1).
2. Write `docker/docker-compose.yml` (as specified in Section 7.2).
3. Add npm scripts: `"docker:up": "docker compose -f docker/docker-compose.yml up -d"`, etc.

### Step 14: CI/CD

1. Create `.github/workflows/ci.yml` (lint → test → build).
2. Create `.github/workflows/deploy.yml` (build image → push → deploy).
3. Document required GitHub secrets in `.env.example` comments.

### Step 15: Tests

1. **Unit tests** (Jest):
   - `UpdateScoreUseCase` — mock repositories + Redis services.
   - `GetLeaderboardUseCase` — cache hit / cache miss paths.
   - `RedisRateLimiterService` — mock ioredis commands.
   - `RedisLeaderboardService` — mock ioredis sorted set commands.
2. **Integration tests** (Supertest + `@nestjs/testing`):
   - `POST /scores` — auth enforcement, rate limiting, idempotency.
   - `GET /scores/top` — response shape, sort order.
   - `POST /auth/register` + `POST /auth/login` — full auth flow.
3. **E2E test:**
   - Register → Login → Update score → Read leaderboard → Verify rank.

---

## 10. Testing Strategy

### Test Commands

```bash
npm run test              # Unit tests
npm run test:watch        # Unit tests (watch mode)
npm run test:cov          # Coverage report
npm run test:e2e          # End-to-end tests
npm run lint              # ESLint
```

### Test Matrix

| Scenario                                     | Type        | Expected                            |
| -------------------------------------------- | ----------- | ----------------------------------- |
| Authenticated user updates score             | Unit        | Score incremented, rank returned    |
| Unauthenticated request to `POST /scores`    | Integration | 401 Unauthorized                    |
| Duplicate `actionId` submitted               | Unit        | 409 Conflict, score unchanged       |
| Rate limit exceeded (>10/min)                | Unit        | 429 Too Many Requests               |
| Leaderboard returns top 10 sorted descending | Unit        | Correct order, max 10 entries       |
| SSE stream receives broadcast on update      | Integration | Event with updated leaderboard      |
| Redis cache miss falls back to PostgreSQL    | Unit        | DB queried, cache warmed            |
| Concurrent updates for same user             | Integration | Final score = sum of all increments |
| Register with duplicate email                | Integration | 409 Conflict                        |
| Login with wrong password                    | Integration | 401 Unauthorized                    |
| SSE with query param token                   | Integration | Stream opens successfully           |
| SSE without auth (no header, no query param) | Integration | 401 Unauthorized                    |
| `GET /scores/me` returns own rank            | Integration | Correct score and rank              |
| Second SSE connection replaces first         | Integration | First connection closed             |
| Health check endpoint                        | Integration | 200 OK with dependency status       |

---

## 11. Recommendations for Improvement

### 11.1 Server-Side Action Validation (High Priority)

The current design trusts the client to report action completion. A more robust approach:

- **Action token pattern:** Before starting an action, the client requests a signed, single-use action token from the server (`POST /actions/start`). On completion, the client submits this token with the score update. The server verifies the token signature, checks it hasn't been used, and validates timing (action must take a minimum realistic duration).
- This moves the trust boundary from "client says it completed an action" to "server issued and verified the action lifecycle."
- Could be implemented as a separate `ActionModule` with `ActionToken` table and `ActionGuard`.

### 11.2 Horizontal Scaling with Redis Pub/Sub (Included in Design)

The design already uses Redis Pub/Sub for broadcasting across instances:

- Multiple NestJS instances behind a load balancer will all receive leaderboard updates.
- No sticky sessions required for SSE.
- Each instance manages its own local SSE connections and subscribes to the shared Redis channel.

### 11.3 Refresh Token Rotation (Medium Priority)

- Add a `POST /auth/refresh` endpoint with refresh token rotation.
- Store refresh tokens in PostgreSQL with family-based revocation.
- Short-lived access tokens (15 min) + long-lived refresh tokens (7 days).
- Prevents long sessions from breaking when access tokens expire, especially important for SSE streams.

### 11.4 Score Audit Log (Medium Priority)

- Log every score event to a `ScoreAuditLog` table: `userId`, `actionId`, `points`, `timestamp`, `ipAddress`.
- Enables retroactive fraud investigation and score corrections.
- Could be async (emit NestJS event → listener writes to DB) to avoid adding latency to the score update path.

### 11.5 Leaderboard Segmentation (Low Priority — Future)

- Support multiple leaderboards: daily, weekly, all-time using separate Redis sorted sets.
- NestJS `@Cron()` scheduler (via `@nestjs/schedule`) to reset daily/weekly sets.

### 11.6 API Versioning (Low Priority)

- Use NestJS URI versioning (`app.enableVersioning({ type: VersioningType.URI })`) from the start.
- Prefix routes as `/v1/scores` to allow future breaking changes without disrupting clients.

### 11.7 Observability (Medium Priority)

- Structured JSON logging via a NestJS logger (e.g., `nestjs-pino`).
- Request tracing with correlation IDs.
- Prometheus metrics endpoint for monitoring (request latency, active SSE connections, score updates/sec).

---

## 12. Risks and Mitigations

| Risk                                      | Impact                                                       | Mitigation                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Redis unavailability                      | Leaderboard reads slow (DB fallback); rate limiting disabled | Circuit breaker on Redis calls; fallback to DB reads + in-memory rate limiter              |
| SSE connection leak                       | Memory growth on server                                      | Max connection timeout (5 min), heartbeat failure detection, max 1 SSE connection per user |
| Score desync between Redis and PostgreSQL | Inconsistent leaderboard                                     | Redis updated after DB commit; periodic reconciliation job (every 5 min) resyncs from DB   |
| Burst of concurrent updates               | DB contention                                                | Prisma atomic `UPDATE SET score = score + N` — no read-then-write race condition           |
| Client spoofing action completion         | Inflated scores                                              | Rate limiting (immediate), action token validation (recommended enhancement)               |
| JWT secret compromise                     | Full auth bypass                                             | Rotate secrets, use RS256 asymmetric signing in production, short token TTL                |
| Database migration failures               | Deployment blocked                                           | Run `prisma migrate deploy` as separate CI step; test migrations against staging DB first  |
| Single-instance SSE bottleneck            | Broadcast failures on scale-out                              | Redis Pub/Sub already included in design for multi-instance support                        |
| JWT token exposure in URL (SSE query param) | Token logged in access logs, browser history, proxies        | Redact `token` param in access logs; use short-lived tokens; restrict query param auth to SSE endpoint only |
| Unnecessary SSE broadcasts                | High traffic to clients on every score update, even when top 10 unchanged | Compare top 10 before and after update; only broadcast when the top 10 actually changes    |
