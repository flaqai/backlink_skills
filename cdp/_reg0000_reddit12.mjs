// _reg0000_reddit12.mjs — reddit 发首篇养号文 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const TITLE = 'New here — learning how small websites get discovered, one evening at a time';
const BODY = `Hi everyone. I have spent the last few months teaching myself how the web really works behind the scenes, and I wanted a quiet place to write down what I learn.

Most of my evenings go something like this: I pick one small question — why do some pages show up in search results while better-looking ones never do, what actually happens when a site loads slowly, how do people decide which tools deserve their attention — and I dig into it until I can explain it in plain words. This post is me starting that notebook in public.

A few things I have learned so far that surprised me. First, most websites that fail are not defeated by competitors; they simply never tell anyone they exist. Second, the tools that survive are rarely the flashiest ones — they are the ones that respect a person's time. Third, communities like this one teach more in a week of reading than a month of tutorials, because real people ask the questions that manuals never anticipate.

I plan to share short notes on website building, free tools worth trying, and the occasional failure, because failures are the funny parts. No selling anything here, no links, just observations and questions.

If you have a favourite under-the-radar tool or a rule of thumb that has saved you time, I would genuinely love to hear it. Glad to be here — thanks for reading.`;
const words = BODY.split(/\s+/).filter(Boolean).length;
console.log('words:', words);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
// 点创建帖子
const r = await Promise.race([c.evalT(`(() => {
  const els=[...document.querySelectorAll('button,a,[role=button],span')].filter(e=>e.offsetParent && /创建帖子/.test((e.innerText||'').trim()));
  const el = els[0]; if(!el) return null; el.scrollIntoView({block:'center'}); const rc=el.getBoundingClientRect();
  return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)});
})()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('CREATE_BTN:', r);
if (!r || r === 'TO') { console.log('no create btn'); process.exit(1); }
const p1 = JSON.parse(r);
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:p1.x, y:p1.y, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:p1.x, y:p1.y, button:'left', clickCount:1});
await sleep(6000);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,100), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,250)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('AFTER_CREATE:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_submit.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
