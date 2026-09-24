import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const r = await c.eval(`(function(){
  const bfs=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe'));
  const big=bfs.find(f=>f.getBoundingClientRect().height>300);
  if(!big) return 'nf';
  let el=big;
  for(let k=0;k<3 && el.parentElement;k++){ el=el.parentElement; }
  el.style.setProperty('transform','translateY(437px)','important');
  return JSON.stringify({y:big.getBoundingClientRect().y});
})()`);
console.log('pos:', r);
await sleep(600);
const r2 = await c.eval(`(function(){
  const big=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe')).find(f=>f.getBoundingClientRect().height>300);
  return big? JSON.stringify({y:Math.round(big.getBoundingClientRect().y)}) : 'nf';
})()`);
console.log('after:', r2);
process.exit(0);
