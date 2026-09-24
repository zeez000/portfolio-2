"""Online browser verification for the standalone portfolio-2 testing site."""
import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa-artifacts'
OUT.mkdir(exist_ok=True)
STRICT = os.environ.get('STRICT_ENHANCEMENTS') == '1'

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = os.environ.get('BASE_URL', f'http://127.0.0.1:{server.server_port}/')
report = {'url': url, 'checks': []}

def check(name, passed, details=None):
    report['checks'].append({'name': name, 'passed': bool(passed), 'details': details})
    print(('PASS ' if passed else 'FAIL ') + name, details or '', flush=True)
    if not passed:
        raise AssertionError(name + ': ' + str(details))

def width_ok(page):
    return page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')

try:
    with sync_playwright() as p:
        launch = {'headless': True, 'args': ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist']}
        if os.environ.get('CHROMIUM_PATH'):
            launch['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = p.chromium.launch(**launch)
        for name, width, height, mobile in [('desktop',1440,1000,False),('mobile',390,844,True),('small-mobile',320,740,True),('tablet',768,1024,False),('wide',1920,1080,False)]:
            context = browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url, wait_until='domcontentloaded', timeout=90000)
            page.wait_for_function('window.portfolioState && window.portfolioState.ready', timeout=30000)
            if STRICT:
                page.wait_for_function('window.portfolioState.scene === "webgl"', timeout=45000)
            page.evaluate('document.fonts.ready')
            fonts = page.evaluate('''async () => {
                const requests = ['400 16px "DM Sans"', 'italic 400 16px "Instrument Serif"'];
                return Promise.all(requests.map(async font => {
                    try {
                        const faces = await document.fonts.load(font, 'Portfolio');
                        return {font, count:faces.length, loaded:faces.length > 0 && faces.every(f => f.status === 'loaded')};
                    } catch (error) { return {font, loaded:false, error:String(error)}; }
                }));
            }''')
            page.wait_for_timeout(1600)
            page.screenshot(path=str(OUT / f'{name}-hero.png'))
            page.screenshot(path=str(OUT / f'{name}-hero.jpg'), type='jpeg', quality=75)
            check(name + ': no horizontal overflow', width_ok(page))
            check(name + ': one main heading', page.locator('h1').count() == 1)
            check(name + ': personal content', 'Abdul Azeez' in page.locator('body').inner_text())
            check(name + ': one implemented project', page.locator('.featured-project').count() == 1 and page.locator('.secondary-projects').count() == 0)
            check(name + ': clear target role', 'DevOps & Cloud' in page.locator('.role-label').inner_text())
            check(name + ': name is the main heading', page.locator('h1').get_attribute('aria-label') == 'Abdul Azeez')
            check(name + ': resume in header', page.locator('.header-resume').is_visible() and page.locator('.header-resume').get_attribute('href') == 'abdul-azeez-resume.pdf')
            check(name + ': resume in first viewport', page.locator('.resume-link').is_visible() and page.locator('.resume-link').bounding_box()['y'] + page.locator('.resume-link').bounding_box()['height'] <= height)
            check(name + ': no empty-project showcase links', page.locator('a[href="https://github.com/zeez000/devops"], a[href="https://github.com/zeez000/devops-cicd-project"]').count() == 0)
            check(name + ': obsolete project popups removed', page.locator('[data-project], #project-dialog').count() == 0)
            check(name + ': learning areas labelled honestly', 'not completed portfolio projects' in page.locator('.learning-note').inner_text())
            check(name + ': verified run linked', page.locator('.verified-run').get_attribute('href').endswith('/actions/runs/35885094668'))
            check(name + ': evidence is dated, not live status', '23 Sep 2026' in page.locator('.verified-run').inner_text() and 'not a live status' in page.locator('.verified-run').inner_text())
            check(name + ': internal destinations exist', page.locator('a[href^="#"]').evaluate_all('(els) => els.every(e => document.getElementById(e.getAttribute("href").slice(1)))'))
            check(name + ': source links pinned', page.locator('.implementation-grid .text-link, .debug-detail .text-link').evaluate_all('(els) => els.every(e => e.href.includes("/51640fe62522416e101af080e7a1e3801d4239c8/"))'))
            state = page.evaluate('window.portfolioState')
            report[name] = {**state, 'fonts':fonts}
            if STRICT:
                check(name + ': actual GSAP loaded', state['gsap'])
                check(name + ': actual Three.js rendered', state['scene'] == 'webgl')
                check(name + ': Lenis loaded', page.evaluate('typeof window.Lenis === "function"'))
                check(name + ': rendered font styles loaded', all(font['loaded'] for font in fonts), fonts)
            page.locator('.structure-toggle').click()
            check(name + ': structure toggle', page.locator('.structure-toggle').get_attribute('aria-pressed') == 'true')
            page.wait_for_timeout(1600)
            if name == 'desktop':
                page.screenshot(path=str(OUT / 'desktop-exploded.png'))
            page.locator('.structure-toggle').click()
            if mobile:
                page.locator('.menu-toggle').click()
                check(name + ': navigation opens', page.locator('#mobile-menu').evaluate('(el)=>el.open'))
                page.locator('#mobile-menu a[href="#work"]').click()
                check(name + ': navigation closes', not page.locator('#mobile-menu').evaluate('(el)=>el.open'))
            page.locator('.motion-toggle').click()
            check(name + ': motion can be disabled', page.locator('html').get_attribute('data-motion') == 'off')
            page.locator('.project-actions a[href="#case-study"]').click()
            check(name + ': case study is directly reachable', page.locator('#case-study').is_visible() and page.url.endswith('#case-study'))
            page.locator('.verification-panel summary').click()
            check(name + ': verification details open', page.locator('.verification-panel').get_attribute('open') is not None)
            check(name + ': test assertions visible', 'stock remains at 3' in page.locator('.verification-content').inner_text())
            check(name + ': limitations visible', 'production cloud deployment' in page.locator('.scope-note').inner_text())
            if name in ('desktop', 'mobile'):
                page.locator('.verification-panel').screenshot(path=str(OUT / f'{name}-evidence.png'))
            page.locator('.verification-panel summary').click()
            page.locator('.trace-button').click()
            page.wait_for_timeout(900)
            check(name + ': flow trace completes', 'Inventory' in page.locator('.trace-caption').inner_text() and page.locator('.trace-button').is_enabled())
            page.locator('.toolkit-list details').nth(2).locator('summary').click()
            check(name + ': toolkit expands', page.locator('.toolkit-list details').nth(2).get_attribute('open') is not None)
            page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
            page.wait_for_timeout(300)
            page.screenshot(path=str(OUT / f'{name}-full.png'), full_page=True)
            check(name + ': no unhandled JavaScript errors', not errors, errors)
            check(name + ': no overflow after interactions', width_ok(page))
            context.close()
        context = browser.new_context(viewport={'width':1280,'height':900}, reduced_motion='reduce')
        page=context.new_page(); page.goto(url,wait_until='domcontentloaded',timeout=90000)
        page.wait_for_function('window.portfolioState && window.portfolioState.ready')
        check('OS reduced motion is honoured', page.locator('html').get_attribute('data-motion')=='off')
        check('Reduced motion has no smooth-scroll engine', not page.evaluate('window.portfolioState.lenis'))
        page.keyboard.press('Tab')
        check('Keyboard skip link comes first', page.locator('.skip-link').evaluate('(e)=>document.activeElement===e'))
        page.screenshot(path=str(OUT/'reduced-motion.png'))
        context.close()
        context=browser.new_context(viewport={'width':390,'height':844},java_script_enabled=False)
        page=context.new_page(); page.goto(url,wait_until='domcontentloaded',timeout=90000)
        check('No-JavaScript content remains visible', page.locator('h1').is_visible() and page.locator('#contact').is_visible())
        check('No-JavaScript layout does not overflow', width_ok(page))
        page.locator('.verification-panel summary').click()
        check('Evidence is accessible without JavaScript', page.locator('.verification-content').is_visible())
        check('No-JavaScript resume link visible', page.locator('.header-resume').is_visible())
        check('Email destination preserved', page.locator('.email-row a').get_attribute('href')=='mailto:abdzeez000@gmail.com')
        check('Resume destination preserved', page.locator('.about-story a').get_attribute('href')=='abdul-azeez-resume.pdf')
        response=context.request.get(url+'abdul-azeez-resume.pdf')
        data=response.body()
        check('Resume returns an actual PDF', response.ok and data.startswith(b'%PDF'))
        check('Original resume is byte-identical', hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()=='56deed174544b354f222d027061f13a061e541e4')
        context.close()
        context=browser.new_context(viewport={'width':390,'height':844})
        context.route('https://cdn.jsdelivr.net/**',lambda route:route.abort())
        page=context.new_page(); page.goto(url,wait_until='domcontentloaded',timeout=90000)
        page.wait_for_function('window.portfolioState && window.portfolioState.ready')
        check('CDN failure preserves the site', page.locator('h1').is_visible() and width_ok(page))
        page.locator('.structure-toggle').click()
        check('CDN failure preserves sculpture interaction', page.locator('.hero-art').evaluate('(e)=>e.classList.contains("is-exploded")'))
        page.screenshot(path=str(OUT/'mobile-fallback.png'))
        context.close(); browser.close()
    report['passed'] = True
finally:
    (OUT/'report.json').write_text(json.dumps(report,indent=2))
    server.shutdown()
