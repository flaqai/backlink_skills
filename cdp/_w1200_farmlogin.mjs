import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// win1200 farm重登: /login 填表提交→验证new-post→截图存档
// 用法: node _w1200_farmlogin.mjs <domain> <email> <password>
const [dom, email, pass] = process.argv.slice(2);
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/login', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
let ready = false;
for (let i = 0; i < 12 && !ready; i++) { await sleep(2500); ready = await cdp.eval(`!!document.querySelector('input[type=email],input[name=email],input[name=user_email],input[name=username],input[name=user_login]')`).catch(() => false); }
if (!ready) { console.log('NO_FORM', await cdp.eval(`location.href+' | '+document.title`)); process.exit(2); }
const form = await cdp.eval(`JSON.stringify({fields: [...document.querySelectorAll('input')].map(i => ({n: i.name, t: i.type, id: i.id})).slice(0,12)})`);
console.log('FORM', form);
// 填email
const f = JSON.parse(form).fields;
const emailSel = f.find(x => x.t === 'email') ? 'input[type=email]' : (f.find(x => /email/.test(x.n)) ? 'input[name=' + f.find(x => /email/.test(x.n)).n + ']' : 'input[name=user_login]');
await cdp.eval(`(() => { const e=document.querySelector('${emailSel}'); e.scrollIntoView({block:'center'}); e.focus(); })()`);
await cdp.send('Input.insertText', { text: email });
await sleep(400);
await cdp.eval(`(() => { const e=document.querySelector('input[type=password]'); e.scrollIntoView({block:'center'}); e.focus(); })()`);
await cdp.send('Input.insertText', { text: pass });
await sleep(400);
console.log('FILLED', await cdp.eval(`JSON.stringify({e: (document.querySelector('${emailSel}')||{value:''}).value.length, p: (document.querySelector('input[type=password]')||{value:''}).value.length})`));
// 提交: submit按钮或form requestSubmit
const sub = await cdp.eval(`(() => { const b=document.querySelector('input[type=submit],button[type=submit]'); if(!b) return 'NOBTN'; b.scrollIntoView({block:'center'}); const fo=b.closest('form'); try { if(fo.requestSubmit){ fo.requestSubmit(b); return 'reqSubmit'; } } catch(e){} b.click(); return 'click'; })()`);
console.log('SUBMIT', sub);
let ok = false;
for (let i = 0; i < 10; i++) {
  await sleep(2500);
  const u = await cdp.eval(`location.href`);
  if (!/login/.test(u)) { ok = true; break; }
}
console.log(ok ? 'LOGIN_OK' : 'LOGIN_FAIL', await cdp.eval(`location.href.slice(0,100)`));
if (ok) {
  // 验证new-post可达
  await cdp.eval(`location.href='https://${dom}/new-post'`);
  await sleep(6000);
  const np = await cdp.eval(`JSON.stringify({url: location.href.slice(0,120), hasTitleBox: !!document.querySelector('#title'), hasTa: !!document.querySelector('textarea#content')})`);
  console.log('NEWPOST', np);
  if (JSON.parse(np).hasTitleBox) {
    await fetch('http://127.0.0.1:9224/json/close/' + t.id).catch(() => {});
    console.log('SAVE_COOKIES_NOW');
    process.exit(0);
  }
}
process.exit(3);
