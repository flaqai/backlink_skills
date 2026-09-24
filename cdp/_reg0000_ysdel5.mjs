import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('youslade.com'));
if(!tab){ console.log('NO TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
const pid = process.argv[2] || '791339';
const r = await c.evalT(`(async function(){ const fd = new FormData(); fd.append('post_id','${pid}'); const rs = await fetch('/requests.php?f=posts&s=delete', {method:'POST', body:fd, headers:{'X-Requested-With':'XMLHttpRequest'}}); return (await rs.text()).slice(0,200); })()`, 15000);
console.log('delete resp:', r);
await sleep(2500);
const chk = await c.evalT(`(function(){ const out=[]; document.querySelectorAll('[data-post-id], [id^=post]').forEach(x=>{ const id=x.getAttribute('data-post-id')||x.id; if(x.innerText&&x.innerText.includes('running notebook')&&/^\\d+$/.test(id)) out.push(id); }); return JSON.stringify(out); })()`, 10000);
console.log('remaining posts:', chk);
process.exit(0);
