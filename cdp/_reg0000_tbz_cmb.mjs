import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t2 => t2.type === 'page' && /tblogz\.com/.test(t2.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const b = await c.eval(`(function(){ const x=document.querySelector('input[name=signup]'); if(!x) return null; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),dis:x.disabled}); })()`);
if (!b) { console.log('NO_BTN'); process.exit(1); }
const p = JSON.parse(b);
if (p.dis) { await c.eval(`document.querySelector('input[name=signup]').disabled=false`); console.log('BTN_WAS_DISABLED_ENABLED'); }
await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
console.log('CREATE_CLICKED');
await sleep(12000);
console.log('AFTER:', await c.eval(`JSON.stringify({url:location.href, head:document.body.innerText.replace(/\s+/g,' ').slice(0,220)})`));
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_tbz_final.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
