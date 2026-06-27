# Component Inventory

Living catalogue of every component in `@offisdesign/ui`. Every component must
have an entry here before it lands in a feature.

For each entry: **Purpose · Props · Variants · States · Dependencies ·
Accessibility · Storybook · Future usage**.

Inherited from Stage 3.5b (foundation): `ThemeProvider`, `Heading`, `Text`,
`Display`, `Icon`, `Container`, `Stack`, `Cluster`, `Grid`, `Box`, `Spacer`,
`AspectRatio`, `VisuallyHidden`, `Divider`. See
`docs/design-system-foundation.md` for those.

This document covers components introduced in **Stage 3.5c**.

---

## 1. Atomics

### Button

- **Purpose** — Primary call to action, including form submission and link-styled actions.
- **Props** — `variant`, `size`, `fullWidth`, `loading`, `leadingIcon`, `trailingIcon`, plus all native `<button>` attributes.
- **Variants** — `primary` (default), `secondary`, `outline`, `ghost`, `link`.
- **States** — Idle, hover, active, focus-visible, disabled, loading (busy + spinner).
- **Dependencies** — Tailwind preset tokens; no JS deps.
- **Accessibility** — Native `<button>`, `aria-busy` while loading, focus ring meets AA via `shadow-focus`. Keyboard support inherits from `<button>` (Space/Enter).
- **Storybook** — `Components/Atomics → Buttons`.
- **Future usage** — Every CTA on the site (Add to bag, Continue, Subscribe), modals, forms.

### Badge

- **Purpose** — Static label for status, category, or count.
- **Props** — `variant`.
- **Variants** — `primary`, `secondary`, `outline`, `muted`.
- **States** — Static only.
- **Dependencies** — None.
- **Accessibility** — Treated as inline text. Add `role="status"` or visually-hidden context when used to convey live state.
- **Storybook** — `Components/Atomics → Badges`.
- **Future usage** — "New", "Sale", "Limited", product flags, navigation count indicators.

### Tag

- **Purpose** — Removable filter chip / facet pill.
- **Props** — `onRemove`, `removeLabel`, child content.
- **Variants** — Single visual style (chip).
- **States** — With/without remove button.
- **Dependencies** — `lucide-react` (X icon).
- **Accessibility** — Remove control is a `<button>` with `aria-label`; full keyboard support.
- **Storybook** — `Components/Atomics → Tags`.
- **Future usage** — Active filters on PLP, selected swatches summary, search refinements.

### Card / CardHeader / CardBody / CardFooter

- **Purpose** — Surface group with optional interactive behaviour.
- **Props** — `as`, `interactive`. Sub-parts are layout-only.
- **Variants** — Static / interactive.
- **States** — Idle, hover, focus-visible (only when `interactive`).
- **Dependencies** — None.
- **Accessibility** — When `interactive`, callers MUST add `tabIndex={0}` and an `onClick`/keyboard handler, or wrap in a link. Card itself remains styled markup.
- **Storybook** — `Components/Atomics → Cards`.
- **Future usage** — Product cards, content cards, journal entries, settings panels.

### Avatar

- **Purpose** — Represent a person or brand with image + initials fallback.
- **Props** — `src`, `alt`, `initials`, `size`.
- **Variants** — Sizes `sm | md | lg | xl`.
- **States** — Loading, loaded, image error → fallback initials.
- **Dependencies** — None.
- **Accessibility** — `alt` required when `src` is set; initials hidden from AT when image succeeds.
- **Storybook** — `Components/Atomics → Avatars`.
- **Future usage** — Account header, testimonial author, admin user list.

### Skeleton

- **Purpose** — Loading placeholder.
- **Props** — `rounded`, plus all `<div>` attributes for sizing.
- **Variants** — `sm | md | full` rounding.
- **States** — Animated pulse.
- **Dependencies** — Tailwind `animate-pulse`.
- **Accessibility** — `role="status"` + `aria-busy` so AT users know content is loading.
- **Storybook** — `Components/Atomics → Skeletons`.
- **Future usage** — PLP/PDP loading shells, dashboard widgets.

---

## 2. Navigation

### NavLink

- **Purpose** — Styled navigation anchor with active indicator.
- **Props** — `active`, native `<a>` attributes.
- **Variants** — Static visual; `active` toggles state.
- **States** — Idle, hover (underline grows), active (`aria-current="page"`), focus-visible.
- **Dependencies** — None. Pair with Next.js `<Link>` via `legacyBehavior` or wrap.
- **Accessibility** — `aria-current="page"` on active; underline animation also conveys state.
- **Storybook** — `Components/Navigation → NavLinks`.
- **Future usage** — Header primary nav, footer columns, account sidebar.

### Breadcrumb

- **Purpose** — Hierarchical location indicator.
- **Props** — `items` (label + optional href), `separator`.
- **Variants** — Custom separator.
- **States** — Last item rendered as `aria-current="page"`.
- **Dependencies** — `lucide-react` (ChevronRight default).
- **Accessibility** — `<nav aria-label="Breadcrumb">` + `<ol>` semantics.
- **Storybook** — `Components/Navigation → Breadcrumbs`.
- **Future usage** — PLP/PDP, journal article header, admin object pages.

### Tabs / TabList / Tab / TabPanel

- **Purpose** — Switch between sibling content panels.
- **Props** — `Tabs`: `defaultValue`, controlled `value`/`onValueChange`. `Tab`: `value`. `TabPanel`: `value`. `TabList`: `label`.
- **Variants** — Single horizontal style (border-bottom + active underline).
- **States** — Selected, idle, hover, focus-visible, disabled (via native).
- **Dependencies** — React context.
- **Accessibility** — Proper `role="tablist|tab|tabpanel"`, `aria-selected`, `aria-controls`, roving `tabIndex`. Keyboard: Tab to focus the active tab; click/Enter/Space activate.
- **Storybook** — `Components/Navigation → TabsExample`.
- **Future usage** — PDP product info, account sections, admin entity editor.

### Pagination

- **Purpose** — Page navigation for lists.
- **Props** — `page`, `pageCount`, `onPageChange`, `siblingCount`.
- **Variants** — Compact with ellipses when many pages.
- **States** — Disabled prev/next at boundaries; active page styled.
- **Dependencies** — `lucide-react` (ChevronLeft/Right).
- **Accessibility** — `<nav aria-label="Pagination">`, `aria-current="page"` on active button. Buttons keyboard-operable.
- **Storybook** — `Components/Navigation → PaginationExample`.
- **Future usage** — PLP, search results, admin tables.

---

## 3. Commerce primitives

### PriceTag

- **Purpose** — Render formatted currency amounts (in minor units) with optional strikethrough original.
- **Props** — `amount` (minor units), `currency`, `originalAmount`, `locale`, `size`.
- **Variants** — Sizes `sm | md | lg`; sale state when `originalAmount > amount`.
- **States** — Default, on-sale.
- **Dependencies** — `Intl.NumberFormat`.
- **Accessibility** — Strikethrough has `aria-label="Original price"` so AT can distinguish; current price reads naturally.
- **Storybook** — `Components/Commerce → Prices`.
- **Future usage** — Product cards, PDP, cart line items, order summary.

### Quantity

- **Purpose** — Numeric stepper for cart/quantity selection.
- **Props** — `value`, `onChange`, `min`, `max`, `step`, `label`, `disabled`.
- **Variants** — Single visual; bounded by min/max.
- **States** — Idle, hover, disabled (whole or buttons at boundary).
- **Dependencies** — `lucide-react` (Plus/Minus).
- **Accessibility** — Wrapped in `role="group"` with label; inner buttons have explicit `aria-label`; number input has matching `aria-label` and `inputMode="numeric"`.
- **Storybook** — `Components/Commerce → QuantityStepper`.
- **Future usage** — PDP, cart, B2B order forms.

### Swatch

- **Purpose** — Visual radio group for product options (colour, wood, fabric).
- **Props** — `options[]`, `value`, `onChange`, `name`, `size`.
- **Variants** — Sizes `sm | md | lg`.
- **States** — Selected (primary ring), idle, hover, focus-visible, disabled per option.
- **Dependencies** — None.
- **Accessibility** — `role="radiogroup"` + `role="radio"` + `aria-checked` + per-option `aria-label`.
- **Storybook** — `Components/Commerce → Swatches`.
- **Future usage** — PDP option selection, configurator, filter facets on PLP.

### Rating

- **Purpose** — Read-only star rating with optional review count.
- **Props** — `value`, `max`, `reviewCount`, `size`.
- **Variants** — Sizes `sm | md | lg`.
- **States** — Static (display only). Partial fill via overlay clip.
- **Dependencies** — `lucide-react` (Star).
- **Accessibility** — Wrapper is `role="img"` with an `aria-label` summarising rating and count; stars are decorative.
- **Storybook** — `Components/Commerce → Ratings`.
- **Future usage** — Product cards, PDP reviews summary, journal post quality marks.

---

## 4. Forms

### Label

- **Purpose** — Styled `<label>` with optional required indicator.
- **Props** — `required`, native `<label>` attributes.
- **Variants** — None.
- **States** — Static.
- **Dependencies** — None.
- **Accessibility** — Always pair with control via `htmlFor`. Required asterisk is `aria-hidden`; communicate "required" via control's `aria-required` or text.
- **Storybook** — Rendered inside `FormField` examples.
- **Future usage** — All form fields.

### Input

- **Purpose** — Single-line text input.
- **Props** — `invalid`, `leadingIcon`, `trailingIcon`, all native input attributes.
- **Variants** — With/without leading or trailing icon.
- **States** — Default, focus, invalid, disabled, with icons.
- **Dependencies** — None.
- **Accessibility** — `aria-invalid` reflects validation; pair with `FormField` for label + helper/error wiring.
- **Storybook** — `Components/Forms → Inputs`.
- **Future usage** — Login, checkout, search, address forms.

### Textarea

- **Purpose** — Multi-line text input.
- **Props** — `invalid`, `rows`, native textarea attrs.
- **Variants** — None.
- **States** — Default, focus, invalid, disabled.
- **Dependencies** — None.
- **Accessibility** — `aria-invalid` reflects validation; user-resizable vertically.
- **Storybook** — `Components/Forms → TextareaExample`.
- **Future usage** — Delivery notes, journal/admin content, contact form.

### Select

- **Purpose** — Native dropdown.
- **Props** — `invalid`, native select attrs.
- **Variants** — None.
- **States** — Default, focus, invalid, disabled.
- **Dependencies** — `lucide-react` (ChevronDown).
- **Accessibility** — Native `<select>` for built-in mobile keyboard + screen reader behaviour.
- **Storybook** — `Components/Forms → SelectExample`.
- **Future usage** — Country selectors, sorting, admin filters.

### Checkbox

- **Purpose** — Boolean choice with label.
- **Props** — `label`, `invalid`, native input attrs.
- **Variants** — Single style.
- **States** — Unchecked, checked, focus-visible, disabled, invalid.
- **Dependencies** — `lucide-react` (Check tick).
- **Accessibility** — Native input under a styled overlay; full keyboard support.
- **Storybook** — `Components/Forms → Choice`.
- **Future usage** — Newsletter opt-in, T&Cs, filter facets.

### Radio

- **Purpose** — Single choice from a group.
- **Props** — `label`, native input attrs.
- **Variants** — Single style.
- **States** — Unselected, selected, focus-visible, disabled.
- **Dependencies** — None.
- **Accessibility** — Native `<input type="radio">`; group containers should set `role="radiogroup"` and `aria-label`.
- **Storybook** — `Components/Forms → Choice`.
- **Future usage** — Shipping methods, payment options, configurators.

### Switch

- **Purpose** — Toggleable preference.
- **Props** — `checked`, `onCheckedChange`, `label`, `disabled`, `id`.
- **Variants** — Single style.
- **States** — Off, on, focus-visible, disabled.
- **Dependencies** — None.
- **Accessibility** — `role="switch"` + `aria-checked`; clickable through wrapping `<label>` for the visible text.
- **Storybook** — `Components/Forms → Choice`.
- **Future usage** — Account notification preferences, admin feature flags.

### FormField

- **Purpose** — Compose `Label + control + helperText/errorText` with wired `aria-describedby`.
- **Props** — `label`, `htmlFor`, `required`, `helperText`, `errorText`, single child control.
- **Variants** — None.
- **States** — Helper-only, error-only (suppresses helper).
- **Dependencies** — `Label`.
- **Accessibility** — Clones child to inject `aria-describedby` pointing at helper/error.
- **Storybook** — Used across `Components/Forms` stories.
- **Future usage** — Every form on the site.

---

## 5. Feedback

### Alert

- **Purpose** — Static inline message — informational, success, warning, or error.
- **Props** — `variant`, `title`, `onDismiss`.
- **Variants** — `info | success | warning | error`.
- **States** — Static, dismissible.
- **Dependencies** — `lucide-react` (Info/CheckCircle2/AlertCircle/X).
- **Accessibility** — `role="alert"` for warning/error (assertive); `role="status"` for info/success (polite). Dismiss button has `aria-label`.
- **Storybook** — `Components/Feedback → Alerts`.
- **Future usage** — Cart messages, form-level errors, banner notifications.

### Tooltip

- **Purpose** — Brief on-hover/focus hint.
- **Props** — `content`, `side`, `delay`, single child trigger.
- **Variants** — `top | bottom | left | right`.
- **States** — Closed, open (after delay).
- **Dependencies** — React clone-element. Lightweight CSS positioning — Floating UI replaces if collisions become an issue.
- **Accessibility** — `role="tooltip"` linked via `aria-describedby` on trigger; appears on hover **and** focus.
- **Storybook** — `Components/Feedback → Tooltips`.
- **Future usage** — Icon-only buttons, label hints, restricted UI explanations.

### Spinner

- **Purpose** — Indeterminate progress indicator.
- **Props** — `size`, `label`.
- **Variants** — `sm | md | lg`.
- **States** — Animated spin.
- **Dependencies** — Tailwind `animate-spin`.
- **Accessibility** — `role="status"` + `aria-label`.
- **Storybook** — `Components/Feedback → Spinners`.
- **Future usage** — Inline loading, modals, route transitions.

### Progress

- **Purpose** — Determinate linear progress bar.
- **Props** — `value`, `max`, `label`.
- **Variants** — Single visual.
- **States** — Animated width transition between value changes.
- **Dependencies** — None.
- **Accessibility** — `role="progressbar"` with `aria-valuenow|min|max` and label.
- **Storybook** — `Components/Feedback → Progresses`.
- **Future usage** — Upload progress, multi-step checkout, onboarding.

### EmptyState

- **Purpose** — Communicate an empty result with optional action.
- **Props** — `icon`, `title`, `description`, `action`.
- **Variants** — Optional icon, optional action.
- **States** — Static.
- **Dependencies** — None.
- **Accessibility** — Heading + descriptive text; action is a normal button/link.
- **Storybook** — `Components/Feedback → EmptyStates`.
- **Future usage** — Empty cart, empty wishlist, no-results search, admin empty lists.

---

## Updating this inventory

Anyone adding a component to `packages/ui/src/components` (or layout/typography
foundations) must add an entry here in the same change. Reviewers will block
merges that skip the inventory.
