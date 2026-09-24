import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('qiita.com/drafts/'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// 1) 关弹窗
const cl = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(e => e.offsetWidth > 0 && (e.textContent||'').trim() === '閉じる'); if (!b) return 'NO'; const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
if (cl !== 'NO') { const q = JSON.parse(cl); await clickXY(q.x, q.y); await sleep(1500); }
// 2) 标签输入
const tagPos = await c.eval(`(() => { const i = document.querySelector('input[placeholder*=タグ i], .tagInput input, input[name*=tag i]'); if (!i) return 'NO'; i.scrollIntoView({block:'center'}); const r = i.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + Math.min(120, r.width/2)), y: Math.round(r.y + r.height/2) }); })()`);
console.log('标签框:', tagPos);
if (tagPos === 'NO') process.exit(1);
const tp = JSON.parse(tagPos);
await clickXY(tp.x, tp.y);
await sleep(800);
await c.send('Input.insertText', { text: 'QRCode' });
await sleep(2500);
// 建议下拉选第一个
const sug = await c.eval(`(() => { const it = [...document.querySelectorAll('li, [role=option], .suggestions__item')].find(e => e.offsetWidth > 0 && /QRCode/.test(e.textContent)); if (!it) return 'NO'; const r = it.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), t: it.textContent.trim().slice(0,20) }); })()`);
console.log('建议:', sug);
if (sug !== 'NO') { const s = JSON.parse(sug); await clickXY(s.x, s.y); }
else { await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); }
await sleep(2000);
console.log('标签结果:', await c.eval(`(() => JSON.stringify([...document.querySelectorAll('.tagChip, [class*=tagChip]')].map(e => e.textContent.trim()).slice(0,5)))()`));
// 3) 再点「記事を投稿する」
const pb = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(e => e.offsetWidth > 0 && (e.textContent||'').trim() === '記事を投稿する'); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
console.log('投稿:', pb);
if (pb !== 'NO') {
  const p = JSON.parse(pb);
  await clickXY(p.x, p.y);
  await sleep(12000);
  console.log('终态:', await c.eval(`(() => JSON.stringify({ url: location.href.slice(0,80) }))()`));
}
