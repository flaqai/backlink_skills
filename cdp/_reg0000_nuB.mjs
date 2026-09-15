// _reg0000_nuB.mjs — inube 填表+点anchor+拍挑战 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /inube\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
for (const [id, val] of [['join_name','Leo'],['join_surname','Xm'],['join_email','inube@92ng.com']]) {
  const r = await Promise.race([c.evalT(`(() => { const i=document.getElementById('${id}'); if(!i) return 'nf'; i.focus(); return 'ok'; })()`, 7000), sleep(8000).then(()=>'TO')]);
  if (r === 'ok') { await c.send('Input.insertText', {text: val}); await sleep(300); }
}
console.log('filled');
// 点 recaptcha anchor
const pos = await Promise.race([c.evalT(`(() => { var f=[...document.querySelectorAll('iframe')].find(function(f){return f.src.indexOf('recaptcha')>=0 && f.src.indexOf('anchor')>=0;}); if(!f) return 'no-frame'; var r=f.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+30), y:Math.round(r.y+r.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('ANCHOR:', pos);
if (pos && pos.startsWith('{')) {
  const p = JSON.parse(pos);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:p.x, y:p.y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:p.x, y:p.y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:p.x, y:p.y, button:'left', clickCount:1});
  await sleep(9000);
  const tk = await Promise.race([c.evalT(`(() => { var t=document.getElementById('g-recaptcha-response'); return t && t.value ? 'HAS_TOKEN' : 'NO_TOKEN(挑战弹出?)'; })()`, 7000), sleep(8000).then(()=>'TO')]);
  console.log('TOKEN:', tk);
}
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:60}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_nu_chal.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
