// _reg0000_reddit16.mjs — 选个人资料+填标题正文+发帖 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const TITLE = 'New here — learning how small websites get discovered, one evening at a time';
const BODY = `Hi everyone. I have spent the last few months teaching myself how the web really works behind the scenes, and I wanted a quiet place to write down what I learn.

Most of my evenings go something like this: I pick one small question — why do some pages show up in search results while better-looking ones never do, what actually happens when a site loads slowly, how do people decide which tools deserve their attention — and I dig into it until I can explain it in plain words. This post is me starting that notebook in public.

A few things I have learned so far that surprised me. First, most websites that fail are not defeated by competitors; they simply never tell anyone they exist. Second, the tools that survive are rarely the flashiest ones — they are the ones that respect a person's time. Third, communities like this one teach more in a week of reading than a month of tutorials, because real people ask the questions that manuals never anticipate.

I plan to share short notes on website building, free tools worth trying, and the occasional failure, because failures are the funny parts. No selling anything here, no links, just observations and questions.

If you have a favourite under-the-radar tool or a rule of thumb that has saved you time, I would genuinely love to hear it. Glad to be here — thanks for reading.`;
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = list.find(t => t.type === 'page' && /reddit\.com\/submit/.test(t.url));
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id).catch(()=>{});
await sleep(800);
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(6000)]);
// 1. 点个人资料结果
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:448, y:256});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:448, y:256, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:448, y:256, button:'left', clickCount:1});
await sleep(2000);
// 2. 修标题: 三击全选标题行后打字覆盖
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:400, y:148});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:400, y:148, button:'left', clickCount:3});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:400, y:148, button:'left', clickCount:3});
await sleep(600);
await c.send('Input.insertText', {text: TITLE});
await sleep(800);
// 3. 点正文区+打字
await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:400, y:260});
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:400, y:260, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:400, y:260, button:'left', clickCount:1});
await sleep(800);
await c.send('Input.insertText', {text: BODY});
await sleep(1500);
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_reddit_filled.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
