// reg0000: 通用 attach 工具 — 连接指定 URL 模式的现有 tab
import { CDP } from "./cdp.mjs";
export async function attach(pattern, { activate = true } = {}) {
  const list = await (await fetch("http://127.0.0.1:9224/json/list")).json();
  const page = list.find(t => t.type === "page" && pattern.test(t.url));
  if (!page) throw new Error("NO_TAB matching " + pattern);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); setTimeout(() => rej(new Error("ws timeout")), 8000); });
  const c = new CDP(ws);
  await c.send("Page.enable");
  if (activate) {
    try { await fetch(`http://127.0.0.1:9224/json/activate/${page.id}`); } catch {}
  }
  return c;
}
