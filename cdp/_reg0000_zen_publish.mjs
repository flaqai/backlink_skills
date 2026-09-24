import { CDP, sleep } from './CDP.mjs';
import { writeFileSync, readFileSync } from 'fs';
// reg0000 0906 thezenweb发文: /new 编辑器探测+发布
// 用法: node _reg0000_zen_publish.mjs <domain> <title> <bodyfile>
const [domain, title, bodyFile] = process.argv.slice(2);
const body = readFileSync(bodyFile, 'utf8').trim();
const log = (...a) => console.log(...a);
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + domain + '/new', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(6000);
const clickXY = async (x, y) => { await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
const ed = await c.eval(`JSON.stringify({url:location.href, titleField:!!(document.querySelector('input[name=title]')||document.querySelector('#title')||document.querySelector('input[placeholder*=itle]')), textareas:[...document.querySelectorAll('textarea')].map(x=>({name:x.name,id:x.id,vis:!!x.offsetParent})), cleditor:!!document.querySelector('.mce-tinymce,iframe[id*=mce],.cke_wysiwyg_frame,[class*=note-editable]'), inputs:[...document.querySelectorAll('input')].filter(i=>i.offsetParent).map(i=>({n:i.name||i.id,p:i.placeholder||'',t:i.type})).slice(0,14), btns:[...document.querySelectorAll('button,input[type=submit]')].filter(b=>b.offsetParent).map(b=>(b.innerText||b.value||'').replace(/\\s+/g,' ').slice(0,22)).slice(0,8)})`);
log('EDITOR:', ed);
const e = JSON.parse(ed);
if (!e.titleField) { log('NO_EDITOR'); const s0 = await c.send('Page.captureScreenshot', { format: 'png' }); writeFileSync('D:/Github/seoadminC/storage/_reg0000_zen_npno.png', Buffer.from(s0.data, 'base64')); process.exit(2); }
// 填标题
const tf = await c.eval(`(function(){ const i=document.querySelector('input[name=title]')||document.querySelector('#title')||document.querySelector('input[placeholder*=itle]'); i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
const tp = JSON.parse(tf); await clickXY(tp.x, tp.y); await sleep(200);
await c.send('Input.insertText', { text: title }); await sleep(300);
// 正文: textarea直填 或 TinyMCE/CKEditor iframe
if (e.textareas.some(x => x.vis)) {
  const sel = e.textareas.find(x => x.id) ? '#' + e.textareas.find(x => x.id).id : (e.textareas.find(x => x.name) ? '[name=' + e.textareas.find(x => x.name).name + ']' : 'textarea');
  const cf = await c.eval(`(function(){ const i=document.querySelector('${sel}'); i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  const cp = JSON.parse(cf); await clickXY(cp.x, cp.y); await sleep(200);
  await c.send('Input.insertText', { text: body }); await sleep(400);
  const len = await c.eval(`(document.querySelector('${sel}')||{value:''}).value.length`);
  log('BODY_LEN', len);
} else if (e.cleditor) {
  // TinyMCE/CKEditor: 找可写iframe body
  const fr = await c.eval(`(function(){ const f=document.querySelector('iframe[id*=mce]')||document.querySelector('.cke_wysiwyg_frame'); if(!f) return null; const b=f.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
  const fp = JSON.parse(fr); await clickXY(fp.x, fp.y); await sleep(400);
  await c.send('Input.insertText', { text: body.split('<p>').join('').split('</p>').join('\n\n').replace(/<[^>]+>/g, '') }); await sleep(400);
  log('RTE_TYPED');
}
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_zen_filled.png', Buffer.from(shot.data, 'base64'));
log('FILLED_SHOT');
process.exit(0);
