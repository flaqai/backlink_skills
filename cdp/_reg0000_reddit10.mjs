// _reg0000_reddit10.mjs — 跳过onboarding到主界面 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(1000);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
// 点跳过
const r = await Promise.race([c.evalT(`(() => { const b=[...document.querySelectorAll('button,a')].find(b=>b.offsetParent && (b.innerText||'').trim()==='跳过'); if(!b) return null; const rc=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('SKIP_BTN:', r);
if (r && r !== 'TO') {
  const {x,y} = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x, y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(5000);
}
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,100), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,300)}))()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('STATE:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_home.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
