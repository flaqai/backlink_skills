import { CDP, sleep } from './CDP.mjs';
const domain = process.argv[2] || 'zakaihu.com';
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
  const prep = await cdp.eval(`(() => {
    const e = document.querySelector('input[name="NewURL"]');
    if (!e) return 'NOFIELD';
    e.scrollIntoView({block:'center'}); e.focus();
    return 'OK';
  })()`);
  console.log('prep:', prep);
  if (prep === 'OK') {
    for (const ch of domain) { await cdp.send('Input.insertText', { text: ch }).catch(() => {}); await sleep(15); }
    await sleep(500);
    const val = await cdp.eval(`document.querySelector('input[name="NewURL"]').value`);
    console.log('input value after typing:', JSON.stringify(val));
    if ((val||'').length === 0) {
      // insertText 没进——改用原生setter
      await cdp.eval(`(() => {
        const e = document.querySelector('input[name="NewURL"]');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(e, '${domain}');
        e.dispatchEvent(new Event('input', {bubbles: true}));
      })()`);
      console.log('fallback native setter applied');
    }
    // 直接发 Enter 到焦点
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await sleep(5000);
    const receipt = await cdp.eval(`(() => {
      const t = document.body.innerText;
      const i = t.indexOf('We are searching similar sites');
      if (i >= 0) return 'RECEIPT: ' + t.slice(i, i + 90);
      const j = t.indexOf('up to 1 minute');
      if (j >= 0) return 'RECEIPT2: ' + t.slice(Math.max(0, j - 60), j + 20);
      return 'NORECEIPT url=' + window.location.href + ' | ' + t.slice(0, 100);
    })()`);
    console.log(domain, receipt);
  }
} catch (e) { console.log('ERR:', String(e).slice(0, 150)); }
process.exit(0);
