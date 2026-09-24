// win1200: blogminds 公共侧找 #188 文章
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://leoxm26.blogminds.com/' });
await sleep(11000);
const r = await cdp.eval(`(() => {
  const links = [...document.querySelectorAll('a')].map(a => ({t: a.innerText.trim().slice(0,60), h: a.href})).filter(x => /smog|engine|california/i.test(x.t)).slice(0,6);
  return JSON.stringify({
    url: location.href.slice(0, 100),
    title: document.title.slice(0, 50),
    cfBlocked: /Sorry, you have been blocked/i.test(document.body.innerText),
    postLinks: links,
    head: document.body.innerText.slice(0, 200)
  });
})()`);
console.log('PUB:', r.slice(0, 800));
