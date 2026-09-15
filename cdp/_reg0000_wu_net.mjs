import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
console.log('INJECT:', await c.evalT(`(function(){return new Promise(function(res){var s=document.createElement('script'); s.src='https://www.recaptcha.net/recaptcha/enterprise.js?render=6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1'; s.onload=function(){res('LOADED grecaptcha='+typeof grecaptcha);}; s.onerror=function(){res('SCRIPT_ERR');}; document.head.appendChild(s); setTimeout(function(){res('TIMEOUT grecaptcha='+typeof grecaptcha);}, 10000);});})()`, 22000));
await sleep(2000);
console.log('TOKEN:', await c.evalT(`(async function(){try{var t=await grecaptcha.enterprise.execute('6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1'); window._rcToken=t; var inp=document.querySelector('#rcToken'); if(inp) inp.value=t; return 'TOKEN_len='+t.length+' head='+t.slice(0,30);}catch(e){return 'EXEC_ERR '+e.message;}})()`, 15000));
process.exit(0);
