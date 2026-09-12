import { CDP, sleep } from './CDP.mjs';
const [DOM] = process.argv.slice(2);
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.find(t => (t.url || '').includes(DOM) && t.type === 'page');
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
for (let i = 0; i < 10; i++) {
  await sleep(2000);
  const st = await cdp.eval(`(() => { const f=document.querySelector('form.dir-submit'); const tas=[...document.querySelectorAll('textarea[name="g-recaptcha-response"]')].map(t=>t.value.length); return JSON.stringify({formGone:!f, url:location.href.slice(0,90), tok:tas}); })()`);
  console.log(i, st);
  const s = JSON.parse(st);
  if (s.formGone || !s.url.includes('submit')) break;
}
ws.close();
