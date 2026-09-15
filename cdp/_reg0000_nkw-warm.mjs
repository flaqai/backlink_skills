// reg0000: nekoweb 第2篇养号文 (页内fetch全流程: 登录→create→edit→验证)
import { CDP, sleep } from './CDP.mjs';
const TITLE = "On the Habit of Writing Things Down";
const SLUG = "on-the-habit-of-writing-things-down";
const HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>On the Habit of Writing Things Down</title>
<link rel="stylesheet" href="/elements.css"></head>
<body>
<main>
<h1>On the Habit of Writing Things Down</h1>
<p>Most of what I know about my own work lives in a dozen places: browser tabs I keep meaning to close, notes apps I forget to open, and a folder of text files with names like "fix2-final-actually.txt". Last month I started consolidating all of it into a small public site, and the experiment has changed how I think more than I expected.</p>
<p>Writing for a public page — even one with no readers yet — demands a different kind of honesty. A private note can get away with a fragment. A published page has to answer the obvious questions: what was the problem, why did the first fix fail, and what would I tell someone else standing in the same spot? Answering those questions in writing is where half-finished understanding turns into real understanding.</p>
<p>There is also a quieter benefit. Notes decay, but published pages accumulate. A year from now this site will be a record of what I cared about, what confused me, and how I worked through it. No algorithm will have sorted it for me, and no platform will have buried it. It will just be there, in plain HTML, readable by anything.</p>
<p>My rule for the habit is deliberately small: one page whenever something genuinely surprises me. Not a schedule, not a quota. Surprise is the signal that my mental model was wrong, and those are exactly the moments worth capturing while the details are fresh.</p>
<p>If you have been meaning to start writing, consider this permission to lower the bar. Pick the last thing that confused you. Write down how you unsnarled it. Publish it somewhere small and quiet. The first page is the hardest; after that, the habit runs on its own momentum.</p>
<p>This page is part of that experiment. More notes will land here as they happen — unpolished, but written down.</p>
</main>
</body>
</html>`;

const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let page = list.find(t => t.type === 'page' && /nekoweb\.org/.test(t.url));
if (!page) {
  const t = await (await fetch('http://127.0.0.1:9224/json/new?https://nekoweb.org/', { method: 'PUT' })).json();
  await sleep(8000);
  page = t;
} else {
  await fetch('http://127.0.0.1:9224/json/activate/' + page.id).catch(() => {});
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; setTimeout(rej, 10000); });
const c = new CDP(ws);
await c.send('Page.enable');
console.log('URL0:', await c.eval('location.href'));

// 1) 登录(页内fetch)
const login = await c.eval(`(async () => {
  const r = await fetch('/auth/login', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: 'username=leoxm&password=' + encodeURIComponent('Xx@Nekoweb26!Xm') });
  return 'status=' + r.status;
})()`);
console.log('LOGIN:', login);
await sleep(1500);
const homeChk = await c.eval(`(async () => { const t = await (await fetch('/', {credentials:'same-origin'})).text(); return t.includes('chatinput') || t.includes('logout') ? 'LOGGED_IN' : t.slice(0,80); })()`);
console.log('HOME_CHK:', homeChk);

// 2) create 文件
const create = await c.eval(`(async () => {
  const fd = new URLSearchParams(); fd.append('pathname', '/leoxm.nekoweb.org/${SLUG}.html'); fd.append('isFolder', 'false');
  const r = await fetch('/api/files/create', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: fd });
  return 'create status=' + r.status + ' body=' + (await r.text()).slice(0,80);
})()`);
console.log('CREATE:', create);

// 3) edit 写内容 (multipart, content纯字符串字段)
const edit = await c.eval(`(async () => {
  const fd = new FormData(); fd.append('pathname', '/leoxm.nekoweb.org/${SLUG}.html'); fd.append('content', ${JSON.stringify(HTML)});
  const r = await fetch('/api/files/edit', { method: 'POST', credentials: 'same-origin', body: fd });
  return 'edit status=' + r.status + ' body=' + (await r.text()).slice(0,80);
})()`);
console.log('EDIT:', edit);

// 4) 公网验证
await sleep(3000);
const verify = await c.eval(`(async () => { const r = await fetch('https://leoxm.nekoweb.org/${SLUG}.html', {credentials:'omit'}); const t = await r.text(); return 'status=' + r.status + ' title_ok=' + t.includes('On the Habit of Writing Things Down') + ' sitejs=' + t.includes('nekoweb'); })()`);
console.log('VERIFY:', verify);
