// fampub5 = fampub4 + 原生dialog自动接受(备份冲突confirm是publish杀手)
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, domain, draftFile] = process.argv;
const draft = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes(domain));
if(!tab){
  const r = await fetch(base+'/json/new?https://'+domain+'/', {method:'PUT'});
  tab = await r.json();
  await fetch(base+'/json/activate/'+tab.id);
  await sleep(4000);
}
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
let dlgCount = 0;
c.on((msg) => {
  if(msg.method === 'Page.javascriptDialogOpening'){
    dlgCount++;
    console.log('DIALOG detected:', msg.data.message.slice(0,80), '→ accept');
    c.send('Page.handleJavaScriptDialog', {accept:true}).catch(()=>{});
  }
});
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
try {
  const ck = JSON.parse(fs.readFileSync('D:/Github/backlink_skills/cookies/default/'+domain+'.json','utf8'));
  for(const k of ck.cookies){
    try { await c.send('Network.setCookie', {name:k.name, value:k.value, domain:k.domain||domain, path:k.path||'/', secure:!!k.secure}); } catch(e){}
  }
} catch(e){}
// ★清掉浏览器备份, 防publish时confirm弹窗
await c.send('Page.navigate',{url:'https://'+domain+'/new-post'});
await sleep(9000);
await c.eval(`(function(){try{var keys=[];for(var i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));keys.forEach(function(k){if(/autosave|backup|wp-/i.test(k))localStorage.removeItem(k)});for(var j=0;j<sessionStorage.length;j++){var sk=sessionStorage.key(j);if(/autosave|backup|wp-/i.test(sk))sessionStorage.removeItem(sk)}}catch(e){}})()`);
let ok = await c.evalT(`!!(document.querySelector('#title')&&document.querySelector('#content'))`, 8000);
console.log('editor:', ok, 'dialogs:', dlgCount);
if(ok !== true){ console.log('FAIL=NO_EDITOR'); process.exit(1); }
// 点掉restore backup横幅里的忽略(无按钮, 仅横幅, 无碍)
let r = await c.eval(`(function(){var i=document.querySelector('#title');i.scrollIntoView({block:'center'});i.focus();var b=i.getBoundingClientRect();return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)});})()`);
var p=JSON.parse(r); await clickXY(p.x,p.y); await sleep(300);
await c.send('Input.insertText',{text:draft.title});
await sleep(400);
r = await c.eval(`(function(){var b=[...document.querySelectorAll('button, a, div[role=tab]')].find(function(x){return x.offsetParent&&(x.innerText||'').trim()==='Text'});if(!b)return 'NO';var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2)});})()`);
if(r!=='NO'){ var bp=JSON.parse(r); await clickXY(bp.x,bp.y); await sleep(700); }
r = await c.eval(`(function(){var i=document.querySelector('#content');if(!i)return 'NO';i.scrollIntoView({block:'center'});i.focus();var b=i.getBoundingClientRect();return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)});})()`);
if(r==='NO'){ console.log('FAIL=NO_TA'); process.exit(1); }
var cp=JSON.parse(r); await clickXY(cp.x,cp.y); await sleep(300);
await c.send('Input.insertText',{text:draft.body});
await sleep(600);
console.log('filled:', await c.eval(`document.querySelector('#title').value.length+' / '+document.querySelector('#content').value.length`));
r = await c.eval(`(function(){var b=document.querySelector('#publish');if(!b)return 'NO';b.scrollIntoView({block:'center'});var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2)});})()`);
if(r==='NO'){ console.log('FAIL=NO_PUB'); process.exit(1); }
var pp=JSON.parse(r);
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:pp.x,y:pp.y});
await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:pp.x,y:pp.y,button:'left',clickCount:1});
await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:pp.x,y:pp.y,button:'left',clickCount:1});
await sleep(6000);
console.log('dialogs-after-mouse:', dlgCount);
let href1 = await c.evalT('location.href', 8000);
console.log('after-mouse-pub:', href1);
if(/new-post/.test(href1)){
  await c.eval(`(function(){var b=document.querySelector('#publish');if(b){b.disabled=false;b.click();}})()`);
  await sleep(8000);
  href1 = await c.evalT('location.href', 8000);
  console.log('after-js-pub:', href1, 'dialogs:', dlgCount);
}
await c.send('Page.navigate',{url:'https://'+domain+'/posts-list'});
await sleep(8000);
const listed = await c.evalT(`(function(){var kw=${JSON.stringify(draft.title.slice(0,40))};var a=[...document.querySelectorAll('a')].find(function(x){return (x.innerText||'').indexOf(kw)>=0});if(a)return 'URL='+a.href;if(document.body.innerText.indexOf(kw)>=0)return 'TITLE_IN_LIST';return 'NOT_IN_LIST';})()`, 10000);
console.log('list:', listed);
process.exit(0);
