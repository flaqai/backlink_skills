// win1000: DOM-render anchor check for 15 CHK pages via 9224
// usage: node _w1000_dom_chk.mjs
import http from 'http';
import fs from 'fs';

const PAGES = [
  ['904', 'https://byzantinenexus.io/@leoxm/pages/power-strips-with-usb-ports-what-the-shared-wattag', 'spravs.com'],
  ['892', 'https://misskey.limia-branks.jp/@leoxm26/pages/qr-code-tip-jar-how-digital-tipping-works-for-busk', 'qrcodegenerator.vip'],
  ['201423', 'https://friendica.rogueproject.org/display/b71a4a1e-196a-a9a9-b783-4f4179850036', 'spravs.com'],
  ['209013', 'https://leoxmseo2.wordpress.com/2026/09/16/buying-a-used-generator-the-inspection-checklist-that-saves-your-wallet-and-your-weekend/', 'generatorforhouse.org'],
  ['219443', 'https://misskey.tokyo/@leoxm/pages/gaming-device-charging-keeping-phones-and-handheld', 'spravs.com'],
  ['427', 'https://leoxme.blogdemls.com/42752293/removing-reflections-from-product-photos-prevention-repair-and-where-ai-fits', 'aiimageeditorfree.com'],
  ['277', 'https://leoxme.buyoutblog.com/42754958/%E9%A6%99%E6%B8%AF%E8%99%9A%E6%8B%9F%E9%93%B6%E8%A1%8C%E7%9A%84%E9%92%B1%E5%AE%89%E5%85%A8%E5%90%97-80-%E4%B8%87%E5%AD%98%E6%AC%BE%E4%BF%9D%E9%9A%9C%E6%80%8E%E4%B9%88%E7%AE%97-%E4%BF%9D%E4%BB%80%E4%B9%88%E4%B8%8D%E4%BF%9D%E4%BB%80%E4%B9%88', 'zakaihu.com'],
  ['464', 'https://leoxme.blogminds.com/explainer-videos-with-generative-footage-the-visual-grammar-of-ideas-39936808', 'aivideogeneratorfree.org'],
  ['469', 'https://leoxme.ezblogz.com/74953547/text-to-video-or-image-to-video-the-routing-decision-that-decides-your-results', 'aivideogeneratorfree.org'],
  ['477', 'https://leoxme.techionblog.com/42954219/directory-comment-sections-the-free-market-research-channel-nobody-harvests', 'aitoolsdirectory.vip'],
  ['258', 'https://leoxme.blogoxo.com/43109448/qr-code-scams-how-to-spot-a-malicious-code-before-you-scan', 'qrcodegenerator.vip'],
  ['355', 'https://leoxme.wssblogs.com/42597163/classic-cars-and-california-smog-who-s-exempt-and-what-still-applies', 'smogcheck-nearme.com'],
  ['361', 'https://leoxme.tkzblog.com/42461195/modified-cars-and-smog-checks-what-passes-what-fails-what-gets-flagged', 'smogcheck-nearme.com'],
  ['365', 'https://leoxme.blogunok.com/42960744/generator-fuel-storage-how-long-gasoline-actually-lasts-and-how-to-extend-it', 'generatorforhouse.org'],
  ['438', 'https://leoxme.tribunablog.com/jpg-png-or-webp-choosing-export-formats-that-keep-product-photos-sharp-and-fast-57828042', 'aiimageeditorfree.com'],
];

function jsonSend(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: 9224, path, method, headers: { 'Content-Type': 'application/json' } }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve(d); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ensure a spare about:blank exists so closing our tab never kills Chrome
const tabs = await jsonSend('/json/list');
const spare = tabs.find((t) => t.type === 'page' && (t.url === 'about:blank' || t.url === ''));
let spareId = spare?.id;
if (!spare) {
  const nt = await jsonSend('/json/new?about:blank', 'PUT');
  spareId = nt.id;
}

const own = await jsonSend('/json/new?about:blank', 'PUT');
const tabId = own.id;
await jsonSend(`/json/activate/${tabId}`, 'GET');

// minimal CDP over websocket: use Node's built-in WebSocket (Node 22+)
const wsUrl = own.webSocketDebuggerUrl;
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let mid = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function cmd(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++mid;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await cmd('Page.enable');
const out = [];
for (const [pid, url, host] of PAGES) {
  try {
    await cmd('Page.navigate', { url });
    await sleep(6000); // allow JS render for misskey family
    const r = await cmd('Runtime.evaluate', {
      expression: `(() => {
        const title = document.title || '';
        const links = [...document.querySelectorAll('a[href]')].map(a => a.href);
        const hit = links.filter(h => h.includes('${host}'));
        const bodyLen = document.body ? document.body.innerText.length : 0;
        return JSON.stringify({ title: title.slice(0, 80), bodyLen, hitCount: hit.length, hitSample: hit.slice(0, 2), linkCount: links.length });
      })()`,
      returnByValue: true,
    });
    const d = JSON.parse(r?.result?.result?.value ?? '{}');
    const verdict = d.hitCount > 0 ? 'ANCHOR_OK(dom)' : (d.title.includes('見つかりません') || d.title.toLowerCase().includes('not found') ? 'PAGE_404(dom)' : 'NOANCHOR(dom)');
    out.push(`${pid}|${verdict}|title="${d.title}"|bodyLen=${d.bodyLen}|links=${d.linkCount}|hit=${d.hitCount}`);
    console.log(out[out.length - 1]);
  } catch (e) {
    out.push(`${pid}|ERR|${String(e).slice(0, 60)}`);
    console.log(out[out.length - 1]);
  }
}
fs.writeFileSync('D:/Github/backlink_skills/cdp/_w1000_dom_result.txt', out.join('\n'));
try { ws.close(); } catch {}
await jsonSend(`/json/close/${tabId}`, 'GET');
console.log('DONE tab closed, spare kept:', spareId);
