// _reg0000_daT.mjs — DA Journal 填文+发布 (reg0000)
import { CDP, sleep } from './CDP.mjs';
const TITLE = 'Notes from a new writer: why I joined this community';
const BODY = `Hello everyone. I joined DeviantArt this week because I wanted a place where writing and visual art live side by side, and after looking around I can already tell this is the friendliest corner of the internet I have found in a long time.

A little about me: I am a hobby writer. I spend most of my free time reading, taking notes about the websites and tools I use every day, and slowly teaching myself how creative work actually gets seen and appreciated online. Joining communities like this one is part of my plan to get better by watching how other people work.

What surprised me most in my first few days is how much care goes into everything here. The profile pages feel personal. The journals read like real diaries, not marketing. People leave thoughtful comments on works that were posted years ago. That kind of attention is rare, and it is the main reason I wanted to introduce myself instead of lurking silently.

I do not have art to share yet. For now my contributions will be words: short journal entries about what I am learning, the occasional observation about creativity on the internet, and lots of encouraging comments on other people's work. If you are a writer here too, I would love to hear how you balance words and images in your posts.

Thanks for reading, and I am glad to be part of this community. See you in the comments.`;
const words = BODY.split(/\s+/).filter(Boolean).length;
console.log('words:', words);
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
// 标题
let r = await Promise.race([c.evalT(`(() => { const t=document.querySelector('textarea[placeholder*="title"]'); if(!t) return 'nf'; t.scrollIntoView({block:'center'}); t.focus(); return 'ok'; })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('title focus:', r);
await c.send('Input.insertText', {text: TITLE});
await sleep(800);
// 正文
r = await Promise.race([c.evalT(`(() => { const d=[...document.querySelectorAll('[contenteditable=true]')].filter(e=>e.offsetParent)[0]; if(!d) return 'nf'; d.scrollIntoView({block:'center'}); d.focus(); return 'ok'; })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('body focus:', r);
await c.send('Input.insertText', {text: BODY});
await sleep(1500);
// 找发布按钮
const b = await Promise.race([c.evalT(`(() => {
  const els=[...document.querySelectorAll('button')].filter(e=>e.offsetParent && /publish|post|submit/i.test(e.innerText) && !/deviation/i.test(e.innerText));
  return JSON.stringify(els.map(e=>{const rc=e.getBoundingClientRect(); return {txt:e.innerText.trim().slice(0,20), x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2), dis:e.disabled};}));
})()`, 9000), sleep(10000).then(()=>'TO')]);
console.log('PUB_BTN:', b);
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_daT.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
