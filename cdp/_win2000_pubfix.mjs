import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, domain, draftFile] = process.argv;
const draft = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes(domain));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
console.log('href0:', await c.evalT('location.href',8000));
// 页面应已是填好内容的 /new-post (pubshot脚本跑过) — 检查字段
const st = await c.eval(`(function(){var t=document.querySelector('#title'),ct=document.querySelector('#content'),b=document.querySelector('#publish');if(!t)return 'NOEDITOR';return JSON.stringify({tl:t.value.length, cl:ct?ct.value.length:-1, dis:b?b.disabled:null, val:b?b.value:null});})()`);
console.log('state:', st);
if(st === 'NOEDITOR'){ console.log('FAIL=NOEDITOR'); process.exit(1); }
const s = JSON.parse(st);
if(s.tl < 10 || s.cl < 500){
  console.log('字段不全, 重新填充');
  await c.eval(`(function(){var t=document.querySelector('#title');t.focus();t.value='';})()`);
  await c.send('Input.insertText',{text:draft.title});
  await sleep(300);
  await c.eval(`(function(){var b=[...document.querySelectorAll('button,a,div[role=tab]')].find(function(x){return x.offsetParent&&(x.innerText||'').trim()==='Text'});if(b)b.click();document.querySelector('#content').focus();})()`);
  await sleep(600);
  await c.send('Input.insertText',{text:draft.body});
  await sleep(500);
  console.log('refilled:', await c.eval(`document.querySelector('#title').value.length+' / '+document.querySelector('#content').value.length`));
}
// 解禁+JS click
const r = await c.eval(`(function(){var b=document.querySelector('#publish');if(!b)return 'NO';b.disabled=false;b.click();return 'CLICKED';})()`);
console.log('pub-click:', r);
await sleep(8000);
console.log('href1:', await c.evalT('location.href',8000));
const listed = await c.evalT(`(function(){var kw=${JSON.stringify(draft.title.slice(0,40))};var a=[...document.querySelectorAll('a')].find(function(x){return (x.innerText||'').indexOf(kw)>=0});if(a)return 'URL='+a.href;return 'CHK: '+document.body.innerText.slice(0,200);})()`, 10000);
console.log('now:', listed);
process.exit(0);
