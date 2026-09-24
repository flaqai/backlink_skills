// 诊断版: 每步回报实际状态
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, domain, draftFile] = process.argv;
const draft = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes(domain));
if(!tab){ console.log('FAIL=NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await c.send('Page.navigate',{url:'https://'+domain+'/new-post'});
await sleep(9000);
console.log('href:', await c.eval('location.href'));
const st = await c.evalT("(function(){var t=document.querySelector('#title');var ct=document.querySelector('#content');var btns=[...document.querySelectorAll('button,input[type=submit],a')].filter(function(x){return x.offsetParent&&(x.innerText||x.value||'').indexOf('ublish')>=0}).map(function(x){return x.tagName+':'+(x.innerText||x.value).trim()+':'+x.id}).slice(0,5);var tabs=[...document.querySelectorAll('button, a, div[role=tab]')].filter(function(x){return x.offsetParent&&(x.innerText||'').trim()==='Text'}).length;return JSON.stringify({title:!!t, tval:t?t.value.slice(0,40):null, content:!!ct, cval:ct?ct.value.slice(0,60):null, pubBtns:btns, textTabs:tabs, txt:document.body.innerText.slice(0,150)});})()", 10000);
console.log('state:', st);
process.exit(0);
