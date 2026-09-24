import http from 'http';
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
const SITES = ['https://startups.fm/submit', 'https://once.tools/submit', 'https://besttools.pro/submit', 'https://antdirectory.com/submit'];
for (const u of SITES) {
  try {
    const t = await put(u);
    await sleep(7000);
    const ev = await cdpEval(t, 1, `(() => JSON.stringify({
      title: document.title.slice(0, 60),
      forms: document.forms.length,
      fields: [...document.querySelectorAll('input,textarea,select')].map(e => e.tagName + ':' + (e.name || e.id || '(none)') + ':' + (e.type || '') + (e.required ? '*' : '')).slice(0, 22),
      paid: /\$[0-9]|premium|payment/i.test(document.body.innerText.slice(0, 4000)),
      loginwall: /sign in to|log in to continue/i.test(document.body.innerText.slice(0, 2000)),
      head: document.body.innerText.slice(0, 180),
    }))()`);
    console.log('[' + u + ']', String(ev.result.value).replace(/\n/g, ' | ').slice(0, 700));
    await new Promise((res) => { const ws2 = new WebSocket(t.webSocketDebuggerUrl); ws2.onopen = () => ws2.send(JSON.stringify({ id: 9, method: 'Target.closeTarget', params: { targetId: t.id } })); setTimeout(res, 500); });
  } catch (e) { console.log('[' + u + '] ERR ' + e.message); }
}
process.exit(0);
