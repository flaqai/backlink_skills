// _reg0000_nuG.mjs — inube 登录验证 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /inube\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
await Promise.race([c.send('Page.navigate', {url: 'https://www.inube.com/'}), sleep(7000).then(()=>'TO')]);
await sleep(5000);
const st = await Promise.race([c.evalT(`(() => {
  const t = (document.body.innerText||'');
  const logout = /logout|sign out|my inube|my blog/i.test(t);
  const m = t.match(/hi[ ,]+leo|welcome[^\n]{0,30}/i);
  return JSON.stringify({url: location.href.slice(0,70), loggedIn: logout, hint: m ? m[0] : '', body: t.replace(/\s+/g,' ').slice(0,150)});
})()`, 10000), sleep(11000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(7000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_nu_home.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
