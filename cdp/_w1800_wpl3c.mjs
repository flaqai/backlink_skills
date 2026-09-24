// win1800: WP-listing form.dir-submit 真实鼠标提交
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
const inv = await cdp.eval(`(() => { const f=document.querySelector('form.dir-submit'); const bad=[...f.querySelectorAll(':invalid')].map(e=>e.name||e.id||e.type).filter(Boolean); const ta=[...f.querySelectorAll('textarea[name="g-recaptcha-response"]')].map(t=>t.value.length); return JSON.stringify({invalid:bad.slice(0,6), tok:ta}); })()`);
console.log('PRE:', inv);
const r = await cdp.eval(`(() => { const f=document.querySelector('form.dir-submit'); const b=[...f.querySelectorAll('button[type=submit]')].find(x=>/submit/i.test(x.textContent||'')); if(!b) return 'NOBTN'; b.scrollIntoView({block:'center'}); const rc=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`);
const p = JSON.parse(r);
console.log('BTN at', p.x, p.y);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x - 25, y: p.y - 15 }); await sleep(200);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y }); await sleep(200);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
console.log('REAL-CLICKED');
await sleep(9000);
const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,2000); const marks=[]; for(const p of ['thank','submitted','success','review','error','required','captcha','already','published','incorrect','24 hour','received']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-40),i+90).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,120), formGone:!document.querySelector('form.dir-submit'), marks:marks.slice(0,5)}); })()`);
console.log('AFTER:', after);
await cdp.send('Page.captureScreenshot').then(r2 => { fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1800_wpl_${DOM}_final3.png`, Buffer.from(r2.data, 'base64')); }).catch(() => {});
ws.close();
