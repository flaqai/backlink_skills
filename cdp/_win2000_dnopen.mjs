import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://directorynode.com/submit-directory/'), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id);
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(9000);
console.log('URL:', await c.eval('location.href.slice(0,70)'));
console.log('状态:', await c.eval(`(() => JSON.stringify({
  loggedOut: !!document.querySelector('a[href*="login"], a[href*="sign"]'),
  loginLink: (document.querySelector('a[href*="login"], a[href*="sign-in"], a[href*="signin"]')||{}).href || null,
  accountLink: (document.querySelector('a[href*="account"], a[href*="dashboard"], a[href*="profile"]')||{}).href || null,
  form: !!document.querySelector('form input[name*=title], form input[name*=url]'),
  bodyHead: document.body.innerText.slice(0, 150).replace(/\n/g, ' | ')
}))()`));
