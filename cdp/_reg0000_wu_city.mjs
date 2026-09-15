import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
// JS 设 city 搜索值 + input 事件触发 AJAX
await c.evalT(`(function(){var set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; var e=document.getElementById('city-search-input'); set.call(e,'Portland'); e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('keyup',{bubbles:true})); return 'typed';})()`);
await sleep(3500);
// dump 城市搜索框附近的可见元素
console.log('NEAR:', await c.evalT(`(function(){var inp=document.getElementById('city-search-input'); var p=inp.closest('div'); var scope=p&&p.parentElement?p.parentElement:document; var lines=[]; scope.querySelectorAll('div,ul,li,a,span,button').forEach(function(e){ if(e.offsetParent===null) return; var t=(e.innerText||'').trim(); if(t && /portland/i.test(t) && t.length<70){ var b=e.getBoundingClientRect(); lines.push([e.tagName, e.className.toString().slice(0,30), t.replace(String.fromCharCode(10),' / ').slice(0,50), Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)].join(':')); } }); return lines.slice(0,5).join(' ; ')||'NO_DROPDOWN';})()`, 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/wu_city2.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
