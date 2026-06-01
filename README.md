# Siraj Pro — marketing site

The marketing website for **Siraj Pro**, a beautiful prayer-times app for iOS built by Syed Muhammad Aziz Ghaus.

Static HTML / CSS / vanilla JS. No build step. Deploys anywhere that can serve files — GitHub Pages, Cloudflare Pages, Netlify, Vercel, an S3 bucket, etc.

## Structure

```
.
├── index.html         Home (hero, features, widgets, themes, pricing, CTA)
├── privacy.html       Privacy Policy (App Store requirement)
├── terms.html         Terms of Use + auto-renewable subscription terms
├── support.html       Help center + FAQ (App Store Support URL)
├── styles.css         Full design system — dark teal #00131B base, pattern overlay,
│                      LightRay, animated glares, teal accent #6BC7DB, CEF7FF→238396
│                      gradient buttons, Liquid Glass cards, floating nav pill.
├── script.js          Glare sparkle field, mobile nav, reveal-on-scroll,
│                      medium-widget renderer + theme swatch picker.
└── assets/            PhoneMockup1-7, MockupWidgets2, SirajProHeroImage, SirajProLogo,
                       Notification, MapGraphic, Pattern2, LightRay, Glare.
```

## Run locally

Just open `index.html` in a browser, or serve the folder for proper relative-path behavior:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

### GitHub Pages
1. Push this repo to GitHub.
2. Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / root.
3. Live at `https://<user>.github.io/<repo>/` within a minute.

### Cloudflare Pages / Netlify / Vercel
Connect the repo, set build command to **(none)** and output directory to **`.`** (root).

## Design source

The site mirrors the real in-app design system from
`~/Documents/XCODE/Widget Test`:

- Background: `CelestialDesign.swift` — fixed `#00131B → black` gradient + Pattern2 + LightRay + Glare.
- Accent: `AccentTheme.swift` — the AppLocked teal `#6BC7DB`.
- Button gradient: `PremiumPitchView.swift` — `#CEF7FF → #238396`.
- Onboarding mockups: `OnboardingFlow.swift` — PhoneMockup1-7 each pair with the value prop the matching onboarding screen demonstrates.

## License

© Syed Muhammad Aziz Ghaus. All rights reserved.
