# Careers with Em: Brand and Formatting Guide

The complete visual and verbal identity for Careers with Em. This document is self-contained: upload it to Claude, Canva, Figma AI, or hand it to a designer, and everything needed to produce on-brand work is here.

The visual system is adapted from the design language of usemotion.com (Motion, the AI productivity company). Every color, font, radius, shadow, and animation value below was extracted from Motion's live CSS in July 2026 and is the system now shipped on careers-with-em's website. Interaction patterns and tokens only: Motion's logo, imagery, and copy are never used.

---

## 1. Brand in one paragraph

Careers with Em is AI-powered career advice for job seekers and corporate workers who want systems, not pep talks. The brand looks like software, not a coach's mood board, because the product is systems: prompts, trackers, templates, and workflows. Free content teaches the exact prompts. Paid offers install them. The founder, Em, administers recruiting systems (ATS, candidate CRM, integrations) as her day job, and that insider credibility is the brand's sharpest edge.

## 2. Voice

Write like a sharp friend who has already done the thing you are scared of. Lead with warmth, then get specific: a real number, a real prompt, a real deadline, never a vibe. Say the direct thing in the first two lines, then structure the rest so it can be skimmed: short paragraphs, headers, bullets.

Rules:
- No hype words, no manufactured urgency, no exclusivity language in organic content
- Sales pages persuade hard with real deadlines and real reasons, stated plainly
- Never use em dashes or en dashes. Use commas, colons, or periods
- If a sentence could appear in anyone else's career content, cut it or add the specific detail that makes it Em's
- Real numbers only. No invented stats, no fake scarcity

## 3. Logo and wordmark

- Wordmark: `careerswithem` set in Albert Sans Bold (700), lowercase, no spaces, tight tracking (-2%)
- The word `with` is set in the primary blue #2C77E7; `careers` and `em` are near-black #101828 on light backgrounds, white #FFFFFF on dark backgrounds
- Icon / avatar: a rounded square (radius 25% of width) filled #2C77E7 containing `em` in white bold sans, centered. Used for favicon, social avatars, and app-icon contexts
- Clear space: keep at least the height of the letter `e` around the wordmark
- Do not stretch, outline, add effects, or recolor beyond the two approved schemes

## 4. Color system

Primary palette (extracted from Motion's CSS custom properties):

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary brand | Primary Blue | #2C77E7 | Links, accents, icon fill, logo accent, focus rings |
| Accent text | Accessible Blue | #2569D4 | Small blue text (13px and under) on light backgrounds; passes WCAG AA 4.5:1 where #2C77E7 does not |
| CTA gradient top | Button Light | #617FE3 | Top of every primary button gradient |
| CTA gradient bottom | Button Deep | #3E63DD | Bottom of every primary button gradient |
| Headings | Ink | #101828 | All headings and strong text on light backgrounds |
| Body | Dark Grey | #475467 | Paragraph text |
| Muted body | Grey Text | #495161 | Button microcopy, secondary lines |
| Subtle | Text Subtle | #667085 | Captions, small labels, footer text |
| Section tint | Light Grey | #F0F4F8 | Alternating section backgrounds |
| Faint tint | Tint | #F9FBFF | Card interiors, subtle panels |
| Soft blue | Primary Light | #EEF5FF | Secondary button fill, footer gradient start, tags |
| Secondary hover | Primary Light Hover | #DEECFF | Hover state of soft blue elements |
| Border | Border | #E6E8EB | Card borders, dividers, input outlines |
| Dark surface | Surface Darkest | #13181D | Dark sections, dark cards, high-contrast bands |
| White | White | #FFFFFF | Page background, cards, button text |

Gradients:

| Name | Value | Usage |
|---|---|---|
| CTA gradient | linear-gradient(to bottom, #617FE3, #3E63DD) | Every primary button. Always vertical |
| AI text gradient | linear-gradient(80.74deg, #D874FE 9.74%, #5E8DFE 93.68%) | One or two accent words inside a headline, clipped to text. Never on body text, never on buttons |
| Ambient hero gradient | linear-gradient(125deg, rgba(115,103,240,.05) 0%, rgba(78,205,196,.05) 25%, rgba(115,103,240,.08) 50%, rgba(78,205,196,.05) 75%, rgba(115,103,240,.05) 100%) at background-size 200% 200% | Hero backgrounds only, animated slowly (12s loop) on web, static in print/social |

Dark-background text colors: headings #FFFFFF, body #98A1AD, general text #C9CFD6, small blue accents #7AB3FF (passes contrast on #13181D).

Rules:
- Blue is the only brand color. Emphasis beyond blue uses weight and size, not new colors
- The AI text gradient is the single decorative flourish. One instance per screen or asset
- Small blue text on light backgrounds uses #2569D4, never #2C77E7 (contrast compliance)

## 5. Typography

| Role | Face | Weights | Notes |
|---|---|---|---|
| Display / headings | Albert Sans | 600 (default), 700, 800 | Geometric sans. Tracking -2% on large sizes, line-height 110% |
| Body and UI | Inter | 400, 500, 600, 700 | Base 16px, line-height 150%. Ledes 18px at 162.5% |
| Mono / data / prompts | System mono stack | 400, 500 | ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New. Used for prompt text, day labels, numbers |

Both Albert Sans and Inter are free, SIL Open Font License, available on Google Fonts, Bunny Fonts, and Adobe Fonts. No licensing cost, safe for all commercial use.

Type scale (from Motion's tokens): 12, 14, 16 (base), 18, 20, 24, 30, 36, 48, 60, 72px. Web headlines use fluid sizes, for example hero h1 clamp(38px, 5.6vw, 64px), section h2 clamp(28px, 4.2vw, 40px).

Hierarchy pattern used everywhere:
1. Eyebrow: 13px, semibold 600, uppercase, letter-spacing 8%, Accessible Blue #2569D4
2. Heading: Albert Sans 600, Ink
3. Lede: 18px Inter, Grey Text, max width around 640px

## 6. Shape, depth, spacing

| Token | Value | Usage |
|---|---|---|
| Radius small | 6px | Chips, small tags |
| Radius button | 8px | All buttons |
| Radius input | 10 to 12px | Form fields |
| Radius card | 16px | Cards, prompt cards, panels |
| Radius large | 24px | Pricing cards, bands, large panels |
| Button shadow | 0 2px 5px rgba(0,0,0,.2), inset 0 0 0 1px rgba(0,0,0,.1), inset 0 2px rgba(255,255,255,.2) | The signature CTA bevel: outer drop + inner ring + top inner highlight |
| Card shadow | layered rgba(16,24,40,.05) and rgba(16,24,40,.10) | Soft, cool-toned, never harsh |
| Container | 1024px max width, 24px side padding | All page content |
| Section padding | 80px vertical (60px mobile) | |
| Card padding | 24 to 28px | |
| Grid gap | 16 to 18px | |

## 7. Components

- Primary button: CTA gradient fill, white text, Inter semibold 16px, 12px x 20px padding, 8px radius, button shadow. Hover: brightness 105% and a 1px lift. Below every standalone CTA sits one line of microcopy in 14px Grey Text (for example "25 copy-paste AI prompts for your job search. Free.")
- Secondary button: Primary Light fill, Primary Blue text, no shadow. Hover: Primary Light Hover
- Dark button: Ink fill, white text (used for de-emphasized alternatives like waitlists)
- Prompt card (signature element): white card, 16px radius, thin border, header bar with a small blue dot and mono label, body in mono 13px showing a real prompt with [FILL-IN FIELDS] in blue, and a dashed-divider result section on Tint background with an "Output" tag pill
- Cards: white, 1px Border, 16px radius, soft shadow. Hover: lift 2 to 3px and deepen shadow
- Eyebrow labels: see hierarchy pattern above. Every section starts with one
- Trust strip: thin band of short proof statements, bold lead-in + regular tail, auto-scrolling marquee on web
- Bento grids: mixed-width card grids for pillars and curriculum days, each card opening with a mono number label (01, DAY 01)
- FAQ: accordion rows, Albert Sans 600 questions, plus sign in blue that rotates 45 degrees when open
- Checklists: blue check marks for benefits and "for you" lists, red #B42318 crosses for "not for you" lists

## 8. Motion and animation

| Pattern | Spec |
|---|---|
| Default transition | 150ms, cubic-bezier(0.4, 0, 0.2, 1). Everything interactive uses this |
| Scroll reveals | Fade up 18px over 600ms, children staggered 80ms, fire once |
| Marquee | Linear infinite loop (30 to 60s), pauses on hover |
| Word cycler | Rotating gradient phrase in hero, 2.6s interval, 300ms swap, fixed width so layout never shifts |
| Ambient hero | Background gradient position drifts over 12s, ease-in-out, infinite |
| Nav | Sticky, translucent white with 12px blur, gains shadow after 10px of scroll |
| Reduced motion | All of the above collapse to static when the user prefers reduced motion |

For static media (social posts, PDFs, slides), translate motion into stillness: use the ambient gradient as a flat background wash, use the reveal hierarchy as layout order.

## 9. Layout patterns

- Light-first: white and Light Grey sections alternate. Dark #13181D sections are reserved for maximum-emphasis moments (credibility statement, final CTA), at most two per page
- Heroes: ambient gradient background, eyebrow + big headline with one AI-gradient phrase + lede + primary CTA with microcopy. Two-column heroes pair text with a prompt card or opt-in card
- One conversion goal per page, repeated down the page with identical button label
- Footer: gradient from Primary Light to white over the first 120px

## 10. Imagery and iconography

- Prefer product-like artifacts over stock photography: prompt cards, tracker screenshots, checklists rendered in the design system
- Photos of Em: natural light, plain or softly tinted backgrounds, no heavy filters
- Icons: simple line or solid shapes in Primary Blue or Ink, 1.5 to 2px strokes, rounded joins
- Never use Motion's logo, screenshots, illustrations, or copy

## 11. Accessibility

- Small blue text on white or tints: #2569D4 minimum (4.5:1). #2C77E7 is reserved for large text and non-text elements
- Body text is never lighter than #667085 on white
- Focus states: 3px Primary Blue outline, 3px offset
- All animation honors prefers-reduced-motion

## 12. Quick-reference token block

For AI tools, paste this with any design request:

Primary #2C77E7, accessible small-text blue #2569D4, CTA gradient #617FE3 to #3E63DD vertical, headings #101828, body #475467, subtle #667085, tint sections #F0F4F8, soft blue #EEF5FF, borders #E6E8EB, dark surface #13181D, AI text gradient #D874FE to #5E8DFE at 81 degrees. Fonts: Albert Sans 600 to 800 for headings (tracking -2%), Inter 400 to 600 for body, system mono for data. Radii: 8px buttons, 16px cards, 24px large panels. Buttons: gradient fill, white semibold text, shadow 0 2px 5px rgba(0,0,0,.2) with inner 1px ring and top inner highlight. Voice: warm, specific, no hype, no em dashes, real numbers only.
