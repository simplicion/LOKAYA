# Design System & UI/UX Guidelines

## 1. Core Philosophy
"Scan Products. Sell Locally. Deliver Faster."

The application targets local retail sellers and buyers. It must remove friction and present a UI that builds trust immediately. The aesthetic combines the data-density of Shopify/Linear with the clinical precision and trust of Stripe.

## 2. Global Aesthetics
- **Theme**: STRICTLY Light Mode Only. No dark mode toggles.
- **Layout**: Massive whitespace, avoiding dense borders. Containers should breathe.
- **Shapes**: Soft rounded corners (e.g., `rounded-2xl` or `rounded-xl`).
- **Depth**: Soft, diffused drop shadows. Elevation should imply hierarchy (e.g., hovering a card lifts it gently).
- **Glassmorphism**: Used sparingly for sticky headers, floating analytics widgets, and notifications (backdrop-blur).

## 3. Color Palette
*   **Backgrounds**:
    *   App Background: `#FDFDFD` or `#FAFAFA`
    *   Card Background: `#FFFFFF`
*   **Primary Accent (The "Fintech" Pop)**:
    *   Primary: `#533AFD` (Deep, vibrant purple)
    *   Primary Hover: `#432EE6`
*   **Secondary/Gradients**:
    *   Subtle Orange/Peach gradient accents used for success states or highlighting premium features (`from-[#FF8C42] to-[#FF5E62]`).
*   **Typography & Borders**:
    *   Text Primary: `#111827` (Gray 900)
    *   Text Secondary: `#6B7280` (Gray 500)
    *   Borders: `#E5E7EB` (Gray 200 - Very thin, 1px max).

## 4. Typography
- **Font Family**: `Inter`, `Geist`, or `Outfit` (Modern Sans-serif).
- **Headers**: Tight tracking (letter-spacing), bold weights (600/700).
- **Body**: Highly legible, standard line-heights.

## 5. UI Components (shadcn/ui customized)
*   **Cards**: White background, `border border-gray-100`, `shadow-sm`, `rounded-xl`.
*   **Buttons**:
    *   Primary: Solid purple background, white text, subtle purple shadow on hover.
    *   Secondary: White background, thin gray border, text gray-700, hover background gray-50.
*   **Inputs/Forms**: Floating labels or minimal placeholders. Focus state uses a soft purple ring.
*   **Tables (Inventory)**: Clean rows, sticky headers. Hovering a row applies a very faint gray background (`bg-gray-50`). Status pills for stock (e.g., Green for In Stock, Red for Low Stock).

## 6. Micro-Interactions & Animations (Framer Motion)
- **Page Transitions**: Soft fade in and slight vertical slide (`y: 10` to `y: 0`, `duration: 0.3`).
- **Hover States**: Cards elevate slightly (`y: -2`) and cast a larger, softer shadow.
- **Success States**: When scanning a QR successfully, trigger a subtle confetti burst or a smooth pulsing green ring around the scanner UI.
- **Skeleton Loading**: Instead of spinners, use pulsing skeleton blocks for inventory loading to make the app feel instantly responsive.

## 7. Key Screens Visualized
*   **Seller Dashboard**: Top row consists of 4 glassmorphic metric cards (Today's Orders, Revenue, Pending Pickups, Low Stock). Below is the main Inventory Table.
*   **QR Scanner Screen**: Full-screen camera view with a clean, semi-transparent overlay framing the scan area. A floating action button to close or manually enter SKU.
*   **Buyer QR Pickup Screen**: Extremely minimal. A large, high-resolution QR code centered on the screen with a soft purple glowing gradient behind it. Order number displayed clearly above.
