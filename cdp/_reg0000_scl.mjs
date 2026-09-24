import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
// scoop.it: verify login state and find publish entry
let tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && t.url.includes('scoop.it'));
if (tab) { try { await fetch('http://127.0.0.1:9224/json/close/' + tab.id); } catch(e){} await sleep(400); }
tab = await (await fetch('http://127.0.0.1:9224/json/new?https://www.scoop.it/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
const st = await c.evalT(`(function(){ const nav=document.querySelector('#scoopit-nav'); const body=(document.body.innerText||''); const login=body.includes('Sign in'); return JSON.stringify({url:location.href.slice(0,80), signInVisible:login, navTxt:(nav?nav.innerText:'').split('\\n').slice(0,8).join('|'), userLinks:[...document.querySelectorAll('a')].filter(a=>/topic|publish|new|create|dashboard|profile/i.test(a.href)).map(a=>({t:(a.innerText||'').trim().slice(0,20),h:a.href.slice(0,70)})).slice(0,8)}); })()`, 10000);
console.log(st);
const shot = await c.send('Page.captureScreenshot', {format:'png'});
writeFileSync('D:/Github/seoadminC/storage/_reg0000/sc_home.png', Buffer.from(shot.data,'base64'));
process.exit(0);
