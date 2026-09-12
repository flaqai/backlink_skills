// win1800: 同tick patch+requestSubmit (防widget清token竞态)
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [DOM] = process.argv.slice(2);
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes(DOM) && t.type === 'page');
if (!tab) { console.log('NOTAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const res = await cdp.eval(`(() => { const tas=[...document.querySelectorAll('textarea[name="g-recaptcha-response"]')]; const src=tas.find(t=>t.value.length>100); const f=document.querySelector('form.dir-submit'); if(!f) return 'NOFORM'; if(!src) return 'NOSRC'; let dst=f.querySelector('textarea[name="g-recaptcha-response"]'); if(!dst){ dst=document.createElement('textarea'); dst.name='g-recaptcha-response'; dst.style.display='none'; f.appendChild(dst); } dst.value=src.value; if (typeof f.requestSubmit==='function') { f.requestSubmit(); return 'SUBMITTED token_len='+src.value.length; } return 'NO_REQUESTSUBMIT'; })()`);
console.log('RES:', res);
await sleep(9000);
const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,2500); const marks=[]; for(const p of ['thank','submitted','success','review','error','required','captcha','already','published','incorrect','blank','received']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-45),i+90).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,130), formGone:!document.querySelector('form.dir-submit'), marks:marks.slice(0,6)}); })()`);
console.log('AFTER:', after);
await cdp.send('Page.captureScreenshot').then(r2 => { fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1800_wpl_${DOM}_subf.png`, Buffer.from(r2.data, 'base64')); }).catch(() => {});
ws.close();
