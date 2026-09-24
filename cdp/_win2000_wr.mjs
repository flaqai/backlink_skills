// websiterating /submit/: node _win2000_wr.mjs <url> <name> <tagline> <descFile> <category> <email>
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, url, name, tagline, descFile, category, email] = process.argv;
const desc = fs.readFileSync(descFile, 'utf8').trim();
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes('websiterating'));
if(!tab){ const r = await fetch(base+'/json/new?https://www.websiterating.com/submit/',{method:'PUT'}); tab = await r.json(); await fetch(base+'/json/activate/'+tab.id); await sleep(5000); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
let dlg = 0;
c.on((m)=>{ if(m.method==='Page.javascriptDialogOpening'){ dlg++; c.send('Page.handleJavaScriptDialog',{accept:true}).catch(()=>{}); } });
await c.send('Page.navigate',{url:'https://www.websiterating.com/submit/'});
await sleep(10000);
// 填字段(insertText真打字)
const fillByClick = async (sel, val) => {
  const r = await c.eval(`(function(){var i=document.querySelector('${sel}');if(!i)return 'NO';i.scrollIntoView({block:'center'});i.focus();var b=i.getBoundingClientRect();return JSON.stringify({x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)});})()`);
  if(r==='NO'){ console.log(sel,'missing'); return false; }
  const p=JSON.parse(r);
  await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
  await sleep(250);
  await c.send('Input.insertText',{text:val});
  await sleep(300);
  return true;
};
await fillByClick('#websiteUrl', url);
// 等enrich(站方可能拉DR)
await sleep(10000);
await fillByClick('#name', name);
await fillByClick('#tagline', tagline);
await fillByClick('#description', desc);
// category 是select还是input
const isSel = await c.eval(`!!document.querySelector('select[name=category]') || !!document.querySelector('#category') && document.querySelector('#category').tagName==='SELECT'`);
if(isSel){
  await c.eval(`(function(){var s=document.querySelector('select[name=category]')||document.querySelector('#category');s.value='${category}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
} else {
  await fillByClick('#category', category);
  await sleep(800);
  await c.eval(`(function(){var i=document.querySelector('#category');if(i){i.dispatchEvent(new Event('input',{bubbles:true}));i.blur();}})()`);
}
await fillByClick('#email', email);
console.log('filled:', await c.eval(`JSON.stringify({u:document.querySelector('#websiteUrl').value.slice(0,30),n:document.querySelector('#name').value.slice(0,20),c:(document.querySelector('select[name=category]')||{value:''}).value||(document.querySelector('#category')||{value:''}).value.slice(0,20)})`));
// 等turnstile token
let tok='';
for(let i=0;i<20;i++){
  tok = await c.eval(`(function(){var el=document.querySelector('[name=cf-turnstile-response]');return el?el.value:'';})()`);
  if(tok) break;
  await sleep(4000);
}
console.log('turnstile:', tok ? 'OK('+tok.length+')' : 'EMPTY');
if(!tok){ console.log('FAIL=NO_TOKEN'); process.exit(1); }
// 提交: 真实点击submit按钮
const r = await c.eval(`(function(){var b=[...document.querySelectorAll('button[type=submit], button')].find(function(x){return x.offsetParent&&/submit|get listed/i.test(x.innerText||'')});if(!b)return 'NO';b.scrollIntoView({block:'center'});var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2),t:(b.innerText||'').slice(0,25)});})()`);
if(r==='NO'){ console.log('FAIL=NO_BTN'); process.exit(1); }
const p=JSON.parse(r); console.log('btn:', p.t);
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
await sleep(9000);
const after = await c.evalT(`(function(){var N=String.fromCharCode(10);return location.href.slice(0,70)+'<<>>'+document.body.innerText.slice(0,400).split(N).join('~');})()`, 10000);
console.log('after:', after);
process.exit(0);
