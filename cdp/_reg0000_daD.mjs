// _reg0000_daD.mjs — DA DOB填写+Join (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const insp = await Promise.race([c.evalT(`(() => {
  const sels = [...document.querySelectorAll('select')].filter(s=>s.offsetParent).map(s=>({name:s.name, id:s.id, opts: [...s.options].slice(0,4).map(o=>o.value)}));
  const inputs = [...document.querySelectorAll('input')].filter(i=>i.offsetParent && i.name!=='username').map(i=>({type:i.type,name:i.name,ph:i.placeholder}));
  return JSON.stringify({sels, inputs});
})()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('DOBEls:', typeof insp === 'string' ? insp : 'TO');
ws.close();
