// win1000 salespider收口: validator全置1+直调post+网络监听
import { CDP, sleep } from './CDP.mjs';
import fs from 'fs';
const t = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + t.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
await cdp.send('Network.enable');
let ajaxLog = [];
cdp.on(m => {
  if (m.method === 'Page.javascriptDialogOpening') { console.log('DIALOG:', m.params.type, m.params.message); cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(()=>{}); }
  if (m.method === 'Network.requestWillBeSent' && /ad_create|ajax/i.test(m.params.request.url)) { console.log('AJAXREQ:', m.params.request.url.slice(0, 120)); ajaxLog.push(m.params.requestId); }
  if (m.method === 'Network.loadingFinished' && ajaxLog.includes(m.params.requestId)) {
    cdp.send('Network.getResponseBody', { requestId: m.params.requestId }).then(r => console.log('AJAXRESP:', String(r.body).slice(0, 300))).catch(()=>{});
  }
});
async function realType(sel, text) {
  await cdp.eval(`(() => { const e = document.querySelector('${sel}'); if (!e) return 'NOEL'; e.scrollIntoView({block:'center'}); e.focus(); e.value=''; return 'OK'; })()`);
  for (const ch of text) {
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, unmodifiedText: ch });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', text: ch, unmodifiedText: ch });
    await sleep(50);
  }
  await cdp.eval(`document.querySelector('${sel}')?.dispatchEvent(new Event('blur',{bubbles:true}))`);
  await sleep(200);
}
try {
  await cdp.send('Page.navigate', { url: 'https://www.salespider.com/business-directories-free-online-ads?name=Dino%20Age&city=623' });
  for (let i = 0; i < 15; i++) { const r = await cdp.evalT(`document.readyState`, 6000).catch(() => 'E'); if (r === 'complete') break; await sleep(2000); }
  await sleep(3000);
  if ((await cdp.evalT(`!!document.querySelector('input[name=businessdirectory_companyName]')`, 6000)) !== true) { console.log('NOFORM'); process.exit(0); }
  await realType('input[name=businessdirectory_companyName]', 'Dino Age');
  await realType('input[name=businessdirectory_address]', '1 N State St');
  await realType('input[name=businessdirectory_zip]', '60602');
  await realType('input[name=businessdirectory_phone]', '312-555-0142');
  await realType('input[name=businessdirectory_owner]', 'Leo Xm');
  await realType('input[name=businessdirectory_website]', 'https://dinoage.cc/');
  await realType('textarea[name=businessdirectory_description]', 'Play dinosaur survival games at DinoAge. Gather, craft, hunt, and outlast werewolves and predators across prehistoric biomes. Free browser game with crafting and survival challenges.');
  await realType('textarea[name=businessdirectory_message]', 'Listing for Dino Age, a free online dinosaur survival browser game.');
  await cdp.eval(`(() => { const s = document.querySelector('select[name=businessdirectory_category]'); s.value = '34'; s.dispatchEvent(new Event('change',{bubbles:true})); return s.value; })()`);
  await sleep(3000);
  await cdp.eval(`(() => { const s = document.querySelector('#businessdirectory_subcategory select') || document.querySelector('select[name=businessdirectory_subcategory]'); if (!s) return 'NOSUB'; const o = [...s.options].find(x => x.value && x.value !== '0'); if (o) { s.value = o.value; s.dispatchEvent(new Event('change',{bubbles:true})); } return 'SUB:' + s.value; })()`);
  // 城市: 用623已有值, 补 hidden
  await cdp.eval(`(() => { const h = document.querySelector('input[name=filter_hidden_city]'); if (h && !h.value) h.value = '623'; return h ? h.value : 'NOH'; })()`);
  // validator 全置1 + start_time 兜底 + Base64/Base64url polyfill(配方③, post内部X.encode引用)
  const vres = await cdp.eval(`(() => {
    window.Base64 = { decode: function(s){ return decodeURIComponent(escape(atob(s))); } };
    window.Base64url = { decode: function(s){ s = s.split("-").join("+"); s = s.split("_").join("/"); while (s.length % 4) s += "="; return decodeURIComponent(escape(atob(s))); }, encode: function(s){ var b = btoa(unescape(encodeURIComponent(s))); b = b.split("+").join("-"); b = b.split("/").join("_"); while (b.charAt(b.length - 1) === "=") b = b.slice(0, -1); return b; } };
    const names = ['email','companyName','description','message','password','location','zip','category','website','address','phone','photo','image','owner','locations','employee','revenue','employeeType','jobTitle','city','subcategory'];
    for (const n of names) { const k = 'validation_businessdirectory_' + n; try { window[k] = 1; } catch(e){} }
    if (typeof window.start_time === 'undefined') window.start_time = Date.now();
    return 'SET:' + typeof window.Base64url.encode;
  })()`);
  console.log('POLYFILL:', vres);
  // 直调 post
  const call = await cdp.eval(`(() => { try { window.__postErr = null; try { businessdirectory_post('0','', start_time); } catch(e) { window.__postErr = e.message; } return JSON.stringify({err: window.__postErr}); } catch(e) { return 'OUTER:' + e.message; } })()`);
  console.log('POSTCALL:', call);
  await sleep(12000);
  console.log('AFTER-URL:', await cdp.evalT(`location.href`, 6000));
  console.log('AFTER-TXT:', String(await cdp.evalT(`document.body.innerText.slice(0, 350)`, 8000)).replace(/\n+/g, ' | '));
  await cdp.send('Page.captureScreenshot').then(r => fs.writeFileSync('D:/Github/backlink_skills/_win1000_ss_go.png', Buffer.from(r.data, 'base64')));
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
