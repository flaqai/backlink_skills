import { CDP, sleep } from './CDP.mjs';
const posts = [
  ['substack', 'https://leoxm.substack.com/p/smog-check-coupons-that-actually', 'smogcheck-nearme'],
  ['wp204', 'https://leoxmseo2.wordpress.com/2026/09/02/generator-fuel-types-compared-propane-natural-gas-gasoline-and-solar/', 'generatorforhouse'],
  ['paperwf', 'https://paper.wf/leoxm/za-bank-hui-lu-yu-duo-bi-chong-zhang-hu-huan-hui-shi-ji-he-shou-xu-fei-de-zhen-s', 'zakaihu'],
  ['hatena', 'https://leoxmnotes.hatenablog.com/entry/2026/09/02/214048', 'qrcodegenerator'],
];
for (const [name, url, anchor] of posts) {
  try {
    const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    await c.send('Page.enable'); await c.send('Runtime.enable');
    await c.goto(url, 25000);
    await sleep(4000);
    const r = await c.eval(`(() => JSON.stringify({ ok: !document.body.innerText.match(/not found|404/i), anchor: document.documentElement.innerHTML.includes('${anchor}'), title: document.title.slice(0,40) }))()`);
    console.log(name, r);
    await fetch('http://127.0.0.1:9224/json/close/' + t.id);
  } catch (e) { console.log(name, 'ERR', e.message.slice(0,50)); }
}
