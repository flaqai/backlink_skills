import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 20; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
await sleep(4000);
console.log('URL:', await cdp.evalT(`location.href`, 8000));
// 找tag相关输入与按钮
console.log('TAGDOM:', await cdp.evalT(`JSON.stringify([...document.querySelectorAll('input,button,[role=combobox],[role=listbox]')].map(function(e){return (e.placeholder||e.textContent.trim().slice(0,20))+'|'+e.tagName+':'+(e.type||e.getAttribute('role')||'btn')}).filter(function(s){return /tag/i.test(s)}).slice(0,10))`, 10000));
// 打字触发autosuggest并数网络请求
const probe = await cdp.evalT(`(async () => {
  const inp = [...document.querySelectorAll('input')].find(e=>/tag/i.test(e.placeholder||''));
  if (!inp) return 'NO_TAG_INPUT';
  inp.scrollIntoView({block:'center'}); inp.focus();
  let n = 0;
  const orig = window.fetch; window.fetch = function(...a){ n++; return orig.apply(this, a); };
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
  set.call(inp, 'artificial'); inp.dispatchEvent(new Event('input', {bubbles:true}));
  await new Promise(r=>setTimeout(r,3500));
  window.fetch = orig;
  const dropdown = document.querySelector('[role=listbox],[class*=suggestion],[class*=dropdown],[class*=autocomplete]');
  return 'TYPED fetches:'+n+' dropdown:'+(dropdown?dropdown.textContent.trim().slice(0,120):'none');
})()`, 20000);
console.log('PROBE:', probe);
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
