# Lokaya UI & UX Principles

Based on our `DESIGN.md` guidelines and the implemented components across our core screens, here are the established UI/UX principles and patterns for the Lokaya application.

## 1. The Home Screen (Social Feed)
**Goal:** Hook the user with rich visual content while subtly embedding commerce action paths.
- **Content-First:** The primary interface is an immersive, vertically scrolling feed (`SocialPost`) mimicking popular social media apps. 
- **Rich Media & Gestures:** Posts utilize edge-to-edge images and carousels, reducing UI chrome to let the content breathe.
- **Commerce Hooks:** Each post seamlessly integrates product chips or "Buy Now" overlays, ensuring a direct path from discovery to purchase without leaving the social experience.
- **Micro-Interactions:** Quick engagement features (StoriesBar at the top, like/comment actions) are prominent and use familiar iconography.

## 2. The Explore Screen (Discovery)
**Goal:** Provide structured, searchable discovery for users with a higher shopping intent.
- **Search as the Anchor:** A prominent, pill-shaped sticky search bar sits at the top.
- **Categorization via Visuals:** Categories are presented in horizontal, snap-scrolling carousels with strong iconography and imagery (`MOCK_CATEGORIES`).
- **Dynamic Merchandising:** Promotional banners (`Summer Sale`, `New Arrivals`) use a card-based snap-scroll layout (`snap-x snap-mandatory`) with vivid backgrounds, establishing a "marketplace" feel.
- **Trending & Filters:** Fast, tap-friendly filter pills (Trending Searches) and a sticky filter/sort bar (`top-[56px]`) ensure the user can refine large catalogs easily as they scroll down into the product grid.

## 3. The Search Screen
**Goal:** Deliver instantaneous, highly relevant results with minimal friction.
- **Active States:** The search input should immediately command focus. Recent searches and trending terms are presented as quick-tap pills.
- **Results Grid:** When results populate, they utilize a masonry or standardized grid (like in Explore) to showcase product photography effectively.
- **Empty States:** "No results found" screens use warm, conversational copy and suggest alternative categories or trending products to prevent dead-ends.

## 4. The Profile Screen
**Goal:** Serve as the unified dashboard for personal identity, commerce history, and seller transition.
- **Action Hierarchy:** Primary actions (like "Set Up Your Shop Now" or "Seller Dashboard") are highlighted with the primary brand color (Coral `#FF5A36`).
- **Data Organization:** Order history (`My Orders`), quick links (`My Addresses`, `Payment Methods`), and account settings are separated into distinct, card-like surface areas with rounded corners (`rounded-2xl`, `rounded-3xl`) and subtle borders (`border-[#E5E2DC]`).
- **Visual Identity:** The user's avatar and basic details sit at the very top, reinforcing the social aspect of the app.

## 5. The Product Detail Page (PDP)
**Goal:** Provide absolute clarity on product value, seller trust, and the final purchase action.
- **Immersive Imagery:** The product gallery takes up the top half of the screen, often utilizing full-width swipeable carousels.
- **Clear Typography Hierarchy:** Product Title (`Plus Jakarta Sans`, 600) and Price (`tabular-nums`, 700) are immediately visible below the images.
- **Social Proof & Trust:** Ratings, reviews, and the seller's verification badge (`isVerified`) are displayed near the price to build confidence.
- **Sticky Commerce Action:** A sticky bottom bar (`StickyBottomBar`) containing the "Add to Cart" or "Buy Now" button ensures the primary conversion action is always accessible, regardless of scroll depth.

## Summary of Core Development Patterns
1. **Layout & Spacing:** We rely heavily on `max-w-md` for mobile-only flows and `max-w-7xl` with responsive padding (`p-4 md:p-6`) for adaptive layouts. 
2. **Surfaces & Borders:** We use `bg-[#FAF9F6]` (Warm White) for the main background and `bg-[#FFFFFF]` for cards/surfaces, separated by a 1px border (`border-[#E5E2DC]`). We avoid heavy drop shadows.
3. **Typography:** `Plus Jakarta Sans` is strictly used for readable UI text, while `DM Serif Display` is reserved exclusively for large promotional headers.
4. **Primary Actions:** `#FF5A36` (Coral) is used carefully and selectively—only for the most critical actions on the screen to draw immediate attention.
