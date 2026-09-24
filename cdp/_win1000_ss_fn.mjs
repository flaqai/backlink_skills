import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://www.salespider.com/business-directories-free-online-ads?name=Dino%20Age&city=623' });
  for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(3000);
  console.log('SEL FN:', String(await cdp.evalT(`typeof window.selectCity === 'function' ? window.selectCity.toString().slice(0, 600) : 'NOSELFN'`, 8000)));
  console.log('CITY INPUTS:', String(await cdp.evalT(`JSON.stringify([...document.querySelectorAll('input')].filter(e=>/city/i.test(e.name)).map(e=>e.name+':'+e.value+':'+e.id))`, 8000)));
  console.log('POST FN HEAD:', String(await cdp.evalT(`typeof window.businessdirectory_post === 'function' ? window.businessdirectory_post.toString().slice(0, 700) : 'NOPOSTFN'`, 8000)));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
