# TOKENS.md: design tokens extracted from usemotion.com

Extracted 2026-07-07 from the live site. Sources: the two Astro CSS bundles linked from the homepage head (`/_astro/_page_.EwdYibhk.css` and `/_astro/studio-component.BiMIfQql.css`) plus the rendered homepage and pricing HTML. The pricing page links the exact same two bundles, so the diff produced no additional tokens.

## Color

| Token | Value | Where Motion uses it |
|---|---|---|
| Primary brand | `#2c77e7` (`--color-primary`) | Links, accents, secondary button text |
| Primary light | `#eef5ff` (`--color-primary-light`) | Secondary button background, footer gradient start |
| Secondary button hover | `#deecff` | Hover state of light blue buttons |
| CTA button gradient | `linear-gradient(to bottom, #617fe3, #3e63dd)` | Every primary "Try Motion for free" button |
| CTA hover | `filter: brightness(1.05)` | Primary button hover (they brighten, they do not recolor) |
| Heading / black | `#101828` (`--color-black`) | All headings, strong text |
| Body text | `#475467` (`--color-dark-grey`) | Paragraph text |
| Muted body | `#495161` (`--color-light-grey-text`) | CTA microcopy ("Start your free trial. Cancel in 1 click.") |
| Subtle text | `#667085` (`--color-semantic-neutral-text-subtle`) | Captions, small labels |
| Section tint | `#f0f4f8` (`--color-light-grey`) | Alternating light sections |
| Faint tint | `#f9fbff`, `#f8f9fa` | Card interiors, subtle panels |
| Border | `#e6e8eb` (`--color-semantic-neutral-border-subtle`) | Card borders, dividers |
| Dark surface | `#13181d` (`--color-surface-darkest`) | Dark panels and bands |
| AI text gradient | `linear-gradient(80.74deg, #d874fe 9.74%, #5e8dfe 93.68%)` (`.text-gradient-ai`) | Gradient words inside headlines |
| Hero ambient gradient | `linear-gradient(125deg, rgba(115,103,240,.05) 0%, rgba(78,205,196,.05) 25%, rgba(115,103,240,.08) 50%, rgba(78,205,196,.05) 75%, rgba(115,103,240,.05) 100%)`, background-size 200% 200% | Animated hero background (`bg-subtle-shift`, 12s ease-in-out infinite) |
| Checkmark gradient | `#ed47eb` to `#b547f5` | Feature checkmarks (not adopted; our checkmarks use primary) |
| Footer | `linear-gradient(to bottom, #eef5ff, #ffffff 120px)` | Footer background fade |

## Typography

| Role | Face | Weights loaded | Notes |
|---|---|---|---|
| Display (`--font-display`) | "Albert Sans", sans-serif | 400, 500, 600, 700, 800 | Headings use 600 (semibold), tracking-tight, line-height 110%. Hero h1 is `clamp(24px, 8vw, 88px)` |
| Body (`--font-sans`) | "Inter", sans-serif | 400, 500, 600, 700 | Base 16px, line-height 1.5. Ledes use 1.125rem / 1.625 |
| Mono (`--font-mono`) | ui-monospace system stack | n/a | SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New |

Motion loads both families from fonts.bunny.net. Type scale: Tailwind defaults (`--text-sm` .875rem through `--text-7xl` 4.5rem).

## Font licensing note

Motion does not use a licensed commercial display face. Both Albert Sans and Inter are open-source (SIL Open Font License) and Motion serves them from Bunny Fonts, a public CDN. So no substitute mapping was needed: we load the identical faces, same weights, from the same CDN (`fonts.bunny.net/css?family=albert-sans:400,500,600,700,800|inter:400,500,600,700`). The freely licensed fallback candidates (Archivo, General Sans, Switzer, Hanken Grotesk) were evaluated but unnecessary. The mono stack is Motion's own system stack, so nothing to license there either. JetBrains Mono from the previous build was dropped in favor of Motion's exact mono stack.

## Radius, shadow, layout

| Token | Value | Use |
|---|---|---|
| `--radius-md` | .375rem | Small chips |
| `--radius-lg` | .5rem | Buttons (`rounded-lg` on every CTA) |
| `--radius-xl` | .75rem | Inputs |
| `--radius-2xl` | 1rem | Cards |
| `--radius-3xl` | 1.5rem | Large panels, pricing cards |
| Button shadow | `0 2px 5px #0003, inset 0 0 0 1px #0000001a, inset 0 2px #fff3` | The signature CTA bevel: drop shadow + inner ring + top inner highlight |
| Nav scrolled shadow | `0 4px 6px -1px rgb(16 24 40 / .1), 0 2px 4px -2px rgb(16 24 40 / .1)` (shadow-md) | Nav gains this once `data-has-scrolled=true` |
| Card shadows | `#1018280d` and `#1018281a` layers | Black token at 5% and 10% |
| Container | `max-width: 64rem` (1024px) at the largest breakpoint, with 1rem to 2rem side padding | `.container` steps 480px / 768px / 840px / 1024px |
| Section padding | `py-20` (80px), large sections `py-24` (96px) | |
| Button padding | 12px x 20px (normal), 10px x 16px (small), font-semibold, text-base | |

## Motion (animation)

| Token | Value |
|---|---|
| Default transition | `.15s cubic-bezier(.4, 0, .2, 1)` (`--default-transition-*`) |
| Marquee / carousel | `carousel 60s linear infinite`, keyframes translate 0 to -50% (track duplicated once). Ours runs 30s for a shorter strip, same keyframes |
| Ambient hero shift | `bg-subtle-shift 12s ease-in-out infinite`, background-position 0% to 100% to 0% |
| Nav behavior | Sticky, gains shadow-md + solid background after scroll begins |

## Tokens not extractable with certainty

1. The hero word-cycler: Motion's current homepage no longer contains a rotating-word component (the h1 is static: "Get an unfair advantage by using AI to double productivity"). Our cycler uses their default easing token and a 2.6s interval chosen by eye, not an extracted value.
2. Scroll-reveal timing: no IntersectionObserver reveal durations were recoverable from the CSS bundles (reveals are handled in their JS). Our .6s fade-up with 80ms stagger is an estimate consistent with their default easing.
3. Card hover lift distance: Motion's cards mostly change shadow and background rather than translating. The 2-3px lift is from the task spec, using their shadow tokens for the deepened state.
