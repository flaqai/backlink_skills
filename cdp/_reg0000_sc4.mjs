import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: dismiss cookie banner, dump select options, set select value
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
// dismiss cookie banner
const ck = await c.evalT(`(function(){ const b=[...document.querySelectorAll('button, a')].find(x=>/accept all/i.test(x.innerText||'')); if(b){ b.click(); return 'accepted'; } return 'no-banner'; })()`, 8000);
console.log('cookie:', ck);
await sleep(1200);
// dump select options
const opts = await c.evalT(`(function(){ const s=document.querySelector('#subscriptionForm select'); if(!s) return 'NO_SELECT'; return JSON.stringify([...s.options].map(o=>({v:o.value, t:o.innerText.trim()}))); })()`, 8000);
console.log('options:', opts);
// shortName check
const sn = await c.evalT(`(function(){ const i=document.querySelector('#subscriptionForm input[name=shortName]'); return JSON.stringify({val: i?i.value:null, vis: i?!!i.offsetParent:null}); })()`, 8000);
console.log('shortName:', sn);
process.exit(0);
