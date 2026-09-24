import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://blogger.ba/wp-signup.php', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 12; i++) {
  await sleep(2000);
  const ready = await cdp.evalT(`document.readyState`, 6000);
  if (ready === 'complete') break;
}
console.log('URL:', await cdp.evalT(`location.href`, 6000));
console.log('H1:', await cdp.evalT(`(document.querySelector('h1,h2')||{}).innerText||''`, 6000));
console.log('LOGGEDIN:', await cdp.evalT(`String(!!document.querySelector('#wp-admin-bar-my-account'))`, 6000));
console.log('BODY:', await cdp.evalT(`document.body.innerText.slice(0,500)`, 6000));
console.log('FORMS:', await cdp.evalT(`JSON.stringify([...document.querySelectorAll('form')].map(function(f){return {a:f.action.slice(0,80),ins:[...f.querySelectorAll('input,select')].map(function(i){return i.name+':'+i.type}).slice(0,14)}}))`, 6000));
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
