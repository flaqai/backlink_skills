// _reg0000_reddit11.mjs — 导航首页+验证登录态 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
await c.send('Page.navigate', {url: 'https://www.reddit.com/user/leoxm_c/'});
await sleep(9000);
// 穿shadow找登录标识
const st = await Promise.race([c.evalT(`(() => {
  const all = [...document.querySelectorAll('*')];
  let loginBtn = null, avatar = false;
  for (const el of all) {
    if (el.tagName === 'AUTH-CLIENT-ID-MENU' || /log ?in|登录/i.test(el.tagName)) {}
    if (el.shadowRoot) {
      const t = el.shadowRoot.textContent || '';
      if (/log in|登录/i.test(t)) loginBtn = (loginBtn||'') + el.tagName.slice(0,30) + ' ';
      const a = el.shadowRoot.querySelector('img[alt*=avatar], faceplate-img, img');
      if (a && /avatar|user/i.test(a.src||a.alt||'')) avatar = true;
    }
  }
  return JSON.stringify({url: location.href.slice(0,90), title: document.title.slice(0,60), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,150), loginBtn: loginBtn || 'none', avatar});
})()`, 12000), sleep(13000).then(()=>'TO')]);
console.log(typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_u.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
