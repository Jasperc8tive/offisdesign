# Navigation

All navigation surfaces are CMS-driven and live in
`apps/web/components/chrome/`. A single `<Drawer>` primitive powers every
overlay so accessibility behaviour stays consistent.

## Surfaces

| Surface            | Component               | Data                                        |
| ------------------ | ----------------------- | ------------------------------------------- |
| Announcement bar   | `AnnouncementBar`       | `useAnnouncements()` (live window-filtered) |
| Desktop header nav | `Header` (`DesktopNav`) | `useNavigation('header')`                   |
| Mobile menu        | `MobileNav`             | `useNavigation('header')`                   |
| Search overlay     | `SearchOverlay`         | `useAutocomplete(q)`                        |
| Cart drawer        | `CartDrawer`            | `useCart()` (provider)                      |
| Account button     | `Header`                | `useAuth()`                                 |
| Footer columns     | `Footer`                | `useNavigation('footer')`                   |

## CMS navigation shape

`Navigation` rows store an `items` JSON tree. The frontend parses it
defensively — any node missing `label` is filtered out. The current
contract:

```ts
type NavItem = {
  label: string;
  href: string;
  /** Optional second level — used by the mobile drawer and a future mega menu. */
  children?: NavItem[];
};
```

When `useNavigation('header')` returns an empty list (no CMS shipped yet),
the desktop nav falls back to four sensible defaults; the mobile drawer
shows a "navigation is being prepared" notice instead of a blank screen.

The footer renders one column per **top-level** item:

```ts
type FooterGroup = { label: string; children?: NavItem[] };
```

When the footer is empty, a brand copyright line is shown instead.

## Drawer primitive

`Drawer({ open, onClose, side, label, title, children })`:

- Renders into the modal z-index band with a backdrop click-to-close.
- Side: `left` (mobile menu), `right` (cart), `top` (search).
- `Escape` closes; body scroll is locked while open; focus moves into the
  dialog and returns to the trigger on close.
- `role="dialog" aria-modal="true" aria-label="…"`.

This is the only new piece of structural UI introduced in Stage 9 — all
visible content remains design-system primitives (`Container`, `Cluster`,
`Stack`, `Icon`, `Button`, etc.).

## Header behaviour

- Sticky, with backdrop blur so content scrolls beneath.
- Skip-to-content link at the top of the layout.
- Mobile menu button visible below `md`; desktop nav visible at `md+`.
- Cart badge counts items via `useCart().itemCount` — derived from the
  React Query cache, optimistically updated on every cart mutation.
- Account button routes to `/account` when signed in, `/account/login`
  otherwise (auth state from `useAuth()`).

## Analytics

Every navigation action fires a typed event:

- `nav_clicked { label, href, surface: 'header' | 'mobile' | 'footer' }` —
  on every link click.
- `cart_opened { trigger: 'header' }` — when the cart drawer opens from the
  header button.
- `search_submitted { q }` — when the search overlay submits.
- `product_click { productId, slug, location: 'search_overlay' }` — when an
  autocomplete hit is clicked.
- `cta_click` for the announcement bar's link target.

## Mobile vs desktop

- Below `md`: hamburger opens `<MobileNav>` (left drawer). Desktop nav is
  hidden.
- `md` and up: full inline nav. The mobile button is hidden.
- Search and cart icons are always available; their overlays are
  consistent on every viewport.

## Future seams

- Mega menu (CMS `mega_menu` block on the navigation tree) — `NavItem.children`
  is already in the contract; the desktop `<Header>` renders only the
  top level today.
- Search results in the overlay (currently autocomplete only) — would
  swap `useAutocomplete` for `useSearch` with a debounced query.
- Account drawer (signed-in customers) — would replace the icon link with a
  trigger that opens a right-side drawer showing recent orders + sign out.
