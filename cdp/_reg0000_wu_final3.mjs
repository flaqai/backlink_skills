import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000g4: 注入ent+token+submit 全一版
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

// 1. 密码字段重填 (native setter)
await c.evalT(`(function(){var set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; ['password','password_confirm'].forEach(function(id){var e=document.querySelector('#'+id); if(e){set.call(e,'Xx@Wuc26!Xm'); e.dispatchEvent(new Event('input',{bubbles:true}));}}); return 'pw';})()`);
// 2. 注入 enterprise via recaptcha.net
console.log('INJECT:', await c.evalT(`(function(){return new Promise(function(res){if(typeof grecaptcha!=='undefined'&&grecaptcha.enterprise) return res('ALREADY'); var s=document.createElement('script'); s.src='https://www.recaptcha.net/recaptcha/enterprise.js?render=6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1'; s.onload=function(){res('LOADED');}; s.onerror=function(){res('SCRIPT_ERR');}; document.head.appendChild(s); setTimeout(function(){res('TIMEOUT');}, 12000);});})()`, 22000));
await sleep(1500);
// 3. csrf 刷新
await c.evalT(`(async function(){try{var r=await fetch('/register/csrf',{method:'POST',headers:{'Accept':'application/json'},credentials:'same-origin'}); var d=await r.json(); var t=document.querySelector('.auth-form [name=_token]'); if(t&&d.token) t.value=d.token;}catch(e){}})()`);
// 4. token with action
console.log('TOKEN:', await c.evalT(`(async function(){try{var t=await grecaptcha.enterprise.execute('6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1',{action:'register'}); var inp=document.getElementById('rcToken')||document.querySelector('[name=g-recaptcha-response]'); inp.value=t; return 'ok_len='+t.length;}catch(e){return 'ERR '+e.message;}})()`, 15000));
// 5. 终检+提交
console.log('FINALVALS:', await c.evalT(`(function(){var f=document.querySelector('.auth-form'); var fd=new FormData(f); var lines=[]; fd.forEach(function(v,k){ lines.push(k+'='+(k==='rcToken'||k==='g-recaptcha-response'? 'len'+v.length : (v.length>30?'len'+v.length: v))); }); return lines.join(' | ');})()`, 8000));
await c.evalT(`document.querySelector('.auth-form').submit()`);
await sleep(8000);
console.log('URL:', await c.evalT('location.href', 8000));
console.log('BODY:', await c.evalT(`document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,12).join(' | ').slice(0,350)`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_final3.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
