# LOW LEVEL DESIGN

## 1. Backend Module Template
```text
modules/catalog/
├── domain/
│   ├── entities/
│   ├── aggregates/
│   ├── value-objects/
│   ├── domain-services/
│   ├── events/
│   ├── repositories/
│   └── errors/
├── application/
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   ├── dto/
│   └── ports/
├── infrastructure/
│   ├── persistence/
│   ├── external/
│   ├── mappers/
│   └── adapters/
└── interfaces/
    ├── http/
    ├── websocket/
    └── consumers/
```

## 2. Use Case Design
A command represents intent:
- CreateProduct
- PublishProduct
- LinkProductToContent
- AddToCart
- StartCheckout
- ReserveStock
- CreatePaymentAttempt
- ConfirmPayment
- CreateOrder
- TransitionOrder
- SubmitReview

A query is read-only and should not mutate business state.

## 3. Domain Objects
Use behavior-rich entities.

Bad:
`product.setStatus("PUBLISHED")`

Good:
`product.publish(actorPolicy)`

Value objects:
- Money
- Currency
- SKU
- ProductId
- OrderId
- SellerId
- EmailAddress
- Rating

## 4. Authorization
Check:
1. authentication
2. capability/role
3. resource ownership
4. domain policy

Example:
Seller may link product to reel only if:
- authenticated
- seller capability active
- content owned by seller
- product owned by same seller
- content state permits modification

## 5. Database Transactions
Use transaction for atomic local state.

Never:
DB transaction → call payment provider → wait → continue

Prefer:
local transaction creates PaymentAttempt → provider call → webhook → local transaction confirms payment.

## 6. Idempotency
Required for:
- payment attempt creation
- webhook processing
- order creation
- refunds
- reservation commands
- event consumers

Enforce uniqueness at DB level wherever possible.

## 7. Pagination
Cursor pagination for:
- home feed
- reels
- comments
- seller products
- orders

Cursor must be stable and tied to deterministic ordering.

## 8. Error Contract
```json
{
  "error": {
    "code": "INVENTORY_UNAVAILABLE",
    "message": "Requested quantity is unavailable",
    "requestId": "..."
  }
}
```

Never expose stack traces to clients.

## 9. API Contract
Controllers:
- validate request
- authorize
- call application handler
- map result to DTO

Controllers MUST NOT contain business rules.

## 10. Testing
Domain tests must not require a database.

Repository tests use real PostgreSQL in integration environment where practical.

Critical E2E:
seller signup → product → reel → customer discovery → cart → checkout → payment → order → seller fulfillment → delivery → review.
