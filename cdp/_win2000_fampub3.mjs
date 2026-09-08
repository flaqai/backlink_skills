// 完整发布+逐步日志: node _win2000_fampub3.mjs <domain> <draftJsonFile>
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
let ok = await c.evalT(`!!(document.querySelector('#title')&&document.querySelector('#content'))`, 8000);
console.log('editor:', ok);
if(ok !== true){ console.log('FAIL=NO_EDITOR2'); process.exit(1); }
// 标题
let r = await c.eval(`(function(){var i=document.querySelector('#title');i.scrollIntoView({block:'center'});i.focus();var b=i.getBoundingClientRect();return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)});})()`);
var p=JSON.parse(r); await clickXY(p.x,p.y); await sleep(300);
await c.send('Input.insertText',{text:draft.title});
await sleep(400);
console.log('title-filled:', await c.eval(`document.querySelector('#title').value.slice(0,50)`));
// Text 标签
r = await c.eval(`(function(){var b=[...document.querySelectorAll('button, a, div[role=tab]')].find(function(x){return x.offsetParent&&(x.innerText||'').trim()==='Text'});if(!b)return 'NO';b.scrollIntoView({block:'center'});var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2)});})()`);
if(r !== 'NO'){ var bp=JSON.parse(r); await clickXY(bp.x,bp.y); await sleep(700); console.log('text-tab: clicked'); }
else console.log('text-tab: none');
// 正文
r = await c.eval(`(function(){var i=document.querySelector('#content');if(!i)return 'NO';i.scrollIntoView({block:'center'});i.focus();var b=i.getBoundingClientRect();return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)});})()`);
if(r === 'NO'){ console.log('FAIL=NO_CONTENT_TA'); process.exit(1); }
var cp=JSON.parse(r); await clickXY(cp.x,cp.y); await sleep(300);
await c.send('Input.insertText',{text:draft.body});
await sleep(500);
console.log('content-len:', await c.eval(`document.querySelector('#content').value.length`));
// Publish 两段式
r = await c.eval(`(function(){var b=[...document.querySelectorAll('button,input[type=submit],a')].find(function(x){return x.offsetParent&&(x.innerText||x.value||'').trim().indexOf('Publish')===0});if(!b)return 'NO';b.scrollIntoView({block:'center'});var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2)});})()`);
if(r === 'NO'){ console.log('FAIL=NO_PUBBTN'); process.exit(1); }
var pp=JSON.parse(r); await clickXY(pp.x,pp.y);
await sleep(5000);
console.log('after-pub1 href:', await c.evalT('location.href', 8000));
r = await c.evalT(`(function(){var cands=[...document.querySelectorAll('button,input[type=submit],a')].filter(function(x){return x.offsetParent&&(x.innerText||x.value||'').trim()==='Publish'});if(!cands.length)return 'NO';var b=cands[cands.length-1];var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2)});})()`, 8000);
console.log('pub2-candidate:', r);
if(r !== 'NO' && r !== 'TIMEOUT'){ var p2=JSON.parse(r); await clickXY(p2.x,p2.y); await sleep(8000); }
console.log('final href:', await c.evalT('location.href', 8000));
// 验证列表
await c.send('Page.navigate',{url:'https://'+domain+'/posts-list'});
await sleep(8000);
const listed = await c.evalT(`(function(){var kw=${JSON.stringify(draft.title.slice(0,40))};var a=[...document.querySelectorAll('a')].find(function(x){return (x.innerText||'').indexOf(kw)>=0});if(a)return 'URL='+a.href;if(document.body.innerText.indexOf(kw)>=0)return 'TITLE_ONLY';return 'NOT_IN_LIST';})()`, 10000);
console.log('list:', listed);
process.exit(0);
