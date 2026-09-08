// appysmarts suggest.php RealPerson破码直投: node _win2000_as.mjs <appName> <descFile> <bareDomain> <email>
// 配方: proven[4] (win1600) — djb2穷举反解 + JS element.click()
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const [,, appName, descFile, bareDomain, email] = process.argv;
const desc = fs.readFileSync(descFile, 'utf8').trim().slice(0, 380);
const base = 'http://127.0.0.1:9224';
let tabs = await (await fetch(base + '/json/list')).json();
let tab = tabs.find(t => t.type === 'page' && t.url.includes('appysmarts'));
if (!tab) { const r = await fetch(base + '/json/new?https://www.appysmarts.com/suggest.php', { method: 'PUT' }); tab = await r.json(); await fetch(base + '/json/activate/' + tab.id); await sleep(5000); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
const c = new CDP(ws);
await c.send('Page.enable'); await c.send('Runtime.enable');
await c.send('Page.navigate', { url: 'https://www.appysmarts.com/suggest.php' });
await sleep(8000);
// 1) 读RealPerson实例数据
const inst = await c.evalT(`(function(){var j=window.jQuery||window.$;if(!j)return 'NOJQ';var el=j('[name=captcha]');if(!el.length)return 'NOFIELD';var d=el.data('realperson');if(!d)return 'NOINST:'+Object.keys(el.data()||{}).join(',');var o=d.options||d.settings||{};return JSON.stringify({hash:d.hash!==undefined?d.hash:(d.DHash!==undefined?d.DHash:null),chars:o.chars||(o.charMin?'?':null),length:o.length||null,keys:Object.keys(d)});})()`, 10000);
console.log('inst:', inst);
if (inst === 'NOFIELD' || inst.startsWith('NOINST')) { console.log('FAIL=' + inst); process.exit(1); }
const d = JSON.parse(inst);
// RealPerson 默认: chars 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 或带数字, length 5, hash=djb2(全串)
const chars = d.chars && d.chars !== '?' ? d.chars : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const len = d.length || 5;
console.log('crack: hash=' + d.hash + ' chars=' + chars.length + ' len=' + len);
let code = null;
const target = d.hash;
let h = 5381;
// 迭代生成器: 26^5 = 11881376
const arr = new Array(len).fill(0);
for (let n = 0; n < Math.pow(chars.length, len); n++) {
  let hh = 5381;
  for (let i = 0; i < len; i++) hh = ((hh << 5) + hh) + chars.charCodeAt(arr[i]);
  if (hh === target) { code = arr.map(i => chars[i]).join(''); break; }
  let k = len - 1;
  while (k >= 0) { arr[k]++; if (arr[k] < chars.length) break; arr[k] = 0; k--; }
  if (k < 0) break;
}
console.log('code:', code);
if (!code) { console.log('FAIL=NO_CODE'); process.exit(1); }
// 2) 填表
const fillSel = async (sel, val) => {
  const r = await c.eval(`(function(){var i=document.querySelector('${sel}');if(!i)return 'NO';i.scrollIntoView({block:'center'});i.focus();i.value='';return 'OK';})()`);
  if (r !== 'OK') { console.log(sel, 'missing'); return false; }
  await c.send('Input.insertText', { text: val }); await sleep(250);
  return true;
};
await fillSel('[name=name]', 'Leo Xm');
await fillSel('[name=email]', email);
await fillSel('[name=appName]', appName);
await fillSel('[name=description]', desc);
await fillSel('[name=findApp]', bareDomain);
await fillSel('[name=comment]', '');
await fillSel('[name=captcha]', code);
await c.eval(`(function(){['iWantDBN','iWantFree'].forEach(function(n){var i=document.querySelector('[name='+n+']');if(i&&!i.checked)i.click();});})()`);
await sleep(400);
console.log('filled:', await c.eval(`JSON.stringify({n:document.querySelector('[name=name]').value,e:document.querySelector('[name=email]').value,a:document.querySelector('[name=appName]').value.slice(0,20),cap:document.querySelector('[name=captcha]').value})`));
// 3) JS click 提交(真鼠标不落)
await c.eval(`(function(){var b=[...document.querySelectorAll('input[type=submit],button')].find(function(x){return x.offsetParent&&/submit|send/i.test(x.value||x.innerText||'')});if(b)b.click();return !!b;})()`);
await sleep(8000);
const after = await c.evalT(`(function(){var N=String.fromCharCode(10);return location.href.slice(0,70)+'<<>>'+document.body.innerText.slice(0,250).split(N).join('~');})()`, 10000);
console.log('after:', after);
process.exit(0);
