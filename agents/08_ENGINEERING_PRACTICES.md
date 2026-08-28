# ENGINEERING BEST PRACTICES

## 1. TypeScript
- strict mode
- noImplicitAny
- avoid any
- discriminated unions for state machines
- explicit DTOs
- runtime validation at boundaries
- domain types separate from ORM types

## 2. Naming
Names must reveal business intent.

Prefer:
CreateProductCommand
ReserveInventoryHandler
PaymentWebhookProcessor

Avoid:
CommonService
DataManager
Utils
Helper2

## 3. Security
- least privilege
- secret manager/environment injection
- secure cookies/tokens
- CSRF protection where applicable
- XSS-safe rendering
- parameterized DB queries
- SSRF protection
- upload validation
- rate limits
- audit logs
- MFA for admin

## 4. Authentication/Authorization
Authentication answers identity.
Authorization answers permission.

Frontend route guards are UX only. Backend authorization is mandatory.

## 5. Payments
- provider webhook signature verification
- webhook deduplication
- idempotency
- explicit state machine
- reconciliation
- no card CVV storage
- no client-authoritative payment success

## 6. Inventory
Use atomic update or locking.

Conceptually:
UPDATE inventory
SET available = available - requested
WHERE variant_id = ? AND available >= requested

Then verify affected row count.

Reservation expiry must be handled by workers/scheduled jobs.

## 7. API
Consistent:
- status codes
- error schema
- request IDs
- pagination
- validation
- authorization

## 8. Testing Pyramid
Unit:
domain/value objects/policies.

Integration:
PostgreSQL repositories, transactions, adapters.

API:
auth/authorization/use cases.

E2E:
critical purchase and seller journeys.

## 9. CI Gates
At minimum:
- typecheck
- lint
- unit tests
- integration tests
- build
- migration validation
- security/dependency checks where configured

## 10. Git
- focused branches
- focused commits
- PR review
- no secrets
- no generated private customer data

## 11. Performance
Measure:
- p50/p95/p99 API latency
- DB latency
- feed query time
- reel startup time
- upload failure rate
- queue latency
- client bundle
- Core Web Vitals
- CDN cache hit

## 12. ADR
Architecture changes require ADR:
docs/adr/ADR-XXXX-title.md

Each ADR:
Context → Decision → Alternatives → Consequences → Status.
