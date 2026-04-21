# Resource CRUD API

A RESTful CRUD API built with Express.js and TypeScript following **Clean Architecture** principles. Uses a JSON file as a simple database for data persistence.

## Architecture

```
src/
├── common/           # Shared constants (e.g. HTTP status codes)
│   └── constants/
├── domain/           # Entities, enums, exceptions and repository interfaces
│   ├── entities/
│   ├── enums/
│   ├── exceptions/
│   └── repositories/
├── application/      # Use cases (depends on domain and common only)
│   └── use-cases/
├── infrastructure/   # Repository implementations (JSON file DB)
│   └── repositories/
├── presentation/     # Express controllers, routes, middlewares and validators
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── validators/
├── app.ts            # Express app factory (composition root)
└── server.ts         # Entry point
data/
└── resource.json     # JSON file database
tests/                # Unit and integration tests
```

### Dependency Rule

Dependencies point inward only:

```
Common ← Domain ← Application ← Infrastructure / Presentation
```

- **Common** — zero dependencies; shared constants used across layers.
- **Domain** — depends on common only; defines entities, interfaces and exceptions.
- **Application** — depends on domain (and common); contains use-case business logic.
- **Infrastructure / Presentation** — depend on application, domain and common; never imported by inner layers.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

## Setup

```bash
# Install dependencies
npm install
```

## Running the Application

### Development mode (with ts-node)

```bash
npm run dev
```

### Production mode

```bash
npm run build
npm start
```

The server starts on `http://localhost:3000` by default. Set the `PORT` environment variable to override:

```bash
PORT=8080 npm run dev
```

## API Endpoints

| Method | Endpoint             | Description                   |
| ------ | -------------------- | ----------------------------- |
| GET    | `/health`            | Health check                  |
| POST   | `/api/resources`     | Create a resource             |
| GET    | `/api/resources`     | List resources (with filters) |
| GET    | `/api/resources/:id` | Get a resource by ID          |
| PUT    | `/api/resources/:id` | Update a resource             |
| DELETE | `/api/resources/:id` | Delete a resource             |

### Filter Parameters

- `GET /api/resources?name=<search>` — filter resources by name (case-insensitive partial match)

### Request/Response Examples

**Create a resource:**

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -d '{"name": "Widget", "description": "A useful widget"}'
```

Response (201):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Widget",
  "description": "A useful widget",
  "createdAt": "2026-04-20T10:00:00.000Z",
  "updatedAt": "2026-04-20T10:00:00.000Z"
}
```

**List resources:**

```bash
curl http://localhost:3000/api/resources
curl http://localhost:3000/api/resources?name=widget
```

**Get a resource:**

```bash
curl http://localhost:3000/api/resources/<id>
```

**Update a resource:**

```bash
curl -X PUT http://localhost:3000/api/resources/<id> \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Widget", "description": "Updated description"}'
```

**Delete a resource:**

```bash
curl -X DELETE http://localhost:3000/api/resources/<id>
```

## Running Tests

```bash
npm test
```

## Data Persistence

Data is stored in `data/resource.json`. The file is initialized as an empty array `[]`. All CRUD operations read from and write to this file.
