import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// reg0000: blog5.net 发文诊断——抓 publish POST 的去向与响应
const [dom, title, bodyfile] = process.argv.slice(2);
const body = fs.readFileSync(bodyfile, 'utf8').trim();
const posts = [];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/new-post', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
cdp.on(async (m) => {
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST') {
    posts.push({ phase: 'sent', url: m.params.request.url.slice(0, 150), postData: (m.params.request.postData || '').slice(0, 400) });
  }
  if (m.method === 'Network.responseReceived') {
    posts.push({ phase: 'resp', url: m.params.response.url.slice(0, 150), status: m.params.response.status });
  }
  if (m.method === 'Network.loadingFinished' && posts.length) {
    const last = posts[posts.length - 1];
    if (last.phase === 'resp' && !last.body) {
      try {
        const r = await cdp.send('Network.getResponseBody', { requestId: m.params.requestId });
        last.body = (r.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300);
      } catch (e) { last.body = 'BODY_ERR:' + e.message.slice(0, 60); }
    }
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
if (!ready) { console.log('NO_EDITOR'); await cdp.eval(`document.body.innerText.slice(0,300)`).then(v=>console.log('PAGE:',v)).catch(()=>{}); process.exit(2); }
// 表单结构诊断: action + 隐藏域
const formInfo = await cdp.eval(`(() => { const f=document.querySelector('#title')?.closest('form'); if(!f) return 'NO_FORM'; const hids=[...f.querySelectorAll('input[type=hidden]')].map(h=>h.name+'='+String(h.value).slice(0,40)); return JSON.stringify({action:String(f.getAttribute('action')||'').slice(0,120), method:f.getAttribute('method'), hids}); })()`);
console.log('FORM', formInfo);
await cdp.eval(`(() => { const t=document.querySelector('#title'); t.scrollIntoView({block:'center'}); t.focus(); })()`);
await cdp.send('Input.insertText', { text: title });
await sleep(300);
await cdp.eval(`(() => { const b=document.querySelector('#content-html'); if(b&&!b.classList.contains('active'))b.click(); const c=document.querySelector('textarea#content'); c.scrollIntoView({block:'center'}); c.focus(); })()`);
await sleep(400);
await cdp.send('Input.insertText', { text: body });
await sleep(500);
console.log('BODY_LEN', await cdp.eval(`document.querySelector('textarea#content').value.length`));
for (let i = 0; i < 15; i++) {
  const saving = await cdp.eval(`/saving draft/i.test(document.body.innerText)`).catch(() => false);
  if (!saving) break;
  await sleep(2000);
}
const q = await cdp.eval(`(() => { const b=document.querySelector('#publish'); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),dis:b.disabled,form:b.form?String(b.form.getAttribute('action')||'').slice(0,120):'noform'}); })()`);
if (!q) { console.log('NO_PUBLISH'); process.exit(3); }
const b = JSON.parse(q);
console.log('PUBLISH_BTN', JSON.stringify(b));
if (b.dis) { console.log('PUBLISH_DISABLED'); process.exit(4); }
const clickXY = async (x,y) => { await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await clickXY(b.x, b.y);
console.log('PUBLISH_CLICKED');
for (let i = 0; i < 10; i++) {
  await sleep(2500);
  const st = await cdp.eval(`JSON.stringify({msg:(document.querySelector('#message')||{innerText:''}).innerText.replace(/\\s+/g,' ').slice(0,120), url:location.href.slice(0,120), title:document.title.slice(0,80)})`).catch(() => '{"err":1}');
  const s = JSON.parse(st);
  if (/published/i.test(s.msg || '') || /post=/.test(s.url || '')) { console.log('POLL_OK', st); break; }
  if (i === 9) console.log('FINAL_STATE', st);
}
console.log('NET_LOG', JSON.stringify(posts, null, 1));
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_b5_net.json', JSON.stringify(posts, null, 1));
process.exit(0);
