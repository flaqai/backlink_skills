import { CDP, sleep } from './CDP.mjs';
const sites = [
  ['livebloggs.com', 'Weekend walker and calendar sceptic. I write short notes about ordinary routines and why they keep working.'],
  ['blogoscience.com', 'Home kitchen experimenter. Mostly bread, sometimes science, always one jar away from another batch.'],
  ['blog-a-story.com', 'I write small observations from the same eleven-minute loop of pavement. City blocks have more plot than people think.'],
  ['blogcudinti.com', 'Recovering content skimmer. One chapter a night, book nine, still slow, no longer in a hurry.'],
];
for (const [dom, bio] of sites) {
  const t = await (await fetch('http://127.0.0.1:9224/json/new?https://leoxm26.' + dom + '/wp-admin/profile.php', { method: 'PUT' })).json();
  await fetch('http://127.0.0.1:9224/json/activate/' + t.id).catch(() => {});
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  for (let i = 0; i < 10; i++) { await sleep(1500); const r = await cdp.evalT(`document.readyState`, 5000).catch(() => 'E'); if (r === 'complete') break; }
  const url = await cdp.evalT(`location.href`, 5000);
  const set = await cdp.evalT(`(()=>{const p=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;const pi=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;const d=document.querySelector('#description');const f=document.querySelector('#first_name');if(!d)return 'NODESC';p.call(d,${JSON.stringify(bio)});d.dispatchEvent(new Event('input',{bubbles:true}));if(f){pi.call(f,'Leo');f.dispatchEvent(new Event('input',{bubbles:true}))}return 'SET:'+d.value.length})()`, 8000);
  let sub = 'SKIP';
  if (String(set).startsWith('SET')) {
    sub = await cdp.evalT(`(()=>{const f=document.querySelector('#your-profile')||document.querySelector('form');if(!f)return 'NOFORM';const b=f.querySelector('input[name=submit],button[type=submit],#submit');if(b){b.scrollIntoView({block:'center'});if(f.requestSubmit){f.requestSubmit(b);return 'reqSubmit'}b.click();return 'click'}return 'NOBTN'})()`, 8000);
    await sleep(3000);
  }
  const after = await cdp.evalT(`document.querySelector('#description')?document.querySelector('#description').value.slice(0,40):document.body.innerText.slice(0,80)`, 5000);
  console.log(dom, '| url:', String(url).slice(0, 60), '| fill:', set, '| submit:', sub, '| after:', String(after).slice(0, 40));
  await fetch('http://127.0.0.1:9224/json/close/' + t.id);
  await sleep(1000);
}
