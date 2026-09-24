import { CDP, sleep } from './CDP.mjs';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post-new.php'));
if (!tab) { console.log('NO TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1500);
const js = `(() => {
  const out = { frames: [] };
  document.querySelectorAll('iframe').forEach((f, i) => {
    let info = { i, name: String(f.title||f.name||'').slice(0,40), acc: 'no' };
    try {
      const d = f.contentDocument;
      if (d) {
        info.acc = 'yes';
        const t = d.querySelector('.editor-post-title__input, [aria-label="Add title"], h1[contenteditable="true"], textarea[aria-label="Add title"]');
        info.title = t ? t.tagName + '.' + String(t.className||'').slice(0,40) : 'nf';
        const cm = d.querySelector('.cm-content[contenteditable="true"], .block-editor-rich-text__editable[data-rich-text-format-binding], [contenteditable="true"]');
        info.body = cm ? String(cm.className||'').slice(0,60) : 'nf';
        info.bodyCount = d.querySelectorAll('[contenteditable="true"]').length;
      }
    } catch (e) { info.acc = 'err:' + e.message.slice(0,30); }
    out.frames.push(info);
  });
  return JSON.stringify(out, null, 1);
})()`;
console.log(await c.eval(js));
