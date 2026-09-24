// _reg0000_reddit8.mjs — reddit OTP注入+继续 (reg0000, 自带activate+超时保护)
import { CDP, sleep } from './CDP.mjs';
const CODE = '064353';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com\/register/.test(t.url));
if (!tab) { console.log('NO_TAB'); process.exit(1); }
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(1500);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const pre = await Promise.race([c.evalT(`(() => {
  const el = document.querySelector('faceplate-text-input[name=code]');
  return JSON.stringify({url: location.href.slice(0,90), hasCode: !!el, txt: (document.body.innerText||'').replace(/\n+/g,' | ').slice(0,200)});
})()`, 8000), sleep(9000).then(()=>'EVAL_TIMEOUT')]);
console.log('PRE:', pre);
if (pre === 'EVAL_TIMEOUT') { console.log('页面无响应(渲染器挂起), 需重开tab'); process.exit(1); }
// 注入
await c.evalT(`(() => { const el = document.querySelector('faceplate-text-input[name=code]'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); if(inp){ inp.focus(); } return inp?'ok':'fail'; })()`, 6000);
await sleep(400);
await c.send('Input.insertText', {text: CODE});
await sleep(1200);
console.log('CODE_VAL:', await Promise.race([c.evalT(`(() => { const el = document.querySelector('faceplate-text-input[name=code]'); const inp = el && el.shadowRoot && el.shadowRoot.querySelector('input'); return inp ? inp.value : 'noshadow'; })()`, 6000), sleep(7000).then(()=>'TO')]));
// 点继续
const r = await Promise.race([c.evalT(`(() => { const btn = [...document.querySelectorAll('button')].find(b => (b.innerText||'').trim()==='继续' && b.offsetParent !== null); if(!btn) return null; btn.scrollIntoView({block:'center'}); const rc = btn.getBoundingClientRect(); return JSON.stringify({x: Math.round(rc.x+rc.width/2), y: Math.round(rc.y+rc.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
if (!r || r === 'TO' || !r.result && !r) { console.log('NO_BTN or TO:', r); }
let xy;
try { xy = JSON.parse(r); } catch(e) { try { xy = JSON.parse(r.result?.value); } catch(e2) { xy = null; } }
if (xy) {
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:xy.x, y:xy.y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:xy.y?xy.x:xy.x, y:xy.y, button:'left', clickCount:1});
  await sleep(5000);
  console.log('URL2:', await Promise.race([c.evalT('location.href', 8000), sleep(9000).then(()=>'TO')]));
  console.log('BODY2:', await Promise.race([c.evalT(`(document.body.innerText||"").replace(/\n+/g," | ").slice(0,400)`, 8000), sleep(9000).then(()=>'TO')]));
  console.log('FIELDS2:', await Promise.race([c.evalT(`JSON.stringify([...document.querySelectorAll('faceplate-text-input')].map(el => ({name: el.name, vis: el.getBoundingClientRect().width > 0})))`, 8000), sleep(9000).then(()=>'TO')]));
} else { console.log('no xy, abort'); }
ws.close();
