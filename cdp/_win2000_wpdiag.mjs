import { CDP, sleep } from './CDP.mjs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://leoxmseo2.wordpress.com/wp-admin/post-new.php?post_type=post'), { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id).then(r=>r.text());
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await sleep(25000);
console.log('URL:', (await cdp.send('Runtime.evaluate', { expression: 'location.href', returnByValue: true })).result.value);
console.log('TITLE:', (await cdp.send('Runtime.evaluate', { expression: 'document.title', returnByValue: true })).result.value);
const probe = await cdp.eval(`(() => {
  const sels = ['.editor-post-title__input','[aria-label="Add title"]','h1[contenteditable=true]','textarea[aria-label="Add title"]','iframe[name="editor-canvas"]','.is-root-container'];
  return JSON.stringify(sels.map(s => s + '=' + document.querySelectorAll(s).length));
})()`);
console.log('PROBE:', probe);
const fs = await import('fs');
await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 }).then(r => {
  fs.writeFileSync('_win2000_wpdiag.jpg', Buffer.from(r.data, 'base64'));
});
console.log('shot saved');
