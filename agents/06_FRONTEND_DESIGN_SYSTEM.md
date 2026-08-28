# FRONTEND ARCHITECTURE + DESIGN SYSTEM

## 1. Architecture
React + TypeScript + Vite.

Recommended:
- React Router
- TanStack Query
- Zustand for small client state
- React Hook Form
- Zod or equivalent schema validation
- Tailwind CSS
- Radix-style accessible primitives
- Vitest
- React Testing Library
- Playwright

## 2. Folder Structure
```text
apps/web/src/
├── app/
│   ├── router/
│   ├── providers/
│   ├── layouts/
│   └── bootstrap/
├── modules/
│   ├── auth/
│   ├── home/
│   ├── explore/
│   ├── reels/
│   ├── store/
│   ├── product/
│   ├── content/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── reviews/
│   ├── account/
│   └── seller-workspace/
├── shared/
│   ├── ui/
│   ├── hooks/
│   ├── lib/
│   ├── validation/
│   └── types/
└── infrastructure/
    ├── api/
    ├── realtime/
    └── analytics/
```

## 3. Route Map
Shopping:
/
/explore
/reels
/cart
/account
/store/:handle
/product/:slug
/checkout
/orders
/orders/:id

Seller:
 /seller/dashboard
 /seller/products
 /seller/products/new
 /seller/products/:id/edit
 /seller/content
 /seller/content/new
 /seller/orders
 /seller/orders/:id
 /seller/store

## 4. Seller Workspace
Use a visually distinct workspace shell:
- sidebar on desktop
- compact navigation on mobile
- clear “Back to Shopping” action
- dashboard-style dense information layout

It is NOT a second frontend deployment.

## 5. Design Theme
Recommended theme:
**Premium Editorial Commerce**

Avoid cloning Instagram exactly.

Characteristics:
- warm/off-white neutral background
- near-black text
- one memorable brand accent
- restrained borders
- minimal shadows
- strong typography
- large photography
- editorial spacing
- subtle motion
- high product/media prominence

## 6. Design Principles
1. Content first.
2. Commerce CTA always understandable.
3. Never sacrifice readability for visual similarity.
4. One primary action per surface.
5. Use progressive disclosure.
6. Keep interactions thumb-friendly.
7. Consistent spacing and radius tokens.
8. Motion must communicate state, not decorate.
9. Empty/error/loading states are designed states.
10. Accessibility is part of the design.

## 7. Tokens
Define centrally:
- colors
- typography scale
- spacing
- radius
- shadows
- motion
- breakpoints
- z-index layers

Do not scatter magic values across components.

## 8. Performance
- route code splitting
- lazy media
- responsive image variants
- prefetch next reel selectively
- virtualization for long lists
- cursor pagination
- skeletons
- abort stale requests
- avoid unnecessary rerenders

## 9. Capacitor
Abstract browser/native boundaries:
- camera
- notifications
- share
- filesystem
- secure storage
- deep links

Do not write core business logic against Capacitor APIs.
