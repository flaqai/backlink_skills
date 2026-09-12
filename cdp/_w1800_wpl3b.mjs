// win1800: WP-listing 真实鼠标点Submit
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
const inv = await cdp.eval(`(() => { const f=document.querySelector('form'); const bad=[...f.querySelectorAll(':invalid')].map(e=>e.name||e.id||e.type).filter(Boolean); return JSON.stringify(bad.slice(0,8)); })()`);
console.log('INVALID:', inv);
const r = await cdp.eval(`(() => { const f=document.querySelector('form'); const b=[...f.querySelectorAll('button,input[type=submit]')].find(x=>/submit|send/i.test(x.textContent||x.value||'')); if(!b) return 'NOBTN'; b.scrollIntoView({block:'center'}); const rc=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`);
const p = JSON.parse(r);
console.log('BTN at', p.x, p.y);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x - 30, y: p.y - 20 }); await sleep(250);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y }); await sleep(250);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
console.log('REAL-CLICKED');
await sleep(8000);
const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,2000); const marks=[]; for(const p of ['thank','submitted','success','review','error','required','captcha','already','published','incorrect','24 hour']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-40),i+90).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,120), marks:marks.slice(0,5)}); })()`);
console.log('AFTER:', after);
await cdp.send('Page.captureScreenshot').then(r2 => { fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1800_wpl_${DOM}_final2.png`, Buffer.from(r2.data, 'base64')); }).catch(() => {});
ws.close();
