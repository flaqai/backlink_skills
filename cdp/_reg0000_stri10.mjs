import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// 找滚动容器并回滚到顶
const r = await c.eval(`(function(){
  const out=[];
  const all=[...document.querySelectorAll('div')];
  for(const d of all){
    const cs=getComputedStyle(d);
    if((cs.overflowY==='auto'||cs.overflowY==='scroll') && d.scrollHeight>d.clientHeight+50 && d.clientHeight>100){
      out.push({cls:(d.className||'').toString().slice(0,50), st:d.scrollTop, sh:d.scrollHeight, ch:d.clientHeight});
      d.scrollTop=0;
    }
  }
  const bf=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('bframe'));
  return JSON.stringify({scrolled:out, bframeY: bf? bf.getBoundingClientRect().y : null});
})()`);
console.log(r);
await sleep(500);
const r2 = await c.eval(`(function(){
  const bf=[...document.querySelectorAll('iframe')].find(f=>(f.src||'').includes('bframe'));
  return bf? JSON.stringify({y:bf.getBoundingClientRect().y,h:bf.getBoundingClientRect().height}) : 'nf';
})()`);
console.log('bframe after:', r2);
process.exit(0);
