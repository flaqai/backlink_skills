/**
 * recaptcha-mirror.mjs — recaptcha.net 镜像拦截武器（reg0000 0911 固化）
 * 用法: import { enableMirrorAndReload } from './recaptcha-mirror.mjs';
 *       await enableMirrorAndReload(ws);  // ws=已连接目标tab的WebSocket
 *
 * 原理: CDP Fetch.enable 拦截 *//www.google.com/recaptcha/* → requestPaused 时
 * Node 侧抓 https://www.recaptcha.net 同路径实体 → fulfillRequest 200 回填。
 * 页面自身的 asyncScriptLoader 第一次就能走通（治 google.com 超时 + 缓存拒绝 promise）。
 * 注意: fulfillRequest 302 对子资源不跟随，必须回填 200 实体。
 */
export async function enableRecaptchaMirror(ws, { referer = '' } = {}) {
  let mid = 0;
  const pend = new Map();
  const fulfilled = new Set();
  const send = (method, params = {}) => new Promise(res => { const id = ++mid; pend.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = async (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method !== 'Fetch.requestPaused') return;
    const p = m.params;
    if (fulfilled.has(p.requestId)) return;
    fulfilled.add(p.requestId);
    const mirror = p.request.url.replace('https://www.google.com/recaptcha', 'https://www.recaptcha.net/recaptcha');
    try {
      const rr = await fetch(mirror, { headers: { 'User-Agent': p.request.headers['User-Agent'] || p.request.headers['user-agent'] || 'Mozilla/5.0', ...(referer ? { Referer: referer } : {}) } });
      const body = Buffer.from(await rr.arrayBuffer()).toString('base64');
      await send('Fetch.fulfillRequest', {
        requestId: p.requestId,
        responseCode: rr.status,
        headers: [
          { name: 'Content-Type', value: rr.headers.get('content-type') || 'application/javascript' },
          { name: 'Access-Control-Allow-Origin', value: '*' },
        ],
        body,
      });
      console.log('[recaptcha-mirror] fulfilled:', mirror.slice(0, 90));
    } catch (e) {
      console.log('[recaptcha-mirror] mirror fetch failed:', e.message);
      await send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'Failed' }).catch(() => {});
    }
  };
  await send('Network.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*//www.google.com/recaptcha/*', requestStage: 'Request' }] });
  return { send, fulfilled };
}
