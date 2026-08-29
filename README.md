# Daniel Brazil — recording studio site

A one-page site for Daniel Brazil (producer, songwriter, mix engineer): studio hire,
production and co-writing, mixing and mastering, with the credits and the room on show.

Static HTML, CSS and vanilla JavaScript. No framework, no build step, no npm install —
open `index.html` in a browser and it works.

---

## ⚠️ Replace these before the site goes live

Everything below is a **placeholder**. Search `index.html` for `EDIT:` to find each one in place.

| What | Where | Current placeholder |
| --- | --- | --- |
| Email address | header menu, contact list, footer, `#bookingForm` `data-mailto` | `hello@danielbrazil.co.uk` |
| Phone number | contact list, footer | plain text, **not** a `tel:` link — nobody should dial a placeholder |
| Studio address / town | contact list, footer, and the hero if you want a location line | "United Kingdom — full address on booking" |
| **All four rate cards** | `#services` — one `<ul class="db-card__prices">` per card | £40/hr, £140 half day, £240 full day, £350 writing day, £750 per song, £250 mix, £70 master |
| Equipment lists | `#equipment` — four `<ul class="db-panel__list">` | see "Equipment" below |
| Streaming links | `#work` — each `db-release__link href` | points at the Instagram profile for now |
| Footer social links | `#footer` — Spotify / Apple Music / YouTube | commented out, so nothing is a dead link |
| Domain | commented-out `canonical` + `og:url` block in `<head>`, and JSON-LD | **deliberately absent** — see below |
| Service promises | "walk out with your files the same night", "two rounds of revisions", "instrumental, TV and a cappella versions", "a DDP", "within two working days" | sensible industry defaults, not quotes from you |
| Cancellation window | `#faq` → `.db-policy` | 24 hours, no refund after |
| Guest and splits policy | `#faq` — two answers | sensible defaults, not your stated policy |
| Free studio tours | `#studio` CTA and the FAQ | offered as standing policy |
| Reply-time promise | `#contact` **and** `SUCCESS_MESSAGE` in `main.js` | "within two working days" — in two places, keep them in step |
| Form destination | `#bookingForm` `data-endpoint` | empty — falls back to a pre-filled email |

### Why there is no canonical URL

A `<link rel="canonical">` pointing at a domain nobody owns tells search engines the real
page lives somewhere else. So the canonical and `og:url` are commented out in `<head>`
with your name on them — uncomment both and drop your domain in the moment you have one.
Everything else (`og:image`, the favicons, the fonts) uses relative paths, so the site
works unchanged whether it is served from a root domain or a GitHub Pages subpath.

### Equipment: what is real and what is a guess

Only these are actually visible in the photos, so only these are safe to state as fact:

- an inline analogue mixing console (roughly 24 channels)
- **Focal** nearfield monitors
- a laptop and a large reference display running a DAW
- an acoustic drum kit with overhead and close mics on boom stands
- movable gobos and acoustic panels
- a MIDI keyboard controller

Everything else in the four equipment lists — the interface, preamps, outboard, guitars,
synths, headphones — is a sensible placeholder. **Please correct it.**

### Prices and promises

The rate card is invented. It is laid out the way the reference site lays its own out
(hourly / half day / full day, then per track), so the shape is right even if the numbers
are not. Change the numbers, or delete a `<li>` if you would rather not publish a rate.

The same goes for the service descriptions. Lines like *"walk out with your files the same
night"*, *"two rounds of revisions"* and *"I'll come back within two working days"* are
commitments a client will hold you to. They read like normal studio terms, but nobody has
confirmed they are yours — each is marked with an `EDIT:` comment directly above it.

---

## Getting it online

It is a plain static site, so any host works.

**GitHub Pages** — Settings → Pages → deploy from this branch, root folder.
`.nojekyll` is already committed so the `assets/` folder is served as-is.

**Netlify / Vercel / Cloudflare Pages** — drag the folder in, or point it at the repo.
No build command, publish directory is the repo root.

**Local preview**

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` straight off disk works too — nothing needs a server.)

## Making the contact form actually send

Out of the box the form validates, then opens the visitor's email client with everything
pre-filled. That works everywhere but is a bit clunky.

To have it post properly, create a form on [Formspree](https://formspree.io) (or use
Netlify Forms) and paste the endpoint in:

```html
<form class="db-form" id="bookingForm" ... data-endpoint="https://formspree.io/f/XXXXXXX">
```

The JS posts a `FormData` with `Accept: application/json`, shows a success message and
resets the form. The honeypot field (`company`) is stripped before sending.

---

## Layout

```
index.html                 the whole page
assets/
  css/
    fonts.css              self-hosted @font-face declarations
    style.css              design tokens + every component (numbered sections)
  js/
    main.js                every effect, one init function each
  fonts/                   Anton, Delicious Handrawn, Plus Jakarta Sans, Roboto Mono (woff2)
  img/                     studio photography, release artwork, icons, OG card
                           (each photo at 400 / 800 / native, in .jpg and .webp)
```

### Page sections, in order

1. Loader (counter to 100)
2. Fixed header + full-screen mobile menu
3. Hero — full-bleed photo, display headline, script sub-line, two CTAs
4. Gold marquee strip
5. **Services** — a full-bleed row of four cards with price chips
6. **The studio** — copy plus a drifting polaroid photo ticker
7. **Equipment** — four panels; expanding columns on desktop, an accordion on mobile
8. **Statement** — a sentence that lights up character by character as you scroll
9. **Selected work** — release cards (the Gerron *CHOKE!* EP and its singles)
10. Track-title marquee
11. **About** — portrait, two paragraphs, three tiles
12. **FAQ** — eight boxed rows, plus the cancellation policy
13. **Contact** — details and the booking form
14. Footer

### Effects

Everything scroll-driven shares one `requestAnimationFrame` loop and one
`IntersectionObserver`, and the loop only runs the scroll-dependent work when the scroll
position actually changed:

a sticky header that hides on scroll-down · staggered reveals that slide in from the left
· a character-by-character statement reveal · two seamless marquees · a polaroid photo
ticker that drifts, speeds up while you scroll and can be dragged · service cards whose
oversized photo and scrim grow on hover · hover-preview / click-pin equipment columns ·
accordions animated with `grid-template-rows: 0fr → 1fr` · a slow hero parallax · wipe
hovers on buttons and nav links.

The reference site animates everything with Framer springs. Those are solved out into CSS
`linear()` easings (the `--spring-*` tokens), so the overshoot feels the same without
shipping an animation library.

**What was deliberately removed.** An earlier version had a percentage page loader, a film
grain overlay, a custom cursor, a scroll progress bar and magnetic buttons. None of them
exist on the reference, and on a studio site they read as decoration rather than craft —
they were cut rather than tuned down. Losing the loader alone took LCP from ~1.2s to
~0.85s. The one piece of chrome that stayed is the "Pause motion" toggle in the footer,
because content still moves and WCAG 2.2.2 requires a way to stop it.

### Things that were deliberate

- **Reveal start states are applied by JS, never in the base CSS.** With JavaScript
  turned off, every word is visible immediately — nothing is hidden waiting for a script
  that never runs.
- **`prefers-reduced-motion` is a real kill switch**, and so is the footer toggle. The
  marquees and ticker stop, the parallax stops, and the statement renders as ordinary text.
- **The fonts are self-hosted.** No Google Fonts request, so no third-party call and no
  layout shift if the CDN is slow. All three families are SIL Open Font License 1.1.
- **Every photo ships at three widths in WebP and JPEG**, behind a `<picture>` whose
  `sizes` matches the slot it actually renders into. A cold mobile load is ~240KB.
- **Only one `<h1>`**, headings run in order, the accordions are real buttons with
  `aria-expanded` whose collapsed content leaves the accessibility tree, the mobile menu
  makes the page behind it `inert` and restores focus on close, and the statement carries
  its sentence as an `aria-label` so screen readers never meet the per-character spans.

### Design

The design language follows the reference closely, because that is what was asked for.

- **The ground is neutral black** (#000 and #121212), never warm brown — warm photography
  goes muddy over a warm background.
- **The warmth is in the type.** Cream #f0e0ca for body and the hero headline, tan #e3b97f
  for every section heading, card title and accent. Warm grey #a09488 and taupe #645d56
  carry the quiet text.
- **Three families, each with one job.** Anton for display, Plus Jakarta Sans for reading,
  Poppins for buttons, nav, labels and prices. An earlier version set all the small type in
  a monospace face, which read as a developer portfolio rather than a studio.
- **Three radii only** — 4px, 10px, 16px — and the service cards are square and full-bleed.
  Buttons are 10px rounded rectangles, not pills. One box-shadow on the whole page.
- Breakpoints match the reference: mobile ≤ 809px, tablet 810–1199px, desktop ≥ 1200px,
  1200px container, 80/60/20px section padding.

```
--ink   #000000    --cream      #f0e0ca    --tan    #e3b97f
--ink-2 #121212    --cream-dim  #c6b9a6    --grey   #a09488    --taupe #645d56
```

---

## Photography

The studio and artwork images are cropped from Daniel's own Instagram posts
(@danielbrazilmusic). The Instagram interface has been cropped and patched out. If you
have the original full-resolution files, drop them into `assets/img/` under the same
names and regenerate the 400/800 variants beside them — everything is `object-fit: cover`,
so any aspect ratio will sit correctly.

Nothing on the page claims that any particular person in a photograph is you. If you want
it to, edit the `alt` text.

| File | What it is |
| --- | --- |
| `studio-console.jpg` | Mix session at the analogue console — also the hero |
| `studio-live-room.jpg` | Live room set up for drums |
| `studio-control-room.jpg` | Control room with the Focal monitors |
| `studio-desk-detail.jpg` | Console faders, close |
| `studio-monitor-detail.jpg` | Nearfield monitor on its stand |
| `studio-drums-detail.jpg` | The kit, close |
| `release-choke.jpg` | *CHOKE!* artwork — Gerron |
| `release-to-change-a-man.jpg` | *To Change a Man* artwork — Gerron |
| `og-cover.jpg` | 1200×630 social share card |

## Credits

Verified work on the site: co-write and production on Gerron's debut EP *CHOKE!*
(CHOKE!, Messy, Grapefruit, To Change a Man, Anymore).

Two entries are on the page: the EP itself and *To Change a Man*. Add more by copying an
`<article class="db-release">` block in `#work` — the grid is two-up under the feature
card, so they fill in cleanly. Give each one its own artwork; a card that repeats the
feature's image and title reads as a duplicate rather than a second credit.
