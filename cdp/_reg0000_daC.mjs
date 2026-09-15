// _reg0000_daC.mjs — deviantart username步+提交 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
const r = await Promise.race([c.evalT(`(() => { const i=document.querySelector('input[name=username]'); if(!i) return 'nf'; i.scrollIntoView({block:'center'}); i.focus(); return 'ok'; })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('focus:', r);
await c.send('Input.insertText', {text: 'leoxm26'});
await sleep(1200);
// 找提交按钮(Join/Continue)
const b = await Promise.race([c.evalT(`(() => { const btns=[...document.querySelectorAll('button')].filter(b=>b.offsetParent && /join|continue|创建|继续/i.test(b.innerText) && !/google|apple|face/i.test(b.innerText)); if(!btns.length) return 'nf'; const rc=btns[btns.length-1].getBoundingClientRect(); return JSON.stringify({txt: btns[btns.length-1].innerText.trim().slice(0,20), x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('BTN:', b);
if (b && b.startsWith('{')) {
  const {x,y} = JSON.parse(b);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x, y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x, y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x, y, button:'left', clickCount:1});
  await sleep(5000);
}
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,90), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,300), visInputs: [...document.querySelectorAll('input')].filter(e=>e.offsetParent).map(e=>({type:e.type,name:e.name})).slice(0,8), iframes: [...document.querySelectorAll('iframe')].map(f=>f.src.slice(0,60)).slice(0,4)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('AFTER:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_da3.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
