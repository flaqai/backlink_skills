// win1200: blogminds 直连slug找文
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
const tries = [
  'https://leoxm26.blogminds.com/engine-swaps-and-smog-checks-in-california',
  'https://leoxm26.blogminds.com/?s=Engine+Swaps',
  'https://leoxm26.blogminds.com/archive.php'
];
for (const u of tries) {
  await cdp.send('Page.navigate', { url: u });
  await sleep(8000);
  const r = await cdp.eval(`(() => JSON.stringify({
    url: location.href.slice(0, 110),
    title: document.title.slice(0, 70),
    blocked: /Sorry, you have been blocked|404|not found/i.test(document.title + document.body.innerText.slice(0,300)),
    smogLinks: [...document.querySelectorAll('a')].map(a => a.href).filter(h => /smog|engine/i.test(h)).slice(0,4),
    head: document.body.innerText.slice(0, 150)
  }))()`);
  console.log('TRY', u.slice(30), '→', r.slice(0, 500));
}
