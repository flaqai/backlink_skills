// reg0000: ampblogs 登录发文——注入PHPSESSID→/new→CKEditor发文
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const SESS = process.argv[2];
const TITLE = 'What keeping a notebook of half-formed ideas taught me';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 1. 开tab
const CDP = await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://ampblogs.com/'), { method: 'PUT' }).then(r => r.json());
const ws = new WebSocket(CDP.webSocketDebuggerUrl);
let mid = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
await new Promise(r => ws.onopen = r);
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
await send('Target.activateTarget', { targetId: CDP.id });

// 2. 注入session cookie
const ck = await send('Network.setCookie', { name: 'PHPSESSID', value: SESS, domain: 'ampblogs.com', path: '/' });
console.log('setCookie:', JSON.stringify(ck));

// 3. 开/new
await send('Page.navigate', { url: 'https://ampblogs.com/new' });
await sleep(8000);
const st = await (await send('Runtime.evaluate', { expression: `JSON.stringify({url:location.href,title:document.title,hasCK:!!window.CKEDITOR,ckNames:window.CKEDITOR?Object.keys(CKEDITOR.instances):[],titleInput:!!document.querySelector('input[name=title]')})`, returnByValue: true })).result?.value;
console.log('ST:', st);
const info = JSON.parse(st);
if (!info.titleInput) { console.log('NO_FORM_NOT_LOGGED_IN'); ws.close(); process.exit(1); }

// 4. 填title
await send('Runtime.evaluate', { expression: `const t=document.querySelector('input[name=title]'); t.focus(); t.value=${JSON.stringify(TITLE)}; t.dispatchEvent(new Event('input',{bubbles:true}));` });
await sleep(400);
// 5. CKEditor 填正文
const src = JSON.parse(fs.readFileSync('C:/Users/Administrator/AppData/Local/Temp/bf_warm.json', 'utf8'));
const html = '<p>' + src.body.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
await send('Runtime.evaluate', { expression: `CKEDITOR.instances.editor1.setData(${JSON.stringify(html)}); CKEDITOR.instances.editor1.updateElement(); 'ok'`, returnByValue: true });
await sleep(600);
console.log('filled title+body');

// 6. 点publish
await send('Runtime.evaluate', { expression: `const p=document.querySelector('input[name=publish]'); p.scrollIntoView({block:'center'}); 'ok'` });
await sleep(400);
const pbox = await (await send('Runtime.evaluate', { expression: `(() => { const p = document.querySelector('input[name=publish]'); const r = p.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)}); })()`, returnByValue: true })).result?.value;
const pc = JSON.parse(pbox);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pc.x, y: pc.y });
await sleep(150);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pc.x, y: pc.y, button: 'left', clickCount: 1 });
await sleep(80);
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pc.x, y: pc.y, button: 'left', clickCount: 1 });
console.log('clicked publish');

for (let i = 0; i < 6; i++) {
  await sleep(3000);
  const after = await (await send('Runtime.evaluate', { expression: `JSON.stringify({url:location.href.slice(0,80),body:document.body.innerText.slice(0,200)})`, returnByValue: true })).result?.value;
  console.log('poll' + i + ':', after);
}
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT + '_reg0000_amp_done.png', Buffer.from(shot.data, 'base64'));
ws.close();
console.log('TAB_KEEP=' + CDP.id);
