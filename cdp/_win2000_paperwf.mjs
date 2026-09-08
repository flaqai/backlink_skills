// paper.wf 发布 (win2000 2026-09-02): 开发布页→注入→Draft菜单→Publish
import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
const html = readFileSync('_win2000_posts/paperwf.html', 'utf8').trim();
const title = 'ZA Bank 汇率与多币种账户：换汇时机和手续费的真实体验';
const bodyFull = title + '\n\n' + html;

const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://paper.wf/publish'), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id);
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(8000);
console.log('URL:', await c.eval('location.href'));
// 登录态检查
console.log('登录态:', await c.eval(`(() => JSON.stringify({ ta: !!document.querySelector('textarea'), user: (document.querySelector('.user, .dropdown-trigger, nav .username')||{}).textContent?.trim()?.slice(0,30) || null }))()`));
// 1) 注入
console.log('注入:', await c.eval(`(function(){ var ta = document.querySelector('textarea'); if (!ta) return 'nf'; ta.scrollIntoView({block:'center'}); ta.focus(); var d = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; d.call(ta, ${JSON.stringify(bodyFull)}); ta.dispatchEvent(new Event('input', {bubbles:true})); return 'len=' + ta.value.length; })()`));
await sleep(1200);
// 2) Draft 菜单
const clickXY = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const dd = await c.eval(`JSON.stringify([...document.querySelectorAll('button, div, span, a')].filter(function(e){ var t = (e.textContent || '').trim(); return e.offsetParent !== null && t.indexOf('Draft') === 0 && t.length < 12; }).map(function(e){ var r = e.getBoundingClientRect(); return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }; }).slice(0, 3))`);
const darr = JSON.parse(dd);
if (!darr.length) { console.log('无Draft下拉'); process.exit(1); }
await clickXY(darr[0].x, darr[0].y);
await sleep(1500);
console.log('菜单项:', await c.eval(`JSON.stringify([...document.querySelectorAll('li, a, button')].filter(function(e){ return e.offsetParent !== null && e.getBoundingClientRect().width > 0; }).map(function(e){ return (e.textContent||'').trim(); }).filter(function(t){ return t && t.length < 30 && /leoxm|draft|blog/i.test(t); }).slice(0,8))`));
// 选 leoxm
const lm = await c.eval(`(() => { const e = [...document.querySelectorAll('li, a, button')].find(function(x){ return x.offsetParent !== null && /leoxm/i.test(x.textContent); }); if (!e) return 'NO'; const r = e.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
console.log('leoxm项:', lm);
if (lm === 'NO') process.exit(1);
const l = JSON.parse(lm);
await clickXY(l.x, l.y);
await sleep(1200);
// 3) Publish 按钮
const pb = await c.eval(`(() => { const b = [...document.querySelectorAll('button')].find(function(x){ return /publish/i.test(x.textContent) && x.offsetWidth > 0; }); if (!b) return 'NO'; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }); })()`);
console.log('Publish:', pb);
if (pb === 'NO') process.exit(1);
const p = JSON.parse(pb);
await clickXY(p.x, p.y);
await sleep(8000);
console.log('终态:', await c.eval(`(() => JSON.stringify({ url: location.href, h1: (document.querySelector('h1')||{}).textContent?.trim()?.slice(0,60) || null }))()`));
