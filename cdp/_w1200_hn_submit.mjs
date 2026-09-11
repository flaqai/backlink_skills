// _w1200_hn_submit.mjs — win1200: hackernoon draft收口(传featured image+tag+Submit)
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
const realClick = async (css) => {
  const p = await cdp.eval(`(() => {
    const e = ${css};
    if (!e) return 'null';
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + Math.min(80, r.width / 2)), y: Math.round(r.y + r.height / 2) });
  })()`);
  if (p === 'null') return false;
  const { x, y } = JSON.parse(p);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
  return true;
};

try {
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a' });
  await sleep(15000);
  // 0) 标题转储
  const meta = await cdp.eval(`(() => {
    const t = document.querySelector('textarea[placeholder*="Title"], input[placeholder*="itle"]');
    const body = document.querySelector('[contenteditable=true]');
    return JSON.stringify({ title: t ? (t.value || t.innerText) : '', bodyHead: body ? body.innerText.slice(0, 120) : '' });
  })()`);
  console.log('meta:', meta);

  // 1) featured image — DOM.setFileInputFiles
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
  console.log('file-inputs:', nodeIds.length);
  if (nodeIds.length) {
    await cdp.send('DOM.setFileInputFiles', { nodeId: nodeIds[0], files: ['D:\\Github\\backlink_skills\\cdp\\thumb-aitools.jpg'] });
    await sleep(6000);
    const up = await cdp.eval(`document.body.innerText.includes('UPLOADING') || document.body.innerText.includes('Click to Remove') || document.body.innerText.includes('Remove')`);
    console.log('upload-poke:', up);
  } else { console.log('无file input!'); await shot('hn_nofileinput'); }

  // 2) tag — Add Tag... 输入
  const tagOk = await realClick(`[...document.querySelectorAll('input')].find(e => e.placeholder === 'Add Tag...')`);
  if (tagOk) {
    await typeSmart(cdp, 'input[placeholder="Add Tag..."]', 'technology', { verify: false });
    await sleep(3000);
    const sugg = await cdp.eval(`(() => {
      const els = [...document.querySelectorAll('[class*="sugg"], [class*="option"], [class*="dropdown"], [class*="menu"], li, [role="option"]')].filter(e => e.offsetParent !== null && e.innerText.trim() && e.innerText.length < 40);
      return JSON.stringify([...new Set(els.map(e => e.innerText.trim()))].slice(0, 10));
    })()`);
    console.log('tag-sugg:', sugg);
    // 若有候选, 点第一个; 否则回车
    const arr = JSON.parse(sugg);
    let done = false;
    for (const s of arr) {
      const hit = await cdp.eval(`(() => {
        const e = [...document.querySelectorAll('[class*="sugg"], [class*="option"], [class*="dropdown"], [class*="menu"], li, [role="option"]')].find(x => x.offsetParent !== null && x.innerText.trim() === ${JSON.stringify(s)});
        if (!e) return 'null';
        const r = e.getBoundingClientRect();
        return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
      })()`);
      if (hit !== 'null') {
        const { x, y } = JSON.parse(hit);
        for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
        done = true; break;
      }
    }
    if (!done) { await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', windowsVirtualKeyCode: 13 }); await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', windowsVirtualKeyCode: 13 }); }
    await sleep(2000);
    const tagNow = await cdp.eval(`document.body.innerText.includes('empty tag') ? 'STILL-EMPTY' : 'TAGGED'`);
    console.log('tag-state:', tagNow);
  }

  // 3) Submit Story for Review!
  const sOk = await realClick(`[...document.querySelectorAll('button')].find(b => /submit story for review/i.test(b.innerText))`);
  console.log('submit-click:', sOk);
  await sleep(5000);
  await shot('hn_after_submit_click');
  const modal = await cdp.eval(`(() => {
    const m = document.querySelector('[class*="modal"], [class*="Modal"], [role="dialog"]');
    return JSON.stringify({ has: !!m, txt: m ? m.innerText.slice(0, 500) : document.body.innerText.slice(0, 400) });
  })()`);
  console.log('modal:', modal);
} catch (e) { console.error('ERR', e.message); await shot('hn_err').catch(() => {}); }
process.exit(0);
