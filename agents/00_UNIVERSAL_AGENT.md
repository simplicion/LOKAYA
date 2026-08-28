# UNIVERSAL AGENT — SOCIAL COMMERCE PLATFORM
Version: 1.0

## 0. Mission
Build a social-commerce platform where sellers publish shoppable visual content and customers discover, interact with, and purchase products.

Core loop:
DISCOVER → ENGAGE → TRUST → BUY → FULFILL → REVIEW → RETURN

This repository uses a DDD-oriented modular monolith. The application is one deployable backend initially, but business boundaries MUST remain explicit.

## 1. Product Roles
### Customer
Can browse, search, follow sellers, view posts/reels, like/comment, manage cart, checkout, pay, track orders, and review eligible purchases.

### Seller
A normal account with seller capability. A seller can use the entire customer experience and can switch into Seller Mode without creating a second identity or logging out.

### Super Admin
Separate administrative application with server-enforced privileged permissions.

## 2. Critical Product Decisions
- One account may have CUSTOMER and SELLER capabilities.
- Seller Mode is a workspace/capability, not a second account.
- Customer-created public posts are out of scope for V1.
- Seller-created posts/reels are shoppable.
- Products linked to content MUST belong to the seller publishing that content.
- Product, inventory, order, payment, and review are separate bounded responsibilities.
- Payment success is never trusted from frontend state.
- Inventory operations MUST be concurrency-safe.
- Historical orders use immutable commercial snapshots.
- Media binaries live in R2, not PostgreSQL.
- Redis is not the source of truth for business data.
- Socket.IO is a realtime transport, not durable storage.
- Super Admin is a separate app.
- Customer/Seller is one responsive web app and later a Capacitor shell.
- Do not start with microservices.

## 3. Technology Baseline
Frontend:
- React + TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- schema validation
- Tailwind CSS
- accessible component primitives
- Vitest + React Testing Library
- Playwright

Backend:
- Node.js + TypeScript
- DDD + Clean/Hexagonal boundaries
- REST API initially
- Socket.IO
- PostgreSQL
- Redis + durable queue library
- OpenAPI contract
- structured logging

Infrastructure:
- Cloudflare R2
- CDN
- FFmpeg media workers
- HLS
- CI/CD
- metrics/logging/tracing

## 4. Agent Protocol
Before coding:
1. Read this file.
2. Read the relevant domain file.
3. Inspect current repository code.
4. Identify bounded context ownership.
5. Identify invariants and authorization rules.
6. Check existing APIs/schema/tests.
7. Make the smallest coherent change.
8. Add tests.
9. Update documentation/ADR if architecture changes.

Never silently invent missing business rules.

## 5. Forbidden Patterns
- frontend-only authorization
- direct cross-module SQL writes
- giant global services/helpers/utils
- ORM models exposed as API responses
- storing video/images in DB blobs
- payment status derived from client
- non-atomic inventory decrement
- long synchronous video processing
- secrets in git
- disabling security to fix tests
- deleting tests to make CI pass
- premature microservices
- arbitrary framework additions
