// topsimilarsites 免jQuery版: 页内fetch直接打 /refresh.aspx
import { CDP, sleep } from './CDP.mjs';
const [tN, domain] = process.argv.slice(2);
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => (t.url || '').includes('topsimilarsites') && t.type === 'page');
if (!tab) tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://www.topsimilarsites.com/add.aspx' });
  await sleep(4000);
  // 页内fetch模拟 refreshSite(0, url, 0)
  const resp = await cdp.eval(`(async () => {
    const r = await fetch('/refresh.aspx', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest'},
      body: 'id=0&url=${encodeURIComponent(domain)}&t=0',
      credentials: 'include'
    });
    const txt = await r.text();
    return 'HTTP' + r.status + ' | ' + txt.slice(0, 200);
  })()`);
  console.log('refresh.aspx:', resp);
  if (resp.includes("'true'") || resp.includes('"true"')) {
    await cdp.send('Page.navigate', { url: 'https://www.topsimilarsites.com/site/' + domain });
    await sleep(5000);
    const receipt = await cdp.eval(`(() => {
      const t = document.body.innerText;
      const i = t.indexOf('We are searching similar sites');
      return i >= 0 ? 'RECEIPT: ' + t.slice(i, i + 95) : 'SITEPAGE-NORECEIPT: ' + t.slice(0, 120);
    })()`);
    console.log('FINAL', tN, domain, receipt);
  } else {
    console.log('FINAL', tN, domain, 'NOT-QUEUED (see refresh response above)');
  }
} catch (e) { console.log('ERR:', String(e).slice(0, 150)); }
await fetch('http://127.0.0.1:9224/json/close/' + tab.id, { method: 'PUT' }).catch(() => {});
process.exit(0);
