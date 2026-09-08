// SecureImg家族参数化发文: node _win2000_fampub.mjs <domain> <draftJsonFile>
// draftJson: {id,title,body(HTML)}  成功输出: URL=<公开页>  失败输出: FAIL=<原因>
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, domain, draftFile] = process.argv;
const draft = JSON.parse(fs.readFileSync(draftFile, 'utf8'));
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes(domain));
if(!tab){
  const r = await fetch(base+'/json/new?https://'+domain+'/',{method:'PUT'});
  tab = await r.json();
  await fetch(base+'/json/activate/'+tab.id);
  await sleep(3000);
}
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const clickXY = async (x,y) => { await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); };
await c.send('Page.navigate',{url:'https://'+domain+'/new-post'});
await sleep(9000);
let probe = await c.evalT(`(function(){
  if(document.querySelector('#title') && document.querySelector('#content')) return 'EDITOR';
  if(document.querySelector('#pageLoginForm')) return 'LOGIN';
  return 'UNK:'+location.href.slice(0,90)+'|'+document.body.innerText.slice(0,120).replace(/\s+/g,' ');
})()`, 10000);
console.log('probe:', probe);
if(probe !== 'EDITOR'){
  // 注入cookie再试
  const ck = JSON.parse(fs.readFileSync('D:/Github/backlink_skills/cookies/default/'+domain+'.json','utf8'));
  for(const k of ck.cookies){
    try { await c.send('Network.setCookie', {name:k.name, value:k.value, domain:k.domain||domain, path:k.path||'/', secure:!!k.secure}); } catch(e){}
  }
  await c.send('Page.navigate',{url:'https://'+domain+'/new-post'});
  await sleep(9000);
  probe = await c.evalT(`(function(){
    if(document.querySelector('#title') && document.querySelector('#content')) return 'EDITOR';
    return 'STILL:'+document.body.innerText.slice(0,120).replace(/\s+/g,' ');
  })()`, 10000);
  console.log('probe2:', probe);
  if(probe !== 'EDITOR'){ console.log('FAIL=NO_EDITOR'); process.exit(1); }
}
// 标题
const tr = await c.eval(`(function(){ const i=document.querySelector('#title'); i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
const tp=JSON.parse(tr); await clickXY(tp.x,tp.y); await sleep(300);
await c.send('Input.insertText',{text:draft.title});
await sleep(300);
// Text 标签切 textarea
const tb = await c.eval(`(function(){ const b=[...document.querySelectorAll('button, a, div[role=tab]')].find(x=>(x.innerText||'').trim()==='Text'&&x.offsetParent); if(!b) return null; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
if(tb){ const bp=JSON.parse(tb); await clickXY(bp.x,bp.y); await sleep(700); }
// 正文
const hasContent = await c.evalT(`!!document.querySelector('#content')`, 5000);
if(!hasContent){ console.log('FAIL=NO_TEXTAREA'); process.exit(1); }
const cr = await c.eval(`(function(){ const i=document.querySelector('#content'); i.scrollIntoView({block:'center'}); i.focus(); const b=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}); })()`);
const cp=JSON.parse(cr); await clickXY(cp.x,cp.y); await sleep(300);
await c.send('Input.insertText',{text:draft.body});
await sleep(500);
// Publish 两段式
const pr = await c.eval(`(function(){ const b=[...document.querySelectorAll('button,input[type=submit],a')].find(x=>(x.innerText||x.value||'').trim().startsWith('Publish')&&x.offsetParent); if(!b) return null; b.scrollIntoView({block:'center'}); const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
if(!pr){ console.log('FAIL=NO_PUBLISH_BTN'); process.exit(1); }
const pp=JSON.parse(pr); await clickXY(pp.x,pp.y);
await sleep(4000);
const pr2 = await c.evalT(`(function(){ const cands=[...document.querySelectorAll('button,input[type=submit],a')].filter(x=>x.offsetParent&&(x.innerText||x.value||'').trim()==='Publish'); if(!cands.length) return null; const b=cands[cands.length-1]; const r=b.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`, 8000);
if(pr2 && pr2!=='TIMEOUT'){ const p2=JSON.parse(pr2); await clickXY(p2.x,p2.y); }
await sleep(8000);
// 验证: posts-list 找标题+拿链接
await c.send('Page.navigate',{url:'https://'+domain+'/posts-list'});
await sleep(7000);
const listed = await c.evalT(`(function(){
  const a=[...document.querySelectorAll('a')].find(x=>(x.innerText||'').includes(${JSON.stringify(draft.title.slice(0,40))}));
  if(a) return 'URL='+a.href;
  if(document.body.innerText.includes(${JSON.stringify(draft.title.slice(0,40))})) return 'URL=INTITLE_ONLY';
  return 'NOT_IN_LIST';
})()`, 10000);
console.log(listed);
process.exit(0);
