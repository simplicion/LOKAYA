# E-Commerce QR Store Pickup Platform

"Scan Products. Sell Locally. Deliver Faster."

## Overview
This platform bridges the gap between local retail inventory tracking and e-commerce. It allows sellers to manage their inventory via a robust dashboard and QR scanning, while empowering local buyers to browse, buy, and pick up items instantly using secure QR pickup tokens—completely removing complex delivery logistics.

## Architecture
Built as a highly scalable Turborepo monorepo:
- **`user-web`**: Unified Next.js application adapting UI for Sellers (Stripe-like dashboard) and Buyers (Zepto-like marketplace).
- **`admin-web`**: Next.js application for global platform management.
- **`backend`**: Node.js/Express service housing REST API endpoints, shared business logic, and internal BullMQ background processors.
- **`@workspace/db`**: PostgreSQL database management using Prisma ORM.

## Documentation Navigation
All detailed technical documentation is located in the `/docs` directory:
1. `SYSTEM_DESIGN.md`: High-Level & Low-Level Architectural Design.
2. `DATABASE_SCHEMA.md`: Prisma Data Models & Relationships.
3. `DESIGN_SYSTEM.md`: UI/UX Guidelines, aesthetics, and micro-interactions.
4. `API_CONTRACTS.md`: REST API endpoint definitions and Background Queues.
5. `DEVELOPMENT_GUIDE.md`: Instructions for running the project locally using Docker.
