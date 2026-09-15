// reg0000: sooperarticles step4——reload挑战页+全面dump(iframe/shadow/坐标)
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const list = await fetch('http://127.0.0.1:9224/json').then(r => r.json());
const t = list.find(x => x.id === TAB);
if (!t) { console.log('TAB_NOT_FOUND'); process.exit(1); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
let mid = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Page.enable'); await send('Runtime.enable');
await send('Target.activateTarget', { targetId: TAB });

await send('Page.navigate', { url: 'https://www.sooperarticles.com/signup' });
await sleep(9000);

const dump = await (await send('Runtime.evaluate', { expression: `(() => {
  const ifr = [...document.querySelectorAll('iframe')].map(f => { const r = f.getBoundingClientRect(); return { src: (f.src||'').slice(0,70), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
  return JSON.stringify({ url: location.href.slice(0,60), title: document.title.slice(0,40), ifr, bodyHead: document.body.innerText.slice(0,150) });
})()`, returnByValue: true })).result?.value;
console.log('DUMP:', dump);

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_so_4.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE');
