import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [DOM] = process.argv.slice(2);
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes(DOM) && t.type === 'page');
if (!tab) { console.log('NOTAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
const st = await cdp.eval(`(() => JSON.stringify({url:location.href.slice(0,100), title:document.title.slice(0,80), hasCf:!!document.querySelector('#challenge-form,[class*=cf-]'), bodyLen:document.body.innerText.length, txt:document.body.innerText.slice(0,150).replace(/\s+/g,' ')}))()`);
console.log('STATE:', st);
const cap = await cdp.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1800_diag_${DOM}.png`, Buffer.from(cap.data, 'base64'));
ws.close();
