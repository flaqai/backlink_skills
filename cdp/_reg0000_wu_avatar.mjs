import { CDP, sleep } from './CDP.mjs';
async function main() {
  const tab = [...(await (await fetch('http://127.0.0.1:9224/json/list')).json())].find(t => t.type === 'page' && /writeupcafe\.com/.test(t.url));
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  const c = new CDP(ws);
  await c.send('DOM.enable'); await c.send('Page.enable');
  await fetch(`http://127.0.0.1:9224/json/activate/${tab.id}`).catch(() => {});
  await sleep(300);
  // settings 页传头像
  await c.send('Page.navigate', { url: 'https://writeupcafe.com/settings' });
  await sleep(6000);
  const doc = await c.send('DOM.getDocument', { depth: -1 });
  const q = await c.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: 'input[type=file]' });
  console.log('FILE_INPUTS=', q.nodeIds.length);
  if (q.nodeIds.length) {
    await c.send('DOM.setFileInputFiles', { nodeId: q.nodeIds[0], files: ['D:\Github\backlink_skills\cdp\_reg0000_wu_avatar.jpg'] });
    console.log('AVATAR_SET');
  }
  await sleep(5000);
  console.log('URL:', await c.evalT('location.href', 8000));
}
main().catch(e => console.log('FATAL:', e.message));
