// _reg0000_reddit9.mjs — 点击后状态诊断: URL/错误提示/截图 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(1200);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({
  url: location.href.slice(0,110),
  fields: [...document.querySelectorAll('faceplate-text-input')].map(el=>({name:el.name, vis:el.getBoundingClientRect().width>0})),
  err: (document.querySelector('[role=alert],.error,[class*=error]')||{}).innerText || '',
  body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,260)
}))()`, 9000), sleep(10000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_diag.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
