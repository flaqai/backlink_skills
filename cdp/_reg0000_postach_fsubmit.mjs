import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('postach.io/register'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Network.enable');
const reqs = [];
c.on(m => { if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST') reqs.push('POST ' + m.params.request.url.slice(0,140) + ' :: ' + String(m.params.request.postData||'').slice(0,200)); });
// 表单结构
console.log('FORM:', await c.evalT("JSON.stringify([...document.querySelectorAll('form')].map(function(f){return {action:f.action, method:f.method, fields:[...f.elements].map(function(e){return e.name||e.id||e.tagName;}).slice(0,10)};}))", 6000));
// token 残留检查（hcaptcha 可能挂在 window 变量）
console.log('VARS:', await c.evalT("[typeof hcaptcha !== 'undefined' ? 'hcaptcha yes' : 'no hcaptcha', (document.querySelector('textarea[name^=h-captcha],textarea[name^=g-recaptcha]')||{}).value !== undefined ? 'ta exists' : 'no ta'].join(' | ')", 6000));
await c.evalT("document.querySelector('form') && document.querySelector('form').submit()", 3000);
await sleep(6000);
console.log('URL:', await c.evalT('location.href', 6000));
reqs.slice(-4).forEach(r => console.log(r));
const shot = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(shot) writeFileSync('D:/Github/seoadminC/storage/_reg0000/postach_fsubmit.png', Buffer.from(shot.data,'base64'));
console.log('SHOT ok');
