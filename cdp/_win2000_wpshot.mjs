import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const base = 'http://127.0.0.1:9224';
const tabs = await (await fetch(base + '/json/list')).json();
const tab = tabs.find(t => t.type === 'page' && t.url.includes('wordpress.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const shot = await c.send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:/Github/seoadminC/storage/_win2000_wpeditor.png', Buffer.from(shot.data, 'base64'));
// 也dump按钮列表
const expr = [
  '(function(){',
  'var N=String.fromCharCode(10);',
  'var bs=[...document.querySelectorAll("button")].filter(function(b){return b.offsetParent}).map(function(b){',
  'var r=b.getBoundingClientRect();',
  'return (b.innerText||"").trim().slice(0,30)+"@("+Math.round(r.x+r.width/2)+","+Math.round(r.y+r.height/2)+")";',
  '}).filter(function(s){return s.length>2});',
  'var ifr=[...document.querySelectorAll("iframe")].map(function(f){return f.src.slice(0,80)});',
  'return "URL="+location.href.slice(0,70)+N+"BUTTONS:"+bs.slice(0,20).join(" | ")+N+"IFRAMES:"+ifr.join(" | ");',
  '})()'
].join('');
console.log(await c.evalT(expr, 10000));
process.exit(0);
