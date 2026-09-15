// _reg0000_wp8.mjs — 点Save (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /post\.php\?post=36/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(400);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
const r = await Promise.race([c.evalT("(() => { var b = document.querySelector('.editor-post-publish-button__button'); if (!b || b.offsetWidth === 0) return ''; b.scrollIntoView({block:'center'}); var rc = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(rc.x + rc.width/2), y: Math.round(rc.y + rc.height/2), txt: b.innerText.trim()}); })()", 8000), sleep(9000).then(()=>'TO')]);
console.log('BTN:', r);
if (r && r.startsWith('{')) {
  const p = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:p.x, y:p.y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:p.x, y:p.y, button:'left', clickCount:1});
  await sleep(9000);
  const s2 = await Promise.race([c.evalT("(() => { var b = document.querySelector('.editor-post-publish-button__button'); var t = (document.querySelector('.editor-post-saved-state, [class*=saved]')||{}).innerText || ''; return JSON.stringify({btnNow: b ? b.innerText.trim() : 'nf', saved: t}); })()", 8000), sleep(9000).then(()=>'TO')]);
  console.log('SAVED_STATE:', s2);
}
ws.close();
