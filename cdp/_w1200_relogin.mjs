import { CDP, sleep } from './CDP.mjs';
const [dom, user, pass] = process.argv.slice(2);
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/sign-in', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 15; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
await sleep(2500);
console.log('URL:', await cdp.evalT(`location.href`, 6000));
const form = await cdp.evalT(`JSON.stringify({inputs:[...document.querySelectorAll('input')].map(function(i){return (i.id||i.name||'noid')+':'+i.type}).slice(0,10), cf:/just a moment|安全验证|attention required/i.test(document.title+document.body.innerText.slice(0,200))})`, 8000);
console.log('FORM:', form);
const fill = await cdp.evalT(`(()=>{const set=(el,v)=>{const p=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;p.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};const ins=[...document.querySelectorAll('input[type=text],input[type=email]')];const pw=document.querySelector('input[type=password]');if(!ins.length||!pw)return 'NOFORM';set(ins[0],${JSON.stringify(user)});set(pw,${JSON.stringify(pass)});return 'FILLED'})()`, 8000);
console.log('FILL:', fill);
if (String(fill) === 'FILLED') {
  const sub = await cdp.evalT(`(()=>{const f=document.querySelector('form');const b=f.querySelector('button[type=submit],input[type=submit]');if(!b)return 'NOBTN';b.scrollIntoView({block:'center'});if(f.requestSubmit){f.requestSubmit(b);return 'reqSubmit'}b.click();return 'click'})()`, 8000);
  console.log('SUBMIT:', sub);
  await sleep(6000);
  console.log('AFTER_URL:', await cdp.evalT(`location.href`, 6000));
  console.log('AFTER_TXT:', await cdp.evalT(`document.body.innerText.slice(0,150)`, 6000));
}
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
