// win1200: 把chapter post=23 翻Published
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://pressbooks.pub/leoxmnotes/wp-admin/post.php?post=23&action=edit'), { method: 'PUT' })).json();
await fetch(`http://127.0.0.1:9224/json/activate/${t.id}`);
const cdp = new CDP(new WebSocket(t.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', () => rej(new Error('ws-err'))); setTimeout(() => rej(new Error('ws-timeout')), 10000); });
await cdp.send('Page.enable');
await sleep(10000);
// 看状态区
const st = await cdp.eval(`(() => JSON.stringify({
  statusDisplay: (document.getElementById('post-status-display')||{}).innerText || '',
  hasStatusEdit: !!document.querySelector('#post-status-select .edit-post-status, a.edit-post-status'),
  submitBoxes: [...document.querySelectorAll('#submitpost .inside')].length,
  visRadio: [...document.querySelectorAll('input[name=visibility], input[name=post_status]')].map(i => ({v: i.value, c: i.checked})),
  publishBtn: (document.getElementById('publish')||{}).value || ''
}))()`);
console.log('STATUS AREA:', st.slice(0, 500));
