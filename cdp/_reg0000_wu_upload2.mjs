import { CDP, sleep } from './CDP.mjs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('DOM.enable');
const doc = await c.send('DOM.getDocument', { depth: -1 });
const q = await c.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
console.log('n=', q.nodeIds.length);
if (q.nodeIds.length) {
  await c.send('DOM.setFileInputFiles', { nodeId: q.nodeIds[0], files: ['D:\Github\backlink_skills\cdp\_reg0000_wu_cover.jpg'] });
  console.log('FILES_SET');
}
await sleep(4000);
console.log('PREVIEW:', await c.evalT(`(function(){var img=document.querySelector('img[src*=blob\\:], img[src*=writeupcafe], [class*=featured] img, [class*=preview] img'); return img? ('img '+(img.src||'').slice(0,60)) : 'no_preview';})()`, 8000));
console.log('ALT:', await c.evalT(`(function(){var e=document.querySelector('input[name=alt_text]'); return e? e.value.slice(0,40) : '?';})()`, 6000));
process.exit(0);
