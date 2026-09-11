import { CDP, sleep } from './CDP.mjs';
const dom = process.argv[2];
const bio = process.argv[3];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/my-profile', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 15; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
await sleep(3000);
const before = await cdp.evalT(`document.querySelector('#blogname')?document.querySelector('#blogname').value:'?'`, 5000);
console.log('BLOGNAME_BEFORE:', before);
const set = await cdp.evalT(`(()=>{const p=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;const d=document.querySelector('#about_me');if(!d)return 'NOABOUT';p.call(d,${JSON.stringify(bio)});d.dispatchEvent(new Event('input',{bubbles:true}));return 'SET:'+d.value.length})()`, 8000);
console.log('FILL:', set);
if (String(set).startsWith('SET')) {
  const sub = await cdp.evalT(`(()=>{const f=document.querySelector('#my-profile-settings, form');if(!f)return 'NOFORM';const b=f.querySelector('input[type=submit],button[type=submit],#submit');if(!b)return 'NOBTN';b.scrollIntoView({block:'center'});if(f.requestSubmit){f.requestSubmit(b);return 'reqSubmit'}b.click();return 'click'})()`, 8000);
  console.log('SUBMIT:', sub);
  await sleep(4000);
  console.log('AFTER:', await cdp.evalT(`document.querySelector('#about_me')?document.querySelector('#about_me').value.slice(0,50):document.body.innerText.slice(0,100)`, 6000));
}
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
