import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post.php?post=54'));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1000);
const js = `(() => {
  const inputs = [...document.querySelectorAll('input')].map(i => i.value).filter(v => /^https:\\/\\/leoxmseo/.test(v));
  const view = [...document.querySelectorAll('a')].map(a => a.href).filter(h => /leoxmseo\\.wordpress\\.com\\/\\d{4}\\//.test(h));
  const live = (document.body.innerText.match(/is now live/) || [])[0];
  return JSON.stringify({ inputs: [...new Set(inputs)].slice(0, 2), view: [...new Set(view)].slice(0, 2), live: !!live });
})()`;
console.log(await c.eval(js));
