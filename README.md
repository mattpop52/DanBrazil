# Daniel Brazil — recording studio site

A one-page site for Daniel Brazil (producer, songwriter, mix engineer): studio hire,
production and co-writing, mixing and mastering, with the credits and the room on show.

Static HTML, CSS and vanilla JavaScript. No framework, no build step, no npm install —
open `index.html` in a browser and it works.

---

## ⚠️ Replace these before the site goes live

Everything below is a **placeholder**. Search `index.html` for `EDIT:` to find each one in
place — the comments are deliberately terse (`<!-- EDIT: rate card -->`) so that anyone
who views source does not read a page explaining that its own prices are invented. The
explanation lives here instead.

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
| Session steps | `#process` — four `<li class="db-step">` | describes a normal session, not necessarily yours |
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

1. Fixed header + full-screen mobile menu
3. Hero — one headline, the badge pill, two lines, two buttons
4. Marquee strip of outlined chips
5. **Services** — a full-bleed row of four cards with price chips
6. **How a session works** — a four-step strip on hairlines
7. **The studio** — a centred heading over a drifting polaroid photo ticker
8. **Equipment** — four panels; expanding columns on desktop, an accordion on mobile
9. **Statement** — a sentence that lights up character by character as you scroll
10. **Selected work** — five records, the *CHOKE!* EP featured
11. **About** — portrait, two paragraphs, three tiles
12. **FAQ** — eight boxed rows, plus the cancellation policy
13. **Contact** — details and the booking form
14. Footer, and a booking bar that follows you up the page below 810px

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

### The logo

The client's logo is a circular lockup: a signature, "SONGWRITER / PRODUCER", and three
dots inside a double ring. It was supplied as a photograph of a printed panel, so it was
extracted by high-passing the image against a blurred copy — which removes the panel's
texture and lighting gradient — then keying the copper strokes to an alpha channel and
flattening them to cream. Both files are cream on transparent, so CSS can tint them.

`logo.png` is the whole lockup. `logo-script.png` is the signature on its own, separated by
dropping the connected components that belong to the ring rather than to the letters.

The header uses the signature and the footer uses the full lockup, for a practical reason:
the lockup is 1.27:1, so at the 34px a nav bar allows it is about 43px wide and the name
cannot be read. The signature reads perfectly at that height. The favicon and the app icon
are drawn from the mark — the double ring and the three dots — because the script does not
survive 32px either.

To swap the header to the full lockup, point `.db-brand__logo` at `logo.png` and raise its
height; nothing else needs to change.

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
| `session-writing.jpg` | A writing session from above — services card and ticker |
| `session-tracking.jpg` | Tracking with a guitar — equipment panel and ticker |
| `session-messy.jpg` | Working at the desk in headphones |
| `portrait-desk.jpg` | Daniel at the studio desk — the About portrait |
| `live-uncorked.jpg` | Drums at the UnCorked showcase |
| `live-denmark.jpg` | Drums on stage in Denmark |
| `release-choke-ep.jpg` | *CHOKE!* EP cover — Gerron |
| `release-awakening.jpg` | *Awakening* cover — Christopher Hockey |
| `release-aftermath.jpg` | *In the Aftermath, We Bloom* cover — Shimmer Boy |
| `release-remember-me.jpg` | *Remember Me* cover — Tyra-Lee Spry |
| `release-question.jpg` | *Question* cover — projective. |
| `logo.png` | The full circular lockup, cream on transparent — footer and share card |
| `logo-script.png` | The signature alone — the header, where the circle would be unreadable |
| `og-cover.jpg` | 1200×630 social share card |

The photos that sit **behind type** — the hero, the four service cards and the equipment
panels — are served from `lit-*.jpg` variants: the same frames with the shadows opened up
(a gamma lift, then a small contrast and saturation nudge). The originals are dark enough
that on a phone, under a scrim, they read as a black rectangle rather than as a room. The
`lit-*` files are also compressed harder, since they always sit under a gradient.

Each photo exists at 400w and 800w in both `.jpg` and `.webp`, referenced through a
`<picture>` with `sizes` matched to the slot it renders into. Each service card sets its
own `--pos` so its crop lands on something worth seeing rather than a random edge.

## Credits

Everything in **Selected work** comes from Daniel's own posts, with the role stated as he
stated it. Nothing is inflated — note that *In the Aftermath, We Bloom* and *Question* are
co-writes only.

| Release | Artist | Role |
| --- | --- | --- |
| *CHOKE!* (EP) — featured | Gerron | Co-write · Production |
| *Awakening* (album) | Christopher Hockey | Co-write on "Turn My Back" and "God Of" · Drums |
| *In the Aftermath, We Bloom* (album) | Shimmer Boy | Co-write on "Brixton" (produced and mixed by Distort Reverse) |
| *Remember Me* | Tyra-Lee Spry | Co-write · Production |
| *Question* | projective. | Co-write |

**One card per release.** *To Change a Man*, *Messy* and *Brixton* each had their own launch
post, but each is a track on a record already listed — they appear in the featured EP's
tracklist or in a card's note line rather than as cards of their own. Listing the same work
twice makes a short catalogue look padded rather than longer.

Add more by copying an `<article class="db-release">` block in `#work` — the grid runs
four-up under the feature card. Give each its own artwork, and set the role line to what you
actually did on that record.

Every card's `href` currently points at the Instagram profile. Swap each for the Spotify or
Apple link, and swap the arrow glyph back to a play triangle (the path is in a comment
beside it) once they point at something playable.
