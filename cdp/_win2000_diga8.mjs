import { CDP, sleep } from './CDP.mjs';
const code = process.argv[2] || 'uFDAE';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes('digabusiness') && t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
// 填CAPTCHA
const f = await cdp.eval(`(() => { const e = document.querySelector('input[name="CAPTCHA"]'); if (!e) return 'NO'; e.scrollIntoView({block:'center'}); e.focus(); return 'OK'; })()`);
if (f !== 'OK') { console.log(f); process.exit(1); }
for (const ch of code) { await cdp.send('Input.insertText', { text: ch }).catch(() => {}); await sleep(15); }
const v = await cdp.eval(`document.querySelector('input[name="CAPTCHA"]').value`);
console.log('code filled:', JSON.stringify(v));
// 点Continue(红色提交钮, 排除导航)
const btn = await cdp.eval(`(() => {
  const bs = [...document.querySelectorAll('#submitForm input[type="submit"], form[action*="submit"] input[type="submit"]')];
  const b = bs.find(x => /continue/i.test(x.value)) || bs[bs.length-1];
  if (!b) return 'NOBTN';
  b.scrollIntoView({block:'center'});
  const r = b.getBoundingClientRect();
  return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), val: b.value});
})()`);
console.log('btn:', btn);
if (btn !== 'NOBTN') {
  const {x, y} = JSON.parse(btn);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(5000);
  const page = await cdp.evalT(`document.body.innerText.replace(/\s+/g,' ').slice(0, 300)`, 8000);
  console.log('AFTER:', page);
}
process.exit(0);
