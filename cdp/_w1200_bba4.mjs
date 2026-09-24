import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://blogger.ba/prijavi-se', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 12; i++) {
  await sleep(2000);
  if (await cdp.evalT(`document.readyState`, 6000) === 'complete') break;
}
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('FORMS:', await cdp.evalT(`JSON.stringify([...document.querySelectorAll('form')].map(function(f){return {a:f.action.slice(0,90),id:f.id,ins:[...f.querySelectorAll('input')].map(function(i){return (i.id||'noid')+'#'+i.name+':'+i.type}).slice(0,16)}}))`, 8000));
console.log('TXT:', await cdp.evalT(`document.body.innerText.slice(0,400)`, 6000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
