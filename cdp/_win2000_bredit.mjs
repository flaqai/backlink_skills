import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const domain = 'blogerus.com';
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes(domain));
if(!tab){ console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await c.send('Page.navigate',{url:'https://blogerus.com/edit-post?64988154'});
await sleep(9000);
let ok = await c.evalT(`!!document.querySelector('#content')`, 8000);
console.log('editor:', ok);
if(ok!==true){ console.log('FAIL=NO_EDITOR'); process.exit(1); }
// Text页签
let r = await c.eval(`(function(){var b=[...document.querySelectorAll('button, a, div[role=tab]')].find(function(x){return x.offsetParent&&(x.innerText||'').trim()==='Text'});if(!b)return 'NO';var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2)});})()`);
if(r!=='NO'){ var bp=JSON.parse(r); await clickXY(bp.x,bp.y); await sleep(700); }
// 光标移到正文末尾
r = await c.eval(`(function(){var i=document.querySelector('#content');if(!i)return 'NO';i.scrollIntoView({block:'center'});i.focus();i.setSelectionRange(i.value.length,i.value.length);i.scrollTop=i.scrollHeight;return 'OK';})()`);
console.log('cursor:', r);
// 追加裸域兜底行
await c.send('Input.insertText',{text:'\n\nMore on this topic: home generator sizing, fuel choice and maintenance guides at https://generatorforhouse.org'});
await sleep(600);
console.log('new-len:', await c.eval(`document.querySelector('#content').value.length`));
// 更新按钮
r = await c.eval(`(function(){var b=document.querySelector('#publish');if(!b)return 'NO';b.scrollIntoView({block:'center'});var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2),v:(b.value||'').slice(0,20)});})()`);
if(r==='NO'){ console.log('FAIL=NO_UPDATE_BTN'); process.exit(1); }
const p=JSON.parse(r); console.log('btn:', p.v);
await clickXY(p.x,p.y);
await sleep(3000);
await c.eval(`(function(){var b=document.querySelector('#publish');if(b){b.disabled=false;b.click();}})()`);
await sleep(8000);
console.log('after:', await c.evalT('location.href', 8000));
process.exit(0);
