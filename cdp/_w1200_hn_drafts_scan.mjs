// _w1200_hn_drafts_scan.mjs — win1200: 扫描6条hackernoon draft找有tag的(Submit可解禁)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DRAFTS = [
  '6a9d7bb2b31525fcd809251a',
  '6a92ca059acb78c281272117',
  '6a8fa3e8656bd340e966eda6',
  '6a8fa5ab656bd340e966ee44',
  '6a8fa5dd656bd340e966ee53',
  '6a958aaf2c21d07f8a990e43',
];

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');

try {
  for (const id of DRAFTS) {
    await cdp.send('Page.navigate', { url: `https://app.hackernoon.com/drafts/${id}` });
    await sleep(9000);
    const st = await cdp.eval(`JSON.stringify({
      emptyTag: document.body.innerText.includes('empty tag'),
      words: (document.body.innerText.match(/Words Written:\\s*(\\d+)/) || [])[1] || '?',
      title: (document.querySelector('textarea[placeholder*="itle"], input[placeholder*="itle"]') || {}).value || '',
      submitDisabled: ((): any => { const b = [...document.querySelectorAll('button')].find(x => /submit story for review/i.test(x.innerText)); return b ? b.disabled : 'nobtn'; })()
    })`.replace('(): any =>', '() =>'));
    console.log(id.slice(0, 8), st);
  }
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
