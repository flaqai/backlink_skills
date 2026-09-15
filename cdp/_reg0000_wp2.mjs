// _reg0000_wp2.mjs — post36状态+补发布 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /post\.php\?post=36/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(1000);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
const st = await Promise.race([c.evalT(`(() => {
  const t = document.querySelector('.editor-post-title__input, textarea[aria-label="Add title"]');
  const status = (document.querySelector('.editor-post-status, [class*=post-schedule] , .components-panel__row')||{}).innerText || '';
  const pubBtn = [...document.querySelectorAll('button')].find(b=>/publish/i.test(b.innerText) && b.offsetParent);
  const sw = document.querySelector('.editor-switch-to-classic, [class*=switch]');
  return JSON.stringify({title: t ? t.value||t.innerText : 'nf', statusTxt: status.replace(/\s+/g,' ').slice(0,120), pubBtn: pubBtn ? pubBtn.innerText.trim().slice(0,20) : 'nf', body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,150)});
})()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('ST:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(7000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_wp2.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
