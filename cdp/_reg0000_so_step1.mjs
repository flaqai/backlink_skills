// reg0000: sooperarticles 注册 step1——开/signup+过CF盾侦察
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const URL = 'https://www.sooperarticles.com/signup';

const CDP = await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(URL), { method: 'PUT' }).then(r => r.json());
console.log('TAB=' + CDP.id);
const ws = new WebSocket(CDP.webSocketDebuggerUrl);
let mid = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Page.enable'); await send('Runtime.enable');
await sleep(8000);

const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;
const info = await ev(`(() => ({ url: location.href, title: document.title, bodyLen: document.body.innerText.length, head: document.body.innerText.slice(0,200) }))()`);
console.log('INFO:', JSON.stringify(info));

// CF盾检测: iframe(challenge) / turnstile
const cf = await ev(`(() => {
  const ifr = [...document.querySelectorAll('iframe')].map(f => ({ src: (f.src||'').slice(0,80), w: f.width, h: f.height, x: Math.round(f.getBoundingClientRect().x), y: Math.round(f.getBoundingClientRect().y), vis: !!f.offsetParent }));
  const ts = !!document.querySelector('[class*=turnstile],[id*=turnstile],input[name=cf-turnstile-response]');
  return { iframes: ifr, turnstile: ts };
})()`);
console.log('CF:', JSON.stringify(cf));

const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_so_1.png', Buffer.from(shot.data, 'base64'));
await send('Target.activateTarget', { targetId: CDP.id });
ws.close();
console.log('KEEP=' + CDP.id);
