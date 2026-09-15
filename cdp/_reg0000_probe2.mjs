// reg0000: 对照诊断——同模板两站+DOM/网络细节
import fs from 'fs';
const OUT = 'D:/Github/backlink_skills/storage/tmp/';
const targets = process.argv.slice(2);
const sleep = ms => new Promise(r => setTimeout(r, ms));

for (const url of targets) {
  const CDP = await fetch('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url), { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(CDP.webSocketDebuggerUrl);
  let mid = 0; const pending = new Map();
  const send = (method, params = {}) => new Promise((res) => { const id = ++mid; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  await new Promise(r => ws.onopen = r);
  await sleep(7000);
  const r = await send('Runtime.evaluate', { expression: `(() => ({
    url: location.href,
    title: document.title,
    htmlLen: document.documentElement ? document.documentElement.outerHTML.length : -1,
    bodyLen: document.body ? document.body.innerText.length : -1,
    htmlHead: document.documentElement ? document.documentElement.outerHTML.slice(0, 300) : '',
    forms: document.forms.length,
    imgsBroken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length,
    imgsTotal: document.images.length
  }))()`, returnByValue: true });
  console.log('===', url, '=>', JSON.stringify(r.result?.value).slice(0, 600));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const nm = url.replace(/[^a-z0-9]/gi, '_');
  fs.writeFileSync(OUT + '_reg0000_probe_' + nm + '.png', Buffer.from(shot.data, 'base64'));
  await send('Target.activateTarget', { targetId: CDP.id });
  ws.close();
  console.log('TAB=' + CDP.id);
}
