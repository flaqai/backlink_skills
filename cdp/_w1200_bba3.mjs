import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://blogger.ba/prijavi-se/', { method: 'PUT' })).json();
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
const fill = await cdp.evalT(`(()=>{const set=(el,v)=>{const p=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;p.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};const u=document.querySelector('#user_login');const p=document.querySelector('#user_pass');if(!u||!p)return 'NO_FORM';set(u,'bloggerba@92ng.com');set(p,'Xx@Bba26!Xm');return 'FILLED:'+u.value.length+':'+p.value.length})()`, 8000);
console.log('FILL:', fill);
if (String(fill).startsWith('FILLED')) {
  const r = await cdp.evalT(`(()=>{const f=document.querySelector('#loginform');const b=document.querySelector('#wp-submit');b.scrollIntoView({block:'center'});if(f.requestSubmit){f.requestSubmit(b);return 'reqSubmit'}b.click();return 'click'})()`, 8000);
  console.log('SUBMIT:', r);
  await sleep(7000);
  console.log('AFTER_URL:', await cdp.evalT(`location.href`, 8000));
  console.log('LOGGEDIN:', await cdp.evalT(`String(!!document.querySelector('#wp-admin-bar-my-account'))`, 6000));
  console.log('TXT:', await cdp.evalT(`document.body.innerText.slice(0,300)`, 6000));
}
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
