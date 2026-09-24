// win1200: 9224渲染验证23章公开页+锚链
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => (x.url || '').includes('post.php?post=23'));
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); setTimeout(() => rej(new Error('ws-timeout')), 10000); });
await cdp.send('Page.enable');
// 取真实permalink
const pl = await cdp.eval(`(() => {
  const a = document.querySelector('#sample-permalink a') || [...document.querySelectorAll('a')].find(x => /chapter\//.test(x.href) && /how-long/.test(x.href));
  return a ? a.href : 'NO-PERMALINK';
})()`);
console.log('PERMALINK:', pl);
await cdp.send('Page.navigate', { url: pl });
await sleep(10000);
const v = await cdp.eval(`(() => {
  const html = document.documentElement.outerHTML;
  const anchor = document.querySelector('a[href*="smogcheck-nearme.com"]');
  return JSON.stringify({
    url: location.href.slice(0, 90),
    title: document.title.slice(0, 60),
    anchorOk: !!anchor,
    anchorHtml: anchor ? anchor.outerHTML.slice(0, 120) : '',
    wordProbe: /smog check/i.test(document.body.innerText)
  });
})()`);
console.log('PUBLIC VERIFY:', v.slice(0, 400));
