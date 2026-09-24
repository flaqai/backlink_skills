// reg0000: ampblogs 发文（同tab登录态）——/new→title+CKEditor→publish
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const TAB = process.argv[2];
const TITLE = 'What keeping a notebook of half-formed ideas taught me';
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

await send('Page.navigate', { url: 'https://ampblogs.com/new' });
await sleep(8000);
const st = await (await send('Runtime.evaluate', { expression: `JSON.stringify({url:location.href.slice(0,60),title:document.title,tIn:!!document.querySelector('input[name=title]'),ck:window.CKEDITOR?Object.keys(CKEDITOR.instances):[]})`, returnByValue: true })).result?.value;
console.log('NEW-PAGE:', st);
const info = JSON.parse(st);
if (!info.tIn) { console.log('NO_FORM'); ws.close(); process.exit(1); }

// title
await send('Runtime.evaluate', { expression: `const t=document.querySelector('input[name=title]'); t.focus(); t.value=${JSON.stringify(TITLE)}; t.dispatchEvent(new Event('input',{bubbles:true})); 'ok'`, returnByValue: true });
await sleep(300);
// body
const src = JSON.parse(fs.readFileSync('C:/Users/Administrator/AppData/Local/Temp/bf_warm.json', 'utf8'));
const html = '<p>' + src.body.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
await send('Runtime.evaluate', { expression: `CKEDITOR.instances.editor1.setData(${JSON.stringify(html)}); CKEDITOR.instances.editor1.updateElement(); 'ok'`, returnByValue: true });
await sleep(500);
console.log('filled');
// publish 真实点击
const pbox = await (await send('Runtime.evaluate', { expression: `(() => { const p=document.querySelector('input[name=publish]'); p.scrollIntoView({block:'center'}); const r=p.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, returnByValue: true })).result?.value;
const pc = JSON.parse(pbox);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pc.x, y: pc.y });
await sleep(120);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pc.x, y: pc.y, button: 'left', clickCount: 1 });
await sleep(80);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pc.x, y: pc.y, button: 'left', clickCount: 1 });
console.log('publish clicked');
for (let i = 0; i < 6; i++) {
  await sleep(3000);
  const after = await (await send('Runtime.evaluate', { expression: `JSON.stringify({url:location.href.slice(0,80),body:document.body.innerText.slice(0,150)})`, returnByValue: true })).result?.value;
  console.log('poll' + i + ':', after);
}
ws.close();
console.log('DONE');
