# PRD — CUSTOMER + SELLER APPLICATION
Version: 1.0

## 1. Product Goal
Create a mobile-first visual commerce application combining social discovery with transactional commerce.

The product must feel like a social content application but its primary business outcome is commerce.

## 2. Application Model
There is ONE Customer/Seller web application.

A user may be:
- Customer only
- Seller only
- Customer + Seller

A seller can still browse Explore, view Reels, follow stores, add products to cart, checkout, and place orders.

The UI exposes Seller Mode only when seller capability is enabled.

## 3. Customer Primary Navigation
Mobile:
1. Home
2. Explore
3. Reels
4. Cart
5. Account

Desktop may use a side navigation while preserving the same information architecture.

### Home
- personalized/following feed
- posts
- product-linked content
- seller identity
- like/comment/share
- primary product CTA
- infinite/cursor pagination
- loading/empty/error states

### Explore
- product search
- seller search
- category discovery
- content discovery
- filters
- sort
- search history where appropriate

### Reels
- vertical video
- autoplay only when permitted
- pause/mute controls
- seller identity
- product card
- Buy Now
- Add to Cart
- like/comment/share
- report

### Cart
- products grouped by seller
- variant
- quantity
- price
- availability
- remove
- save-for-later only if explicitly approved
- checkout

Important: multi-seller cart requires explicit checkout/order strategy. If V1 does not support multi-seller checkout, enforce one-seller checkout rather than hiding complexity.

### Account
- account/profile settings
- addresses
- orders
- notifications
- support
- privacy/security
- seller mode entry if eligible

## 4. Seller Public Storefront
A seller has a public store page:
- avatar/logo
- store name
- handle
- description
- seller rating
- follower count
- products
- posts
- reels
- follow button
- report store

The seller's private operational dashboard is separate from the public storefront.

## 5. Product Detail
- media gallery
- title
- description
- variant selector
- price
- discount if supported
- stock state
- seller
- seller rating
- product rating
- reviews
- Add to Cart
- Buy Now

## 6. Checkout
1. Cart validation
2. Address
3. Delivery/shipping
4. Price/tax/discount calculation
5. Order summary
6. Payment
7. Provider confirmation
8. Order confirmation
9. Thank-you/order tracking entry

The final success screen MUST be driven by authoritative order/payment state.

## 7. Seller Mode Navigation
Seller Mode is a dedicated workspace inside the same app:
1. Dashboard
2. Products
3. Create
4. Orders
5. Store

Seller can return to Shopping Mode without logout.

### Dashboard
- revenue/sales summary
- orders requiring action
- product count
- low-stock alerts
- content performance
- store rating
- operational warnings

### Products
- product list
- search
- filter
- status
- create
- edit
- archive
- variants
- inventory visibility

### Create
- create product
- create post
- create reel

### Product creation
- title
- description
- category
- media
- variants
- SKU
- price
- inventory
- shipping attributes
- publication state

### Post/Reel creation
Upload/record → caption → select product(s) → preview → publish.

Product picker searches ONLY seller-owned products.

### Orders
- pending/new
- confirmed
- processing
- packed
- shipped
- out for delivery
- delivered
- cancellation
- returns/refunds

### Store
- storefront profile
- logo/avatar
- description
- business information
- policies
- shipping/return settings where supported

## 8. Seller Onboarding
REGISTERED
→ PROFILE_INCOMPLETE
→ VERIFICATION_PENDING
→ VERIFIED
→ ACTIVE

Rejected/suspended states must be explicit.

## 9. Reviews
Product review eligibility:
- customer purchased item
- order reaches configured eligible state, normally DELIVERED
- one review per eligible order item unless business rules explicitly permit updates

Seller review:
- separate from product rating
- tied to eligible transaction/seller relationship

## 10. Notifications
- order status
- payment result
- seller order alerts
- stock alerts
- comment/interaction notifications
- system announcements

## 11. V1 Exclusions
- customer public posting
- stories
- live commerce
- affiliate marketplace
- creator monetization
- ads
- advanced recommendation ML
- complex multi-warehouse fulfillment
- microservices
