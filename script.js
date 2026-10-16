/* ──────────────────────────────────────────────────────────
   Siraj Pro — site interactivity
   - Glare sparkle field (matches CelestialGlares in the app)
   - Mobile nav toggle
   - Reveal-on-scroll
   ────────────────────────────────────────────────────────── */

(() => {
  // ── Deterministic RNG (same approach as CelestialRNG) ──
  function makeRng(seed) {
    let s = seed * 9301 + 49297;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  // ── Glare field: animated sparkle PNGs scattered top-heavy ──
  function makeGlares() {
    const host = document.querySelector(".glare-field");
    if (!host) return;
    const count = 36;
    const rng = makeRng(17);
    const placed = [];
    const minDist = 0.085;
    const aspect = 0.5;
    let attempts = 0;

    while (placed.length < count && attempts < count * 18) {
      attempts++;
      const yRaw = rng();
      const yBiased = yRaw * yRaw * yRaw;   // top-heavy
      const x = rng() * 0.96 + 0.02;
      const y = yBiased * 0.88 + 0.01;

      const tooClose = placed.some((g) => {
        const dx = g.x - x;
        const dy = (g.y - y) / aspect;
        return dx * dx + dy * dy < minDist * minDist;
      });
      if (tooClose) { rng(); rng(); rng(); rng(); continue; }

      const sizeBase = rng() * 28 + 3;
      const sizeScale = 1 - 0.45 * yBiased;
      const size = sizeBase * sizeScale;
      const op = rng() * 0.50 + 0.30;
      const dur = rng() * 1.4 + 0.9;
      const delay = rng() * 3;

      placed.push({ x, y, size, op, dur, delay });
    }

    const docH = Math.max(
      document.documentElement.scrollHeight,
      window.innerHeight * 2
    );
    host.style.height = `${docH}px`;

    const frag = document.createDocumentFragment();
    placed.forEach((g) => {
      const el = document.createElement("div");
      el.className = "glare";
      el.style.left = `${g.x * 100}%`;
      el.style.top = `${g.y * 100}%`;
      el.style.width = `${g.size}px`;
      el.style.height = `${g.size}px`;
      el.style.setProperty("--op", g.op.toFixed(2));
      el.style.setProperty("--dur", `${g.dur.toFixed(2)}s`);
      el.style.setProperty("--delay", `${g.delay.toFixed(2)}s`);
      frag.appendChild(el);
    });
    host.appendChild(frag);
  }

  // ── Medium widget renderer ──
  // Mirrors PrayerWidget's mediumWidget: theme-tinted radial bg,
  // brand logo + prayer name + countdown header, WeatherStyleArc
  // with 6 prayer markers + split sun orb, bottom strip of names.
  const THEMES = [
    { key: 'cosmos',   name: 'Cosmos',
      accent: '#a78bfa', bloom: '#552c96', mid: '#32166e', outer: '#1d0d47', edge: '#11082c' },
    { key: 'emerald',  name: 'Emerald',
      accent: '#34d399', bloom: '#115e42', mid: '#0a3c2a', outer: '#06261a', edge: '#031811' },
    { key: 'ember',    name: 'Ember',
      accent: '#fb923c', bloom: '#6e290b', mid: '#471806', outer: '#2a0e04', edge: '#180803' },
    { key: 'sapphire', name: 'Sapphire',
      accent: '#60a5fa', bloom: '#133d78', mid: '#0a265c', outer: '#06183c', edge: '#030d26' },
    { key: 'rose',     name: 'Rose',
      accent: '#f472b6', bloom: '#6e1444', mid: '#470d2c', outer: '#2c081c', edge: '#180510' },
    { key: 'midnight', name: 'Midnight',
      accent: '#6384f5', bloom: '#223078', mid: '#141e5a', outer: '#0a123a', edge: '#050922' },
    { key: 'lilac',    name: 'Lilac',
      accent: '#ce9df2', bloom: '#5c3a8a', mid: '#382260', outer: '#1f103c', edge: '#100822' },
    { key: 'custom',   name: 'Custom · Sky',
      accent: '#5BAFFF', bloom: '#1a4480', mid: '#0e2a55', outer: '#061a36', edge: '#031020' },
  ];

  // SF-Symbol-equivalent simple paths, optimized to viewBox 24×24.
  const PRAYER_ICONS = {
    fajr:    '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" fill="#fff"/>',
    sunrise: '<circle cx="12" cy="14" r="4" fill="#fff"/><path d="M3 19h18M12 5v3M5.5 9.5l2 2M18.5 9.5l-2 2M9 6.5L12 3l3 3.5" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    dhuhr:   '<circle cx="12" cy="12" r="5" fill="#fff"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>',
    asr:     '<circle cx="12" cy="13" r="4" fill="#fff"/><path d="M4 18h16M4 18l2-1M20 18l-2-1M8 6l2 2M16 6l-2 2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
    maghrib: '<circle cx="12" cy="14" r="4" fill="#fff"/><path d="M3 18h18M5 13l2 1M19 13l-2 1" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
    isha:    '<path d="M19 13.5a7 7 0 1 1-7.5-9 5.5 5.5 0 0 0 7.5 9z" fill="#fff"/><circle cx="17" cy="6" r="0.9" fill="#fff"/><circle cx="20" cy="9" r="0.7" fill="#fff"/>',
  };

  // Times shown in the bottom strip + header (matches the design preview).
  const PRAYERS = [
    { id: 'fajr',    name: 'Fajr',    time: '5:48',  ampm: 'AM' },
    { id: 'sunrise', name: 'Sunrise', time: '7:02',  ampm: 'AM' },
    { id: 'dhuhr',   name: 'Dhuhr',   time: '1:11',  ampm: 'PM' },
    { id: 'asr',     name: 'Asr',     time: '4:35',  ampm: 'PM' },
    { id: 'maghrib', name: 'Maghrib', time: '7:18',  ampm: 'PM' },
    { id: 'isha',    name: 'Isha',    time: '8:28',  ampm: 'PM' },
  ];
  // Canonical t-positions (matches PrayerArcGeometry.tValues).
  const T_VALUES = [0.10, 0.25, 0.50, 0.625, 0.75, 0.90];

  function renderMediumWidget(host, theme) {
    // Native medium widget aspect ≈ 338 × 158 (≈ 2.14 : 1). We draw
    // into a 338-wide viewBox; the container scales it via CSS.
    const W = 338, H = 158;
    const ARC_W = 338, ARC_H = 70;          // arc strip
    const horizonY = ARC_H * 0.52;
    const amp = ARC_H * 0.34;
    const sY = (t) => horizonY + amp * Math.cos(t * 2 * Math.PI);

    // Cosine path samples.
    const STEPS = 80;
    let path = `M0,${sY(0).toFixed(2)}`;
    for (let i = 1; i <= STEPS; i++) {
      const t = i / STEPS;
      path += ` L${(t * ARC_W).toFixed(2)},${sY(t).toFixed(2)}`;
    }

    const progress = 0.62;                  // mid-afternoon — between Asr & Maghrib
    const orbX = progress * ARC_W;
    const orbY = sY(progress);
    const orbR = 7;
    const lineW = 4;
    const markerR = 8.5;

    // Cut-outs at marker positions so the line ducks behind the icons.
    const markerCutMask = `
      <mask id="line-mask-${theme.key}">
        <rect width="${ARC_W}" height="${ARC_H}" fill="white"/>
        ${T_VALUES.map((t) => `<circle cx="${(t * ARC_W).toFixed(2)}" cy="${sY(t).toFixed(2)}" r="${markerR + 2}" fill="black"/>`).join('')}
      </mask>
    `;

    // Markers: dark base disc + accent tint + white SF-style icon.
    const markers = T_VALUES.map((t, i) => {
      const x = (t * ARC_W).toFixed(2);
      const y = sY(t).toFixed(2);
      const id = PRAYERS[i].id;
      const tint = 0.35 + (1 - Math.cos(t * 2 * Math.PI)) * 0.30; // brighter at peak
      return `
        <g transform="translate(${x},${y})">
          <circle r="${markerR}" fill="#0a0c1a"/>
          <circle r="${markerR}" fill="${theme.accent}" fill-opacity="${tint.toFixed(2)}"/>
          <g transform="translate(${-markerR * 0.55},${-markerR * 0.55}) scale(${(markerR * 1.1 / 24).toFixed(3)})">
            <svg viewBox="0 0 24 24" width="24" height="24">${PRAYER_ICONS[id]}</svg>
          </g>
        </g>
      `;
    }).join('');

    // Sun orb — split at the horizon: glowing white above, dark disc below.
    const aboveHorizon = orbY < horizonY;
    const orbGlow = aboveHorizon ? `
      <circle cx="${orbX}" cy="${orbY}" r="22" fill="${theme.accent}" opacity="0.10" filter="url(#blur-lg-${theme.key})"/>
      <circle cx="${orbX}" cy="${orbY}" r="14" fill="#fff" opacity="0.18" filter="url(#blur-md-${theme.key})"/>
      <circle cx="${orbX}" cy="${orbY}" r="${orbR + 4}" fill="#fff" opacity="0.55" filter="url(#blur-sm-${theme.key})"/>
      <circle cx="${orbX}" cy="${orbY}" r="${orbR}" fill="#fff"/>
    ` : `
      <circle cx="${orbX}" cy="${orbY}" r="${orbR}" fill="#000a12"/>
      <circle cx="${orbX}" cy="${orbY}" r="${orbR}" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.2"/>
    `;

    const nextIdx = PRAYERS.findIndex((_, i) => T_VALUES[i] > progress);
    const nextPrayer = PRAYERS[nextIdx] || PRAYERS[PRAYERS.length - 1];

    host.innerHTML = `
      <div class="w-bg"></div>
      <div class="w-inner">
        <header class="w-head">
          <div class="w-logo"><img src="assets/SirajProLogo.png" alt=""></div>
          <div class="w-name">
            <div class="w-name-1">${nextPrayer.name}</div>
            <div class="w-name-2">until ${nextPrayer.name} · ${nextPrayer.time} ${nextPrayer.ampm}</div>
          </div>
          <div class="w-timer">
            <div class="w-timer-big">2:48</div>
            <div class="w-timer-small">REMAINING</div>
          </div>
        </header>

        <div class="w-arc-wrap">
          <svg class="w-arc" viewBox="0 0 ${ARC_W} ${ARC_H}" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="line-${theme.key}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"  stop-color="${theme.accent}" stop-opacity="0.85"/>
                <stop offset="40%" stop-color="${theme.accent}" stop-opacity="0.55"/>
                <stop offset="65%" stop-color="${theme.accent}" stop-opacity="0.30"/>
                <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0.05"/>
              </linearGradient>
              <filter id="blur-sm-${theme.key}"><feGaussianBlur stdDeviation="2"/></filter>
              <filter id="blur-md-${theme.key}"><feGaussianBlur stdDeviation="5"/></filter>
              <filter id="blur-lg-${theme.key}"><feGaussianBlur stdDeviation="9"/></filter>
              ${markerCutMask}
            </defs>
            <line x1="0" y1="${horizonY}" x2="${ARC_W}" y2="${horizonY}" stroke="#fff" stroke-opacity="0.22" stroke-width="0.8"/>
            <path d="${path}" fill="none" stroke="url(#line-${theme.key})" stroke-width="${lineW}" stroke-linecap="round" mask="url(#line-mask-${theme.key})"/>
            ${markers}
            ${orbGlow}
          </svg>
        </div>

        <footer class="w-strip">
          ${PRAYERS.map((p, i) => {
            const isNext = i === nextIdx;
            const isPast = T_VALUES[i] <= progress;
            const cls = isNext ? 'is-next' : isPast ? 'is-past' : '';
            return `<div class="w-cell ${cls}"><div class="w-cell-n">${p.name}</div><div class="w-cell-t">${p.time}</div></div>`;
          }).join('')}
        </footer>
      </div>
    `;

    // Apply theme palette via CSS vars.
    host.style.setProperty('--w-accent', theme.accent);
    host.style.setProperty('--w-bloom', theme.bloom);
    host.style.setProperty('--w-mid', theme.mid);
    host.style.setProperty('--w-outer', theme.outer);
    host.style.setProperty('--w-edge', theme.edge);
  }

  function initThemeWidgets() {
    const widget = document.querySelector('[data-theme-widget]');
    const swatchHost = document.querySelector('[data-theme-swatches]');
    const label = document.querySelector('[data-theme-label]');
    if (!widget || !swatchHost) return;

    // Build the swatch row.
    swatchHost.innerHTML = THEMES.map((t, i) => `
      <button type="button"
              class="theme-swatch-btn"
              data-theme-key="${t.key}"
              aria-label="${t.name}"
              aria-pressed="${i === 0 ? 'true' : 'false'}"
              title="${t.name}"
              style="
                --swatch-bg: radial-gradient(circle at 32% 30%, ${t.accent} 0%, ${t.bloom} 70%);
                --swatch-glow: ${t.accent}cc;
              "></button>
    `).join('');

    // Pick + render a theme.
    let activeKey = THEMES[0].key;
    const apply = (key) => {
      const theme = THEMES.find((t) => t.key === key);
      if (!theme) return;
      renderMediumWidget(widget, theme);
      if (label) label.textContent = theme.name;
      swatchHost.querySelectorAll('.theme-swatch-btn').forEach((b) => {
        b.setAttribute('aria-pressed', b.dataset.themeKey === key ? 'true' : 'false');
      });
      activeKey = key;
    };

    // First render.
    apply(activeKey);

    // Wire up clicks.
    swatchHost.querySelectorAll('.theme-swatch-btn').forEach((b) => {
      b.addEventListener('click', () => apply(b.dataset.themeKey));
    });
  }

  // ── Mobile nav ──
  function initNav() {
    const t = document.querySelector(".nav-toggle");
    const l = document.querySelector(".nav-links");
    if (!t || !l) return;
    t.addEventListener("click", () => l.classList.toggle("open"));
    l.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => l.classList.remove("open"))
    );
  }

  // ── Reveal on scroll ──
  // Elements with `.reveal` start invisible (opacity: 0 + translateY)
  // and animate in via the `.in` class. Below the fold, an
  // IntersectionObserver triggers on entry. Above the fold (text-heavy
  // pages like privacy / terms / support), the observer's first
  // callback can fire late enough that the user briefly sees blank
  // content — so we also do a synchronous "is it already visible?"
  // sweep in the next frame and force `.in` on anything currently in
  // the viewport. Belt-and-suspenders, but it makes the legal pages
  // reliably show their content the moment they load.
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    const inViewport = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((e) => io.observe(e));

    // Force-reveal anything already in the viewport on initial paint
    // — two `requestAnimationFrame` calls ensures we run after layout
    // settles AND after the first paint, so the CSS transition still
    // plays smoothly instead of snapping.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        els.forEach((el) => {
          if (!el.classList.contains("in") && inViewport(el)) {
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      });
    });
  }

  // ── Android waitlist ──
  //
  // Two paths:
  //
  // 1. Big section form (#android .waitlist-form) — classic HTML form
  //    that POSTs to formsubmit.co and uses the ?waitlist=success
  //    redirect to show success inline.
  //
  // 2. Inline buttons in the hero + closing CTA — click expands a
  //    compact email-input pill right in place (no scrolling at all),
  //    and submission uses formsubmit.co's AJAX endpoint so the page
  //    never navigates. Dramatically more reliable on mobile than
  //    scrolling to the big section with the fixed nav in the way.
  function initWaitlist() {
    // ─── (1) Big section redirect-success handling ───
    const bigForm = document.querySelector("[data-waitlist]");
    const bigNote = document.querySelector("[data-waitlist-note]");
    if (bigForm) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("waitlist") === "success" && bigNote) {
        bigNote.textContent = "🎉 You're on the list — we'll email you the moment the Android app launches.";
        bigNote.classList.add("is-success");
        if (window.history.replaceState) {
          const clean = window.location.pathname + window.location.hash;
          window.history.replaceState({}, "", clean);
        }
      }
      const bigBtn = bigForm.querySelector(".waitlist-submit");
      bigForm.addEventListener("submit", () => {
        if (bigBtn) {
          bigBtn.disabled = true;
          bigBtn.textContent = "Sending…";
        }
      });
    }

    // ─── (2) Inline button → expand → AJAX submit ───
    document.querySelectorAll("[data-waitlist-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const form = document.getElementById(btn.dataset.waitlistToggle);
        if (!form) return;
        btn.style.display = "none";
        form.classList.add("is-open");
        // Focus the input on the next frame so the keyboard pops on mobile.
        requestAnimationFrame(() => {
          form.querySelector("input[type=email]")?.focus({ preventScroll: true });
        });
      });
    });

    document.querySelectorAll("[data-ajax-waitlist]").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = form.querySelector("input[type=email]");
        const submit = form.querySelector(".inline-waitlist-submit");
        const email = (input?.value || "").trim();
        if (!email) return;

        // Remove any previous error state.
        form.querySelector(".inline-waitlist-error")?.remove();

        submit.disabled = true;
        const originalLabel = submit.textContent;
        submit.textContent = "…";

        try {
          const res = await fetch("https://formsubmit.co/ajax/sirajproapp@gmail.com", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
              email,
              _subject: "Siraj Pro — new Android waitlist signup (inline)",
              _captcha: "false",
              _template: "table",
              source: form.id || "inline",
            }),
          });
          if (!res.ok) throw new Error("Submission failed");
          // Replace the form contents with an inline success message.
          form.innerHTML = `<div class="inline-waitlist-success">🎉 You're on the list — we'll email you the moment the Android app launches.</div>`;
        } catch (err) {
          submit.disabled = false;
          submit.textContent = originalLabel;
          const msg = document.createElement("div");
          msg.className = "inline-waitlist-error";
          msg.textContent = "Couldn't submit — please try again, or email sirajproapp@gmail.com.";
          form.appendChild(msg);
        }
      });
    });
  }

  // ── In-app browser escape (TikTok, Instagram, FB, Snapchat, …) ──
  //
  // Many social-app webviews either silently fail or render a broken
  // in-webview preview when the user taps an App Store link. We detect
  // these environments, intercept the Download button, and show a small
  // card that copies the link to the clipboard and tells the user how
  // to open it in Safari. Zero behavior change in real browsers.
  const APP_STORE_URL = "https://apps.apple.com/app/siraj-pro/id6789160938";

  function detectInAppBrowser() {
    const ua = navigator.userAgent || "";
    if (/BytedanceWebview|musical_ly|TTWebView|TikTok|aweme/i.test(ua)) return "TikTok";
    if (/Instagram/i.test(ua)) return "Instagram";
    if (/\bFBAN\b|\bFBAV\b|FB_IAB|FBIOS/i.test(ua)) return "Facebook";
    if (/\bSnapchat\b/i.test(ua)) return "Snapchat";
    if (/\bLinkedInApp\b/i.test(ua)) return "LinkedIn";
    if (/\bTwitter\b|TwitterAndroid/i.test(ua)) return "X / Twitter";
    if (/\bLine\//i.test(ua)) return "Line";
    if (/Pinterest/i.test(ua)) return "Pinterest";
    if (/MicroMessenger/i.test(ua)) return "WeChat";
    return null;
  }

  function isIOS() {
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    // iPadOS 13+ identifies as Mac — detect via touch points.
    return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  function buildInAppOverlay(appName) {
    const existing = document.getElementById("in-app-overlay");
    if (existing) return existing;

    const el = document.createElement("div");
    el.id = "in-app-overlay";
    el.className = "in-app-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML = `
      <div class="in-app-backdrop" data-dismiss></div>
      <div class="in-app-sheet" role="document">
        <div class="in-app-grabber" aria-hidden="true"></div>
        <button type="button" class="in-app-close" data-dismiss aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>

        <div class="in-app-hero">
          <div class="in-app-app-icon" aria-hidden="true">
            <img src="assets/SirajProLogo.png" alt="">
          </div>
          <h3>Open Siraj Pro in Safari</h3>
          <p>You're inside <strong>${escapeHtml(appName)}</strong>'s in-app browser — it can't reliably open the App Store from here. Pick either option:</p>
        </div>

        <div class="in-app-options">
          <div class="in-app-option">
            <div class="in-app-option-num" aria-hidden="true">1</div>
            <div class="in-app-option-body">
              <h4>Copy the link</h4>
              <p>Then paste it into Safari.</p>
              <div class="in-app-link">
                <input type="text" readonly value="${escapeHtml(APP_STORE_URL)}" aria-label="Siraj Pro App Store link">
                <button type="button" class="in-app-copy" data-copy>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="12" height="12" rx="2.5"/>
                    <path d="M5 15H4a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 014 3h9A1.5 1.5 0 0114.5 4.5V5"/>
                  </svg>
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>

          <div class="in-app-or" aria-hidden="true"><span>or</span></div>

          <div class="in-app-option">
            <div class="in-app-option-num" aria-hidden="true">2</div>
            <div class="in-app-option-body">
              <h4>Jump to the App Store</h4>
              <p>If this opens the App Store, tap <strong>Get</strong>. If nothing happens, open the App Store yourself and search <strong>“Siraj Pro”</strong>.</p>
              <button type="button" class="in-app-pill" data-open-store>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Open App Store
              </button>
            </div>
          </div>
        </div>

        <button type="button" class="in-app-cancel" data-dismiss>Not now</button>
      </div>
    `;
    document.body.appendChild(el);

    const close = () => el.classList.remove("is-open");
    el.querySelectorAll("[data-dismiss]").forEach((n) => n.addEventListener("click", close));
    el.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    const input = el.querySelector(".in-app-link input");
    const copyBtn = el.querySelector("[data-copy]");
    const copyLabel = copyBtn.querySelector("span");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(APP_STORE_URL);
      } catch {
        input.select();
        input.setSelectionRange(0, APP_STORE_URL.length);
        try { document.execCommand("copy"); } catch {}
      }
      copyLabel.textContent = "Copied";
      copyBtn.classList.add("is-copied");
      setTimeout(() => {
        copyLabel.textContent = "Copy";
        copyBtn.classList.remove("is-copied");
      }, 1800);
    });

    el.querySelector("[data-open-store]").addEventListener("click", () => {
      // Try the native App Store scheme first — some in-app webviews
      // (older TikTok, Snapchat) hand this straight to iOS which
      // launches the App Store app natively. If it silently no-ops,
      // fall through to the universal link ~450ms later.
      const itmsUrl = APP_STORE_URL.replace(/^https?:\/\/apps\.apple\.com/, "itms-apps://apps.apple.com");
      window.location.href = itmsUrl;
      setTimeout(() => {
        window.open(APP_STORE_URL, "_blank", "noopener");
      }, 450);
    });

    return el;
  }

  function initInAppBrowserGuard() {
    const inAppName = detectInAppBrowser();
    if (!inAppName || !isIOS()) return;        // only intercept on iOS inside a known in-app browser

    document.querySelectorAll('a[href*="apps.apple.com"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const overlay = buildInAppOverlay(inAppName);
        overlay.classList.add("is-open");
        // Nudge focus so VoiceOver / keyboard users land in the dialog.
        setTimeout(() => overlay.querySelector(".in-app-copy")?.focus(), 50);
      });
    });
  }

  function boot() {
    makeGlares();
    initNav();
    initThemeWidgets();
    initReveal();
    initWaitlist();
    initInAppBrowserGuard();
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
