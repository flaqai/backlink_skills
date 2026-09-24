// win1200: blog-ezine CF盾后复查
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]) || list.find(x => /blog-ezine/.test(x.url));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await sleep(8000);
const r = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0, 140),
  title: document.title.slice(0, 60),
  cf: /安全验证|请稍候|Checking your browser|Just a moment/i.test(document.body.innerText.slice(0,300)),
  bodyHead: document.body.innerText.slice(0, 260)
}))()`);
console.log('STATE:', r);
