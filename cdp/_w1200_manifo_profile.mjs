// win1200: manifo 补资料入口侦察
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
const links = await cdp.eval(`(() => {
  return JSON.stringify([...document.querySelectorAll('a')].map(a => ({t: a.innerText.trim().slice(0,40), h: a.href})).filter(x => x.t && /account|profil|setting|ustaw|dane|konto|user/i.test(x.t + ' ' + x.h)).slice(0, 15));
})()`);
console.log('LINKS:', links);
