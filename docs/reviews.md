# Product Reviews

Customer reviews land on the PDP under the "Reviews" tab. They are stored in the API and moderated before publication.

## Data model

`ProductReview` (`packages/database/prisma/schema.prisma`):

| Field              | Notes                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `rating`           | Integer 1–5. Validated server- and client-side.                                                                           |
| `title`, `body`    | `body` required, `title` optional.                                                                                        |
| `verifiedPurchase` | Set true when the submitting customer has a PAID/FULFILLING/SHIPPED/COMPLETED order containing a variant of this product. |
| `status`           | `PENDING` / `PUBLISHED` / `REJECTED`. Only `PUBLISHED` rows are visible to the storefront.                                |
| `helpfulCount`     | Denormalised counter incremented by `ReviewHelpfulVote` rows.                                                             |

The `(productId, status, createdAt)` composite index serves the storefront list query.

A separate `ReviewHelpfulVote` table holds `(reviewId, customerId)` votes — composite PK enforces one vote per customer per review at the DB level.

## Backend services

- `ReviewsService.submit` — verifies the customer hasn't already submitted a non-rejected review for this product (`REVIEW_EXISTS` 409 if they have), checks purchase history to set `verifiedPurchase`, persists with `status = PENDING`.
- `ReviewsService.list` — published-only, paginated, newest first.
- `ReviewsService.summary` — `prisma.groupBy({ by: rating })` aggregated into `{ count, average, buckets: {'1'..'5'} }`.
- `ReviewsService.vote` — inserts a `ReviewHelpfulVote`. Prisma's P2002 (unique violation) becomes `ALREADY_VOTED` 409.

## Storefront

- `apps/web/components/pdp/reviews-section.tsx` — composes summary, list, vote button, and submission form.
- Submission form is only shown to authenticated customers (`useAuth().isAuthenticated`). Anonymous visitors see the list and a prompt to sign in.
- After submission a toast informs the customer that the review is awaiting moderation. The list does **not** optimistically include the pending review — it stays hidden until a moderator approves it.
- Helpful votes are optimistic in user feedback only (toast). The count refreshes on the next query revalidation.

## Buckets bar chart

Each rating bucket renders as a horizontal bar (`width: ${pct}%`). The bar uses `role="img"` with an `aria-label` describing the count, so screen-reader users get the numbers without having to parse the visual chart.

## Pagination

Page size is fixed at 5 reviews. Pagination is handled client-side via local state and the `page` query param sent to `/v1/storefront/reviews/products/:productId`.
