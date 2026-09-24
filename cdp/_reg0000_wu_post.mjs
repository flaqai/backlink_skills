import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000h4: writeupcafe 养号文
const TITLE = 'Settling In: First Notes From a New Writing Spot';
const BODY = [
  'I have kept notes in paper notebooks for years, mostly about bicycles I fix during the week and the small things I notice on my route to the shop. A friend who writes here suggested I try putting a few of those notes online, so this is my first attempt at doing that.',
  'My plan is simple. I will write about the bikes that come through the shop, the odd weather we get in my corner of Oregon, and whatever book has my attention at the moment. Nothing long, nothing polished. The point is to practice putting sentences together that a stranger might actually enjoy reading.',
  'What I like about the idea of a blog, as old-fashioned as it sounds, is that there is no feed pushing anything at me. I write when something is worth writing down, and anyone who wanders past can read it or not. That feels like a healthier way to spend a bit of each week.',
  'If you are reading this, hello. I hope to have a proper first entry up soon, probably about a cargo bike I rebuilt last month that taught me a lesson in patience.',
].join('\n\n');

const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

// 标题
const tp = await c.evalT(`(function(){var e=document.querySelector('#write-title'); if(!e) return 'NO'; var r=e.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2)].join('|');})()`, 8000);
const [tx, ty] = tp.split('|').map(Number);
await ev('mouseMoved', { x: tx, y: ty }); await sleep(120);
await ev('mousePressed', { x: tx, y: ty, button: 'left', clickCount: 1 }); await sleep(80);
await ev('mouseReleased', { x: tx, y: ty, button: 'left', clickCount: 1 }); await sleep(300);
await c.send('Input.insertText', { text: TITLE }); await sleep(400);

// 正文 contenteditable
const ep = await c.evalT(`(function(){var es=[...document.querySelectorAll('[contenteditable=true]')].filter(function(e){return e.offsetParent!==null}); if(!es.length) return 'NO'; var b=es[0].getBoundingClientRect(); return [Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)].join('|');})()`, 8000);
console.log('EDITOR:', ep);
const [ex, ey] = ep.split('|').map(Number);
await ev('mouseMoved', { x: ex, y: ey }); await sleep(120);
await ev('mousePressed', { x: ex, y: ey, button: 'left', clickCount: 1 }); await sleep(80);
await ev('mouseReleased', { x: ex, y: ey, button: 'left', clickCount: 1 }); await sleep(300);
// insertHTML 分段
const paras = BODY.split('\n\n');
for (const p of paras) {
  await c.send('Input.insertText', { text: p });
  await c.evalT(`document.execCommand('insertParagraph')`).catch(() => {});
  await sleep(200);
}
await sleep(500);
console.log('TLEN:', await c.evalT(`(function(){var t=document.querySelector('#write-title'); var es=[...document.querySelectorAll('[contenteditable=true]')].filter(function(e){return e.offsetParent!==null}); return 'title='+(t?t.value.length:0)+'ch body='+(es[0]?es[0].innerText.length:0)+'ch';})()`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_editor.png', Buffer.from(s.data, 'base64'));
console.log('tab=' + tab.id + ' SHOT ok');
process.exit(0);
