# DDD DOMAIN ARCHITECTURE
Version: 1.0

## 1. Why DDD Modular Monolith
This system is broad but its domains are strongly related. A modular monolith gives:
- strong boundaries
- one deployment
- simple transactions
- low operational overhead
- easier debugging
- future extraction options

A plain folder-based “modular architecture” is insufficient. Modules must have domain ownership, contracts, invariants, and dependency rules.

## 2. Bounded Contexts

### Identity & Access
Owns identity, authentication references, capabilities, sessions, authorization policies.

### Seller / Store
Owns seller status, verification, storefront.

### Catalog
Owns product, variants, category, product media references.

### Inventory
Owns stock, reservations, movements, availability.

### Content
Owns posts, reels, publication lifecycle, content media, product links.

### Social
Owns follows, likes, comments, persistent interaction state.

### Discovery
Owns feed assembly/ranking and discovery query policies.

### Cart
Owns customer cart and cart items.

### Checkout
Owns checkout session and commercial snapshots before order creation.

### Order
Owns orders, order items, fulfillment state, cancellation, return state.

### Payment
Owns payment attempts, provider references, webhooks, payment state.

### Review
Owns review eligibility and product/seller reviews.

### Notification
Owns notifications and delivery adapters.

### Moderation
Owns reports, moderation states and actions.

### Search
Owns search projection/index integration; it does not own canonical products.

## 3. Ownership Rule
Each domain owns its invariants and persistence.

Correct:
Checkout → Inventory application port → reserve()

Incorrect:
Checkout repository → UPDATE inventory_items directly

## 4. Domain Layers
Domain:
- entities
- aggregates
- value objects
- domain services
- domain events
- repository interfaces
- domain errors

Application:
- commands
- queries
- handlers
- DTOs
- policies
- ports

Infrastructure:
- DB repositories
- Redis
- R2
- provider SDKs
- search adapters

Interfaces:
- HTTP
- Socket.IO
- queue consumers

## 5. Dependency Rule
Interface → Application → Domain
Infrastructure → implements ports

Domain MUST NOT depend on:
- HTTP
- Express/Fastify
- React
- PostgreSQL client
- Redis SDK
- R2 SDK
- payment SDK

## 6. Aggregate Guidance
Keep aggregates small.

Order aggregate should protect order lifecycle and commercial invariants. It should not load an entire product catalog or customer profile graph.

## 7. Domain Events
Use meaningful facts:
- ProductPublished
- ContentPublished
- StockReserved
- StockReservationExpired
- OrderCreated
- PaymentSucceeded
- PaymentFailed
- OrderConfirmed
- OrderShipped
- OrderDelivered
- ReviewSubmitted
- SellerSuspended

Use transactional outbox for durable asynchronous integration.

## 8. State Machines
Order, Payment, Seller, Content, Media, and Inventory reservations MUST use explicit states and valid transition rules.

Never use arbitrary strings throughout the codebase.
