import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
// win1200: activeboard 第2帖 — 论坛登录→new topic→发布
// 用法: node _w1200_abpost2.mjs <titleFile> <bodyHtmlFile>
const [titleFile, bodyFile] = process.argv.slice(2);
const title = fs.readFileSync(titleFile, 'utf8').trim();
const bodyHtml = fs.readFileSync(bodyFile, 'utf8').trim();
const esc = bodyHtml.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/'/g, "\\'");
const net = [];
const t = await (await fetch('http://127.0.0.1:9224/json/new?https://leoxmforum.activeboard.com/', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const c = new CDP(ws);
try {
  await c.send('Page.enable');
  await c.send('Network.enable');
  c.on((m) => {
    if (m.method === 'Network.requestWillBeSent' && m.params.request.method === 'POST') {
      net.push({ url: m.params.request.url.slice(0, 110), data: (m.params.request.postData || '').slice(0, 150) });
    }
  });
  for (let i = 0; i < 8; i++) { await sleep(2000); if ((await c.eval(`document.readyState`)) === 'complete') break; }
  const probe = await c.eval(`JSON.stringify({
    user: !!document.querySelector('input[name=username]'), pwd: !!document.querySelector('input[name=password]'),
    anyPwd: !!document.querySelector('input[type=password]'),
    names: [...document.querySelectorAll('input')].map(i => i.name || i.id).slice(0, 10)
  })`);
  console.log('LOGIN_FORM', probe);
  const pf = JSON.parse(probe);
  if (!pf.anyPwd) { console.log('ALREADY_LOGGED_IN_OR_NO_FORM', await c.eval(`document.body.innerText.replace(/\\s+/g,' ').slice(0,150)`)); }
  else {
    const uSel = 'input[name=forumUserName]';
    const pSel = 'input[name=forumPassword]';
    await c.eval(`(() => { const u=document.querySelector(${JSON.stringify(uSel)}); u.scrollIntoView({block:'center'}); u.focus(); })()`);
    await c.send('Input.insertText', { text: 'leoxm' });
    await sleep(300);
    await c.eval(`(() => { const p=document.querySelector(${JSON.stringify(pSel)}); p.scrollIntoView({block:'center'}); p.focus(); })()`);
    await c.send('Input.insertText', { text: 'Xx@Active26!Xm' });
    await sleep(300);
    await c.eval(`(() => { const b=[...document.querySelectorAll('input[type=submit],button')].find(x => /login/i.test(x.value || x.innerText || '')); b.scrollIntoView({block:'center'}); b.click(); })()`);
    await sleep(6000);
    console.log('AFTER_LOGIN', await c.eval(`document.body.innerText.replace(/\\s+/g,' ').slice(0,150)`));
  }
  // 直接进 new topic 页(与0910同subForum)
  await c.eval(`location.href='https://leoxmforum.activeboard.com/p/new/?subForumID=668034'`);
  await sleep(7000);
  console.log('TOPIC_PAGE', await c.eval(`location.href.slice(0,100)`), '| subject:', await c.eval(`!!document.querySelector('#threadSubject')`), '| mce:', await c.eval(`typeof tinyMCE != 'undefined' && !!tinyMCE.activeEditor`));
  await c.eval(`document.querySelector('#threadSubject').scrollIntoView({block:'center'}); document.querySelector('#threadSubject').focus();`);
  await c.send('Input.insertText', { text: title });
  await sleep(500);
  console.log('TITLE_LEN', await c.eval(`document.querySelector('#threadSubject').value.length`));
  const how = await c.eval(`(() => {
    if (typeof tinyMCE != 'undefined' && tinyMCE.activeEditor) { tinyMCE.activeEditor.setContent('${esc}'); return 'tinymce-set'; }
    var t = document.querySelector('#textEditor'); if (t) { t.value = '${esc}'; return 'textarea-set'; }
    return 'no-editor';
  })()`);
  console.log('EDITOR', how);
  await c.evalT(`typeof PTMR != 'undefined' && PTMR.w && PTMR.w(); 'ptmr-ok'`, 5000);
  await sleep(800);
  const btn = await c.eval(`(() => { var b = document.querySelector('button[name=submitButton]'); if (!b) return 'no-btn'; b.scrollIntoView({block:'center'}); var r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)}); })()`);
  console.log('BTN', btn);
  if (btn !== 'no-btn') {
    const p = JSON.parse(btn);
    for (const ty of ['mousePressed', 'mouseReleased']) await c.send('Input.dispatchMouseEvent', { type: ty, x: p.x, y: p.y, button: 'left', clickCount: 1 });
  }
  await sleep(8000);
  const after = await c.evalT(`location.href`, 10000);
  console.log('URL-AFTER', after);
  console.log('TEXT-AFTER', String(await c.evalT(`document.body ? document.body.innerText.slice(0, 400) : ''`, 8000)).replace(/\n+/g, ' | ').slice(0, 300));
  console.log('NET', JSON.stringify(net).slice(0, 500));
  console.log('TAB', t.id);
} catch (e) {
  console.log('ERR', e.message);
  process.exit(1);
}
