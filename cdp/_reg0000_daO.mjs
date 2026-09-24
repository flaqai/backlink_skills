// _reg0000_daO.mjs — 绕路: 个人页→Submit菜单→Journal (reg0000)
import { CDP, sleep } from './CDP.mjs';
// 关掉挂死的journal tab
const list0 = await (await fetch('http://127.0.0.1:9224/json/list')).json();
for (const t of list0.filter(t => t.type === 'page' && /deviantart\.com\/journal\/post/.test(t.url))) {
  await fetch('http://127.0.0.1:9224/json/close/' + t.id).catch(()=>{});
}
let tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.deviantart.com/leoxm26', {method:'PUT'})).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(12000);
const list2 = await (await fetch('http://127.0.0.1:9224/json/list')).json();
tab = list2.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,90), title: document.title.slice(0,40), ok: !!document.body && document.body.innerText.length > 50}))()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('PROFILE:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_daO.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
