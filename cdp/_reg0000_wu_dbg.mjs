import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Runtime.enable'); await c.send('Network.enable'); await c.send('Page.enable');
const errs = [];
c.on(m => {
  if (m.method === 'Runtime.exceptionThrown') errs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception && m.params.exceptionDetails.exception.description || '').slice(0, 150));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('ERR ' + (m.params.args || []).map(a => (a.value || a.description || '')).join(' ').slice(0, 150));
});
await c.send('Page.reload');
await sleep(6000);
console.log('GOBJ:', await c.evalT(`(function(){return 'grecaptcha=' + (typeof grecaptcha) + ' render=' + (typeof grecaptcha !== 'undefined' ? !!grecaptcha.render : 'n/a');})()`, 8000));
console.log('WIDGET:', await c.evalT(`(function(){var g=document.querySelector('.g-recaptcha'); return g ? 'div_yes sitekey=' + (g.getAttribute('data-sitekey')||'') : 'no_div';})()`, 8000));
console.log('IFRAMES:', await c.evalT(`(function(){return [...document.querySelectorAll('iframe')].map(function(f){return (f.src||'').slice(0,60)}).join(' ; ') || 'none';})()`, 8000));
console.log('ERRS:', errs.slice(0, 5).join(' || ').slice(0, 600));
process.exit(0);
