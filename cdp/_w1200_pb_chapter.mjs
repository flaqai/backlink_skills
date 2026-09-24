// win1200: pressbooks 第2章发文 (捷径: /leoxmnotes/wp-admin/post-new.php?post_type=chapter)
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch(`http://127.0.0.1:9224/json/activate/${t.id}`);
const cdp = new CDP(new WebSocket(t.webSocketDebuggerUrl));
await new Promise((res, rej) => { cdp.ws.addEventListener('open', res); cdp.ws.addEventListener('error', rej); });
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: 'https://pressbooks.pub/leoxmnotes/wp-admin/post-new.php?post_type=chapter' });
await sleep(12000);
const r = await cdp.eval(`(() => JSON.stringify({
  url: location.href.slice(0, 110),
  title: document.title.slice(0, 50),
  loggedIn: !document.getElementById('login_error'),
  hasTitle: !!document.getElementById('title'),
  hasTinymce: !!document.querySelector('.mce-content-body, #wp-content-editor-container, textarea#content'),
  head: document.body.innerText.slice(0, 200)
}))()`);
console.log('CHAPTER EDITOR:', r.slice(0, 400));
console.log('TABID:' + t.id);
