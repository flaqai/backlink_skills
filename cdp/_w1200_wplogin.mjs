import { CDP, sleep } from './CDP.mjs';
// win1200: virily wp-login 重登 — node _w1200_wplogin.mjs <domain> <user> <pass>
const [domain, user, pass] = process.argv.slice(2);
const tab = await (await fetch(`http://127.0.0.1:9224/json/new?${encodeURIComponent(`https://${domain}/wp-login.php`)}`, { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(() => {});
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
let ok = false, waited = 0;
for (let i = 0; i < 12; i++) {
  await sleep(2500); waited = (i + 1) * 2.5;
  ok = await cdp.eval(`!!document.querySelector('#user_login') && !!document.querySelector('#user_pass')`).catch(() => false);
  if (ok) break;
}
console.log('FORM after', waited, 's:', ok);
if (!ok) { console.log(JSON.stringify({ status: 'FAIL', err: 'no-form', url: await cdp.eval('location.href.slice(0,90)'), title: await cdp.eval('document.title.slice(0,50)') })); await fetch('http://127.0.0.1:9224/json/close/' + tab.id).catch(() => {}); process.exit(1); }
await cdp.eval(`(() => { document.querySelector('#user_login').focus(); })()`);
await sleep(250);
await cdp.send('Input.insertText', { text: user });
await sleep(200);
await cdp.eval(`(() => { document.querySelector('#user_pass').focus(); })()`);
await sleep(250);
await cdp.send('Input.insertText', { text: pass });
await sleep(300);
console.log('FILLED', await cdp.eval(`JSON.stringify({u: document.querySelector('#user_login').value.length, p: document.querySelector('#user_pass').value.length})`));
const btn = await cdp.eval(`(() => { const b = document.querySelector('#wp-submit'); if (!b) return 'NOBTN'; b.scrollIntoView({block:'center'}); const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)}); })()`);
if (btn === 'NOBTN') { console.log('FAIL no-btn'); process.exit(1); }
const B = JSON.parse(btn);
for (const ty of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
  const p = { type: ty, x: B.x, y: B.y };
  if (ty !== 'mouseMoved') { p.button = 'left'; p.clickCount = 1; }
  await cdp.send('Input.dispatchMouseEvent', p);
  await sleep(100);
}
console.log('CLICKED');
await sleep(9000);
const chk = await cdp.eval(`JSON.stringify({url: location.href.slice(0,110), title: document.title.slice(0,60), adminBar: !!document.querySelector('#wpadminbar'), err: (document.querySelector('#login_error')||{innerText:''}).innerText.slice(0,80)})`);
console.log('CHECK:', chk);
const s = JSON.parse(chk);
if (/wp-admin|logged.?in|dashboard/i.test(s.url + s.title) || s.adminBar) {
  console.log(JSON.stringify({ status: 'OK' }));
  process.exit(0); // tab留着供后续发文
}
console.log(JSON.stringify({ status: 'FAIL' }));
await fetch('http://127.0.0.1:9224/json/close/' + tab.id).catch(() => {});
process.exit(1);
