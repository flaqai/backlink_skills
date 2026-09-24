import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && t.url.includes('leoxmseo2.wordpress.com/wp-admin/post-new.php'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws超时')), 8000); });
const cdp = new CDP(ws);
await cdp.send('Runtime.enable');
const s1 = await cdp.eval(`JSON.stringify({
  apiNonce: window.wpApiSettings && window.wpApiSettings.nonce,
  hasApi: !!window.wpApiSettings,
  inputNonce: (document.querySelector('input[name=_wpnonce]')||{}).value || null,
  restRoot: window.wpApiSettings && window.wpApiSettings.root
})`);
console.log('STEP1:', s1);
