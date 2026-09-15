import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// reg0000: 加固版 farm 发文——正文灌入验证+requestSubmit+POST去向判定
const [dom, title, bodyfile] = process.argv.slice(2);
const body = fs.readFileSync(bodyfile, 'utf8').trim();
const net = [];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/new-post', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
cdp.on((m) => {
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST' && /new-post|post\.php/.test(m.params.request.url)) {
    net.push({ phase: 'sent', url: m.params.request.url.slice(0, 120) });
  }
  if (m.method === 'Network.responseReceived' && /new-post|post\.php/.test(m.params.response.url)) {
    net.push({ phase: 'resp', url: m.params.response.url.slice(0, 120), status: m.params.response.status });
  }
});
await cdp.send('Page.enable');
await cdp.send('Network.enable').catch(() => {});
let ready = false;
for (let i = 0; i < 20; i++) {
  await sleep(2500);
  ready = await cdp.eval(`!!(document.querySelector('#title')&&document.querySelector('textarea#content'))`).catch(() => false);
  if (ready) break;
}
if (!ready) { console.log('NO_EDITOR'); process.exit(2); }
await cdp.eval(`(() => { const t=document.querySelector('#title'); t.scrollIntoView({block:'center'}); t.focus(); })()`);
await cdp.send('Input.insertText', { text: title });
await sleep(500);
console.log('TITLE_LEN', await cdp.eval(`document.querySelector('#title').value.length`));
// 正文灌入: Text模式切换+验证, 最多3轮
let ok = false;
for (let a = 0; a < 3 && !ok; a++) {
  await cdp.eval(`(() => { const b=document.querySelector('#content-html'); if(b) b.click(); })()`);
  await sleep(1200);
  await cdp.eval(`(() => { const c=document.querySelector('textarea#content'); c.scrollIntoView({block:'center'}); c.focus(); })()`);
  await sleep(600);
  await cdp.send('Input.insertText', { text: body });
  await sleep(800);
  const len = await cdp.eval(`document.querySelector('textarea#content').value.length`);
  console.log('TRY' + (a + 1), 'BODY_LEN', len);
  if (len > 200) ok = true;
}
if (!ok) { console.log('BODY_FILL_FAIL'); process.exit(5); }
for (let i = 0; i < 12; i++) {
  const saving = await cdp.eval(`/saving draft/i.test(document.body.innerText)`).catch(() => false);
  if (!saving) break;
  await sleep(2000);
}
net.length = 0;
// 主路径: requestSubmit; 备用: 坐标真点击
const r = await cdp.eval(`(() => { const b=document.querySelector('#publish'); const f=b.closest('form'); b.scrollIntoView({block:'center'}); try { if(f.requestSubmit){ f.requestSubmit(b); return 'reqSubmit'; } } catch(e){} const rc=b.getBoundingClientRect(); const x=Math.round(rc.x+rc.width/2), y=Math.round(rc.y+rc.height/2); for(const ty of ['mouseMoved','mousePressed','mouseReleased']){} return 'needClick:'+x+','+y; })()`);
console.log('SUBMIT_VIA', r);
if (r.startsWith('needClick')) {
  const [x, y] = r.split(':')[1].split(',').map(Number);
  for (const ty of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    const p = { type: ty, x, y };
    if (ty !== 'mouseMoved') { p.button = 'left'; p.clickCount = 1; }
    await cdp.send('Input.dispatchMouseEvent', p);
  }
}
let published = false;
for (let i = 0; i < 10; i++) {
  await sleep(2500);
  const st = await cdp.eval(`JSON.stringify({msg:(document.querySelector('#message')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,140), url:location.href.slice(0,110)})`).catch(() => '{"err":1}');
  const s = JSON.parse(st);
  if (/published/i.test(s.msg || '')) { console.log('MSG_OK', st); published = true; break; }
}
console.log('NET', JSON.stringify(net));
console.log(published ? 'DONE' : 'CHECK_SUBDOMAIN');
process.exit(0);
