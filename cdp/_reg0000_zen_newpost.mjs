import { CDP, sleep } from './CDP.mjs';
import { writeFileSync, readFileSync } from 'fs';
// reg0000 0906 thezenweb发文: /posts页点New post→探编辑器→填标题正文→提交
const [titleFile, bodyFile] = process.argv.slice(2);
const title = readFileSync(titleFile, 'utf8').trim();
const body = readFileSync(bodyFile, 'utf8').trim();
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('thezenweb'));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x, y) => { await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); };
// 点New post
const nb = await c.eval(`(function(){ const x=[...document.querySelectorAll('a,button')].find(e=>/new post/i.test(e.innerText||'')&&e.offsetParent); if(!x) return null; x.scrollIntoView({block:'center'}); const r=x.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),href:x.href||''}); })()`);
if (!nb) { console.log('NO_NEWPOST_LINK'); process.exit(1); }
const np = JSON.parse(nb);
console.log('NEWPOST_LINK', JSON.stringify(np));
await clickXY(np.x, np.y);
await sleep(6000);
// 探编辑器形态
const ed = await c.eval(`JSON.stringify({url:location.href, title:!!(document.querySelector('input[name=title]')||document.querySelector('#title')), tinymce:!!document.querySelector('.mce-tinymce,iframe[id*=mce],div[id*=mce]'), textarea:[...document.querySelectorAll('textarea')].map(t=>({name:t.name,id:t.id,vis:!!t.offsetParent})), inputs:[...document.querySelectorAll('input')].filter(i=>i.offsetParent).map(i=>i.name||i.id).slice(0,12), buttons:[...document.querySelectorAll('button,input[type=submit]')].filter(b=>b.offsetParent).map(b=>(b.innerText||b.value||'').slice(0,20)).slice(0,10)})`);
console.log('EDITOR:', ed);
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
writeFileSync('D:/Github/seoadminC/storage/_reg0000_zen_editor.png', Buffer.from(shot.data, 'base64'));
process.exit(0);
