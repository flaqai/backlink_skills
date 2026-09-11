import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => (x.url || '').includes('post.php?post=23'));
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); setTimeout(() => rej(new Error('ws-timeout')), 10000); });
await cdp.send('Page.enable');
const un = await cdp.eval(`(() => {
  const cb = document.querySelector('input[name=require_password]');
  if (cb && cb.checked) { cb.click(); return 'UNCHECKED'; }
  return cb ? 'ALREADY-UN' : 'NO-EL';
})()`);
console.log('PW:', un);
await sleep(400);
const sv = await cdp.eval(`(() => { const b = [...document.querySelectorAll('button,input[type=submit]')].find(x => (x.value||x.innerText||'').trim() === 'Save'); const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2)}); })()`);
const S = JSON.parse(sv);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: S.x, y: S.y });
await sleep(120);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: S.x, y: S.y, button: 'left', clickCount: 1 });
await sleep(90);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: S.x, y: S.y, button: 'left', clickCount: 1 });
console.log('SAVED');
await sleep(8000);
