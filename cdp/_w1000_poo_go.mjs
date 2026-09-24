// win1000: bedirectory submit via 9224 (phpLD + recaptcha v2)
// usage: node _w1000_bed_go.mjs fill | shot | anchor | solve <x> <y> (bframe tile idx) | submit | status
import http from 'http';
import fs from 'fs';

const CMD = process.argv[2] || 'status';
const ARG = process.argv[3];

function jsonSend(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: 9224, path, method, headers: { 'Content-Type': 'application/json' } }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tabs = await jsonSend('/json/list');
let tab = tabs.find((t) => t.type === 'page' && t.url.includes('poordirectory.com/submit'));
if (CMD === 'fill') {
  if (tab) await jsonSend(`/json/close/${tab.id}`, 'GET');
  const spare = tabs.find((t) => t.type === 'page' && t.url === 'about:blank');
  if (!spare) await jsonSend('/json/new?about:blank', 'PUT');
  tab = await jsonSend('/json/new?about:blank', 'PUT');
  await jsonSend(`/json/activate/${tab.id}`, 'GET');
} else if (!tab) {
  console.log('NO_TAB — run fill first');
  process.exit(1);
}

const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let mid = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const cmd = (method, params = {}) => new Promise((resolve) => {
  const id = ++mid;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});
await cmd('Page.enable');

async function shot(file, clip = null) {
  const p = { format: 'png' };
  if (clip) p.clip = clip;
  const r = await cmd('Page.captureScreenshot', p);
  fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  console.log('shot ->', file);
}
async function evalJs(expr) {
  const r = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true });
  return r?.result?.result?.value;
}

if (CMD === 'fill') {
  await cmd('Page.navigate', { url: 'https://www.poordirectory.com/submit.php' });
  await sleep(4000);
  const fill = await evalJs(`(() => {
    const set = (sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return 'missing:' + sel;
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return 'ok';
    };
    let r = [];
    r.push(set('input[name="TITLE"]', 'Spravs'));
    r.push(set('input[name="URL"]', 'https://spravs.com'));
    r.push(set('textarea[name="DESCRIPTION"]', 'Spravs offers detailed home appliance guides, buying checklists and maintenance tips, covering everything from refrigerators to HVAC so families choose and maintain equipment with confidence.'));
    r.push(set('input[name="OWNER_NAME"]', 'Leo Xm'));
    r.push(set('input[name="OWNER_EMAIL"]', 'dir.poordirectory@92ng.com'));
    const cat = document.querySelector('select[name="CATEGORY_ID"]');
    if (cat) { cat.value = '692'; cat.dispatchEvent(new Event('change', { bubbles: true })); r.push('cat=692'); }
    const agree = document.querySelector('input[name="AGREERULES"]');
    if (agree && !agree.checked) { agree.click(); r.push('agreed'); }
    return r.join('|');
  })()`);
  console.log('FILL:', fill);
  await sleep(800);
  // locate recaptcha anchor iframe
  const geo = await evalJs(`(() => {
    const f = document.querySelector('iframe[src*="recaptcha"][title*="reCAPTCHA"], iframe[src*="recaptcha/api2/anchor"]');
    if (!f) return 'NO_ANCHOR_IFRAME';
    const r = f.getBoundingClientRect();
    return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height });
  })()`);
  console.log('ANCHOR_GEO:', geo);
  await shot('D:/Github/seoadminC/storage/tmp/_w1000_poo_page.png');
  process.exit(0);
}

if (CMD === 'anchor') {
  const geo = JSON.parse(await evalJs(`JSON.stringify((() => { const f = document.querySelector('iframe[src*="recaptcha/api2/anchor"]'); const r = f.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })())`));
  const cx = geo.x + 30, cy = geo.y + geo.h / 2;
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
  console.log('anchor clicked at', cx, cy);
  await sleep(4000);
  const st = await evalJs(`(() => {
    const bf = document.querySelector('iframe[src*="recaptcha/api2/bframe"]');
    const bfr = bf ? bf.getBoundingClientRect() : null;
    const anchor = document.querySelector('iframe[src*="recaptcha/api2/anchor"]');
    return JSON.stringify({ bframeVisible: bfr && bfr.height > 50, bframe: bfr ? { x: bfr.x, y: bfr.y, w: bfr.width, h: bfr.height } : null, anchorChecked: anchor ? anchor.src.includes('anchor') : false });
  })()`);
  console.log('STATUS:', st);
  process.exit(0);
}

if (CMD === 'solve') {
  // ARG = "x,y" click coords INSIDE bframe image area (page coords)
  const [cx, cy] = ARG.split(',').map(Number);
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
  console.log('tile clicked', cx, cy);
  await sleep(1200);
  process.exit(0);
}

if (CMD === 'verify') {
  // click the VERIFY button inside bframe
  const geo = await evalJs(`(() => {
    const bf = document.querySelector('iframe[src*="recaptcha/api2/bframe"]');
    if (!bf) return 'NO_BFRAME';
    const r = bf.getBoundingClientRect();
    return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height });
  })()`);
  if (geo === 'NO_BFRAME') { console.log('NO_BFRAME'); process.exit(1); }
  const g = JSON.parse(geo);
  const vx = g.x + g.w - 75, vy = g.y + g.h - 30;
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: vx, y: vy, button: 'left', clickCount: 1 });
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: vx, y: vy, button: 'left', clickCount: 1 });
  console.log('verify clicked', vx, vy);
  await sleep(4000);
  process.exit(0);
}

if (CMD === 'status') {
  const st = await evalJs(`(() => {
    const cb = document.querySelector('iframe[src*="recaptcha/api2/anchor"]');
    const bf = document.querySelector('iframe[src*="recaptcha/api2/bframe"]');
    const body = document.body.innerText.slice(0, 200);
    return JSON.stringify({ hasAnchor: !!cb, bframeH: bf ? bf.getBoundingClientRect().height : 0, body });
  })()`);
  console.log('PAGE:', st);
  process.exit(0);
}

if (CMD === 'submit') {
  await evalJs(`(() => { const btns = [...document.querySelectorAll('input[type="submit"]')]; const b = btns.find(x => !x.closest('form[action*="index"]')) || btns[btns.length-1]; b.scrollIntoView({block:'center'}); return b.name; })()`);
  await sleep(500);
  const pos = JSON.parse(await evalJs(`JSON.stringify((() => { const btns = [...document.querySelectorAll('input[type="submit"]')]; const b = btns.find(x => x.value === 'Continue'); const r = b.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })())`));
  await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
  await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
  console.log('submit clicked', pos.x, pos.y);
  await sleep(5000);
  const res = await evalJs(`document.body.innerText.slice(0, 500)`);
  console.log('RESULT:', (res || '').replace(/\n+/g, ' | ').slice(0, 400));
  process.exit(0);
}

if (CMD === 'shotcap') {
  // screenshot the bframe challenge area
  const geo = await evalJs(`(() => { const bf = document.querySelector('iframe[src*="recaptcha/api2/bframe"]'); if (!bf) return 'NO'; const r = bf.getBoundingClientRect(); return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height }); })()`);
  if (geo === 'NO') { console.log('NO_BFRAME'); process.exit(1); }
  const g = JSON.parse(geo);
  await shot('D:/Github/seoadminC/storage/tmp/_w1000_poo_cap.png', { x: Math.max(0, g.x), y: Math.max(0, g.y), width: g.w, height: g.h, scale: 1 });
  console.log('BFARGE:', JSON.stringify(g));
  process.exit(0);
}
ws.close();
