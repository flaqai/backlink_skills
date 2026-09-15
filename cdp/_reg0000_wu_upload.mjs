import { CDP, sleep } from './CDP.mjs';
import { readFileSync } from 'fs';
const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('DOM.enable');
// 找 file input
console.log('FILES:', await c.evalT(`(function(){var lines=[]; document.querySelectorAll('input[type=file]').forEach(function(e,i){ lines.push(i+':'+(e.name||e.id||'noname')+':accept='+(e.accept||'any')); }); return lines.join(' ; ')||'NONE';})()`, 8000));
// DOM.getDocument 找 node 供 setFileInputFiles
const doc = await c.send('DOM.getDocument');

// 直接用 JS 找出 file input 的 backendNodeId 不可行——用 DOM.performSearch
const res = await c.send('DOM.performSearch', { search: 'input[type=file]' });
const nodes = await c.send('DOM.getSearchResults', { searchId: res.searchId, fromIndex: 0, toIndex: res.resultCount });
if (nodes.nodeIds.length) {
  await c.send('DOM.setFileInputFiles', { nodeId: nodes.nodeIds[0], files: ['D:\\Github\\backlink_skills\\cdp\\_reg0000_wu_cover.jpg'] });
  console.log('UPLOADED via setFileInputFiles');
}
await sleep(3000);
// 验证 alt 预览变化
console.log('PREVIEW:', await c.evalT(`(function(){var img=document.querySelector('img[src*=blob], img[src*=writeup], [class*=featured] img'); return img? ('img_here '+(img.src||'').slice(0,50)) : 'no_preview';})()`, 8000));
process.exit(0);
