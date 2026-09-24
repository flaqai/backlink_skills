// wp2 publish 闭环: 点Publish->等面板->找面板内确认键(文本Publish)->点->验证
import { CDP, sleep } from './CDP.mjs';
const base = 'http://127.0.0.1:9224';
const tabs = await (await fetch(base + '/json/list')).json();
const tab = tabs.find(t => t.type === 'page' && t.url.includes('wordpress.com'));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable');
const clickXY = async (x, y) => {
  await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
// 确保在编辑器页
if (tab.url.indexOf('post.php') < 0) {
  await c.send('Page.navigate', { url: 'https://leoxmseo2.wordpress.com/wp-admin/post.php?post=38&action=edit' });
  await sleep(12000);
}
// 1) 点 Publish
const b1 = await c.evalT('(function(){var b=[...document.querySelectorAll("button")].find(function(x){return x.offsetParent&&(x.innerText||"").trim()==="Publish"});if(!b)return "NO";var r=b.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});})()', 10000);
console.log('publish-btn:', b1);
if (b1 === 'NO' || b1 === 'TIMEOUT') { console.log('FAIL=NO_PUB'); process.exit(1); }
const p = JSON.parse(b1);
await clickXY(p.x, p.y);
await sleep(7000);
// 2) 面板确认键: 文本为Publish或Schedule且在面板容器内
const b2 = await c.evalT('(function(){var cands=[...document.querySelectorAll("button")].filter(function(x){return x.offsetParent&&/^(Publish|Schedule|Save)$/.test((x.innerText||"").trim())});if(!cands.length)return "NO";var out=[];cands.forEach(function(b){var r=b.getBoundingClientRect();out.push({t:(b.innerText||"").trim(),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})});return JSON.stringify(out);})()', 10000);
console.log('panel-btns:', b2);
if (b2 !== 'NO' && b2 !== 'TIMEOUT') {
  const arr = JSON.parse(b2);
  if (arr.length >= 2) {
    await clickXY(arr[arr.length - 1].x, arr[arr.length - 1].y);
    await sleep(15000);
    console.log('confirm clicked:', arr[arr.length - 1].t);
  } else {
    console.log('panel has only 1 button, no confirm step');
  }
}
// 3) 验证: is now live / View link
const fin = await c.evalT('(function(){var m=document.body.innerText.match(/(is now live|subscribers|published)/i);var a=[...document.querySelectorAll("a")].filter(function(x){return x.href.indexOf("leoxmseo2.wordpress.com/2026")>=0}).map(function(x){return x.href});return JSON.stringify({live:m?m[0]:"none", urls:a.slice(0,2)});})()', 12000);
console.log('fin:', fin);
process.exit(0);
