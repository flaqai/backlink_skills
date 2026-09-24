// _w1200_hn_fix.mjs — win1200: hackernoon 编辑器修图(定位正确file input)+tag(portal容器)
import { CDP } from './CDP.mjs';
import { typeSmart } from './cdp-type.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await cdp.send('DOM.enable');
const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const fs = await import('fs');
  fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1200_${name}.jpg`, Buffer.from(data, 'base64'));
  console.log('shot:', name);
};

try {
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a' });
  await sleep(15000);
  // 0) 若有确认模态先点No
  const noHit = await cdp.eval(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^no$/i.test(b.innerText.trim()) && b.offsetParent !== null);
    if (!btn) return 'none';
    const r = btn.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  if (noHit !== 'none') {
    const { x, y } = JSON.parse(noHit);
    for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
    await sleep(3000);
    console.log('modal-No clicked');
  }

  // 1) 三个file input的上下文识别
  const ctx = await cdp.eval(`JSON.stringify([...document.querySelectorAll('input[type=file]')].map((e, i) => {
    let p = e; let txt = '';
    for (let k = 0; k < 5 && p; k++) { p = p.parentElement; if (p) txt = (p.innerText || '').replace(/\\s+/g, ' ').slice(0, 80); if (txt.trim()) break; }
    return { i, id: e.id, accept: e.accept, name: e.name, ctx: txt };
  }))`);
  console.log('file-inputs:', ctx);
  const files = JSON.parse(ctx);
  const fi = files.find(f => /featured|upload|image|1400/i.test(f.ctx) || (!/import|sticky/i.test(f.ctx) && f.i === 0));
  console.log('chosen:', JSON.stringify(fi));

  // 2) 对选中的 input setFileInputFiles(用document顺序定位)
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
  const idx = files.findIndex(f => f.i === fi.i);
  await cdp.send('DOM.setFileInputFiles', { nodeId: nodeIds[idx], files: ['D:\\Github\\backlink_skills\\cdp\\thumb-aitools.jpg'] });
  await sleep(8000);
  const upSt = await cdp.eval(`JSON.stringify({
    removeBtn: [...document.querySelectorAll('button, a, span')].some(e => /remove|delete/i.test(e.innerText) && e.offsetParent !== null),
    imgs: [...document.querySelectorAll('img')].filter(im => /hackernoon|cdn|upload|featured/.test(im.src) && im.offsetParent !== null).length,
    uploading: document.body.innerText.toUpperCase().includes('UPLOADING')
  })`);
  console.log('after-set:', upSt);
  await shot('hn_img');

  // 3) tag — 打字后扫 portal/fixed 容器
  await cdp.eval(`(() => { const e = [...document.querySelectorAll('input')].find(x => x.placeholder === 'Add Tag...'); if (e) { e.scrollIntoView({ block: 'center' }); e.focus(); } })()`);
  await typeSmart(cdp, 'input[placeholder="Add Tag..."]', 'technology', { verify: false });
  await sleep(4000);
  const portal = await cdp.eval(`(() => {
    const cands = [...document.querySelectorAll('div, ul')].filter(e => {
      const s = getComputedStyle(e);
      return (s.position === 'fixed' || s.position === 'absolute' || s.zIndex > 100) && e.offsetParent !== null && e.innerText.trim() && e.innerText.length < 200 && /tech|web|cod|produc|start/i.test(e.innerText);
    });
    return JSON.stringify([...new Set(cands.map(e => e.tagName + ':' + e.className.toString().slice(0, 40) + ':' + e.innerText.replace(/\\s+/g, '|').slice(0, 100)))].slice(0, 8));
  })()`);
  console.log('portal-dump:', portal);
  await shot('hn_tag');
} catch (e) { console.error('ERR', e.message); await shot('hn_err').catch(() => {}); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
