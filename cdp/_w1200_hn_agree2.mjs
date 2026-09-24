// _w1200_hn_agree2.mjs — win1200: 修邮箱(insertText)+全checkbox扫描+投稿协议勾选
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const fs = await import('fs');
  fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1200_${name}.jpg`, Buffer.from(data, 'base64'));
  console.log('shot:', name);
};
const realClick = async (evalFn) => {
  const p = await cdp.eval(evalFn);
  if (p === 'null' || p === 'none' || p === '"none"') return null;
  const { x, y } = JSON.parse(p);
  for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
  return { x, y };
};

try {
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a' });
  await sleep(15000);
  // 1) 修邮箱: 三连全选删除+insertText
  const em = await cdp.eval(`(() => {
    const e = [...document.querySelectorAll('input')].find(x => x.placeholder === 'you@email.com');
    if (!e) return 'noemail';
    e.scrollIntoView({ block: 'center' }); e.focus();
    return 'ok';
  })()`);
  if (em === 'ok') {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', windowsVirtualKeyCode: 65, modifiers: 2 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', windowsVirtualKeyCode: 65, modifiers: 2 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Delete', windowsVirtualKeyCode: 46 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Delete', windowsVirtualKeyCode: 46 });
    await cdp.send('Input.insertText', { text: 'hackernoon@92ng.com' });
    await sleep(1000);
    console.log('email-fixed:', await cdp.eval(`[...document.querySelectorAll('input')].find(x => x.placeholder === 'you@email.com').value`));
  }
  // 2) 全checkbox扫描
  const all = await cdp.eval(`JSON.stringify([...document.querySelectorAll('input[type=checkbox]')].map((e, i) => {
    const lb = e.closest('label, div') || {};
    return { i, checked: e.checked, vis: e.offsetParent !== null, name: e.name, label: (lb.innerText || '').replace(/\\s+/g, ' ').slice(0, 150) };
  }))`);
  console.log('checkboxes:', all);
  // 3) 勾选所有未勾且可见、label含agree/terms/submission的
  const list = JSON.parse(all);
  for (const c of list) {
    if (c.vis && !c.checked && /agree|terms|submission|guideline|original/i.test(c.label)) {
      const r = await cdp.eval(`(() => { const e = document.querySelectorAll('input[type=checkbox]')[${c.i}]; if (!e) return 'null'; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + Math.min(12, r.width / 2)), y: Math.round(r.y + r.height / 2) }); })()`);
      if (r !== 'null') {
        const { x, y } = JSON.parse(r);
        for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
        await sleep(1200);
        console.log('clicked-cb', c.i, c.label.slice(0, 60));
      }
    }
  }
  // 4) Submit按钮复查+若解禁则提交
  const btn = await cdp.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => /submit story for review/i.test(x.innerText)); return b ? JSON.stringify({ disabled: b.disabled }) : '"nobtn"'; })()`);
  console.log('btn-now:', btn);
  if (btn.includes('"disabled":false')) {
    const ok = await realClick(`(() => { const b = [...document.querySelectorAll('button')].find(x => /submit story for review/i.test(x.innerText)); if (!b) return 'null'; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
    await sleep(6000);
    await realClick(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^yes$/i.test(b.innerText.trim()) && b.offsetParent !== null); if (!b) return 'null'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
    await sleep(10000);
    console.log('final-url:', await cdp.eval('location.href'));
    console.log('final-body:', await cdp.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 400)`));
    await shot('hn_final2');
  } else await shot('hn_dis2');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
