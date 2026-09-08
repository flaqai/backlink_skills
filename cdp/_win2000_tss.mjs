// topsimilarsites add.aspx 复放: node _win2000_tss.mjs <tN> <domain>
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
  await sleep(4500);
  const fill = await cdp.eval(`(() => {
    const e = document.querySelector('input[name="NewURL"]');
    if (!e) return 'NOFIELD';
    e.scrollIntoView({block:'center'}); e.focus();
    return 'OK';
  })()`);
  console.log('fill:', fill);
  if (fill === 'OK') {
    for (const ch of domain) {
      await cdp.send('Input.insertText', { text: ch }).catch(() => {});
      await sleep(15);
    }
    await sleep(800);
    const rect = await cdp.eval(`(() => {
      const a = [...document.querySelectorAll('a')].find(x => x.textContent.trim().toLowerCase().indexOf('add site') >= 0);
      if (!a) return 'NOLINK';
      a.scrollIntoView({block:'center'});
      const r = a.getBoundingClientRect();
      return JSON.stringify({x: r.x + r.width/2, y: r.y + r.height/2});
    })()`);
    console.log('addsite rect:', rect);
    if (rect !== 'NOLINK') {
      const {x, y} = JSON.parse(rect);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      await sleep(4000);
      const receipt = await cdp.eval(`(() => {
        const t = document.body.innerText;
        const i = t.indexOf('We are searching similar sites');
        if (i >= 0) return 'RECEIPT: ' + t.slice(i, i + 80);
        return 'NORECEIPT: ' + t.slice(0, 120);
      })()`);
      console.log(tN, domain, receipt);
    }
  }
} catch (e) { console.log('ERR:', String(e).slice(0, 150)); }
await fetch('http://127.0.0.1:9224/json/close/' + tab.id, { method: 'PUT' }).catch(() => {});
process.exit(0);
