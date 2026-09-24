// _reg0000_wp9.mjs — Save面板确认 (reg0000)
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
const clickAt = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x, y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
};
await clickAt(1289, 64);
await sleep(3500);
const r = await Promise.race([c.evalT("(() => { var b = document.querySelector('.editor-post-publish-panel__header-publish-button button'); if (!b || b.offsetWidth === 0) return 'no-panel-btn'; var rc = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(rc.x + rc.width/2), y: Math.round(rc.y + rc.height/2), txt: b.innerText.trim()}); })()", 8000), sleep(9000).then(()=>'TO')]);
console.log('PANEL_BTN:', r);
if (r && r.startsWith('{')) { const p = JSON.parse(r); await clickAt(p.x, p.y); }
await sleep(8000);
ws.close();
