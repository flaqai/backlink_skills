// Qiita 养号文 (reg0000兜底③): 复用publish6流程, 内容内联无外链
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const TITLE = "Why I'm Keeping a Public Engineering Notebook";
const BODY = `Lately I've been noticing how much of my working knowledge lives in scattered notes — terminal snippets, debugging stories, small configuration tricks, and half-finished write-ups about problems I solved at 2am and forgot two weeks later. This post is a small public promise: I'm going to keep an engineering notebook here, in the open.

Why public? Three reasons.

First, writing for an unknown reader forces clarity. A private note can say "fix the config thing" and still be useful six months later, because past-me remembers the context. A public note has to explain what the problem was, why the obvious solution failed, and what actually worked. That extra discipline is where the real learning hides.

Second, the search tax is real. Almost every weird problem I hit — a build tool failing in a specific environment, an API returning an undocumented error, a performance cliff with a strange cause — was already solved by someone who wrote it down. Publishing my own notes is a way of paying that debt forward. Even one post that saves a stranger an hour is worth the effort of writing ten.

Third, a public notebook is a portfolio that compounds. Job interviews, project proposals, open-source conversations — all of them get easier when you can point at concrete, written evidence of how you think. Not polished marketing posts, just honest records: what broke, what I tried, what I learned.

My plan for this notebook is simple. Short posts about real problems: infrastructure quirks, tooling discoveries, data work, and the occasional postmortem of my own mistakes. No perfectionism — a rough note published today beats a perfect article that never ships.

If you're reading this and sitting on a folder of private notes, consider this your nudge. Pick one note, clean it up for ten minutes, and publish it. The habit matters more than the topic.

That's the plan. First real notes coming soon.`;

const open = async (url, waitMs = 12000) => {
  const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 15000); });
  const c = new CDP(ws);
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await sleep(waitMs);
  return { t, c };
};
const realClick = async (c, x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await sleep(250);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(100);
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
const key = (c, ch) => c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, code: 'Key' + ch.toUpperCase(), windowsVirtualKeyCode: ch.toUpperCase().charCodeAt(0), text: ch })
  .then(() => c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, code: 'Key' + ch.toUpperCase(), windowsVirtualKeyCode: ch.toUpperCase().charCodeAt(0) }));

const { t, c } = await open('https://qiita.com/drafts/new', 13000);
const titleOk = await c.eval(`(() => { const i=document.querySelector('input[placeholder*="タイトル"], input[placeholder*="Title"]'); if(!i) return ''; i.scrollIntoView({block:'center'}); i.focus(); const r=i.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}); })()`);
if (!titleOk) {
  log('❌ 无标题输入框(未登录或网络) URL:', await c.eval('location.href'));
  log('页面:', (await c.eval('document.body.innerText.slice(0,150)')||'').replace(/\n/g,' | '));
  process.exit(1);
}
let p = JSON.parse(titleOk);
await realClick(c, p.x, p.y);
await sleep(400);
await c.send('Input.insertText', { text: TITLE });
await sleep(800);
log('标题已填');

const bodyOk = await c.eval(`(() => { const e=document.querySelector('div.cm-content[contenteditable]'); if(!e) return ''; e.scrollIntoView({block:'center'}); e.focus(); const r=e.getBoundingClientRect(); return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+Math.min(r.height/2,200))}); })()`);
if (!bodyOk) { log('❌ 无CodeMirror编辑器'); process.exit(1); }
p = JSON.parse(bodyOk);
await realClick(c, p.x, p.y);
await sleep(400);
for (const ch of (BODY.match(/[\s\S]{1,1200}/g) || [])) {
  await c.send('Input.insertText', { text: ch });
  await sleep(400);
}
await sleep(2000);
const bodyChk = await c.eval(`(() => { const e=document.querySelector('div.cm-content'); return e ? e.textContent.length : 0; })()`);
log('正文核验len(应~1550):', bodyChk);

// 标签
await c.eval(`(() => { const i=[...document.querySelectorAll('input')].find(x=>/タグを入力/.test(x.placeholder||'')); if(i){i.scrollIntoView({block:'center'}); i.focus(); return 'focused';} return 'no-input'; })()`);
for (const ch of 'engineering') { await key(c, ch); await sleep(60); }
await sleep(1800);
await c.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
await sleep(1200);

// 发布弹窗
const dlg = await c.eval(`(() => { const d=document.querySelector('dialog'); if(!d) return 'NO-DIALOG'; if(!d.open) d.showModal(); return 'open:' + d.open; })()`);
log('弹窗:', dlg);
await sleep(1500);
const cb = await c.eval(`(() => { const d=document.querySelector('dialog'); if(!d) return 0; const xs=[...d.querySelectorAll('input[type=checkbox]')]; xs.forEach(x=>{ if(!x.checked) x.click(); }); return xs.length; })()`);
log('勾选checkbox数:', cb);
await sleep(600);
const pubRes = await c.eval(`(() => { const b=[...document.querySelectorAll('button')].find(e=>/記事を投稿する/.test((e.textContent||'').replace(/\\s+/g,''))); if(!b) return 'NO-BTN'; b.click(); return 'clicked'; })()`);
log('投稿:', pubRes);
await sleep(12000);

const after = await c.eval(`(() => JSON.stringify({url: location.href, title: document.title}))()`);
log('终态:', after);
const postUrl = JSON.parse(after).url.includes('/items/') ? JSON.parse(after).url.split('?')[0] : '';
log('postUrl:', postUrl || '(无, 看终态)');
if (postUrl) {
  await sleep(4000);
  const v = await open(postUrl, 9000);
  const chk = await v.c.eval(`(() => JSON.stringify({h1: (document.querySelector('h1')||{}).textContent||'', bodyLen: (document.body.innerText||'').length}))()`);
  log('线上核验:', chk);
  try { await fetch('http://127.0.0.1:9224/json/close/' + v.t.id); } catch {}
}
