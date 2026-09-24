// _reg0000_wp5.mjs — 列表进编辑器+Update (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /edit\.php/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(1000);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
// 找到该帖行链接
const r = await Promise.race([c.evalT(`(() => { var a=[...document.querySelectorAll('a')].find(function(a){return a.offsetParent && a.innerText.indexOf('A Quiet Notebook') >= 0;}); if(!a) return 'nf'; var rc=a.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('ROW:', r);
if (r && r.startsWith('{')) {
  const p = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:p.x, y:p.y, button:'left', clickCount:2});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:p.x, y:p.y, button:'left', clickCount:2});
  await sleep(12000);
}
const st = await Promise.race([c.evalT(`(() => { var cm = document.querySelector('.cm-content[contenteditable=true]'); var len = cm ? cm.innerText.length : 0; var hasP3 = cm ? cm.innerText.indexOf('What will show up here') >= 0 : false; var upd = [...document.querySelectorAll('button')].find(function(b){return b.offsetParent && (/^update$/i.test(b.innerText.trim()))}); return JSON.stringify({url: location.href.slice(0,80), cmLen: len, hasP3: hasP3, btn: upd ? upd.innerText.trim() : 'nf'}); })()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('ED:', typeof st === 'string' ? st : 'TO');
if (st && st.indexOf('"btn":"Update"') >= 0) {
  const j = JSON.parse(st);
  const p2 = await Promise.race([c.evalT(`(() => { var upd=[...document.querySelectorAll('button')].find(function(b){return b.offsetParent && /^update$/i.test(b.innerText.trim())}); upd.scrollIntoView({block:'center'}); var rc=upd.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
  if (p2 && p2.startsWith('{')) {
    const q = JSON.parse(p2);
    await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:q.x, y:q.y, button:'left', clickCount:1});
    await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:q.x, y:q.y, button:'left', clickCount:1});
    await sleep(8000);
    console.log('UPDATED');
  }
}
ws.close();
