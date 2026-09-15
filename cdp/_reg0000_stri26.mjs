import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('/edit'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await sleep(800);
for (const u of ['https://www.strikingly.com/s/sites/35253136/posts','https://www.strikingly.com/s/sites/35253136/blog']) {
  await c.goto(u, 30000).catch(e=>console.log('goto:',e.message));
  await sleep(4000);
  const st = await c.eval(`location.href + ' ||| ' + document.title + ' ||| ' + document.body.innerText.slice(0,200)`);
  console.log(u.slice(-20), '→', st.slice(0,300));
  if (!String(st).includes('404') && !String(st).includes('Page not found')) break;
}
process.exit(0);
