// win1200: pressbooks 章节发布 (title insertText + tinymce setContent)
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = list.find(x => x.id === process.argv[2]);
const cdp = new CDP(new WebSocket(tab.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
const body = fs.readFileSync('D:/Github/backlink_skills/storage/_w1200_pb_body.html', 'utf8');
// 标题
await cdp.eval(`document.getElementById('title').focus()`);
await sleep(300);
await cdp.send('Input.insertText', { text: 'How Long Does a Smog Check Take: The Real Time Budget' });
await sleep(500);
const tchk = await cdp.eval(`document.getElementById('title').value`);
console.log('TITLE:', tchk.slice(0, 60));
// 正文 TinyMCE
const bres = await cdp.eval(`(() => {
  const ed = window.tinymce && tinymce.activeEditor;
  if (!ed) return 'NO-TINYMCE';
  ed.setContent(${JSON.stringify(body)});
  return 'SET len=' + ed.getContent().length;
})()`);
console.log('BODY:', bres);
await sleep(800);
// 发布按钮 (WP classic: #publish)
const pub = await cdp.eval(`(() => { const p = document.getElementById('publish'); if (!p) return 'NO-PUB'; const r = p.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), v: p.value}); })()`);
console.log('PUBLISH BTN:', pub);
const P = JSON.parse(pub);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: P.x, y: P.y });
await sleep(150);
await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: P.x, y: P.y, button: 'left', clickCount: 1 });
await sleep(100);
await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: P.x, y: P.y, button: 'left', clickCount: 1 });
console.log('CLICKED PUBLISH');
await sleep(12000);
const aft = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0, 120),
  msg: (document.querySelector('#message') || {}).innerText?.slice(0, 150) || 'no-msg',
  permalink: (document.querySelector('#sample-permalink a') || {}).href || '',
  titleVal: document.getElementById('title')?.value?.slice(0, 40) || ''
}))()`);
console.log('AFTER:', aft);
