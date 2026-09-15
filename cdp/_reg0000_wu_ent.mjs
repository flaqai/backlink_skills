import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
// 页内 fetch enterprise.js 看状态
console.log('FETCH:', await c.evalT(`(async function(){try{var r=await fetch('https://www.google.com/recaptcha/enterprise.js?render=6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1',{mode:'no-cors'}); return 'status='+r.status+' type='+r.type;}catch(e){return 'ERR '+e.message;}})()`, 15000));
// 手动注入 script 加载 enterprise
console.log('INJECT:', await c.evalT(`(function(){return new Promise(function(res){var s=document.createElement('script'); s.src='https://www.google.com/recaptcha/enterprise.js?render=6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1'; s.onload=function(){res('LOADED grecaptcha='+typeof grecaptcha);}; s.onerror=function(){res('SCRIPT_ERR');}; document.head.appendChild(s); setTimeout(function(){res('TIMEOUT grecaptcha='+typeof grecaptcha);}, 8000);});})()`, 20000));
await sleep(1500);
// 尝试 execute 拿 token
console.log('TOKEN:', await c.evalT(`(async function(){try{var t=await grecaptcha.enterprise.execute('6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1'); return 'TOKEN='+t.slice(0,40)+'...len='+t.length;}catch(e){return 'EXEC_ERR '+e.message;}})()`, 15000));
process.exit(0);
