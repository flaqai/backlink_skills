import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';

// reg0000e: dreamwidth 养号文发布 (/update)
const BODY_HTML = `<p>I have been meaning to slow down online for a while now, and last week I finally made an account here. Most of my internet time lately has been scrolling feeds that never end, and I wanted something that feels more like keeping a notebook than shouting into a crowd. A friend mentioned this place years ago and I am glad I finally listened.</p>
<p>A little about me: I fix bicycles at a small shop, I read mostly old science fiction, and I cook the same five dinners on rotation. My plan for this journal is simple. I want to write about the small repairs I do at work, the books I find at the secondhand stall near the station, and whatever else sticks in my head during the week. Nothing polished, just notes I would be happy to reread in a year.</p>
<p>What surprised me most is how quiet it feels here. There is no feed pushing headlines at me, no counter telling me how many people saw a post. I write when I want, I read a few journals I have discovered while wandering, and then I close the laptop. It reminds me of the forums I loved as a teenager, where a conversation could last a whole month.</p>
<p>If you are passing through, hello. I am mostly here to keep a record of ordinary days, and maybe to learn a few recipes along the way. This corner of the internet seems built for exactly that.</p>`;
const TITLE = 'Finding My Corner on Dreamwidth';

const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())]
  .find(t => t.type === 'page' && /dreamwidth\.org/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const ev = (t, p) => c.send('Input.dispatchMouseEvent', { type: t, ...p });
await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
await sleep(400);

// 回 /update
await c.send('Page.navigate', { url: 'https://www.dreamwidth.org/update' });
await sleep(5000);
console.log('URL:', await c.evalT('location.href', 8000));

// subject
await ev('mouseMoved', { x: 503, y: 362 }); await sleep(150);
await ev('mousePressed', { x: 503, y: 362, button: 'left', clickCount: 1 }); await sleep(90);
await ev('mouseReleased', { x: 503, y: 362, button: 'left', clickCount: 1 }); await sleep(300);
await c.send('Input.insertText', { text: TITLE }); await sleep(400);

// event textarea
await ev('mouseMoved', { x: 602, y: 573 }); await sleep(150);
await ev('mousePressed', { x: 602, y: 573, button: 'left', clickCount: 1 }); await sleep(90);
await ev('mouseReleased', { x: 602, y: 573, button: 'left', clickCount: 1 }); await sleep(300);
await c.send('Input.insertText', { text: BODY_HTML }); await sleep(600);

// tags
await ev('mouseMoved', { x: 598, y: 773 }); await sleep(150);
await ev('mousePressed', { x: 598, y: 773, button: 'left', clickCount: 1 }); await sleep(90);
await ev('mouseReleased', { x: 598, y: 773, button: 'left', clickCount: 1 }); await sleep(300);
await c.send('Input.insertText', { text: 'introductions, everyday life' }); await sleep(400);

// security select -> public (JS 原生)
await c.evalT(`(function(){var s=document.querySelector('select[name=security]'); if(s){ for(var i=0;i<s.options.length;i++){ if(/public/i.test(s.options[i].text)){ s.selectedIndex=i; s.dispatchEvent(new Event('change',{bubbles:true})); break; } } } return s? s.options[s.selectedIndex].text : 'NO_SECURITY';})()`);
await sleep(300);

// 校验值
console.log('VALS:', await c.evalT(`(function(){var s=document.querySelector('input[name=subject]'); var t=document.querySelector('textarea[name=event]'); var tg=document.querySelector('input[name=prop_taglist]'); var sec=document.querySelector('select[name=security]'); return ['subject='+(s?s.value.length:0)+'ch', 'event='+(t?t.value.length:0)+'ch', 'tags='+(tg?tg.value:''), 'sec='+(sec&&sec.options[sec.selectedIndex]?sec.options[sec.selectedIndex].text:'?')].join(' | ');})()`, 8000));

// Post 按钮 (action:update 在 security select 旁 @721,1047 附近; 重新定位)
const post = await c.evalT(`(function(){var bs=[...document.querySelectorAll('input[name="action:update"]')]; var b=bs[bs.length-1]||bs[0]; if(!b) return 'NO_BTN'; b.scrollIntoView({block:'center'}); var r=b.getBoundingClientRect(); return [Math.round(r.x+r.width/2), Math.round(r.y+r.height/2), b.value].join('|');})()`, 8000);
console.log('POSTBTN:', post);
const [px, py] = post.split('|').map(Number);
await ev('mouseMoved', { x: px, y: py }); await sleep(150);
await ev('mousePressed', { x: px, y: py, button: 'left', clickCount: 1 }); await sleep(90);
await ev('mouseReleased', { x: px, y: py, button: 'left', clickCount: 1 });
await sleep(6000);

console.log('FINAL URL:', await c.evalT('location.href', 8000));
const s = await c.send('Page.captureScreenshot', { format: 'png' }).catch(() => null);
if (s) writeFileSync('D:/Github/seoadminC/storage/_reg0000/dw_posted.png', Buffer.from(s.data, 'base64'));
console.log('SHOT ok');
process.exit(0);
