## Setup

Install node packages
```bash
npm install
```

## Run Server

```bash
npm run start
```

## Refactor

### Modularization and separation of concerns

routes directory for routes
- Not using controller. Believe inflates things and generally leads to worse developer experience.

schemas directory for MongoDB schemas

### Input validation

Using MongoDB build in input validation logic on the schema.

[src/schemas/user.ts](src/schemas/user.ts)

### Error Handling and logging

Routes contain try catch statements.

In production app we'd ensure errors are thrown and logged (i.e w/ CloudWatch Logs on AWS)

### Rate Limiting

Implemented a simple rate limiter. Allows 30 requests every 30 minutes.

[src/middleware/rateLimiter.ts](src/middleware/rateLimiter.ts)

### Optimize Database queries

Get request accepts
- page and limit params for pagination
- fields param to select specific fields to return
    - Returns all fields if no fields param.

