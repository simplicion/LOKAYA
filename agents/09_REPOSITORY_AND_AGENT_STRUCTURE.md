# REPOSITORY + AGENT STRUCTURE

## 1. Recommended Monorepo
```text
commerce-platform/
├── apps/
│   ├── web/                 # customer + seller
│   ├── admin/               # super admin
│   ├── api/                 # Node API
│   └── workers/             # async workers
├── packages/
│   ├── contracts/
│   ├── shared-kernel/
│   ├── config/
│   └── tooling/
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── database/
│   ├── media/
│   ├── design/
│   ├── adr/
│   └── operations/
├── infrastructure/
└── agents/
```

## 2. Backend
```text
apps/api/src/
├── app/
├── modules/
│   ├── identity/
│   ├── seller/
│   ├── catalog/
│   ├── inventory/
│   ├── content/
│   ├── social/
│   ├── discovery/
│   ├── cart/
│   ├── checkout/
│   ├── order/
│   ├── payment/
│   ├── review/
│   ├── notification/
│   ├── moderation/
│   └── search/
└── shared/
```

## 3. Worker
```text
apps/workers/src/
├── bootstrap/
├── jobs/
│   ├── media/
│   ├── notifications/
│   ├── search/
│   ├── cleanup/
│   └── outbox/
└── shared/
```

## 4. Frontend
Customer and seller modules share primitives but seller workspace has its own layout.

## 5. Agent Files
```text
agents/
├── 00_UNIVERSAL_AGENT.md
├── 01_PRD_CUSTOMER_SELLER_APP.md
├── 02_DOMAIN_ARCHITECTURE.md
├── 03_HLD.md
├── 04_LLD.md
├── 05_DATABASE_SCHEMA.md
├── 06_FRONTEND_DESIGN_SYSTEM.md
├── 07_MEDIA_PIPELINE.md
├── 08_ENGINEERING_PRACTICES.md
├── 09_REPOSITORY_AND_AGENT_STRUCTURE.md
├── 10_SUPER_ADMIN_OPERATIONS.md
└── 11_SECURITY_THREAT_MODEL.md
```

## 6. Agent Responsibilities
Universal: rules and conflict resolution.
Product: requirements and acceptance criteria.
Architecture: boundaries/ADRs.
Backend: use cases/domain/infrastructure.
Frontend: UI/state/navigation.
DB: schema/index/migrations.
Media: upload/transcode/HLS.
QA: test strategy.
Security: threat modeling and security review.
DevOps: deployment/observability/backups.
Admin: operational application.

## 7. Agent Conflict Rule
Higher priority:
Universal → Architecture → Product → Domain-specific implementation.

If two docs conflict, do not silently choose. Record conflict and request resolution.
