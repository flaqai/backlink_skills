import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// reg0000: blog5.net 发文第三轮——action改写/wp-admin/post.php + requestSubmit
const [dom, title, bodyfile] = process.argv.slice(2);
const body = fs.readFileSync(bodyfile, 'utf8').trim();
const net = [];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/new-post', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
cdp.on((m) => {
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST') {
    net.push({ phase: 'sent', url: m.params.request.url.slice(0, 130) });
  }
  if (m.method === 'Network.responseReceived' && !/fonts|cdn-cgi|gravatar|beacon|load-styles/.test(m.params.response.url)) {
    net.push({ phase: 'resp', url: m.params.response.url.slice(0, 130), status: m.params.response.status });
  }
});
await cdp.send('Page.enable');
await cdp.send('Network.enable').catch(() => {});
let ready = false;
for (let i = 0; i < 15; i++) {
  await sleep(2500);
  ready = await cdp.eval(`!!(document.querySelector('#title')&&document.querySelector('textarea#content'))`).catch(() => false);
  if (ready) break;
}
if (!ready) { console.log('NO_EDITOR'); process.exit(2); }
await cdp.eval(`(() => { const t=document.querySelector('#title'); t.scrollIntoView({block:'center'}); t.focus(); })()`);
await cdp.send('Input.insertText', { text: title });
await sleep(300);
await cdp.eval(`(() => { const b=document.querySelector('#content-html'); if(b&&!b.classList.contains('active'))b.click(); const c=document.querySelector('textarea#content'); c.scrollIntoView({block:'center'}); c.focus(); })()`);
await sleep(400);
await cdp.send('Input.insertText', { text: body });
await sleep(800);
for (let i = 0; i < 12; i++) {
  const saving = await cdp.eval(`/saving draft/i.test(document.body.innerText)`).catch(() => false);
  if (!saving) break;
  await sleep(2000);
}
const r = await cdp.eval(`(() => { const b=document.querySelector('#publish'); const f=b.closest('form'); f.setAttribute('action','/wp-admin/post.php'); b.scrollIntoView({block:'center'}); try { f.requestSubmit(b); return 'ok'; } catch(e){ return 'ERR:'+e.message; } })()`);
console.log('SUBMIT', r);
let landed = '';
for (let i = 0; i < 8; i++) {
  await sleep(2500);
  landed = await cdp.eval(`JSON.stringify({url:location.href.slice(0,110), title:document.title.slice(0,60), msg:(document.querySelector('#message')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,140), body:(document.body.innerText||'').replace(/\\s+/g,' ').slice(0,120)})`).catch(e=>'"ERR"');
  const s = JSON.parse(landed);
  if (/post\.php|message|published/i.test(s.url + s.msg + s.title)) break;
}
console.log('LANDED', landed);
console.log('NET', JSON.stringify(net));
process.exit(0);
