import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000g3: 填密码+token+submit 一气呵成
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

// JS 直接设密码值 (Laravel 服务端渲染页, 表单提交时值会被发送, React 无关)
await c.evalT(`(function(){var p=document.querySelector('#password'),pc=document.querySelector('#password_confirm'); var pv=p?Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set:null; if(p){pv.call(p,'Xx@Wuc26!Xm'); p.dispatchEvent(new Event('input',{bubbles:true}));} if(pc){pv.call(pc,'Xx@Wuc26!Xm'); pc.dispatchEvent(new Event('input',{bubbles:true}));} return 'pw_set';})()`);
await sleep(400);

// csrf 刷新
console.log('CSRF:', await c.evalT(`(async function(){try{var r=await fetch('/register/csrf',{method:'POST',headers:{'Accept':'application/json'},credentials:'same-origin'}); var d=await r.json(); var t=document.querySelector('.auth-form [name=_token]'); if(t&&d.token) t.value=d.token; return 'http='+r.status+' tok='+(d.token?'y':'n');}catch(e){return 'ERR '+e.message;}})()`, 15000));

// token with action
console.log('TOKEN:', await c.evalT(`(async function(){try{var t=await grecaptcha.enterprise.execute('6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1',{action:'register'}); document.getElementById('rcToken').value=t; return 'ok_len='+t.length;}catch(e){return 'ERR '+e.message;}})()`, 15000));

// 终检
console.log('FINALVALS:', await c.evalT(`(function(){var f=document.querySelector('.auth-form'); var fd=new FormData(f); var lines=[]; fd.forEach(function(v,k){ lines.push(k+'='+(typeof v==='string'? (k==='rcToken'? 'len'+v.length : (v.length>30?'len'+v.length : v)) : 'file')); }); return lines.join(' | ');})()`, 8000));

// 原生提交
await c.evalT(`document.querySelector('.auth-form').submit()`);
await sleep(8000);

console.log('URL:', await c.evalT('location.href', 8000));
console.log('BODY:', await c.evalT(`document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,12).join(' | ').slice(0,350)`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_final2.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
