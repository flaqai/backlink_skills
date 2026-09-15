// _reg0000_daW.mjs — 重开journal+填文+精确Submit (reg0000)
import { CDP, sleep } from './CDP.mjs';
const TITLE = 'Notes from a new writer: why I joined this community';
const BODY = `Hello everyone. I joined DeviantArt this week because I wanted a place where writing and visual art live side by side, and after looking around I can already tell this is the friendliest corner of the internet I have found in a long time.

A little about me: I am a hobby writer. I spend most of my free time reading, taking notes about the websites and tools I use every day, and slowly teaching myself how creative work actually gets seen and appreciated online. Joining communities like this one is part of my plan to get better by watching how other people work.

What surprised me most in my first few days is how much care goes into everything here. The profile pages feel personal. The journals read like real diaries, not marketing. People leave thoughtful comments on works that were posted years ago. That kind of attention is rare, and it is the main reason I wanted to introduce myself instead of lurking silently.

I do not have art to share yet. For now my contributions will be words: short journal entries about what I am learning, the occasional observation about creativity on the internet, and lots of encouraging comments on other people's work. If you are a writer here too, I would love to hear how you balance words and images in your posts.

Thanks for reading, and I am glad to be part of this community. See you in the comments.`;
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(t => t.type === 'page' && /deviantart\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(()=>rej(new Error('ws timeout')), 10000); });
const c = new CDP(ws);
await Promise.race([c.send('Page.enable'), sleep(5000)]);
// 点JOURNAL开编辑器
let r = await Promise.race([c.evalT(`(() => { const els=[...document.querySelectorAll('button')].filter(e=>e.offsetParent && /^journal$/i.test((e.innerText||'').trim())); if(!els.length) return 'nf'; const el=els[els.length-1]; el.scrollIntoView({block:'center'}); const rc=el.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('J:', r);
const p1 = JSON.parse(r);
await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:p1.x, y:p1.y, button:'left', clickCount:1});
await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:p1.x, y:p1.y, button:'left', clickCount:1});
await sleep(3500);
// 填标题
r = await Promise.race([c.evalT(`(() => { const t=document.querySelector('textarea[placeholder*="title" i]'); if(!t) return 'nf'; t.focus(); return 'ok'; })()`, 8000), sleep(9000).then(()=>'TO')]);
await c.send('Input.insertText', {text: TITLE});
await sleep(700);
// 填正文
r = await Promise.race([c.evalT(`(() => { const d=[...document.querySelectorAll('[contenteditable=true]')].filter(e=>e.offsetParent)[0]; if(!d) return 'nf'; d.focus(); return 'ok'; })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('body:', r);
await c.send('Input.insertText', {text: BODY});
await sleep(2000);
// Submit: 用元素中心且先scrollIntoView
r = await Promise.race([c.evalT(`(() => { const els=[...document.querySelectorAll('button')].filter(e=>e.offsetParent && /^submit$/i.test((e.innerText||'').trim()) && !e.disabled); if(!els.length) return 'nf'; const el=els[0]; el.scrollIntoView({block:'center'}); const rc=el.getBoundingClientRect(); return JSON.stringify({x:Math.round(rc.x+rc.width/2), y:Math.round(rc.y+rc.height/2)}); })()`, 8000), sleep(9000).then(()=>'TO')]);
console.log('SUBMIT:', r);
if (r && r.startsWith('{')) {
  const p = JSON.parse(r);
  await c.send('Input.dispatchMouseEvent', {type:'mouseMoved', x:p.x, y:p.y});
  await c.send('Input.dispatchMouseEvent', {type:'mousePressed', x:p.x, y:p.y, button:'left', clickCount:1});
  await c.send('Input.dispatchMouseEvent', {type:'mouseReleased', x:p.x, y:p.y, button:'left', clickCount:1});
  await sleep(6000);
}
const st = await Promise.race([c.evalT(`(() => JSON.stringify({url: location.href.slice(0,110), body: (document.body.innerText||'').replace(/\s+/g,' ').slice(0,300)}))()`, 10000), sleep(11000).then(()=>'TO')]);
console.log('AFTER:', typeof st === 'string' ? st : 'TO');
const shot = await Promise.race([c.send('Page.captureScreenshot', {format:'jpeg', quality:55}), sleep(8000).then(()=>'TO')]);
if (shot && shot !== 'TO') (await import('fs')).writeFileSync('_reg0000_daW.jpg', Buffer.from(shot.data, 'base64'));
ws.close();
