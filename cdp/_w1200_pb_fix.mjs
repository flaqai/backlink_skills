// win1200: 23章补正文+勾Show in Web+Save
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => (x.url || '').includes('post.php?post=23'));
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); setTimeout(() => rej(new Error('ws-timeout')), 10000); });
await cdp.send('Page.enable');
const body = fs.readFileSync('D:/Github/backlink_skills/storage/_w1200_pb_body.html', 'utf8');
// 1) 勾选 Show in Web / Show Title / Show in Exports
const chk = await cdp.eval(`(() => {
  const out = [];
  document.querySelectorAll('#submitdiv input[type=checkbox], .postbox input[type=checkbox]').forEach(cb => {
    const lbl = (cb.closest('label,div,span') || {}).innerText || cb.name || '';
    if (/show in web|show title|show in exports/i.test(lbl) && !cb.checked) { cb.click(); out.push(cb.name + '->checked'); }
  });
  return JSON.stringify(out);
})()`);
console.log('CHECKBOXES:', chk);
await sleep(500);
// 2) 正文 setContent (tinymce active)
const bres = await cdp.eval(`(() => {
  const ed = window.tinymce && (tinymce.get('content') || tinymce.activeEditor);
  if (!ed) return 'NO-TINYMCE';
  ed.setContent(${JSON.stringify(body)});
  return 'SET len=' + ed.getContent().length;
})()`);
console.log('BODY:', bres);
await sleep(800);
// 3) Save
const sv = await cdp.eval(`(() => { const b = [...document.querySelectorAll('button,input[type=submit]')].find(x => (x.value||x.innerText||'').trim() === 'Save'); if (!b) return 'NO-SAVE'; const r = b.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2)}); })()`);
const S = JSON.parse(sv);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: S.x, y: S.y });
await sleep(150);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: S.x, y: S.y, button: 'left', clickCount: 1 });
await sleep(100);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: S.x, y: S.y, button: 'left', clickCount: 1 });
console.log('CLICKED SAVE');
await sleep(9000);
const aft = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0,80),
  wordcount: (document.querySelector('.word-count, #wp-word-count .word-count')||{}).innerText || '',
  showWeb: [...document.querySelectorAll('input[type=checkbox]')].filter(c => c.checked).length
}))()`);
console.log('AFTER:', aft);
const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
await fs.promises.writeFile('D:/Github/backlink_skills/storage/_w1200_pb_fix.png', Buffer.from(shot.data, 'base64'));
