// win1800: click challenge cells + VERIFY — usage: node _w1800_click.mjs <域片段> <x1,y1 x2,y2 ...> [--verify]
import WebSocket from 'ws';
const [DOM, PTS, DOVERIFY, VXY] = process.argv.slice(2);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes(DOM) && t.type === 'page');
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let mid=0; const pend=new Map();
const cmd=(m,p)=>new Promise((res,rej)=>{const id=++mid;pend.set(id,{res,rej});ws.send(JSON.stringify({id,method:m,params:p||{}}));setTimeout(()=>{if(pend.has(id)){pend.delete(id);rej(new Error('timeout '+m));}},30000);});
ws.on('message',d=>{const m=JSON.parse(d);if(m.id&&pend.has(m.id)){const{res,rej}=pend.get(m.id);pend.delete(m.id);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result);}});
await cmd('Page.enable');
for (const pt of (PTS||'').split(/\s+/).filter(Boolean)) {
  const [x,y]=pt.split(',').map(Number);
  for (const ty of ['mouseMoved','mousePressed','mouseReleased'])
    await cmd('Input.dispatchMouseEvent',{type:ty,x,y,button:'left',clickCount:1});
  console.log('clicked',x,y);
  await sleep(600);
}
if (DOVERIFY === '--verify') {
  await sleep(400);
  for (const ty of ['mouseMoved','mousePressed','mouseReleased'])
    { const [vx,vy]=(VXY||'627,662').split(',').map(Number); await cmd('Input.dispatchMouseEvent',{type:ty,x:vx,y:vy,button:'left',clickCount:1}); }
  console.log('VERIFY-CLICKED '+(VXY||'627,662'));
}
await sleep(4000);
const tk = await cmd('Runtime.evaluate',{expression:`(() => { const ta=document.querySelector('#g-recaptcha-response'); const ch=[...document.querySelectorAll('iframe')].some(i=>(i.getAttribute('title')||'').includes('验证任务')); return JSON.stringify({tokenLen: ta?ta.value.length:0, challengeOpen: ch}); })()`,returnByValue:true});
console.log('STATE='+tk.result.value);
ws.close();
