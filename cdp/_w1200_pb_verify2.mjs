// win1200: 简化版 23章公开页验证
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => (x.url || '').includes('post.php?post=23'));
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); setTimeout(() => rej(new Error('ws-timeout')), 10000); });
await cdp.send('Page.enable');
const pl = await cdp.eval("(() => { var a = document.querySelector('#sample-permalink a'); if (a) return a.href; var all = document.querySelectorAll('a'); for (var i=0;i<all.length;i++){ if (all[i].href && all[i].href.indexOf('/chapter/') >= 0 && all[i].href.indexOf('how-long') >= 0) return all[i].href; } return 'NO-PERMALINK'; })()");
console.log('PERMALINK:', pl);
if (pl !== 'NO-PERMALINK') {
  await cdp.send('Page.navigate', { url: pl });
  await sleep(11000);
  const v = await cdp.eval("(() => { var an = document.querySelector('a[href*=\"smogcheck-nearme.com\"]'); return JSON.stringify({url: location.href.slice(0,90), title: document.title.slice(0,55), anchorOk: !!an, anchorHtml: an ? an.outerHTML.slice(0,130) : '', textProbe: document.body.innerText.toLowerCase().indexOf('smog check') >= 0}); })()");
  console.log('PUBLIC VERIFY:', v.slice(0, 420));
}
