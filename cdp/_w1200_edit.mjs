import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [dom, pid, bodyfile] = process.argv.slice(2);
const body = fs.readFileSync(bodyfile, 'utf8').trim();
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://leoxm26.' + dom + '/?p=' + pid + '&action=edit', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 15; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
console.log('URL:', await cdp.evalT(`location.href`, 6000));
for (let a = 0; a < 3; a++) {
  await cdp.evalT(`(()=>{const b=document.querySelector('#content-html');if(b)b.click();})()`, 5000);
  await sleep(1200);
  await cdp.evalT(`(()=>{const c=document.querySelector('textarea#content');c.scrollIntoView({block:'center'});c.focus();})()`, 5000);
  await sleep(400);
  await cdp.send('Input.insertText', { text: body });
  await sleep(800);
  const len = await cdp.evalT(`document.querySelector('textarea#content')?document.querySelector('textarea#content').value.length:0`, 5000);
  console.log('TRY' + (a+1), 'BODY_LEN', len);
  if (len > 200) break;
}
const sub = await cdp.evalT(`(()=>{const b=document.querySelector('#publish');if(!b)return 'NOPUB';const f=b.closest('form');b.scrollIntoView({block:'center'});if(f.requestSubmit){f.requestSubmit(b);return 'reqSubmit'}b.click();return 'click'})()`, 8000);
console.log('SUBMIT:', sub);
await sleep(6000);
console.log('AFTER:', await cdp.evalT(`location.href`, 6000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
