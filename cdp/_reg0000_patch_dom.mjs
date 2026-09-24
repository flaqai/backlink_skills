import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /patch\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
// 重开模态(页面已回到落地态) — 先看Sign up钮
const r = await c.evalT(`(function(){
  var zip = document.querySelector('input[placeholder=\"Your town or ZIP code\"]');
  var em = document.querySelector('input[placeholder=\"Email address\"]');
  return JSON.stringify({zip: !!zip, em: !!em});
})()`, 5000);
console.log('fields:', r);
// DOM填值(全实例)
const fill = await c.evalT(`(function(){
  var st = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  function set(el, v){ el.focus(); st.call(el, v); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }
  var zips = document.querySelectorAll('input[placeholder=\"Your town or ZIP code\"]');
  var ems = document.querySelectorAll('input[placeholder=\"Email address\"]');
  if (zips[0]) set(zips[0], '10001');
  if (ems[0]) set(ems[0], 'patch@92ng.com');
  return JSON.stringify({zip: zips[0] && zips[0].value, em: ems[0] && ems[0].value});
})()`, 5000);
console.log('filled:', fill);
// 点 Find your community
const btn = await c.evalT(`(function(){ var b=[...document.querySelectorAll('button')].find(function(x){return (x.innerText||'').indexOf('Find your community')>=0 && x.offsetParent;}); if(!b) return 'nobtn'; b.click(); return 'clicked'; })()`, 5000);
console.log('btn:', btn);
await sleep(7000);
console.log('URL:', await c.evalT('location.href', 6000));
console.log('BODY:', await c.evalT("document.body.innerText.split(String.fromCharCode(10)).filter(function(s){return s.trim();}).slice(0,12).join(' | ')", 8000));
const s = await c.send('Page.captureScreenshot', {format:'png'}).catch(()=>null);
if(s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/patch_dom.png', Buffer.from(s.data,'base64'));
console.log('SHOT ok');
