// _reg0000_nuH.mjs — inube 登录态验证 indexOf版 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /inube\.com/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(500);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
await Promise.race([c.send('Page.navigate', {url: 'https://www.inube.com/'}), sleep(7000).then(()=>'TO')]);
await sleep(5000);
const st = await Promise.race([c.evalT("(() => { var t = document.body.innerText || ''; var low = t.toLowerCase(); var out = {url: location.href.slice(0,70), loggedIn: (low.indexOf('logout') >= 0 || low.indexOf('my inube') >= 0), bodyLen: t.length, head: t.substring(0, 130)}; return JSON.stringify(out); })()", 10000), sleep(11000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
ws.close();
