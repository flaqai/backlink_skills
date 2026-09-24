// _reg0000_daL.mjs — 等journal编辑器加载并盘点 (reg0000)
import { CDP, sleep } from './CDP.mjs';
let tab = null;
for (let i = 0; i < 8; i++) {
  const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
  tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
  if (tab) break;
  await sleep(2000);
}
if (!tab) { console.log('NO_DA_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(3000);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,110), title: document.title.slice(0,50), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,250), ed: [...document.querySelectorAll('[contenteditable=true],textarea,input')].filter(e=>e.offsetParent).map(e=>({tag:e.tagName,ce:e.isContentEditable,ph:e.placeholder||'',aid:e.getAttribute('aria-label')||''})).slice(0,8)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_daJ3.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
