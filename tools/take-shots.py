"""Take Ember Kitchen's 4 screenshots: serve game/ on :8080, open each ?shot=
scene in headless Chromium, wait for window.__shotReady, save a JPEG. Also
measures live frame time: loads the plain game, counts rAF callbacks for 2 s
and reports the mean frame interval. Prints console errors and file sizes.
Run: `node serve.ts` first (background), then this script."""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path('/home/hatch/workspace/makefun/best-cooking-game-20261125-0137')
SHOTS = json.loads((ROOT / 'shots.json').read_text())
PORT = 8080
CHROME = '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome'

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    page.on('console', lambda m: errors.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    for shot in SHOTS:
        url = f'http://127.0.0.1:{PORT}/index.html{shot["query"]}'
        page.goto(url)
        try:
            page.wait_for_function('window.__shotReady === true', timeout=60000)
        except Exception as exc:
            print(f'{shot["name"]}: SHOT NOT READY: {exc}')
            continue
        out = ROOT / 'screenshots' / shot['name']
        page.screenshot(path=str(out), type='jpeg', quality=82)
        print(f'{shot["name"]}: {out.stat().st_size} bytes')
    # Live frame-time probe on the plain game (no ?shot=): count rAF for 2 s.
    page.goto(f'http://127.0.0.1:{PORT}/index.html')
    page.wait_for_timeout(500)
    frames = page.evaluate("""() => new Promise((resolve) => {
      let n = 0;
      const t0 = performance.now();
      const tick = () => {
        n += 1;
        if (performance.now() - t0 < 2000) requestAnimationFrame(tick);
        else resolve({ frames: n, ms: performance.now() - t0 });
      };
      requestAnimationFrame(tick);
    })""")
    print(f'FRAME PROBE: {frames["frames"]} rAF callbacks in {frames["ms"]:.0f} ms '
          f'-> mean frame {frames["ms"]/frames["frames"]:.1f} ms')
    browser.close()

print('CONSOLE ISSUES:' if errors else 'NO CONSOLE ISSUES')
for e in errors[:20]:
    print(' ', e)
