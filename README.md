# Abdul Azeez - Portfolio 2

Recruiter-facing DevOps and cloud portfolio, retaining the Systems in Motion visual design.

## Deployment boundary

This repository is **zeez000/portfolio-2**, the testing site at https://zeez000.github.io/portfolio-2/.
The separate **zeez000/PORTFOLIO** live repository and its domain are not part of this deployment. No CNAME or production settings are changed. This testing site remains `noindex, nofollow`.

The pre-refinement version is preserved on `archive/before-recruiter-20260923`. The older pre-redesign version is on `archive/before-studio-20260923`.

## Recruiter-facing changes

- Name and explicit DevOps / Cloud / Early Career role lead the opening.
- Resume access is available in the header, hero, About, mobile navigation, and footer. The original PDF is unchanged.
- One implemented e-commerce project is featured, with source links, a directly reachable technical case study, and dated CI evidence.
- Technical notes explain container networking, Kafka inventory decisions, CI, documentation, and a Codespaces networking diagnosis.
- The empty CI/CD practice repository and README-only lab no longer appear as completed projects. Their obsolete dialogs were removed; learning areas are represented in a small, clearly labelled note.
- Verification details use native HTML details/summary and work without JavaScript.

## Evidence policy

Project source links are pinned to `zeez000/ecommerce-platform` commit `51640fe62522416e101af080e7a1e3801d4239c8`, reviewed on 23 September 2026.

The dated evidence links to Ecommerce Platform CI run `35885094668`, job `107263087989`, which passed the build, health checks, and end-to-end smoke test. The assertions cover product/inventory creation, a confirmed order, an insufficient-stock rejection, unchanged remaining stock after rejection, and the frontend/API proxy checks.

This is a recorded CI result, not a live service monitor. The architecture animation is an illustration. No production cloud deployment, uptime, customer traffic, load-test result, exactly-once guarantee, or production Kubernetes installation is claimed. The Codespaces firewall repair is environment-specific and is not reproduced by the cited CI run.

## Implementation

Static HTML with progressive enhancement. The base visual system is in `assets/site.css`; the scoped recruiter-facing layout and case-study components are in `assets/hiring.css`. `assets/site.js` handles navigation, motion preference, the diagram, and small interactions. `assets/scene.js` provides the optional Three.js sculpture.

GSAP and ScrollTrigger coordinate motion, Three.js renders the sculpture, and Lenis handles optional desktop scrolling. Native scrolling, content, navigation, and a CSS sculpture remain when the CDN is unavailable. Google Fonts are loaded externally; no font files are bundled here.

## Local preview and verification

```sh
python -m http.server 8000
```

Visit `http://localhost:8000/`.

```sh
python -m pip install playwright==1.55.0
python -m playwright install --with-deps chromium
node --check assets/site.js
node --check assets/scene.js
STRICT_ENHANCEMENTS=1 python tests/check_site.py
```

The GitHub Actions quality workflow performs real Chromium checks at 320, 390, 768, 1440, and 1920 pixels. It verifies fonts and animation libraries, content contracts, header and first-screen resume access, native evidence expansion, mobile navigation, motion controls, keyboard access, original PDF integrity, and blocked-CDN / no-JavaScript fallbacks. Screenshots and the machine-readable report are uploaded as artifacts. These checks are not a substitute for real-device or cross-browser testing.

Set `BASE_URL` to the deployed testing URL to run the same checks against GitHub Pages. Without it, the script serves the checkout using an ephemeral local port.
