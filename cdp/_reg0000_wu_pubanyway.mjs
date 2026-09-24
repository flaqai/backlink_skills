import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('Page.enable');
  const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await sleep(300);
  await ev('mouseMoved', { x: 820, y: 481 }); await sleep(150);
  await ev('mousePressed', { x: 820, y: 481, button: 'left', clickCount: 1 }); await sleep(90);
  await ev('mouseReleased', { x: 820, y: 481, button: 'left', clickCount: 1 });
  await sleep(8000);
  console.log('URL:', await c.evalT('location.href', 8000));
  console.log('BODY:', await c.evalT(`document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,10).join(' | ').slice(0,280)`, 8000));
  const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
  if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_pubanyway.png', Buffer.from(s.data, 'base64'));
  console.log('SHOT ok');
}
main().catch(e => console.log('FATAL:', e.message));
