# Local Development Guide

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- pnpm (v9+)

## 1. Environment Setup
Create a `.env` file in the root of the `apps/backend` package and `@workspace/db`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecom_db?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-key"
PORT=4000
```

## 2. Infrastructure Bootup
We use Docker to run our dependencies (PostgreSQL and Redis).
From the project root:
```bash
docker-compose up -d
```
Verify they are running using `docker ps`.

## 3. Install Dependencies
In the monorepo root, run:
```bash
pnpm install
```

## 4. Database Migrations
Initialize the Prisma schema to the database:
```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run generate
```
To view the database visually:
```bash
pnpm --filter @workspace/db run studio
```

## 5. Running the Application
Using Turborepo, you can run all applications simultaneously:
```bash
pnpm dev
```
This single command spins up:
- `admin-web` (Next.js) on `http://localhost:3000`
- `user-web` (Next.js) on `http://localhost:3001`
- `backend` (Express API & Worker) on `http://localhost:4000`
