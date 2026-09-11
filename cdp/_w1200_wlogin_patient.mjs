import { CDP, sleep } from './CDP.mjs';
// win1200: 耐心版wlogin — 35s轮询等CF挑战放行再填表
const domain = process.argv[2], user = process.argv[3], pass = process.argv[4];
const tab = await (await fetch(`http://127.0.0.1:9224/json/new?${encodeURIComponent(`https://${domain}/sign-in`)}`, { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
let fields = '[]';
let waited = 0;
for (let i = 0; i < 14; i++) {
  await sleep(2500);
  waited = (i + 1) * 2.5;
  fields = await cdp.eval(`(() => { const ins = [...document.querySelectorAll('input')].filter(i => ['text','email','password'].includes(i.type) && i.offsetParent); return JSON.stringify(ins.map(i => ({id: i.id, name: i.name, type: i.type}))); })()`).catch(() => '[]');
  if (JSON.parse(fields).length >= 2) break;
}
console.log('FIELDS(after', waited, 's):', fields);
const f = JSON.parse(fields);
if (f.length < 2) { console.log(JSON.stringify({ status: 'FAIL', err: 'no-form-35s', url: await cdp.eval('location.href.slice(0,90)'), title: await cdp.eval('document.title.slice(0,50)') })); await fetch('http://127.0.0.1:9224/json/close/' + tab.id).catch(() => {}); process.exit(1); }
const userInput = f.find(x => x.type !== 'password');
const passInput = f.find(x => x.type === 'password');
const selU = userInput.id ? `#${userInput.id}` : `input[name="${userInput.name}"]`;
const selP = passInput.id ? `#${passInput.id}` : `input[name="${passInput.name}"]`;
await cdp.eval(`document.querySelector(${JSON.stringify(selU)}).focus()`);
await sleep(250);
await cdp.send('Input.insertText', { text: user });
await sleep(200);
await cdp.eval(`document.querySelector(${JSON.stringify(selP)}).focus()`);
await sleep(250);
await cdp.send('Input.insertText', { text: pass });
await sleep(300);
console.log('FILLED:', await cdp.eval(`JSON.stringify({u: document.querySelector(${JSON.stringify(selU)}).value.length, p: document.querySelector(${JSON.stringify(selP)}).value.length})`));
const btn = await cdp.eval(`(() => { const bs = [...document.querySelectorAll('button, input[type=submit]')].filter(b => b.offsetParent && /sign in|log in|submit|登录/i.test(b.innerText || b.value || '')); if (!bs.length) { const b2 = document.querySelector('button[type=submit], input[type=submit]'); if (!b2) return 'NO-BTN'; bs.push(b2); } const b = bs[0]; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2)}); })()`);
if (btn === 'NO-BTN') { console.log('FAIL no-btn'); await fetch('http://127.0.0.1:9224/json/close/' + tab.id).catch(() => {}); process.exit(1); }
const B = JSON.parse(btn);
for (const ty of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
  const p = { type: ty, x: B.x, y: B.y };
  if (ty !== 'mouseMoved') { p.button = 'left'; p.clickCount = 1; }
  await cdp.send('Input.dispatchMouseEvent', p);
  await sleep(100);
}
console.log('CLICKED');
await sleep(8000);
await cdp.send('Page.navigate', { url: `https://${domain}/new-post` });
await sleep(8000);
const chk = await cdp.eval(`JSON.stringify({url: location.href.slice(0,90), nonce: !!document.querySelector('#_wpnonce'), tbox: !!document.querySelector('#title'), title: document.title.slice(0,40)})`);
console.log('CHECK:', chk);
const ok = JSON.parse(chk).nonce || JSON.parse(chk).tbox;
console.log(JSON.stringify({ status: ok ? 'OK' : 'FAIL' }));
if (!ok) await fetch('http://127.0.0.1:9224/json/close/' + tab.id).catch(() => {});
process.exit(ok ? 0 : 1);
