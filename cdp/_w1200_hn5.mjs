import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
for (let i = 0; i < 20; i++) { await sleep(2000); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
await sleep(5000);
console.log('BTNS:', await cdp.evalT(`JSON.stringify([...document.querySelectorAll('button,div[role=button],span')].map(e=>e.textContent.trim().slice(0,30)).filter(s=>/tag/i.test(s)).slice(0,8))`, 10000));
const click = await cdp.evalT(`(async () => {
  const el = [...document.querySelectorAll('button,div[role=button],span')].find(e=>/^add tag/i.test(e.textContent.trim()));
  if (!el) return 'NO_ADDTAG';
  el.scrollIntoView({block:'center'});
  const rc = el.getBoundingClientRect();
  return 'FOUND:'+Math.round(rc.x+rc.width/2)+','+Math.round(rc.y+rc.height/2);
})()`, 10000);
console.log('CLICK:', click);
if (String(click).startsWith('FOUND')) {
  const [x, y] = String(click).split(':')[1].split(',').map(Number);
  for (const ty of ['mouseMoved','mousePressed','mouseReleased']) {
    const p = { type: ty, x, y };
    if (ty !== 'mouseMoved') { p.button = 'left'; p.clickCount = 1; }
    await cdp.send('Input.dispatchMouseEvent', p);
    await sleep(120);
  }
  await sleep(2500);
  console.log('AFTER:', await cdp.evalT(`JSON.stringify({inputs:[...document.querySelectorAll('input,textarea')].map(function(i){return (i.placeholder||'noph')+'|'+i.tagName}).slice(0,8), popover:(document.querySelector('[role=dialog],[role=listbox],[class*=popover],[class*=dropdown]')||{}).textContent ? document.querySelector('[role=dialog],[role=listbox],[class*=popover],[class*=dropdown]').textContent.trim().slice(0,150) : 'none'})`, 10000));
  // 打字看网络
  const probe = await cdp.evalT(`(async () => {
    const inp = [...document.querySelectorAll('input,textarea')].find(e=>/tag/i.test(e.placeholder||''));
    if (!inp) return 'NO_INPUT_AFTER_CLICK';
    inp.focus();
    let n = 0; const orig = window.fetch; window.fetch = function(...a){ n++; return orig.apply(this, a); };
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    set.call(inp, 'javascript'); inp.dispatchEvent(new Event('input', {bubbles:true}));
    await new Promise(r=>setTimeout(r,3500));
    window.fetch = orig;
    const opts = document.querySelector('[role=option],[class*=option],[class*=suggestion]');
    return 'TYPED fetches:'+n+' options:'+(opts?opts.textContent.trim().slice(0,100):'none');
  })()`, 20000);
  console.log('PROBE:', probe);
}
await fetch('http://127.0.0.1:9224/json/close/' + t.id);
