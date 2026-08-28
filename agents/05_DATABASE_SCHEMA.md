# DATABASE SCHEMA — POSTGRESQL

## 1. Rules
- PostgreSQL is canonical transactional storage.
- UTC timestamps.
- UUID/UUIDv7-style IDs according to chosen implementation.
- foreign keys.
- unique constraints.
- check constraints.
- migrations.
- indexes based on query patterns.
- JSONB only for genuinely flexible/snapshot data.
- no business-critical state only in Redis.

## 2. Identity
### accounts
id, status, created_at, updated_at

### account_identities
id, account_id, provider, provider_subject, created_at

### account_capabilities
account_id, capability, status, created_at, updated_at

Capabilities: CUSTOMER, SELLER.

## 3. Seller
### sellers
id, account_id, verification_status, status, rating_average, rating_count, created_at, updated_at

### stores
id, seller_id, handle, display_name, description, avatar_media_id, status, created_at, updated_at

Unique seller_id and handle.

## 4. Catalog
### products
id, store_id, title, slug, description, status, base_price, currency, rating_average, rating_count, created_at, updated_at

### product_variants
id, product_id, sku, title, price, compare_at_price, attributes_jsonb, status, created_at, updated_at

Unique SKU.

### categories
id, parent_id, name, slug, status

### product_categories
product_id, category_id

### product_media
id, product_id, media_asset_id, sort_order

## 5. Inventory
### inventory_items
id, variant_id, available_quantity, reserved_quantity, low_stock_threshold, updated_at

### inventory_reservations
id, variant_id, checkout_id, quantity, status, expires_at, created_at

### inventory_movements
id, variant_id, type, quantity, reference_type, reference_id, created_at

Use atomic/locked reservation logic.

## 6. Content
### content
id, seller_id, type, caption, status, published_at, created_at, updated_at

### content_media
id, content_id, media_asset_id, sort_order

### content_product_links
id, content_id, product_id, variant_id nullable, display_order

Enforce seller ownership at application/domain level and add DB constraints where feasible.

## 7. Social
### follows
customer_account_id, seller_id, created_at
Unique pair.

### likes
customer_account_id, content_id, created_at
Unique pair.

### comments
id, customer_account_id, content_id, body, status, created_at, updated_at

## 8. Cart
### carts
id, customer_account_id, status, created_at, updated_at

### cart_items
id, cart_id, variant_id, quantity, created_at, updated_at

Unique(cart_id, variant_id).

## 9. Checkout
### checkout_sessions
id, customer_account_id, cart_id, status, currency, subtotal, shipping_total, discount_total, grand_total, address_snapshot_jsonb, pricing_snapshot_jsonb, created_at, expires_at

## 10. Orders
### orders
id, order_number, customer_account_id, status, payment_status, fulfillment_status, currency, subtotal, shipping_total, discount_total, grand_total, shipping_address_snapshot_jsonb, billing_address_snapshot_jsonb, created_at, updated_at

### order_items
id, order_id, seller_id, product_id, variant_id, product_title_snapshot, sku_snapshot, unit_price, quantity, line_total, metadata_snapshot_jsonb

### order_status_history
id, order_id, from_status, to_status, actor_type, actor_id, reason, created_at

### returns
id, order_id, status, reason, created_at, updated_at

### return_items
id, return_id, order_item_id, quantity, reason

## 11. Payment
### payments
id, order_id, method, status, provider, provider_reference, amount, currency, created_at, updated_at

### payment_attempts
id, payment_id, idempotency_key, status, provider_reference, failure_code, created_at

Unique idempotency key.

### payment_webhook_events
id, provider, provider_event_id, payload_hash, status, processed_at

Unique(provider, provider_event_id).

## 12. Reviews
### product_reviews
id, order_item_id, customer_account_id, product_id, rating, title, body, status, created_at

### seller_reviews
id, order_id, customer_account_id, seller_id, rating, body, status, created_at

Eligibility constraints enforced by domain/application.

## 13. Media
### media_assets
id, owner_type, owner_id, object_key, media_type, mime_type, size_bytes, width, height, duration_ms, status, created_at

### media_variants
id, media_asset_id, variant_type, object_key, width, height, bitrate, codec, status

## 14. Notifications
### notifications
id, account_id, type, payload_jsonb, read_at, created_at

## 15. Moderation
### reports
id, reporter_account_id, target_type, target_id, reason, status, created_at

### moderation_actions
id, moderator_account_id, target_type, target_id, action, reason, created_at

## 16. Outbox
### outbox_events
id, aggregate_type, aggregate_id, event_type, payload_jsonb, occurred_at, published_at, retry_count

Use for reliable asynchronous integration.

## 17. Indexing
Design indexes from actual access patterns:
- feed ordering
- store products
- product search/filter
- seller orders
- customer orders
- order status
- media processing status
- webhook provider event ID
- reservation expiry

Avoid speculative index explosion.
