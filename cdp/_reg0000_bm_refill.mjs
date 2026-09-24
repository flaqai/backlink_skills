import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /blogminds/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x, y) => { await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
const fill = async (sel, text) => {
  const r = await c.eval(`(function(){ const i=${sel}; if(!i) return null; i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  if (!r) { console.log('MISS', sel); return false; }
  const p = JSON.parse(r); await clickXY(p.x, p.y); await sleep(200); await c.send('Input.insertText', { text }); await sleep(200);
  return true;
};
await fill(`document.querySelector('input[name=email]')`, 'blogminds@92ng.com');
await fill(`document.querySelector('input[name=password]')`, 'Xx@Bmd26!Xm');
await fill(`document.querySelector('input[name=username]')`, 'leoxm26');
const b = await c.eval(`(function(){ const x=[...document.querySelectorAll('input[type=submit],button')].find(e=>/create my blog/i.test(e.innerText||e.value||'')&&e.offsetParent); if(!x) return null; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
if (!b) { console.log('NO_BTN'); process.exit(1); }
const p = JSON.parse(b); await clickXY(p.x, p.y);
console.log('SUBMIT_CLICKED');
await sleep(12000);
console.log('AFTER:', await c.eval(`JSON.stringify({url:location.href, head:document.body.innerText.replace(/\s+/g,' ').slice(0,150)})`));
process.exit(0);
