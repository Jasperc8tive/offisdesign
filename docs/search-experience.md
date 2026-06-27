# Search Experience

Search lives in two places: the **overlay** (top drawer triggered from the
header) and the **results page** (`/search`). Both consume
`/v1/storefront/search` through the same service.

## Overlay

`components/chrome/search-overlay.tsx`:

- Triggered by the magnifier icon in the header on every viewport.
- Renders inside the shared `<Drawer side="top">` for consistent
  focus-trap, Esc, and body-scroll-lock behaviour.
- The input takes focus on open and clears its value (the URL state on
  `/search` is the source of truth, not the overlay).

### Keyboard navigation

- `↓` / `↑` move through suggestions; the focused item gets the
  `bg-primary-subtle` style and `aria-selected="true"`.
- `Enter` while a suggestion is focused navigates to that product;
  `Enter` from the input submits the query to `/search?q=…`.
- `Escape` closes the overlay.

The overlay annotates its `<Input>` with `aria-autocomplete="list"`,
`aria-expanded`, and `aria-activedescendant`. Suggestions render in a
`role="listbox"` parent with `role="option"` children.

### Recent searches

`useRecentSearches()` (`lib/local-store/recent-searches.ts`) backs the
overlay's "Recent" section:

- Stored as a JSON array of strings at `offis:recent-searches:v1`.
- Capped at 8 entries. The most recent is always at the head.
- A clicked or submitted query is pushed to the front and dedup'd.
- Per-row `×` removes a single entry; "Clear" wipes the list.
- Hydrates on mount; subscribes to cross-tab updates via `storage` event.

### Empty suggestions

When the input is below 2 characters and there are no recent searches,
the overlay shows a small set of curated suggestions (`Sofas`, `Dining
tables`, `Walnut`, `Workspace`, `Storage`). Clicking one drives the same
flow as typing it.

## Results page

`app/(shop)/search/page.tsx`:

- Reads filters from the URL with `parseFilters`.
- The search bar is uncontrolled until submit; pressing Enter pushes
  `q` into the URL via `serializeFilters` and the React Query key changes,
  triggering a refetch.
- Sort, pagination, facet clicks all push fresh URLs — the back button
  returns you to the previous filter set.
- Empty query → empty result UI with a helpful prompt.
- Empty matches for `q` → "No matches for ‹q›" + clear filters CTA.
- Active facets render as removable `<Tag>` chips at the top of the page.

## Facets

`<FilterSidebar>` reads the same response.facets the backend returned —
collections, categories, tags, plus price min/max inputs. Hidden facets
are toggled per surface (collection page hides the `collection` facet
because the page already scopes by it).

## Analytics

| Event                                            | When                                                          |
| ------------------------------------------------ | ------------------------------------------------------------- | -------------------------- |
| `search_submitted { q }`                         | search overlay submit, search bar submit, recent search click |
| `search_filter_changed { facet, value }`         | every facet bucket click + price range change                 |
| `search_paginated { page }`                      | results page pagination                                       |
| `product_click { ..., location: 'search_overlay' | 'search' }`                                                   | autocomplete or grid click |
| `nav_clicked { ..., surface: 'header' }`         | header search icon                                            |

## Architectural rule

The frontend never ranks, filters, or paginates results — every query
includes the URL filter set and the backend returns hits + facets. The
overlay's keyboard handling and the results page's URL/QueryClient sync
are presentation concerns only.
