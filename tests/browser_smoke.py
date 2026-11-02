"""Browser workflow checks; --inline is an explicit offline-only rendering harness."""
from pathlib import Path
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from threading import Thread
import json
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT / 'test-results/browser';OUT.mkdir(parents=True,exist_ok=True)
def inline_html():
    soup=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
    for meta in soup.find_all('meta', attrs={'http-equiv':'Content-Security-Policy'}): meta.decompose()
    for link in soup.find_all('link',rel='stylesheet'):
        style=soup.new_tag('style');style.string=(ROOT/link['href']).read_text();link.replace_with(style)
    for script in soup.find_all('script',src=True):
        script.string=(ROOT/script['src']).read_text();del script['src']
    return str(soup)
checks=[]
def check(name,value):
    checks.append({'name':name,'passed':bool(value)})
    if not value: print('FAILED',name)
inline = '--inline' in sys.argv
server = None
url = os.environ.get('BASE_URL')
if not inline and not url:
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
    options={'headless':True}
    if os.environ.get('CHROMIUM_PATH'): options['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
    errors=[];console_errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
    page.on('console',lambda message: console_errors.append(message.text) if message.type == 'error' else None)
    if inline: page.set_content(inline_html(),wait_until='domcontentloaded')
    else: page.goto(url,wait_until='domcontentloaded')
    page.wait_for_selector('#btn-open-booking-modal')
    def role(name): page.select_option('#role-select',name)
    def tab(name): page.click('#tab-'+name)
    page.screenshot(path=str(OUT/'01-booking.png'),full_page=True)
    check('application initialises',page.locator('#btn-open-booking-modal').is_visible())
    page.click('#btn-open-booking-modal');check('booking dialog focused',page.evaluate("document.getElementById('booking-modal').contains(document.activeElement)"))
    check('available reservation enabled',page.locator('#btn-confirm-booking').is_enabled())
    page.select_option('#booking-equipment','eq_us_01');check('maintenance prevents reservation',page.locator('#btn-confirm-booking').is_disabled())
    page.select_option('#booking-equipment','eq_standard');page.click('#btn-confirm-booking')
    check('reservation committed once',page.evaluate('AppStore.getState().bookings.length === 1'))
    page.click('#btn-open-booking-modal');check('repeat reservation blocked',page.locator('#btn-confirm-booking').is_disabled())
    page.keyboard.press('Escape');check('escape closes dialog',not page.locator('#booking-modal').is_visible())
    check('focus restored',page.locator('#btn-open-booking-modal').evaluate('(el)=>document.activeElement===el'))
    page.evaluate('AppStore.reset();App.refreshAllViews()')
    tab('epr');page.screenshot(path=str(OUT/'02-clinical.png'),full_page=True)
    for discipline in ['osteopathy','physiotherapy','cardiovascular','physiology','sc']:
        page.click('[data-discipline="'+discipline+'"]');check('discipline '+discipline,page.locator('#clinical-draft-form').is_visible())
    page.click('[data-discipline="osteopathy"]');role('student')
    check('student countersign disabled',page.locator('#btn-execute-countersign').is_disabled())
    page.fill('#epr-subjective','<img src=x onerror="window.badMarkup=true"> Updated synthetic history')
    page.click('#btn-save-draft');check('draft saved and versioned',page.evaluate('AppStore.getState().records.osteopathy.version === 2'))
    check('draft HTML escaped',page.evaluate('!window.badMarkup && document.querySelector("#epr-subjective").value.startsWith("<img")'))
    role('booker');check('booker clinical DOM hidden',page.locator('#clinical-draft-form').count()==0)
    check('booker has no research controls',page.locator('#btn-preview-research').count()==0)
    tab('commercial');page.screenshot(path=str(OUT/'03-commercial.png'),full_page=True)
    page.click('[data-add-service="srv_physio_eval"]');check('catalogue adds items',page.evaluate('AppStore.getState().cart[0].qty===2'))
    page.fill('#po-number','INVALID#PO');check('native PO pattern rejects invalid characters',page.locator('#po-number').evaluate('(el)=>!el.checkValidity()'))
    page.fill('#po-number','QA-PO-100');page.select_option('#po-terms','Net 60 Days');page.click('#btn-submit-po');page.wait_for_timeout(150)
    check('PO terms retained',page.evaluate('AppStore.getState().orders[0].paymentTerms==="Net 60 Days"'))
    check('booker has no approval button',page.locator('[data-approve-order]').count()==0)
    role('manager');page.locator('[data-approve-order]').first.click();page.wait_for_timeout(150)
    check('manager approves PO',page.evaluate('Boolean(AppStore.getState().orders[0].dateApproved)'))
    check('approval not falsely synced',page.evaluate('!AppStore.getState().orders[0].oracleEbsSynced'))
    tab('governance');page.screenshot(path=str(OUT/'04-governance.png'),full_page=True)
    check('dynamic finance includes new PO', 'QA-PO-100' in page.locator('#oracle-csv-preview').inner_text())
    page.fill('#audit-filter','<img src=x onerror="window.badMarkup=true">')
    check('audit filter plain text',page.locator('#audit-rows img').count()==0)
    page.fill('#audit-filter','')
    role('booker');tab('governance');check('booker finance DOM hidden',page.locator('#oracle-csv-preview').count()==0)
    role('supervisor');tab('epr');page.click('#btn-preview-research')
    check('research preview current', 'REF-STUDY-001' in page.locator('#research-modal').inner_text())
    page.keyboard.press('Escape')
    page.evaluate('AppStore.getState().records.osteopathy.researchConsent=false;EPRModule.render()');page.click('#btn-preview-research')
    check('research consent current', '"discipline": "osteopathy"' not in page.locator('#research-modal pre').inner_text())
    page.keyboard.press('Escape');page.evaluate('AppStore.reset();App.refreshAllViews()')
    tab('booking');page.click('#btn-release-place');role('booker');page.click('#btn-claim-place')
    check('waiting-list acceptance',page.evaluate('AppStore.getState().waitlistOffer.status === "CLAIMED"'))
    for width in [1440,1024,768,390,360,320]:
        page.set_viewport_size({'width':width,'height':900})
        for name,persona in [('booking','supervisor'),('epr','supervisor'),('commercial','booker'),('governance','manager')]:
            role(persona);tab(name)
            metrics=page.evaluate('({viewport:innerWidth,width:document.documentElement.scrollWidth})')
            check(f'no page overflow {name} {width}',metrics['width']<=width)
            if width in [390,768]:page.screenshot(path=str(OUT/f'{name}-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':1000});page.focus('#tab-governance');page.keyboard.press('Home')
    check('keyboard tab navigation',page.locator('#tab-booking').get_attribute('aria-selected')=='true')
    page.click('#btn-open-arch-modal');page.keyboard.press('Escape');check('overview escape',not page.locator('#arch-modal').is_visible())
    check('no uncaught JavaScript errors',not errors)
    check('no browser console errors',not console_errors)
    browser.close()
if server: server.shutdown()
result={'harness': 'offline-inline' if inline else 'http-browser', 'checks':checks,'passed':sum(c['passed'] for c in checks),'total':len(checks),'javascript_errors':errors,'console_errors':console_errors}
(OUT/'results.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
raise SystemExit(0 if all(c['passed'] for c in checks) else 1)
