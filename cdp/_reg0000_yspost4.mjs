import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// youslade: full post flow with network capture
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Network.enable');
const reqs = [];
c.on((m) => {
  if (m.method === 'Network.requestWillBeSent' && /requests\.php/.test(((m.params||{}).request||{}).url||'')) {
    const r = m.params.request;
    reqs.push({u: r.url.slice(0,80), m: r.method, pd: (r.postData||'').slice(0,120)});
  }
});
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
// open composer
await clickXY(489, 530);
await sleep(2500);
const r = await c.evalT(`(function(){ const ta=document.querySelector('textarea.postText'); if(!ta) return null; ta.focus(); const b=ta.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`, 8000);
if(!r){ console.log('NO TEXTAREA'); process.exit(1); }
const p=JSON.parse(r); await clickXY(p.x, p.y); await sleep(300);
const TXT = `Finally set up my little corner here. Planning to use this space as a running notebook: short notes on the small software choices that quietly shape a workday, and the occasional observation when a tool either earns its keep or gets uninstalled. No grand conclusions, just honest field notes as I go.`;
await c.send('Input.insertText', {text: TXT});
await sleep(600);
// confirm text landed
const chk = await c.evalT(`(function(){ const ta=document.querySelector('textarea.postText'); return ta?ta.value.slice(0,40):'EMPTY'; })()`, 8000);
console.log('textarea now:', chk);
if (chk === 'EMPTY' || chk === 'TIMEOUT' || chk === 'ERR:eval异常: TypeError: Cannot read properties of null (reading \'value\')') { console.log('TEXT DID NOT LAND'); process.exit(1); }
const btn = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Publish'&&x.offsetParent); if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
console.log('publish:', btn);
const pp=JSON.parse(btn); await clickXY(pp.x, pp.y);
await sleep(6000);
console.log('requests:', JSON.stringify(reqs));
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/ys_posted2.png', Buffer.from(shot.data,'base64'));
process.exit(0);
