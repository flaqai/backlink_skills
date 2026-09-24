import { CDP } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /thezenweb/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
await c.send('Runtime.enable');
const out = await c.eval(`(function(){
  const pc = document.querySelector('#puzzleContainer');
  if(!pc) return 'NO_CONTAINER';
  const kids = [...pc.querySelectorAll('*')].map(e=>{const b=e.getBoundingClientRect(); return {tag:e.tagName, id:e.id||'', cls:(e.className||'').toString().slice(0,30), st:(e.getAttribute('style')||'').slice(0,120), r:[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]};});
  return JSON.stringify(kids);
})()`);
console.log(out);
process.exit(0);
