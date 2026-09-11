// _w1200_hn_tagapi.mjs — win1200: tag最后一搏(API监听+键盘选择+StorySettings)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await cdp.send('Network.enable');
await cdp.send('DOM.enable');
const shot = async (name) => {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const fs = await import('fs');
  fs.writeFileSync(`D:/Github/backlink_skills/cdp/_w1200_${name}.jpg`, Buffer.from(data, 'base64'));
  console.log('shot:', name);
};
const responses = [];
cdp.on((m) => {
  if (m.method === 'Network.responseReceived' && /tag/i.test(m.params.response.url)) {
    responses.push({ url: m.params.response.url.slice(0, 120), status: m.params.response.status });
  }
});

try {
  await cdp.send('Page.navigate', { url: 'https://app.hackernoon.com/drafts/6a9d7bb2b31525fcd809251a' });
  await sleep(15000);
  // 聚焦tag输入, 打字触发API
  await cdp.eval(`(() => { const e = [...document.querySelectorAll('input')].find(x => x.placeholder === 'Add Tag...'); if (e) { e.scrollIntoView({ block: 'center' }); e.focus(); } })()`);
  for (const ch of 'technology') {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, windowsVirtualKeyCode: ch.toUpperCase().charCodeAt(0), text: ch, unmodifiedText: ch });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch, windowsVirtualKeyCode: ch.toUpperCase().charCodeAt(0) });
    await sleep(60);
  }
  await sleep(4000);
  console.log('tag-api:', JSON.stringify(responses.slice(0, 8)));
  // 键盘下选+回车(不管下拉可不可见)
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', windowsVirtualKeyCode: 40 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', windowsVirtualKeyCode: 40 });
  await sleep(500);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', windowsVirtualKeyCode: 13 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', windowsVirtualKeyCode: 13 });
  await sleep(3000);
  console.log('tag-after-kbd:', await cdp.eval(`document.body.innerText.includes('empty tag') ? 'STILL-EMPTY' : 'TAGGED'`));

  // Story Settings 找 tag 字段
  const ss = await cdp.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /story settings/i.test(x.innerText));
    if (!b) return 'nosettings';
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
  })()`);
  if (ss !== 'nosettings' && ss !== '"nosettings"') {
    const { x, y } = JSON.parse(ss);
    for (const ty of ['mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type: ty, x, y, button: 'left', clickCount: 1 });
    await sleep(4000);
    const fields = await cdp.eval(`JSON.stringify({
      tagish: [...document.querySelectorAll('input, textarea')].filter(e => e.offsetParent !== null).map(e => e.placeholder || e.name || e.type).slice(0, 15),
      txt: document.body.innerText.replace(/\\s+/g, ' ').slice(0, 400)
    })`);
    console.log('story-settings:', fields);
    await shot('hn_ss');
  } else console.log('no story settings btn');
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
