# Porfiria API

Backend API for Porfiria Academy.

## Stack

- Node.js LTS
- NestJS
- Fastify
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Swagger
- Docker

## Local Setup

Copy the environment file:

```bash
cp .env.example .env
```

Start local infrastructure:

```bash
docker compose up -d
```

If your environment uses the legacy Compose binary:

```bash
docker-compose up -d
```

The local PostgreSQL container is exposed on host port `55432` to avoid conflicts with local PostgreSQL installations that commonly use `5432`.

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Run the API in development mode:

```bash
npm run start:dev
```

Swagger is available at:

```text
http://localhost:3000/docs
```

## Quality Checks

Before concluding an implementation, run:

```bash
npm run lint
npm run test
npm run build
```
