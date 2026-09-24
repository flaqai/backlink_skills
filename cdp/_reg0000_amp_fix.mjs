// reg0000: ampblogs 重填表单+拼图截图
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const list = await fetch('http://127.0.0.1:9224/json').then(r => r.json());
const t = list.find(x => x.id === TAB);
const ws = new WebSocket(t.webSocketDebuggerUrl);
let mid = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Page.enable'); await send('Runtime.enable');
await send('Target.activateTarget', { targetId: TAB });
await sleep(500);

// 直接value赋值+事件(非React站)
await send('Runtime.evaluate', { expression: `(() => {
  const u = document.querySelector('input[name=username]');
  const p = document.querySelector('input[name=password]');
  u.value = 'leoxmamp';
  p.value = 'Xx@AmpBlogs26!Xm';
  u.dispatchEvent(new Event('input', {bubbles:true}));
  p.dispatchEvent(new Event('input', {bubbles:true}));
  return JSON.stringify({u:u.value, p:p.value.length});
})()`, returnByValue: true }).then(r => console.log('REFILL:', r.result?.value));
await sleep(400);

// 找拼图canvas/iframe几何
const geo = await (await send('Runtime.evaluate', { expression: `(() => {
  const els = [...document.querySelectorAll('#puzzle,canvas,iframe,div[class*=puzzle],div[id*=puzzle],img[src*=keycaptcha]')].map(e => {
    const r = e.getBoundingClientRect();
    return {tag: e.tagName, id: e.id, src: (e.src||'').slice(0,60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vis: !!e.offsetParent};
  }).filter(e => e.w > 30 && e.h > 30);
  return JSON.stringify(els);
})()`, returnByValue: true })).result?.value;
console.log('GEO:', geo);

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_amp_pz2.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('DONE');
