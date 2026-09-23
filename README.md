# Abdul Azeez - Systems in motion

A complete standalone redesign of **portfolio-2**, the testing portfolio.

Testing site: https://zeez000.github.io/portfolio-2/

## Isolation

`zeez000/PORTFOLIO` is the separate live repository. Do not modify that repository, its deployment, or its domain. This repository has no CNAME. The old testing design is preserved on `archive/before-studio-20260923`.

## Design and implementation

Warm off-white, ink, cobalt, and chartreuse. Large DM Sans typography is contrasted with Instrument Serif. An interactive layered sculpture represents independent parts working together. The projects, diagrams, profile, toolkit, and contact section share the same visual language.

The old CSS and JavaScript are replaced, not overlaid. Legacy page URLs redirect to the appropriate sections. The original resume PDF is preserved byte-for-byte.

- GSAP 3.13.0 with ScrollTrigger: coordinated typography, reveals, pointer response, and scroll accents.
- Three.js 0.180.0: nine bevelled layers, pointer response, assembly/explosion, and locally generated studio lighting. No downloaded 3D model.
- Lenis 1.3.11: smooth desktop wheel scrolling synchronized with GSAP. Touch devices retain native scrolling.
- Native anchor navigation, details/summary, and accessible dialogs. The content-led site requires no application framework or build step.

Libraries use pinned CDN URLs. If they are unavailable, content, links, project notes, and the CSS sculpture remain available. Fonts use display=swap and system fallbacks. No font files are included in this repository.

Motion can be disabled in the header; the system reduced-motion preference is honoured. WebGL drawing pauses offscreen, when hidden, and while a reduced-motion static scene is unchanged. The order-flow sketch is illustrative, never a fabricated live status monitor.

## Reference review - 23 September 2026

Reviewed accessible pages and documentation at https://gsap.com/, https://motion.dev/, https://www.react-spring.dev/, https://animejs.com/, https://threejs.org/, and https://lenis.dev/.

GSAP informed coordinated timelines. Motion and React Spring informed restrained, continuous interaction. Anime.js informed compact graphic choreography. Three.js enables the sculptural element; Lenis coordinates wheel scrolling. Motion, React Spring, and Anime.js are references rather than redundant runtime dependencies.

https://spring.dev/ could not be retrieved. No claim is made that it was inspected. Interactive visual browsing of reference-site animations was unavailable locally; accessible page content and documentation were reviewed.

## Content provenance

Identity, education, location, CGPA, skills, email, LinkedIn, project links, and descriptions were carried over from portfolio-2 profile.html, stack.html, projects.html, and contact.html at commit `f60c9a6b5c7704c6f26e7eecc124b740fd461e0a`. No employment history, certifications, performance metrics, or production-scale achievements were invented.

## Development and verification

Run `python -m http.server 8080` and open http://localhost:8080.

Browser checks: install `playwright==1.55.0`, run `python -m playwright install chromium`, then `STRICT_ENHANCEMENTS=1 python tests/check_site.py`.

The quality workflow runs only in portfolio-2 with read-only repository permissions. It saves desktop/mobile screenshots and test results as workflow artifacts. It does not deploy. Existing GitHub Pages publishing from this repository's main branch remains responsible for the testing site.

The local no-library fallback was tested separately at 320, 390, 768, 1440, and 1920 pixels. Online animation checks are reported by CI; local fallback checks do not establish that CDN libraries loaded.

The testing site deliberately uses noindex,nofollow. Remove only for a separately authorized production launch.
