import { CDP } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeablog/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
await c.send('Page.enable');
console.log('URL:', await c.eval(`location.href`));
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_wab_state.png', Buffer.from(shot.data, 'base64'));
console.log('SAVED');
process.exit(0);
