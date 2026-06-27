# Animations & Motion — Branch Furniture

> Extracted from `data-animate-*` attributes in the DOM + transition rules in `style.css`.

## Motion inventory (observed)

| Pattern                | Hook                                | Count | Behavior                                         |
| ---------------------- | ----------------------------------- | ----- | ------------------------------------------------ |
| Scroll slide-in        | `data-animate-slide-in="true"`      | 241   | element rises + fades in on entering viewport    |
| Scroll slide-in + zoom | `data-animate-slide-in-zoom="true"` | 9     | slide-in with subtle scale                       |
| Cascade stagger        | `data-cascade-order="N"`            | many  | sequences children (1,2,3…) for staggered reveal |
| Applied state          | `data-animated="true"`              | 239   | toggled by IntersectionObserver once revealed    |

## Timing / easing

- Menu transition: `all .25s ease-in-out` (`--menu-mobile-transition`).
- `scroll-behavior: smooth` globally.
- Micro-interactions cluster at ~150–300ms (brand feel = calm, unhurried).

## Signature behaviors

- **Hero**: full-bleed background video loop.
- **Press carousel**: auto-cycling logo strip (Swiper present — `--swiper-*` vars).
- **Sticky/condensing header** on scroll; mega-menu panels fade/slide.
- **Cart drawer** & **search overlay**: slide/fade in from edge.
- **Product cards**: variant image-swap on color hover/select.

## Rebuild approach (Framer Motion)

- One shared `<Reveal>` primitive = IntersectionObserver-driven `whileInView` with
  `initial={{opacity:0, y:24}}` → `{opacity:1, y:0}`, `transition={{duration:0.4, ease:'easeOut'}}`.
- Stagger via parent `staggerChildren: 0.08` to reproduce `data-cascade-order`.
- Zoom variant adds `scale: 0.98 → 1`.
- **Honor `prefers-reduced-motion`**: disable transforms, keep opacity-only or none.
- Use `transform`/`opacity` only (GPU) — never animate width/height (`transform-performance` rule).
- Keep Swiper or swap for Embla (lighter) for carousels.
