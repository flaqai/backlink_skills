// digabusiness t9: 填表+LINK_TYPE+类目弹窗dump: node _win2000_diga.mjs
import { CDP, sleep } from './CDP.mjs';
const T = { site:'https://spravs.com', title:'Spravs - Curated Web Directory and Online Resources',
  desc:'Spravs is a curated web directory collecting useful online resources across business, education, technology, shopping and daily life. Each listing is reviewed for quality so visitors can find trustworthy sites fast.',
  email:'digabusiness.spr@92ng.com' };
const tabs = await (await fetch('http://127.0.0.1:9224/json/list')).json();
let tab = tabs.find(t => (t.url || '').includes('digabusiness') && t.type === 'page');
if (!tab) tab = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
await fetch('http://127.0.0.1:9224/json/activate/' + tab.id, { method: 'PUT' }).catch(() => {});
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const cdp = new CDP(ws);
await cdp.send('Page.enable');
try {
  await cdp.send('Page.navigate', { url: 'https://www.digabusiness.com/submit.php' });
  await sleep(5000);
  async function fill(name, val) {
    const ok = await cdp.eval(`(() => { const e = document.querySelector('[name="${name}"]'); if (!e) return 'NO'; e.scrollIntoView({block:'center'}); e.focus(); const p = e.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p,'value').set.call(e,''); return 'OK'; })()`);
    if (ok !== 'OK') { console.log('SKIP', name); return; }
    for (const ch of val) { await cdp.send('Input.insertText', { text: ch }).catch(() => {}); await sleep(8); }
    console.log('FILL', name, 'ok');
  }
  await fill('TITLE', T.title); await fill('URL', T.site); await fill('DESCRIPTION', T.desc);
  await fill('OWNER_NAME', 'Leo Xm'); await fill('OWNER_EMAIL', T.email);
  console.log('LINKTYPE:', await cdp.eval(`(() => { const r=[...document.querySelectorAll('input[name="LINK_TYPE"]')]; const p=r.find(x=>/normal|2/i.test(x.value))||r[r.length-1]; if(!p) return 'NORADIO'; p.scrollIntoView({block:'center'}); p.click(); return 'PICK:'+p.value; })()`));
  // 开类目弹窗: 找 Change category 链接/按钮
  const catBtn = await cdp.eval(`(() => { const el=[...document.querySelectorAll('a,button,input')].find(x=>/change category|select categor/i.test(x.textContent||x.value||'')); if(!el) return 'NOBTN'; el.scrollIntoView({block:'center'}); el.click(); return 'CLICKED'; })()`);
  console.log('catBtn:', catBtn);
  await sleep(2500);
  const dump = await cdp.eval(`(() => {
    const nodes = [...document.querySelectorAll('a,div,span,li')].filter(x => x.id && /^\d+$/.test(x.id) || (x.getAttribute && x.getAttribute('onclick') && x.getAttribute('onclick').includes('update_categ_selection')));
    const out = nodes.slice(0, 40).map(x => ({tag: x.tagName, id: x.id || '', text: (x.textContent||'').trim().slice(0,40), oc: (x.getAttribute('onclick')||'').slice(0,60)}));
    return JSON.stringify(out, null, 0).slice(0, 1800);
  })()`);
  console.log('TREE:', dump);
} catch (e) { console.log('ERR:', String(e).slice(0, 150)); }
process.exit(0);
