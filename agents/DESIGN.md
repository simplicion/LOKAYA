# Design System & Principles

## 1. Design Philosophy
Our visual identity communicates **Social + Premium + Trust + Commerce**. 
The core aesthetic is **Premium Editorial Commerce** – combining Instagram's content density, Apple's cleanliness, modern fashion-commerce photography, and Amazon's transactional clarity.

- **Strategic Differentiation:** Instagram-like discovery, but *every piece of content can become a storefront*. The design must have a subtle commerce signature (e.g., Reel → product chip → product detail → Buy Now) rather than just driving engagement.

## 2. Design Principles
- **Content-First:** The content is the hook; commerce is the conversion. The product imagery should provide the visual richness, not the UI chrome.
- **Commerce-Focused:** Primary commerce actions (like "Buy Now") must be aggressive and immediately recognizable.
- **Minimal & Restrained:** Use plenty of whitespace. Keep shadows extremely subtle (prefer borders over huge shadows).
- **High-Trust & Warm:** Avoid stark, clinical whites. Use warm tones to give a premium editorial feel and enhance product photography.
- **Mobile-First:** Tailored for mobile interactions with appropriate hit areas and spacing.

## 3. Design Tokens

### Brand Colors
- **Primary Accent:** `#FF5A36` (Coral/Orange) 
  - *Usage:* Buy Now, Add to Cart emphasis, active states, notification badges, selected filters, important interactive elements. It carries high commerce energy.
- **Primary:** `#171717` (Deep Charcoal) 
  - *Usage:* Primary buttons, navigation emphasis, headings, seller actions.

### Surfaces (Warm-Light Theme)
- **Background:** `#FAF9F6` (Warm White) 
  - *Usage:* Main app background. Gives a premium editorial feel and makes product photography look better than pure white.
- **Surface:** `#FFFFFF` (Pure White)
- **Secondary Surface:** `#F2EFE9` (Soft Beige) 
  - *Usage:* Cards, input backgrounds, seller sections, filter containers, subtle separators.

### Text
- **Primary:** `#171717` (Deep Charcoal)
- **Secondary:** `#6B6B6B`
- **Muted:** `#999999`

### Border & Shadows
- **Default Border:** `#E5E2DC`
- *Philosophy:* Keep shadows extremely subtle. Prefer `border: 1px solid #E5E2DC` over huge drop shadows. 

### Semantic Colors
*Note: Do not use these as branding colors. They are purely semantic.*
- **Success:** `#16845B`
- **Warning:** `#C78300`
- **Error:** `#D64545`
- **Info:** `#2563EB`

### Dark Mode (Future Implementation)
- **Background:** `#111111`
- **Surface:** `#1A1A1A`
- **Text:** `#F5F5F5`
- **Muted:** `#A1A1A1`
- **Border:** `#2A2A2A`
- **Accent:** `#FF5A36` (Coral remains)

## 4. Typography
- **Primary Typeface:** **Plus Jakarta Sans** (Fallback: system-ui, sans-serif) 
  - *Usage:* Used for 90% of the app (Navigation, Buttons, Product names, Prices, Seller names, Feed captions, etc.) to give a premium personality.
- **Editorial Typeface:** **DM Serif Display** 
  - *Usage:* Use sparingly for large promotional headlines, collection titles, campaign banners, and empty-state marketing moments.
  - *Constraint:* Do not use DM Serif for normal product information. It reduces scannability.

### Typography Hierarchy

| Element | Font | Weight | Size |
| :--- | :--- | :--- | :--- |
| Display | DM Serif Display | Regular | 36–48px |
| H1 | Plus Jakarta Sans | 700 | 28–32px |
| H2 | Plus Jakarta Sans | 700 | 22–24px |
| H3 | Plus Jakarta Sans | 600 | 18–20px |
| Product title | Plus Jakarta Sans | 600 | 16–18px |
| Body | Plus Jakarta Sans | 400 | 14–16px |
| Caption | Plus Jakarta Sans | 400 | 13–14px |
| Price | Plus Jakarta Sans | 700 | 17–20px (Use `tabular-nums`) |
| Button | Plus Jakarta Sans | 600 | 14–16px |
| Navigation | Plus Jakarta Sans | 500–600 | 12–14px |
| Seller handle | Plus Jakarta Sans | 500 | 13–14px |

### Anti-Patterns
- **❌ DO NOT USE:** Poppins, Montserrat, Roboto, Lato.
- **❌ DO NOT USE:** 3+ font families, decorative fonts, excessive bold text, or all-caps UI everywhere.

## 5. UI Components & Styling

### Border Radius
*Avoid making everything a giant pill. Instagram-style excessive circular UI isn't appropriate for everything.*
- **Buttons:** 10–12px
- **Cards:** 14–18px
- **Images:** 12–16px
- **Inputs:** 10–12px
- **Bottom Sheet:** 24px
- **Avatar:** 50% (Circular)

### Key Components

**The Feed**
Content should dominate. Don't turn every post into an Amazon product card. Let the image breathe and use simple, clean metadata below it.
```text
┌─────────────────────────┐
│ Store Name        ⋯     │
│                         │
│      PRODUCT IMAGE      │
│                         │
│ ♡  💬  ↗               │
│                         │
│ Product Name            │
│ ₹1,499                  │
│                         │
│ [       BUY NOW       ] │
└─────────────────────────┘
```

**Buy Now Button**
- **Color:** Coral (`#FF5A36`) with White text.
- **Shape:** Rounded but not excessively pill-shaped.
- **Visibility:** Must stand out immediately from the rest of the UI. Do not make it black; the user needs to immediately understand the primary commerce action.

**Seller Profile**
- Must feel more like a storefront than a traditional social-media profile.
- Use ample whitespace.
- Clearly delineate actions (Follow vs. Shop) and content types (Posts, Reels, Products).
```text
        ◯
     Store Logo

     Urban Threads
     @urbanthreads

     ★ 4.8  •  12.4K followers
     Premium streetwear...
     
     [ Follow ] [ Shop ]
     Posts     Reels     Products
```
