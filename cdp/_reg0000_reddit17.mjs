// _reg0000_reddit17.mjs — 清正文杂字+发帖 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const BODY = `Hi everyone. I have spent the last few months teaching myself how the web really works behind the scenes, and I wanted a quiet place to write down what I learn.

Most of my evenings go something like this: I pick one small question — why do some pages show up in search results while better-looking ones never do, what actually happens when a site loads slowly, how do people decide which tools deserve their attention — and I dig into it until I can explain it in plain words. This post is me starting that notebook in public.

A few things I have learned so far that surprised me. First, most websites that fail are not defeated by competitors; they simply never tell anyone they exist. Second, the tools that survive are rarely the flashiest ones — they are the ones that respect a person's time. Third, communities like this one teach more in a week of reading than a month of tutorials, because real people ask the questions that manuals never anticipate.

I plan to share short notes on website building, free tools worth trying, and the occasional failure, because failures are the funny parts. No selling anything here, no links, just observations and questions.

If you have a favourite under-the-radar tool or a rule of thumb that has saved you time, I would genuinely love to hear it. Glad to be here — thanks for reading.`;
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com\/submit|leoxm_c\/submit/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
// 点正文
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:400, y:260});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:400, y:260, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:400, y:260, button:'left', clickCount:1});
await sleep(700);
// Ctrl+A 全选正文编辑器内容
await c.send('Input.dispatchKeyEvent', {type:'keyDown', key:'a', code:'KeyA', windowsVirtualKeyCode:65, modifiers:2});
await c.send('Input.dispatchKeyEvent', {type:'keyUp', key:'a', code:'KeyA', windowsVirtualKeyCode:65, modifiers:2});
await sleep(500);
await c.send('Input.insertText', {text: BODY});
await sleep(2000);
// 点发帖
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:843, y:432});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:843, y:432, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:843, y:432, button:'left', clickCount:1});
await sleep(6000);
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,120), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,250)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('POSTED:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_posted.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
