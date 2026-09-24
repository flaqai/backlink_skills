// sonicrun freelance listing: 9224 turnstile无感+邮箱验证: node _win2000_sonic.mjs <taskUrl> <title> <email> <name>
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, taskUrl, title, email, name] = process.argv;
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base+'/json/list')).json();
let tab = tabs.find(t => t.type==='page' && t.url.includes('sonicrun'));
if(!tab){ const r = await fetch(base+'/json/new?https://www.sonicrun.com/freelisting.html',{method:'PUT'}); tab = await r.json(); await fetch(base+'/json/activate/'+tab.id); await sleep(5000); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.send('Page.navigate',{url:'https://www.sonicrun.com/freelisting.html'});
await sleep(9000);
// 填表单
const fill = async (sel, val) => {
  const r = await c.eval(`(function(){var i=document.querySelector('${sel}');if(!i)return 'NO';i.scrollIntoView({block:'center'});i.focus();i.value='';return 'OK';})()`);
  if(r!=='OK'){ console.log('field '+sel+' missing'); return false; }
  await c.send('Input.insertText',{text:val}); await sleep(250);
  return true;
};
await fill('input[name=url]', taskUrl);
await fill('input[name=email]', email);
await fill('input[name=name]', name);
// 勾terms
await c.eval(`(function(){var t=document.querySelector('input[name=terms]');if(t&&!t.checked){t.scrollIntoView({block:'center'});t.click();}})()`);
await sleep(500);
// 等turnstile token
let tok = '';
for(let i=0;i<12;i++){
  tok = await c.eval(`(function(){var el=document.querySelector('[name=cf-turnstile-response]');return el?el.value.slice(0,20):'';})()`);
  if(tok && tok!=='TIMEOUT') break;
  await sleep(5000);
}
console.log('turnstile token:', tok ? tok+'...(ok)' : 'EMPTY');
// 提交按钮
const r = await c.eval(`(function(){var b=[...document.querySelectorAll('input[type=submit],button')].find(function(x){return x.offsetParent&&/submit|continue/i.test(x.value||x.innerText||'')});if(!b)return 'NO';b.scrollIntoView({block:'center'});var q=b.getBoundingClientRect();return JSON.stringify({x:Math.round(q.x+q.width/2),y:Math.round(q.y+q.height/2),v:(b.value||b.innerText||'').slice(0,30)});})()`);
if(r==='NO'){ console.log('FAIL=NO_SUBMIT_BTN'); process.exit(1); }
const p=JSON.parse(r); console.log('btn:', p.v);
await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
await sleep(10000);
console.log('after:', await c.evalT(`location.href.slice(0,90)+' | '+document.body.innerText.slice(0,150).split(String.fromCharCode(10)).join('~')`, 10000));
const shot = await c.send('Page.captureScreenshot',{format:'png'});
fs.writeFileSync('D:/Github/seoadminC/storage/_win2000_sonic.png', Buffer.from(shot.data,'base64'));
process.exit(0);
