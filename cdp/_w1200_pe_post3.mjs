import { writeFileSync, readFileSync } from 'fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const BASE = 'http://127.0.0.1:9224';

const data = JSON.parse(readFileSync('D:/Github/backlink_skills/cdp/_pz-post.json', 'utf-8'));

const r = await fetch(BASE + '/json/new?about:blank', { method: 'PUT' });
const tab = await r.json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); setTimeout(() => rej(new Error('ws超时')), 8000); });
let _id = 0; const pending = new Map();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const { resolve, reject } = pending.get(m.id); pending.delete(m.id); m.error ? reject(new Error(m.error.message)) : resolve(m.result); } });
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++_id; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const evalJs = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(String(r.exceptionDetails.exception?.description || '').slice(0, 300)); return r.result?.value; };
const jp = v => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
const realClick = async (x, y) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await sleep(120); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
// 真实键盘事件（触发 antibot 的 keydown 监听）
const realKey = async (key) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: 'Key' + key.toUpperCase(), windowsVirtualKeyCode: key.toUpperCase().charCodeAt(0) }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: 'Key' + key.toUpperCase(), windowsVirtualKeyCode: key.toUpperCase().charCodeAt(0) }); };

await send('Page.enable');
await send('Page.navigate', { url: 'https://posteezy.com/node/add/article' });
for (let i = 0; i < 10; i++) { await sleep(2500); const n = await evalJs(`document.querySelectorAll('#edit-title-0-value').length`).catch(() => 0); if (n >= 1) break; }
log('form rendered');
// ① 真实点击标题框（真实 mousedown）
const t = jp(await evalJs(`(function(){ var f=document.querySelector('#edit-title-0-value'); f.scrollIntoView({block:'center'}); var b=f.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}; })()`));
await realClick(t.x, t.y);
// ② 真实按键几下（再触发 keydown 监听）
for (const k of ['a', 'b', 'c']) await realKey(k);
await sleep(1000);
// ③ 检查 antibot key 是否已被 JS 填上
const ab = await evalJs(`(function(){ var f=document.querySelector('#edit-title-0-value').form; var inputs=[...f.querySelectorAll('input[type=hidden]')].map(i=>i.name+'='+(i.value?'SET':'empty')); return inputs.join(', '); })()`);
log('hidden fields:', ab);
// ④ 填值
await evalJs(`(function(){ document.querySelector('#edit-title-0-value').value = ${JSON.stringify(data.title)}; })()`);
await evalJs(`(function(){ document.querySelector('#edit-body-0-value').value = ${JSON.stringify(data.body)}; })()`);
await evalJs(`(function(){ var t=document.querySelector('#edit-field-tags-target-id'); if(t) t.value = ${JSON.stringify(data.tags)}; })()`);
log('values set');
// ⑤ 真实鼠标点击提交按钮
const b = jp(await evalJs(`(function(){ var f=document.querySelector('#edit-title-0-value').form; var btn=f.querySelector('#edit-submit'); btn.scrollIntoView({block:'center'}); var r=btn.getBoundingClientRect(); return {x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}; })()`));
await sleep(8000); await realClick(b.x, b.y);
await sleep(10000);
const after = jp(await evalJs(`(function(){ return {url: location.href.slice(0,160), body: (document.body.innerText||'').slice(0,500)}; })()`));
log('AFTER:', JSON.stringify(after));
const s = await Promise.race([send('Page.captureScreenshot', { format: 'jpeg', quality: 60 }), new Promise((_, rej) => setTimeout(() => rej(new Error('shot超时')), 8000))]).catch(() => null);
if (s) { writeFileSync('D:/Github/backlink_skills/cdp/_pz-posted2.jpg', Buffer.from(s.data, 'base64')); log('shot saved'); }
process.exit(0);
