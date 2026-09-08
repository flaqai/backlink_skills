import { CDP, sleep } from './CDP.mjs';
const EDIT = 'https://blog.hatena.ne.jp/leoxm/leoxmnotes.hatenablog.com/edit?entry=14945776032072942378';
const NEWTITLE = 'The Real Cost of QR Codes: What Is Free Forever, What Is a Subscription, and What Pays Off';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(EDIT), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id);
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(10000);
console.log('URL:', await c.eval('location.href.slice(0,80)'));
console.log('标题框:', await c.eval(`(() => { const sels = ['input.field-title','input[name=title]','.hatena-editor-title input','input[placeholder*=タイトル i]']; for (const s of sels) { const e = document.querySelector(s); if (e) return s + ' = ' + (e.value||'').slice(0,40); } return 'NONE'; })()`));
// 清空+填新标题
await c.eval(`(function(){ var inp = document.querySelector('input.field-title, input[name=title], .hatena-editor-title input, input[placeholder*=タイトル i]'); inp.scrollIntoView({block:'center'}); inp.focus(); var d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; d.call(inp, ''); inp.dispatchEvent(new Event('input', {bubbles:true})); })()`);
await sleep(800);
await c.send('Input.insertText', { text: NEWTITLE });
await sleep(1500);
console.log('新标题值:', await c.eval(`(() => (document.querySelector('input.field-title, input[name=title], .hatena-editor-title input, input[placeholder*=タイトル i]')||{}).value?.slice(0,50))()`));
// 保存: 投稿する
const sb = await c.eval(`(() => { const b = [...document.querySelectorAll('button, input[type=submit]')].find(e => e.offsetWidth > 0 && /^(投稿する|公開する|Update|保存する)/.test((e.textContent||e.value||'').trim())); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), t: (e => (e.textContent||e.value||'').trim())(b) }); })()`);
console.log('保存:', sb);
if (sb !== 'NO') {
  const s = JSON.parse(sb);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.x, y: s.y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.x, y: s.y, button: 'left', clickCount: 1 });
  await sleep(9000);
  console.log('终态:', await c.eval('JSON.stringify({ url: location.href.slice(0,90) })'));
}
