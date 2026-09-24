// win1800: WP-listing patch token + 元素校准真实点击(防overlay关闭布局漂移)
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
for (let att = 0; att < 3; att++) {
  const patch = await cdp.eval(`(() => { const tas=[...document.querySelectorAll('textarea[name="g-recaptcha-response"]')]; const src=tas.find(t=>t.value.length>100); const f=document.querySelector('form.dir-submit'); if(!f) return 'NOFORM'; const dst=[...f.querySelectorAll('textarea[name="g-recaptcha-response"]')]; if(!src) return 'NOSRC'; if(!dst.length){ const d=document.createElement('textarea'); d.name='g-recaptcha-response'; d.style.display='none'; f.appendChild(d); dst.push(d);} dst.forEach(d=>d.value=src.value); return 'PATCHED'; })()`);
  console.log('PATCH:', patch);
  if (patch !== 'PATCHED') { await sleep(2000); continue; }
  let ok = false;
  for (let i = 0; i < 4; i++) {
    const r = await cdp.eval(`(() => { const f=document.querySelector('form.dir-submit'); const b=[...f.querySelectorAll('button[type=submit]')].find(x=>/submit|send/i.test(x.textContent||x.value||'')) || f.querySelector('button[type=submit]'); if(!b) return 'NOBTN'; b.scrollIntoView({block:'center'}); const rc=b.getBoundingClientRect(); const x=Math.round(rc.x+rc.width/2), y=Math.round(rc.y+rc.height/2); const hit=document.elementFromPoint(x,y); const good=hit && (hit===b || b.contains(hit)); return JSON.stringify({x, y, good}); })()`);
    const p = JSON.parse(r);
    console.log('MEASURE', JSON.stringify(p));
    if (!p.good) { await sleep(800); continue; }
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y }); await sleep(200);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    ok = true; break;
  }
  if (!ok) { console.log('CLICK_FAILED'); continue; }
  await sleep(8000);
  const after = await cdp.eval(`(() => { const t=document.body.innerText.slice(0,2500); const marks=[]; for(const p of ['thank','submitted','success','review','error','required','captcha','already','published','incorrect','blank','received']){ const i=t.toLowerCase().indexOf(p); if(i>=0) marks.push(t.slice(Math.max(0,i-45),i+90).replace(/\s+/g,' ')); } return JSON.stringify({url:location.href.slice(0,130), formGone:!document.querySelector('form.dir-submit'), marks:marks.slice(0,6)}); })()`);
  console.log('AFTER:', after);
  await cdp.send('Page.captureScreenshot').then(r2 => { fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1800_wpl_${DOM}_sub.png`, Buffer.from(r2.data, 'base64')); }).catch(() => {});
  ws.close(); process.exit(0);
}
console.log('GAVE_UP');
ws.close();
