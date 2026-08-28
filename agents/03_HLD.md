# HIGH LEVEL DESIGN

## 1. System
```text
                  +----------------------+
                  | Customer/Seller Web  |
                  | React + TypeScript   |
                  +----------+-----------+
                             |
                          HTTPS
                             |
                  +----------v-----------+
                  | Node.js API          |
                  | DDD Modular Monolith |
                  +----------+-----------+
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
 PostgreSQL               Redis              R2/CDN
 source of truth       cache/queues       media storage/delivery
        |
        v
 Transactional Outbox
        |
        v
 Background Workers
   |        |         |
   v        v         v
Media     Search   Notifications
FFmpeg
HLS

Socket.IO Gateway
      |
    Redis adapter when horizontally scaled
```

## 2. Web Application
Single customer/seller application with route-level code splitting.

Shopping Mode and Seller Mode share authentication/session state but use different route shells/layouts.

## 3. API
Stateless nodes.

Responsibilities:
- auth
- authorization
- validation
- use-case orchestration
- domain invocation
- DTO mapping
- rate limiting
- request correlation

## 4. Worker System
Workers execute asynchronous jobs:
- video processing
- image optimization
- thumbnails
- search indexing
- notifications
- cleanup
- outbox consumers

Jobs MUST be retry-safe and idempotent.

## 5. PostgreSQL
Canonical transactional state.

Use:
- constraints
- indexes
- foreign keys
- migrations
- transaction boundaries

## 6. Redis
Use:
- queue backend
- cache
- rate limits
- ephemeral locks only where justified
- Socket.IO adapter

Do not put canonical order/payment/inventory state only in Redis.

## 7. Media
Client uploads directly to R2 using short-lived authorized upload credentials.

API should not proxy large video uploads by default.

## 8. Realtime
Socket.IO transports:
- chat messages if messaging is enabled
- order status events
- seller alerts
- notification badges

Durable data is persisted first/authoritatively; realtime transport is delivery acceleration.

## 9. Checkout
Recommended sequence:
Cart validation → inventory reservation → price/address snapshot → payment attempt → provider redirect/SDK → verified webhook → payment state → order confirmation → notification.

External provider calls should not be held inside long DB transactions.

## 10. Scalability
- stateless API
- DB pool
- Redis shared infrastructure
- CDN
- direct R2 uploads
- worker pool
- cursor pagination
- proper DB indexes
- lazy media loading

## 11. Failure Strategy
Every external integration needs:
- timeout
- retry policy
- idempotency
- failure classification
- logging
- reconciliation path

## 12. Observability
Log:
- request ID
- actor/account ID where safe
- domain object ID
- operation
- latency
- result

Trace:
- order
- payment
- media job
- seller
- content

Never log passwords, tokens, CVV, or secrets.
