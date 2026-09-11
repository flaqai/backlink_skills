// _w1200_fark_check.mjs — win1200: fark 提交放行复核(9224渲染搜自己提交的link)
import { CDP } from './CDP.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await new Promise(r => setTimeout(r, 300));
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');

try {
  // 用站内搜索查提交的 smogcheck 链接是否放行(fark 搜索=总主站搜索)
  await cdp.send('Page.navigate', { url: 'https://www.fark.com/search?q=smogcheck-nearme&all=true' });
  await sleep(12000);
  const r1 = await cdp.eval(`JSON.stringify({ url: location.href.slice(0, 90), hits: (document.body.innerText.match(/smogcheck[- ]?nearme/gi) || []).length, sample: (document.body.innerText.match(/.{0,60}smogcheck.{0,60}/i) || [''])[0] })`);
  console.log('fark-search-smog:', r1);
  // 第二条: generatorforhouse
  await cdp.send('Page.navigate', { url: 'https://www.fark.com/search?q=generatorforhouse&all=true' });
  await sleep(10000);
  const r2 = await cdp.eval(`JSON.stringify({ hits: (document.body.innerText.match(/generatorforhouse/gi) || []).length, sample: (document.body.innerText.match(/.{0,60}generatorforhouse.{0,60}/i) || [''])[0] })`);
  console.log('fark-search-gen:', r2);
} catch (e) { console.error('ERR', e.message); }
try { await cdp.send('Target.closeTarget', { targetId: tab.id }); } catch (_) {}
process.exit(0);
