import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// win1200: activeboard 论坛第2帖 — 登录+New Topic+TinyMCE+发布
// 用法: node _w1200_abpost.mjs <titleFile> <bodyHtmlFile>
const [titleFile, bodyFile] = process.argv.slice(2);
const title = fs.readFileSync(titleFile, 'utf8').trim();
const bodyHtml = fs.readFileSync(bodyFile, 'utf8').trim();
const net = [];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://leoxmforum.activeboard.com/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
await c.send('Page.enable');
await c.send('Network.enable');
c.on((m) => {
  if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST') {
    net.push({ url: m.params.request.url.slice(0, 110), data: (m.params.request.postData || '').slice(0, 200) });
  }
});
for (let i = 0; i < 8; i++) { await sleep(2000); if ((await c.eval(`document.readyState`)) === 'complete') break; }
// 登录
const hasLogin = await c.eval(`!!document.querySelector('input[name=username], input[name=Username]')`);
if (!hasLogin) { console.log('NO_LOGIN_FORM', await c.eval(`location.href`)); process.exit(2); }
await c.eval(`(() => { const u=document.querySelector('input[name=username], input[name=Username]'); u.scrollIntoView({block:'center'}); u.focus(); })()`);
await c.send('Input.insertText', { text: 'leoxm' });
await sleep(300);
await c.eval(`(() => { const p=document.querySelector('input[name=password], input[name=Password], input[type=password]'); p.scrollIntoView({block:'center'}); p.focus(); })()`);
await c.send('Input.insertText', { text: 'Xx@Active26!Xm' });
await sleep(300);
await c.eval(`(() => { const b=[...document.querySelectorAll('input[type=submit],button')].find(x => /login/i.test(x.value || x.innerText || '')); b.scrollIntoView({block:'center'}); b.click(); })()`);
await sleep(6000);
const logged = await c.eval(`JSON.stringify({u: location.href.slice(0,90), txt: document.body.innerText.replace(/\\s+/g,' ').slice(0,150)})`);
console.log('AFTER_LOGIN', logged);
// 找 New Topic / Post New Topic 入口
const nav = await c.eval(`(() => {
  const link = [...document.querySelectorAll('a,button,input[type=submit]')].find(x => /new topic|post new topic|start.*topic/i.test(x.innerText || x.value || ''));
  if (!link) return 'NO_ENTRY: ' + document.body.innerText.replace(/\\s+/g,' ').slice(0,300);
  link.scrollIntoView({block:'center'}); link.click();
  return 'CLICKED';
})()`);
console.log('ENTRY', nav);
if (nav.startsWith('NO_ENTRY')) { console.log('NET', JSON.stringify(net)); process.exit(3); }
for (let i = 0; i < 8; i++) { await sleep(2000); if ((await c.eval(`document.readyState`)) === 'complete') break; }
console.log('TOPIC_PAGE', await c.eval(`location.href.slice(0,100)`));
// 标题
await c.eval(`(() => { const e=document.querySelector('input[name=subject], input[name=title], input[id*=subject i], input[name=TopicSubject]'); if(e){e.scrollIntoView({block:'center'}); e.focus();} })()`);
await c.send('Input.insertText', { text: title });
await sleep(400);
console.log('TITLE_LEN', await c.eval(`JSON.stringify([...document.querySelectorAll('input')].map(i=>i.value.length).filter(v=>v>10))`));
// TinyMCE iframe 或 textarea
const filled = await c.eval(`(() => {
  const ed = document.querySelector('iframe[id*=iframe i], iframe[class*=mce]');
  if (ed) { ed.scrollIntoView({block:'center'}); return 'TINYMCE:' + (ed.id || ed.name); }
  const ta = document.querySelector('textarea[name*=message i], textarea[name*=body i], textarea');
  if (ta) { ta.scrollIntoView({block:'center'}); ta.focus(); return 'TEXTAREA:' + (ta.name || 'x'); }
  return 'NONE';
})()`);
console.log('EDITOR', filled);
if (filled.startsWith('TINYMCE')) {
  const frame = filled.split(':')[1];
  // 进iframe填: 用eval在iframe上下文
  await sleep(500);
  const tree = await c.send('DOM.getTree', { depth: 3 });
  const target = tree.root.children.flatMap(function walk(n) {
    const kids = (n.children || []).flatMap(walk);
    return (n.frameId ? [n] : []).concat(kids);
  });
  console.log('FRAMES', JSON.stringify(tree.root.children.map(x => x.frameId)).slice(0, 200));
}
console.log('NET', JSON.stringify(net).slice(0, 400));
console.log('STAGE1_DONE tab=' + t.id);
