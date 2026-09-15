import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// reg0000: blog5.net 发文诊断第二轮——按钮/表单体检 + requestSubmit + action改写直提
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
  if (m.method === 'Network.responseReceived' && !/fonts|cdn-cgi|gravatar|load-styles/.test(m.params.response.url)) {
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
const diag = await cdp.eval(`(() => {
  const btns=[...document.querySelectorAll('#publish')];
  const b=btns[0]; if(!b) return JSON.stringify({err:'no #publish'});
  const f=b.closest('form');
  const r=b.getBoundingClientRect();
  const el=document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
  return JSON.stringify({
    btnCount:btns.length, tag:b.tagName, type:b.getAttribute('type'), name:b.getAttribute('name'),
    formId:f?f.id:'noform', formLen:f?f.length:0, valid:f?f.checkValidity():null,
    cover: el?(el.tagName+'#'+(el.id||'')+'.'+(el.className||'').toString().slice(0,30)):'null',
    disabled:b.disabled
  });
})()`);
console.log('DIAG', diag);
net.length = 0;
let attempt = await cdp.eval(`(() => { const b=document.querySelector('#publish'); const f=b.closest('form'); b.scrollIntoView({block:'center'}); try { if(f.requestSubmit){ f.requestSubmit(b); return 'requestSubmit-ok'; } b.click(); return 'click-ok'; } catch(e){ return 'ERR:'+e.message; } })()`);
console.log('ATTEMPT_A', attempt);
for (let i = 0; i < 6; i++) { await sleep(2500); }
const stA = await cdp.eval(`JSON.stringify({url:location.href.slice(0,100), title:document.title.slice(0,60)})`).catch(e=>'"ERR"');
console.log('AFTER_A', stA, 'POSTs:', JSON.stringify(net.filter(n=>n.phase==='sent')));
if (!net.some(n => n.phase === 'sent')) {
  net.length = 0;
  attempt = await cdp.eval(`(() => { const b=document.querySelector('#publish'); const f=b.closest('form'); f.setAttribute('action','/wp-admin/post.php'); try { f.submit(); return 'submit-ok'; } catch(e){ return 'ERR:'+e.message; } })()`);
  console.log('ATTEMPT_B(action=post.php)', attempt);
  for (let i = 0; i < 6; i++) { await sleep(2500); }
  const stB = await cdp.eval(`JSON.stringify({url:location.href.slice(0,100), title:document.title.slice(0,60), body:(document.body.innerText||'').replace(/\\s+/g,' ').slice(0,150)})`).catch(e=>'"ERR"');
  console.log('AFTER_B', stB, 'POSTs:', JSON.stringify(net));
}
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_b5_net2.json', JSON.stringify(net, null, 1));
process.exit(0);
