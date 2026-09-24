import { CDP, sleep } from './CDP.mjs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('strikingly.com/templates'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const r = await c.eval(`(function(){
  const bfs=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe'));
  const out=[];
  bfs.forEach((bf,i)=>{
    // 逐级父链找最大的那个挑战框 (400x580)
    out.push({i, y:bf.getBoundingClientRect().y, w:bf.getBoundingClientRect().width, h:bf.getBoundingClientRect().height});
    if(bf.getBoundingClientRect().height>300){
      let el=bf;
      for(let k=0;k<3 && el.parentElement;k++){ el=el.parentElement; }
      el.style.setProperty('position','fixed','important');
      el.style.setProperty('top','60px','important');
      el.style.setProperty('left','480px','important');
      el.style.setProperty('z-index','2147483000','important');
      bf.style.setProperty('position','relative','important');
      bf.style.setProperty('top','0','important');
      bf.style.setProperty('left','0','important');
    }
  });
  return JSON.stringify(out);
})()`);
console.log('before:', r);
await sleep(800);
const r2 = await c.eval(`(function(){
  const bfs=[...document.querySelectorAll('iframe')].filter(f=>(f.src||'').includes('bframe')).map(f=>({y:Math.round(f.getBoundingClientRect().y),w:f.getBoundingClientRect().width,h:f.getBoundingClientRect().height}));
  return JSON.stringify(bfs);
})()`);
console.log('after:', r2);
process.exit(0);
