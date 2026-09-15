import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000g2: 正确 action token + csrf 刷新 + 原生 submit
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(500);

// 表单字段检查 (reload 后可能已清空)
console.log('VALS:', await c.evalT(`(function(){var u=document.querySelector('#username'),e=document.querySelector('#email'),p=document.querySelector('#password'),pc=document.querySelector('#password_confirm'); return ['u='+(u&&u.value||''),'e='+(e&&e.value||''),'p='+(p?p.value.length:0),'pc='+(pc?pc.value.length:0)].join(' | ');})()`, 8000));

// 1. 刷新 csrf
console.log('CSRF:', await c.evalT(`(async function(){try{var r=await fetch('/register/csrf',{method:'POST',headers:{'Accept':'application/json'},credentials:'same-origin'}); var d=await r.json(); var t=document.querySelector('.auth-form [name=_token]'); if(t&&d.token) t.value=d.token; return 'csrf='+(d.token?'refreshed':'no_token')+' http='+r.status;}catch(e){return 'ERR '+e.message;}})()`, 15000));

// 2. 正确 action 拿 token
console.log('TOKEN:', await c.evalT(`(async function(){try{var t=await grecaptcha.enterprise.execute('6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1',{action:'register'}); document.getElementById('rcToken').value=t; return 'ok_len='+t.length;}catch(e){return 'EXEC_ERR '+e.message;}})()`, 15000));

// 3. 原生 submit 绕过 handler
console.log('SUBMIT:', await c.evalT(`(function(){var f=document.querySelector('.auth-form'); if(!f) return 'NO_FORM'; f.submit(); return 'NATIVE_SUBMIT';})()`, 10000));
await sleep(8000);

console.log('URL:', await c.evalT('location.href', 8000));
console.log('BODY:', await c.evalT(`document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,12).join(' | ').slice(0,350)`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_final.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
