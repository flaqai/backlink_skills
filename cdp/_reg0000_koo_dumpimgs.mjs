// reg0000: blogkoo 重开→弹九宫格→dump img id
import fs from 'fs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const CDP = await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent('https://blogkoo.com/signup'), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(CDP.webSocketDebuggerUrl);
  let mid = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  await new Promise(r => ws.onopen = r);
  await send('Page.enable'); await send('Runtime.enable');
  await sleep(6000);
  await send('Target.activateTarget', { targetId: CDP.id });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 481, y: 437 });
  await sleep(100);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 481, y: 437, button: 'left', clickCount: 1 });
  await sleep(80);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 481, y: 437, button: 'left', clickCount: 1 });
  await sleep(4500);
  const st = await (await send('Runtime.evaluate', { expression: `JSON.stringify([...document.querySelectorAll('#captcha_table img')].map(i => ({ id: i.id, src: (i.src || '').slice(0, 90) })))`, returnByValue: true })).result?.value;
  console.log('IMGS:', st);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('D:/Github/backlink_skills/storage/tmp/_reg0000_koo_grid.png', Buffer.from(shot.data, 'base64'));
  ws.close();
  console.log('KEEP=' + CDP.id);
})();
