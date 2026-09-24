// _win1000_render2.mjs: 渲染两篇疑坏链文章 + 确认DOM锚链(win1000验收②坏链定性)
// 用法: node _win1000_render2.mjs
import http from 'http';
import fs from 'fs';

const PAGES = [
  { tag: 'wp2', url: 'https://leoxmseo2.wordpress.com/2026/09/07/star-station-vs-regular-smog-check-the-real-differences-that-affect-you-2/', needle: 'dinoage' },
];

function put(url) {
  return new Promise((resolve, reject) => {
    const req = http.request('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url), { method: 'PUT' }, (res) => {
      let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject); req.end();
  });
}
function send(wsUrl, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => ws.send(JSON.stringify({ id, method, params }));
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id === id) { resolve(m.result); ws.close(); } };
    ws.onerror = reject;
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const p of PAGES) {
  const t = await put(p.url);
  await send(t.webSocketDebuggerUrl, 1, 'Page.enable');
  await send(t.webSocketDebuggerUrl, 2, 'Runtime.enable');
  await sleep(7000);
  const ev = await send(t.webSocketDebuggerUrl, 3, 'Runtime.evaluate', {
    expression: `(() => {
      const html = document.documentElement.innerHTML;
      const links = [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.includes('${p.needle}'));
      return JSON.stringify({
        title: document.title,
        url: location.href,
        bodyLen: document.body ? document.body.innerText.length : 0,
        needleCount: (html.match(new RegExp('${p.needle}', 'gi')) || []).length,
        needleLinks: links,
        firstText: document.body ? document.body.innerText.slice(0, 200) : '',
      });
    })()`,
    returnByValue: true,
  });
  console.log(`[${p.tag}]`, ev.result.value);
  await send(t.webSocketDebuggerUrl, 4, 'Page.captureScreenshot', { format: 'png' }).then((r) => {
    if (r && r.data) fs.writeFileSync(`D:/Github/backlink_skills/_win1000_${p.tag}_render.png`, Buffer.from(r.data, 'base64'));
  });
  await send(t.webSocketDebuggerUrl, 5, 'Target.closeTarget', { targetId: t.id });
}
