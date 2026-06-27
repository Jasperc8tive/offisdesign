# Component Inventory — Branch Furniture

> Observed UI components, grouped for a component-driven rebuild (React + Tailwind + shadcn/Framer).

## Global / chrome

- **AnnouncementBar** — rotating messages (free shipping $90+, review count).
- **Header** — sticky, condenses on scroll; logo, primary nav, search/account/cart icons.
- **MegaMenu** — desktop image-rich category panels ("Shop By" / "Explore"); DTC vs Business.
- **MobileNav** — full-screen drawer, 32px headers / 18px links; links use **primary `#B81F34`**.
- **Footer** — columns: About / Support / Account / Social; country selector; newsletter.
- **AudienceSwitch** — DTC ↔ Branch Business callout.

## Commerce

- **ProductCard** — image (+ variant swatches/image-swap), title, price (strike-through on sale),
  badges (SAVE %, New colors, Bestseller, New).
- **ProductGrid** — responsive collection grid.
- **CollectionToolbar** — sort + filters (facets: type, color/material, price, etc.).
- **Pagination / InfiniteScroll**.
- **ProductGallery** — multi-image, zoom; **VariantSelector** (color/material/size).
- **PriceBlock** — lining numerals, compare-at price, discount.
- **QuantityStepper**, **AddToCart** (loading state), **BuyNow**.
- **CartDrawer** — line items, qty, subtotal, shipping-threshold progress, upsells.
- **QuickView** modal.
- **Recommendations / RelatedProducts / RecentlyViewed** rails.
- **ReviewsBlock** (rating stars, review count, UGC).
- **Wishlist** toggle.

## Content / editorial

- **Hero** (video/image, headline, dual CTA).
- **ImageTextSideBySide** (`image-text-side-by-side__section` observed) — alternating editorial.
- **LogoCarousel** (press/social proof, Swiper).
- **TrustBadges** (`custom-trust_badge_section`).
- **SocialProof** (`section-social-proof`) — stats, reviews.
- **SpacesShowcase** — persona/room editorial pages.
- **QuizFunnel** — multi-step "Design my office".
- **BlogList / ArticleCard / ArticlePage** (Journal).
- **FAQ accordion**, **Tabs**, **Breadcrumbs**.

## Forms

- Newsletter, Contact, Account (login/register/reset), Address book, Checkout fields.
- Built on React Hook Form + Zod; inputs radius 4px, label-for associations.

## Primitives / tokens

> All primitives consume brand tokens ([color-system.md](color-system.md)) — **no hardcoded hex**.
> Buttons use `primary #B81F34`; headings/titles `secondary #410C14`; hover/borders/inputs/focus
> `accent #350D13`; surfaces `background #FEFEFE`; body `text #410C14`.

- **Button** (primary `#B81F34` w/ `#FEFEFE` label / secondary outline / link), radius 4px,
  hover → `--primary-hover`, focus ring `--focus-ring`, loading + disabled states.
- **Badge / Tag**, **Skeleton** (loading), **Drawer**, **Modal**, **Accordion**, **Carousel**.
- **Reveal** (scroll animation wrapper — see [animations.md](animations.md)).

## Reuse principle

Catalog grid, product card, rails, and CMS section blocks are the high-leverage reusable units.
CMS pages should compose from a registry of **section blocks** (hero, side-by-side, grid, carousel,
trust, FAQ) so editorial pages need no bespoke code.
