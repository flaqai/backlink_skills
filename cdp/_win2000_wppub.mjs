// win2000: 发布既有 draft (post.php?post=N) — Publish 主钮 → 面板内确认钮(精确类名定位)
import { CDP, sleep } from './CDP.mjs';
import { writeFileSync } from 'fs';
const tag = process.argv[2] || '';
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const tab = tabs.filter(t => t.type === 'page').reverse().find(t => t.url.includes('post.php') && (!tag || t.url.includes(tag)));
if (!tab) { console.log('NO POST TAB'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await sleep(1500);

// 幂等: 若确认钮已在面板中直接用; 否则点 toggle 开面板
const pre = await c.eval(`(() => {
  const vis = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0);
  const conf = vis.find(x => /(^|\\s)editor-post-publish-button(\\s|$)/.test(String(x.className)));
  return conf ? 'panel-open' : 'panel-closed';
})()`);
console.log('面板状态:', pre);
if (pre === 'panel-closed') {
  const r1 = await c.eval(`(() => {
    const b = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0).find(b => /^(publish|发布)$/i.test(b.innerText.trim()));
    if (!b) return 'nf';
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  console.log('主钮坐标:', r1);
  if (r1 === 'nf') process.exit(1);
  const { x, y } = JSON.parse(r1);
  await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(5000);
}
// dump 面板内候选钮
const dump = await c.eval(`(() => {
  return JSON.stringify([...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0 && /publish|go live|立即|schedule|live/i.test(b.innerText)).map(b => ({ t: b.innerText.trim().slice(0, 30), cls: String(b.className).slice(0, 90) })));
})()`);
console.log('面板候选:', dump);
// 确认钮: 优先 editor-publish-button 类, 否则面板区域内 Publish
const r2 = await c.eval(`(() => {
  const vis = [...document.querySelectorAll('button')].filter(b => b.getBoundingClientRect().width > 0);
  let b = vis.find(x => /editor-post-publish-button(__button)?$/.test(String(x.className).trim()) || /(^|\s)editor-post-publish-button(\s|$)/.test(String(x.className)));
  if (!b) b = vis.find(x => /go live|立即发布|publish again/i.test(x.innerText));
  if (!b) b = vis.find(x => /^(publish|发布)$/i.test(x.innerText.trim()) && !!x.closest('.editor-publish-panel, .interface-interface-skeleton__sidebar'));
  if (!b) return 'nf';
  const r = b.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), t: b.innerText.trim().slice(0, 30) });
})()`);
console.log('确认钮:', r2);
if (r2 === 'nf') process.exit(1);
const p2 = JSON.parse(r2);
await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p2.x, y: p2.y, button: 'left', clickCount: 1 });
await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p2.x, y: p2.y, button: 'left', clickCount: 1 });
await sleep(9000);
const js = `(() => JSON.stringify({ url: location.href.slice(0, 100), status: (document.body.innerText.match(/Published|Draft|发布成功/g) || []).slice(0, 3), view: [...document.querySelectorAll('a')].map(a => a.href).filter(h => /\\d{4}\\/\\d{2}\\//.test(h)).slice(0, 2) }))()`;
console.log(await c.eval(js));
const shot = await c.send('Page.captureScreenshot', { format: 'jpeg', quality: 60 });
writeFileSync('D:/Github/backlink_skills/cdp/_win2000_wppub_' + (tag || 'x') + '.jpg', Buffer.from(shot.data, 'base64'));
console.log('shot saved');
