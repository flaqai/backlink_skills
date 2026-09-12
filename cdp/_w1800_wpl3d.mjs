// win1800: token patch into form.dir-submit + 真实点击提交
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
const patch = await cdp.eval(`(() => { const tas=[...document.querySelectorAll('textarea[name="g-recaptcha-response"]')]; const src=tas.find(t=>t.value.length>100); const f=document.querySelector('form.dir-submit'); if(!f) return 'NOFORM'; const dst=[...f.querySelectorAll('textarea[name="g-recaptcha-response"]')]; if(!src) return 'NOSRC len_all='+JSON.stringify(tas.map(t=>t.value.length)); if(!dst.length) { const d=document.createElement('textarea'); d.name='g-recaptcha-response'; d.style.display='none'; f.appendChild(d); dst.push(d); } let out=[]; for(const d of dst){ d.value=src.value; out.push(d.value.length); } return 'PATCHED '+JSON.stringify(out); })()`);
console.log('PATCH:', patch);
const r = await cdp.eval(`(() => { const f=document.querySelector('form.dir-submit'); const b=[...f.querySelectorAll('button[type=submit]')].find(x=>/submit/i.test(x.textContent||'')); if(!b) return 'NOBTN'; b.scrollIntoView({block:'center'}); const rc=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`);
const p = JSON.parse(r);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y }); await sleep(200);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
console.log('REAL-CLICKED', p.x, p.y);
await sleep(9000);
const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,2000); const marks=[]; for(const p of ['thank','submitted','success','review','error','required','captcha','already','published','incorrect','received','gone live','approved']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-45),i+90).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,130), formGone:!document.querySelector('form.dir-submit'), marks:marks.slice(0,6)}); })()`);
console.log('AFTER:', after);
await cdp.send('Page.captureScreenshot').then(r2 => { fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1800_wpl_${DOM}_final4.png`, Buffer.from(r2.data, 'base64')); }).catch(() => {});
ws.close();
