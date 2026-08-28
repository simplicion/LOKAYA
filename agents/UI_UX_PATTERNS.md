# Lokaya UI & UX Patterns (Buyer App)

This document is the absolute source of truth for the structure, flow, and UI patterns of the main buyer-side pages in the Lokaya application. It builds upon the aesthetic foundations set in `DESIGN.md`.

Whenever you are building or refactoring a buyer page, you MUST reference this document.

---

## 1. General Principles
- **Container Strategy**: Mobile-first layout wrapping. Use `max-w-md mx-auto` or `max-w-7xl mx-auto` depending on whether it's a mobile-only view (like Reels) or a responsive grid.
- **Header Stickiness**: Use `sticky top-0 z-40 bg-white/80 backdrop-blur-md` for headers to maintain context without completely blocking the scrolled content beneath.
- **Bottom Navigation Safe Area**: Always include `pb-20 md:pb-0` on the main container to ensure the mobile bottom nav doesn't overlap content.
- **Micro-Interactions**: Use `active:scale-95 transition-transform` on highly tapped buttons.

---

## 2. Home Page (Social Feed)
**Goal:** An immersive, infinite-scrolling feed mimicking Instagram, but with integrated commerce.

### Structure
- **Stories Bar**: Horizontal scrolling carousel (`overflow-x-auto snap-x`) at the top, just below the header.
- **Feed Posts**:
  - Full-width images on mobile (`-mx-4` or no horizontal padding).
  - Clean metadata below the image: Store Name, Product Title, Price.
  - Interactive Action Bar: Like, Comment, Share icons on the left; **"Buy Now" / "View Product" button (`bg-[#FF5A36] text-white`) on the right**.
- **Performance**: Must utilize virtualization or infinite query fetching (e.g., RTK Query `useInfiniteQuery`) for smooth scrolling.

---

## 3. Explore & Search Pages
**Goal:** Category discovery and high-intent searching with minimal friction.

### Explore Structure
- **Search Header**: Sticky pill-shaped search input (`rounded-full bg-[#F2EFE9]`).
- **Category Carousel**: Quick-tap visual categories in a horizontal snap-scroll list.
- **Promotional Banners**: Snap-scroll cards (`snap-center`) with vibrant backgrounds (not just white) to break up the monotony.
- **Product Grid**: A 2-column grid on mobile (`grid-cols-2 gap-3`), 4-column on desktop. 
  - Product cards must have `rounded-2xl` images and minimal padding.

### Search Structure
- **Immediate Focus**: The search input should be `autoFocus` (when appropriate) on the dedicated search page.
- **Suggestions**: Display "Trending Searches" and "Recent Searches" as wrap-around pills before the user types.
- **Filters**: Sticky filter bar (`top-[60px]`) containing quick-sort options (Price, Rating, Distance).

---

## 4. Reel Page (Short-form Video)
**Goal:** High-engagement video discovery leading to impulse purchases.

### Structure
- **Snap Scrolling**: The main container MUST use `snap-y snap-mandatory h-[calc(100vh-4rem)] overflow-y-scroll`.
- **Video Player**: Each reel takes up `h-full w-full snap-start relative`.
- **Overlays**:
  - Right-side action column (absolute positioned): Like, Comment, Share, Profile.
  - Bottom-left metadata (absolute positioned): Username, caption.
- **Commerce Hook**: A prominent, animated "Product Link" chip that floats above the bottom metadata. Tapping it opens a Bottom Sheet (`Drawer`) with the product details and a "Buy Now" button.

---

## 5. Nearby Page
**Goal:** Location-based discovery of local stores and fast-delivery items.

### Structure
- **Map View (Optional/Toggleable)**: A visual map showing store pins.
- **Store Cards**: Horizontal list of stores sorted by distance.
  - **Metadata**: Store Name, Rating, Distance (e.g., "1.2 km away"), Estimated Delivery Time (e.g., "Delivery in 30 mins").
  - **Trust Signals**: Display `Verified` badges (`isVerified` flag) prominently.
- **Permissions State**: Must gracefully handle the case where Location Services are denied (e.g., an empty state prompting them to enter a zip code manually).

---

## 6. Cart & Checkout
**Goal:** Absolute clarity, trust, and frictionless conversion.

### Cart Structure
- **Items List**: Clean cards for each store (if multi-store cart) or each item. Ensure easy Qty manipulation (+/- buttons).
- **Sticky Summary**: A `fixed bottom-0` (above nav) or `sticky bottom-safe` bar containing the Total Price and the primary "Proceed to Checkout" button (`bg-[#FF5A36] w-full py-4 rounded-xl font-bold`).

### Checkout Structure
- **Step-by-Step or Accordion**: Keep billing, shipping, and payment cleanly separated.
- **Security Signals**: Use padlock icons and "Secure Checkout" text.
- **Final Action**: The final "Pay Now" button must be the most prominent element on the screen, isolated from distractions.

---

## 7. Seller App (Dashboard & Management)
**Goal:** Clean, data-rich, and minimalist management interface that feels premium and frictionless.

### Aesthetic Foundation (The "Clean White" Theme)
- **Backgrounds**: Embrace stark white (`bg-white` or `#FFFFFF`) for the main container and backgrounds. Avoid large blocks of heavy colors (like the old solid orange headers).
- **Subtle Dividers**: Use faint borders (`border-[#F2EFE9]` or `border-[#E5E2DC]`) to separate content instead of heavy drop shadows or thick borders.
- **Typography**: 
  - Bold, high-contrast text (`#171717`) for primary values, prices, and titles.
  - Soft gray (`#6B6B6B`) for secondary text, labels, and SKUs.
- **Micro-Color Indicators**: Use color sparingly but deliberately for status indicators (e.g., green `text-green-500` for Active/Positive trends, orange `text-orange-500` for Low Stock/Warnings).

### Component Patterns
- **Top Headers (Expanding Search)**: Universal header featuring icon buttons (Hamburger Menu, Search, Add/Plus) flanking a bold page title. The Search icon, when clicked, hides the header content and smoothly replaces it with a full-width search input (`bg-[#F9F9F9] rounded-full`) to filter the current page content dynamically.
- **Stat Cards (Dashboard)**: Square or rectangular cards with a clean border. Include the label (gray), the main value (bold black), and a green percentage trend badge.
- **Tabs / Categories**: Scrollable horizontal list of pill-shaped tabs (`rounded-full`). The active state is dark (`bg-[#171717] text-white`), while inactive states have no background with gray text.
- **Filters**: Filter buttons are circular and placed adjacently to the tabs section (no standalone search bars in the body content).
- **List Layouts (Products/Orders)**: Avoid heavy wrapping cards. Instead, use a continuous white list separated by single horizontal lines.
  - Left side: Square/rounded image (`rounded-2xl bg-[#F2EFE9]`).
  - Right side: Stacked details (Title, 3-dots menu, SKU, Price, Status Badge).
