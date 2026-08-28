# LOKAYA BRAND IMPLEMENTATION INSTRUCTION

You are working on the Lokaya Social Commerce application.

Implement the Lokaya visual identity consistently throughout the existing application.

IMPORTANT:
Do not redesign the application architecture.
Do not rewrite unrelated components.
Do not replace existing functionality.
Do not introduce unnecessary dependencies.

First inspect the existing design system, Tailwind configuration, CSS variables, component library, typography setup, and theme implementation.

Then integrate the following brand system into the existing architecture.

==================================================
1. BRAND IDENTITY
==================================================

Brand:
LOKAYA

Tagline:
See It. Know It. Buy It.

Product positioning:
Social commerce + local commerce.

The visual identity should communicate:

- modern
- premium
- trustworthy
- social
- commerce
- Indian-rooted but globally usable
- clean
- editorial
- mobile-first

DO NOT make the UI look like a direct Instagram clone.

DO NOT use Instagram's purple/pink branding.

DO NOT use excessive gradients.

DO NOT use excessive rounded cards.

DO NOT make every element colorful.

The product photography/content should remain the visual hero.

==================================================
2. PRIMARY COLOR SYSTEM
==================================================

Primary Brand Navy:
#172554

Use for:
- primary text
- navigation
- headings
- logo lettering
- primary dark buttons
- important UI elements

Dark Navy:
#0F172A

Use for:
- very high emphasis text
- dark surfaces where required
- dashboard headings

Brand Orange:
#FF6B00

Use for:
- primary commerce actions
- Buy Now
- important CTA states
- selected states where appropriate
- brand accents

Brand Coral:
#FF4D6D

Use for:
- secondary brand accents
- social interaction highlights
- heart/like active state
- notification accents
- limited decorative emphasis

==================================================
3. BRAND GRADIENT
==================================================

Use this ONLY for specific brand elements:

linear-gradient(
  135deg,
  #FF6B00 0%,
  #FF4D6D 100%
)

Primary use:
- Lokaya logo O
- selected brand illustrations
- limited promotional elements
- selected hero accents

DO NOT use this gradient as:
- page background
- navigation background
- every button
- every card
- every heading
- random decoration

The gradient must remain visually special.

==================================================
4. APPLICATION COLORS
==================================================

Background:
#FAF9F6

Primary Surface:
#FFFFFF

Secondary Surface:
#F5F3EF

Border:
#E7E5E0

Primary Text:
#172554

Secondary Text:
#64748B

Muted Text:
#94A3B8

Success:
#16A34A

Warning:
#F59E0B

Error:
#DC2626

Info:
#2563EB

==================================================
5. TYPOGRAPHY
==================================================

Primary font:
Plus Jakarta Sans

Use Plus Jakarta Sans throughout the application.

Weights:

400 = regular
500 = medium
600 = semibold
700 = bold

Use:

400:
- body text
- descriptions
- captions

500:
- metadata
- navigation
- secondary labels

600:
- buttons
- product titles
- seller names
- section headings

700:
- major headings
- prices
- important totals
- dashboard metrics

Optional display font:
DM Serif Display

Use it VERY selectively.

Allowed:
- marketing hero headings
- campaign/editorial sections
- special promotional headings

Do NOT use DM Serif Display for:
- navigation
- product information
- checkout
- forms
- dashboards
- tables
- orders

The application should remain primarily Plus Jakarta Sans.

==================================================
6. LOGO
==================================================

The approved visual direction is a TEXT-BASED WORDMARK.

Brand:

LOKAYA

The wordmark should be the primary logo.

Do not create a complicated mascot or shopping-cart icon.

The logo should work independently without the tagline.

Logo structure:

LOKAYA

The O may use the Lokaya orange → coral gradient.

The A letters may contain the small brand accent dots as part of the wordmark treatment.

Tagline:

See It. Know It. Buy It.

The tagline is secondary and MUST NOT be used every time the logo appears.

==================================================
7. LOGO COLOR TREATMENT
==================================================

Default logo:

L = #172554
O = orange/coral gradient
K = #172554
A = #172554
Y = #172554
A = #172554

Optional accent dots:

First A:
#FF6B00

Second A:
#FF4D6D

Tagline:

"See It."
#172554

"Know It."
#FF6B00

"Buy It."
#FF4D6D

However, avoid excessive multicolor text in normal application UI.

The colorful tagline treatment is primarily for:
- brand presentation
- splash screen
- onboarding
- marketing pages

==================================================
8. BUTTON SYSTEM
==================================================

Primary commerce button:

Background:
#FF6B00

Text:
#FFFFFF

Hover:
slightly darker orange

Active:
slightly darker orange

Disabled:
use neutral disabled treatment

Example:

BUY NOW

Do NOT make every button orange.

Secondary button:

Background:
#FFFFFF
Border:
#E7E5E0
Text:
#172554

Tertiary button:
transparent
Text:
#172554

Danger:
#DC2626

==================================================
9. PRODUCT CARDS
==================================================

Product imagery must dominate.

Do not create heavy cards.

Preferred:

- white surface
- subtle border
- 14–16px radius
- minimal/no shadow
- strong image
- readable product name
- strong price
- seller identity
- clear CTA

Avoid:
- giant gradients
- excessive shadows
- unnecessary badges
- excessive rounded pills

==================================================
10. SOCIAL CONTENT
==================================================

The Home and Reels experiences should remain visually content-first.

Content:
- image/video first
- seller identity
- engagement actions
- product information
- commerce CTA

The product CTA should be clearly visible without overwhelming the content.

Example:

Product:
Premium Linen Shirt

₹1,499

[ BUY NOW ]

Use orange for the primary purchase action.

==================================================
11. SELLER PROFILE
==================================================

Seller storefront should feel like:

SOCIAL PROFILE
+
DIGITAL STORE

Use:
- large product imagery
- clean typography
- strong store identity
- rating
- product grid
- posts
- reels

Avoid making it look like an old-style e-commerce catalogue.

==================================================
12. STORES NEAR YOU
==================================================

This feature is strategically important.

Use the brand system to communicate:

LOCAL
TRUST
DISCOVERY
COMMERCE

Store cards should include:

Store name
Rating
Distance
Category
Open/closed state
Featured products

Primary actions:

VIEW STORE
GET DIRECTIONS

Do not overuse orange.

Use orange primarily for the main action.

==================================================
13. CHECKOUT
==================================================

Checkout must prioritize trust and clarity.

Use:

- white surfaces
- navy typography
- subtle borders
- orange primary CTA
- clear price hierarchy
- clear delivery information
- clear payment status

Avoid decorative visual elements.

The checkout should feel extremely reliable.

==================================================
14. SELLER DASHBOARD
==================================================

The Seller Workspace should use the same brand identity but feel more operational.

Primary:
#172554

Accent:
#FF6B00

Background:
#FAF9F6

Cards:
#FFFFFF

The dashboard should NOT look like Instagram.

It should look like a professional commerce management system.

==================================================
15. SPACING
==================================================

Use a consistent spacing scale.

Prefer:

4px
8px
12px
16px
20px
24px
32px
40px
48px
64px

Do not introduce arbitrary spacing values unless necessary.

==================================================
16. BORDER RADIUS
==================================================

Buttons:
10–12px

Inputs:
10–12px

Cards:
14–16px

Large containers:
18–24px

Bottom sheets:
24px+

Avatars:
50%

Do NOT turn everything into pill-shaped UI.

Pills should be reserved for:
- tags
- filters
- statuses
- compact metadata

==================================================
17. SHADOWS
==================================================

Prefer borders over heavy shadows.

Default cards:

border: 1px solid #E7E5E0

Use shadows only when elevation is meaningful:

- modal
- dropdown
- bottom sheet
- floating action

Avoid large decorative shadows.

==================================================
18. ICONOGRAPHY
==================================================

Use one consistent icon system.

Icons should be:
- simple
- outlined where appropriate
- consistent stroke width
- accessible

Do not mix multiple icon libraries without reason.

==================================================
19. MOBILE-FIRST
==================================================

Lokaya is mobile-first.

All screens must work properly at:

320px
375px
390px
414px
768px
1024px
1440px+

Touch targets should generally be at least 44px.

Bottom navigation should be optimized for thumb interaction.

==================================================
20. ACCESSIBILITY
==================================================

Maintain:

- WCAG-conscious contrast
- keyboard navigation
- visible focus states
- semantic HTML
- accessible labels
- screen-reader-friendly controls

Do not use color alone to communicate state.

==================================================
21. DARK MODE
==================================================

If dark mode already exists, adapt it rather than removing it.

Dark theme:

Background:
#0F172A

Surface:
#172033

Elevated Surface:
#1E293B

Primary Text:
#F8FAFC

Secondary Text:
#CBD5E1

Muted:
#94A3B8

Border:
#334155

Accent:
#FF6B00

Coral:
#FF4D6D

Maintain sufficient contrast.

==================================================
22. DESIGN TOKEN IMPLEMENTATION
==================================================

Do NOT scatter hexadecimal values throughout components.

Create centralized design tokens.

If Tailwind is being used, map the brand colors into the Tailwind theme.

If CSS variables already exist, extend them.

Preferred conceptual structure:

--color-brand-navy
--color-brand-orange
--color-brand-coral
--color-background
--color-surface
--color-surface-secondary
--color-border
--color-text-primary
--color-text-secondary
--color-text-muted
--color-success
--color-warning
--color-error
--color-info

Components should consume tokens rather than hardcoded colors.

==================================================
23. IMPLEMENTATION RULE
==================================================

Before changing code:

1. Inspect the existing theme system.
2. Inspect Tailwind/CSS configuration.
3. Inspect existing reusable components.
4. Identify duplicated styles.
5. Identify existing typography implementation.
6. Identify existing button/card/input components.
7. Determine the minimum set of changes required.

Then implement the brand system centrally.

Do NOT manually redesign every page independently.

Update shared primitives first.

Then update pages that use those primitives.

==================================================
24. VISUAL QUALITY BAR
==================================================

The final application should feel like a serious funded consumer product.

Target characteristics:

- premium
- restrained
- clean
- modern
- editorial
- trustworthy
- fast
- social
- commerce-first

Avoid:

- generic SaaS dashboard aesthetics in customer screens
- excessive gradients
- excessive shadows
- excessive rounded cards
- random colors
- inconsistent typography
- inconsistent spacing
- giant text
- visual clutter
- Instagram pixel-copying
- Amazon-like dense catalogue UI on social screens

==================================================
25. FINAL VALIDATION
==================================================

After implementation:

- run typecheck
- run lint
- run tests
- run build
- verify responsive layouts
- verify contrast
- verify logo rendering
- verify dark mode if present
- verify Buy Now CTA
- verify seller workspace
- verify checkout
- verify Explore
- verify Stores Near You

Ensure no existing business functionality is broken.

Do not report the task as complete merely because the build succeeds.

Perform a visual consistency review across the entire application.

Final result should feel like ONE BRAND:

LOKAYA

See It. Know It. Buy It.
