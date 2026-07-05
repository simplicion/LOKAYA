# System Design: E-Commerce QR Store Pickup Platform

## 1. High-Level Design (HLD)

### 1.1 Architecture Overview
The platform uses a microservices-inspired, monolithic repository (monorepo) architecture to balance separation of concerns with developer velocity. The client layer has been simplified to consolidate user roles.

*   **Client Layer (Next.js)**: 
    *   `admin-web`: Dedicated application for platform administrators to manage the entire ecosystem (verifying stores, global analytics, user management).
    *   `user-web`: A unified application for both **Sellers** and **Buyers**. The UI and features dynamically adapt based on the authenticated user's role (e.g., showing the Seller Dashboard to store owners and the Marketplace to buyers).
*   **API Gateway / Ingress**: Nginx routing requests to respective services based on path/subdomain.
*   **Service Layer (Node.js)**:
    *   `backend`: A single Express.js and Node process containing internal modules for the REST API, BullMQ Worker, and Shared logic.
*   **Data Layer**:
    *   PostgreSQL: Primary source of truth.
    *   Redis: Queue management and caching.

### 1.2 System Components Interaction
1.  **QR Scanning (Seller in `user-web`)**: `user-web` -> `http-backend` -> `Postgres` -> Response.
2.  **Order Placement (Buyer in `user-web`)**: `user-web` -> `http-backend` (Transaction) -> `Postgres` -> `Redis` (Queue Notification) -> `worker` (Sends Email/SMS).

## 2. Low-Level Design (LLD)

### 2.1 Monorepo Structure (pnpm workspaces)
```
/apps
  /admin-web      (Port 3000) - Platform Admins
  /user-web       (Port 3001) - Buyers & Sellers (Unified App)
  /backend        (Port 4000) - Unified API and Worker
    /src/api
    /src/worker
    /src/shared
/packages
  /@workspace/backend-common (Shared backend logic and services)
  /@workspace/db (Prisma Client & Schema)
  /@workspace/ui (Tailwind, shadcn/ui)
  /@workspace/common (Zod schemas, Redux slices, Types)
```

### 2.2 Unified User-Web Routing Strategy
Because `user-web` handles both roles, routing and state management must be strictly guarded:
*   `/app/buyer/*`: Layouts and pages for marketplace discovery and purchasing.
*   `/app/seller/*`: Layouts and pages for the store inventory dashboard and QR scanner.
*   **Guards**: Higher-Order Components or Next.js Middleware intercepts requests to `/app/seller` and ensures the user has the `SELLER` role.

### 2.3 API Design Principles
*   **RESTful URLs**: Resources modeled as nouns (e.g., `POST /api/v1/orders`).
*   **Layered Architecture (http-backend)**:
    *   `Routes`: Define endpoints and attach middleware.
    *   `Middlewares`: Auth validation, rate limiting, error catching.
    *   `Controllers`: Extract req/res data, call services.
    *   `Services`: Core business logic.
    *   `Repositories (Prisma)`: Raw database access abstracted in `@workspace/db`.

### 2.4 Error Handling & Logging
*   Centralized error handling middleware in Express mapping custom `AppError` classes to HTTP status codes.
*   Structured JSON logging across all backend services.
