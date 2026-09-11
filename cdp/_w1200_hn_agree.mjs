// _w1200_hn_agree.mjs — win1200: hackernoon 填投稿邮箱+勾agreed→Submit按钮解禁判定
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
  // 1) 邮箱框 insertText 真实打字
  const foc = await cdp.eval(`(() => {
    const e = [...document.querySelectorAll('input')].find(x => x.placeholder === 'you@email.com');
    if (!e) return 'noemail';
    e.scrollIntoView({ block: 'center' });
    e.focus();
    return 'ok';
  })()`);
  console.log('email-focus:', foc);
  if (foc === 'ok') {
    for (const ch of 'hackernoon@92ng.com') {
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, windowsVirtualKeyCode: ch === '@' ? 50 : ch.toUpperCase().charCodeAt(0), text: ch, unmodifiedText: ch, modifiers: ch === '@' ? 8 : 0 });
      await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, windowsVirtualKeyCode: ch === '@' ? 50 : ch.toUpperCase().charCodeAt(0) });
    }
    await sleep(1000);
    const ev = await cdp.eval(`(() => { const e = [...document.querySelectorAll('input')].find(x => x.placeholder === 'you@email.com'); return e ? e.value : ''; })()`);
    console.log('email-value:', ev);
  }
  // 2) agreed checkbox 状态与点击
  const cb = await cdp.eval(`(() => {
    const e = [...document.querySelectorAll('input[type=checkbox]')].find(x => x.name === 'agreed' || (x.closest('label, div') || {}).innerText && /agree/i.test(x.closest('label, div').innerText));
    if (!e) return 'nocb';
    const r = e.getBoundingClientRect();
    return JSON.stringify({ checked: e.checked, vis: e.offsetParent !== null, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), label: ((e.closest('label, div') || {}).innerText || '').slice(0, 120) });
  })()`);
  console.log('agreed-cb:', cb);
  if (cb !== 'nocb' && cb !== '"nocb"') {
    const C = JSON.parse(cb);
    if (!C.checked && C.vis) {
      await realClick(`(() => { const e = [...document.querySelectorAll('input[type=checkbox]')].find(x => x.name === 'agreed'); if (!e) return 'null'; const r = e.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
      await sleep(1500);
      console.log('agree-now:', await cdp.eval(`(() => { const e = [...document.querySelectorAll('input[type=checkbox]')].find(x => x.name === 'agreed'); return e ? e.checked : 'gone'; })()`));
    }
  }
  // 3) Submit按钮状态复查
  const btn = await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /submit story for review/i.test(x.innerText));
    if (!b) return '"nobtn"';
    return JSON.stringify({ disabled: b.disabled });
  })()`);
  console.log('submit-btn-now:', btn);
  if (btn.includes('"disabled":false')) {
    const ok = await realClick(`(() => { const b = [...document.querySelectorAll('button')].find(x => /submit story for review/i.test(x.innerText)); if (!b) return 'null'; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
    console.log('submit-click:', !!ok);
    await sleep(6000);
    const yes = await realClick(`(() => { const b = [...document.querySelectorAll('button')].find(b => /^yes$/i.test(b.innerText.trim()) && b.offsetParent !== null); if (!b) return 'null'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }); })()`);
    console.log('confirm-yes:', !!yes);
    await sleep(10000);
    console.log('final-url:', await cdp.eval('location.href'));
    await shot('hn_agree_final');
    console.log('final-body:', await cdp.eval(`document.body.innerText.replace(/\\s+/g, ' ').slice(0, 400)`));
  } else { await shot('hn_still_disabled'); }
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
