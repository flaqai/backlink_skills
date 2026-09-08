import { CDP, sleep } from './CDP.mjs';
const [,, domain] = process.argv;
const base = 'http://127.0.0.1:9224';
const tabs = await (await fetch(base+'/json/list')).json();
const tab = tabs.find(t => t.type==='page' && t.url.includes(domain));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
const c = new CDP(ws);
await c.send('Page.enable');
try {
  const r = await c.send('Page.handleJavaScriptDialog', {accept:true});
  console.log('dialog handled:', JSON.stringify(r));
} catch(e){ console.log('no dialog:', e.message); }
// 表单直提大法: 补 publish 字段后 form.submit()
const st = await c.eval(`(function(){var f=document.querySelector('form#post');if(!f)return 'NOFORM';f.noValidate=true;var i=document.createElement('input');i.type='hidden';i.name='publish';i.value='Publish';f.appendChild(i);f.submit();return 'SUBMITTED';})()`);
console.log('form-submit:', st);
await sleep(8000);
console.log('href:', await c.evalT('location.href',8000));
process.exit(0);
