import { CDP, sleep } from './CDP.mjs';
// win1200: 批量测 farm族 new-post 登录态(真判据=编辑器出现)
const doms = process.argv.slice(2);
for (const dom of doms) {
  const t = await (await fetch('http://127.0.0.1:9224/json/new?https://' + dom + '/new-post', { method: 'PUT' })).json();
  await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  let res = 'TIMEOUT';
  for (let i = 0; i < 8; i++) {
    await sleep(2200);
    const st = await cdp.eval(`JSON.stringify({u: location.href.slice(0,110), t: !!document.querySelector('#title'), ta: !!document.querySelector('textarea#content')})`).catch(() => null);
    if (st) {
      const s = JSON.parse(st);
      if (s.t && s.ta) { res = 'ALIVE_EDITOR'; break; }
      if (/login|signin|sign-in/.test(s.u)) { res = 'DEAD_LOGIN_WALL'; break; }
      res = 'UNK:' + s.u.slice(0, 80);
    }
  }
  console.log(dom, '=>', res);
  await fetch('http://127.0.0.1:9224/json/close/' + t.id).catch(() => {});
  ws.close();
}
console.log('BATCH_DONE');
