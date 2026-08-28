# SUPER ADMIN + OPERATIONS

## 1. Separate Application
Super Admin is a separate frontend application:
apps/admin

It uses the same backend but privileged APIs and policies.

## 2. Admin Navigation
- Dashboard
- Sellers
- Customers
- Products
- Content
- Orders
- Payments
- Reviews
- Reports/Moderation
- Notifications
- Settings
- Audit Logs

## 3. Seller Operations
- search
- verification
- approve/reject
- suspend/reactivate
- inspect storefront
- inspect content
- rating
- operational history

## 4. Product Operations
- search
- category management
- moderation
- hide/unpublish
- reported products

## 5. Content Operations
- reported posts/reels
- takedown
- restore
- media failure inspection

## 6. Order Operations
- search
- inspect payment/fulfillment
- returns/refunds
- support notes
- anomaly detection

## 7. Audit
Every privileged action:
- actor
- action
- target
- timestamp
- reason
- before/after summary when appropriate

## 8. Admin Security
- MFA
- short sessions
- RBAC
- least privilege
- audit logs
- no shared credentials

## 9. Alerts
- payment webhook failure
- media queue backlog
- failed workers
- abnormal API latency
- DB failure
- inventory anomalies
- order state anomalies
