// win1200: blog-ezine 登录态检查 (cookie 0904版, 验证 /Dashboard 可达性)
import { CDP } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch(`http://127.0.0.1:9224/json/activate/${t.id}`);
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const cdp = new CDP(ws);
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url: 'https://blog-ezine.com/Dashboard' });
  await sleep(9000);
  const r = await cdp.eval(`(() => {
    return JSON.stringify({
      url: location.href.slice(0, 140),
      title: document.title.slice(0, 60),
      hasAdminBar: !!document.getElementById('wpadminbar'),
      bodyHead: document.body.innerText.slice(0, 300)
    });
  })()`);
  console.log('STATE:', r);
} catch (e) { console.log('ERR:', e.message); }
console.log('TABID:' + t.id);
