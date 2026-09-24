import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const log = (s) => fs.writeSync(1, s + '\n');
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(() => rej(new Error('ws超时')), 8000); });
const c = new CDP(ws);
await c.send('Target.activateTarget', { targetId: tab.id });
await c.send('Page.enable');
await c.send('Network.enable');
const reqs = [];
c.on((m) => {
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST' && m.params.request.url.includes('requests.php')) {
    reqs.push({ url: m.params.request.url.slice(-40), post: (m.params.request.postData || '').slice(0, 120) });
  }
  if (m.method === 'Network.responseReceived' && m.params.response.url.includes('requests.php')) {
    reqs.push({ resp: m.params.response.url.slice(-40), status: m.params.response.status });
  }
});
const sleepMs = (ms) => new Promise(r => setTimeout(r, ms));
const click = async (x, y, wait = 2000) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleepMs(wait);
};
// 点发布框展开
await click(484, 530, 3000);
// 灌文
const ta = await c.evalT("(() => { const t=document.querySelector('textarea[name=postText]'); if(!t) return 'NOTA'; t.focus(); const r=t.getBoundingClientRect(); return Math.round(r.x+r.width/2)+','+Math.round(r.y+r.height/2); })()", 8000);
log('TA: ' + ta);
if (ta !== 'NOTA') {
  const [x, y] = ta.split(',').map(Number);
  await click(x, y, 500);
  await c.send('Input.insertText', { text: "I keep coming back to the same small pleasure: watching the street wake up. Around seven the bakery fan kicks on, the first bus sighs at the corner, and the man with the checkered cap walks his dog past the launderette like he is inspecting it. None of it is remarkable, which is exactly why it works. On slow mornings I make tea, stand by the window, and let the street do its comedy routine. The dog always barks at the same lamppost. The lamppost, to its credit, has never once reacted. Find your window. Find your seven a.m. Everything else can wait ten minutes." });
  await sleepMs(1000);
  // 实时找 Publish
  const pub = await c.evalT("(() => { const b=document.querySelector('#publisher-button'); if(!b) return 'NOBTN'; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); const cs=getComputedStyle(b); return Math.round(r.x+r.width/2)+','+Math.round(r.y+r.height/2)+' dis='+b.disabled+' op='+cs.opacity; })()", 8000);
  log('PUB: ' + pub);
  if (pub !== 'NOBTN') {
    const [px, py] = pub.split(',').map(Number);
    await click(px, py, 6000);
  }
}
log('REQS: ' + JSON.stringify(reqs));
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_reg0000_ys_pub2.png', Buffer.from(shot.data, 'base64'));
ws.close(); process.exit(0);
