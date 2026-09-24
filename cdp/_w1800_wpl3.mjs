// win1800: WP-listing族 参数化提交 (token到手后点Submit)
// 用法: node _w1800_wpl3.mjs <域片段>
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
const token = await cdp.eval(`(() => { const tas=[...document.querySelectorAll('textarea[name="g-recaptcha-response"]')]; return Math.max(0,...tas.map(t=>t.value.length)); })()`);
console.log('TOKEN_LEN:', token);
if (token > 0) {
  await cdp.eval(`(() => { const f=document.querySelector('form'); const b=f ? [...f.querySelectorAll('button,input[type=submit]')].find(x=>/submit|send/i.test(x.textContent||x.value||'')) : null; if(b){b.scrollIntoView({block:'center'}); b.click(); return 1;} return 0; })()`);
  console.log('SUBMIT clicked');
  await sleep(7000);
  const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,1500); const marks=[]; for(const p of ['thank','submitted','success','review','error','required','captcha','already','published','incorrect']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-40),i+80).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,120), marks:marks.slice(0,4)}); })()`);
  console.log('AFTER:', after);
  await cdp.send('Page.captureScreenshot').then(r => { fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1800_wpl_${DOM}_final.png`, Buffer.from(r.data, 'base64')); }).catch(() => {});
} else { console.log('NO_TOKEN_ABORT'); }
ws.close();
