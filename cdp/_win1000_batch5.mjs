// win1000: 批量渲染候选目录站根页, 提取真实提交入口
import http from 'http';
import fs from 'fs';
function put(url) {
  return new Promise((resolve, reject) => {
    const req = http.request('http://127.0.0.1:9224/json/new?' + encodeURIComponent(url), { method: 'PUT' }, (res) => {
      let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject); req.end();
  });
}
function cdpEval(t, id, expr, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    const timer = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, timeout);
    ws.onopen = () => ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id === id) { clearTimeout(timer); resolve(m.result); ws.close(); } };
    ws.onerror = reject;
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SITES = ['toolb.dev', 'toolsroller.com', 'ailistingtool.com', 'once.tools', 'besttools.pro', 'r-ai.dev', 'appalist.com', 'startups.fm', 'antdirectory.com', 'bestdirectories.org'];
for (const s of SITES) {
  try {
    const t = await put('https://' + s + '/');
    await sleep(7000);
    const ev = await cdpEval(t, 1, `(() => {
      const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => /submit|add[-_]?(url|site|tool|listing)|suggest/i.test(h || '')).slice(0, 5);
      const forms = document.forms.length;
      const fields = [...document.querySelectorAll('input:not([type=hidden]),textarea')].length;
      return JSON.stringify({ links, forms, fields });
    })()`);
    console.log('[' + s + ']', ev.result.value);
    await cdpEval(t, 9, '1', 3000).catch(() => {});
    await new Promise((res) => { const ws2 = new WebSocket(t.webSocketDebuggerUrl); ws2.onopen = () => ws2.send(JSON.stringify({ id: 9, method: 'Target.closeTarget', params: { targetId: t.id } })); setTimeout(res, 500); });
  } catch (e) { console.log('[' + s + '] ERR ' + e.message); }
}
process.exit(0);
