// reg0000: tab清场 — 保留 about:blank 和 bigmodel.cn(用户tab)
const list = await (await fetch("http://127.0.0.1:9224/json/list")).json();
const blanks = list.filter(t => t.type === "page" && /about:blank/.test(t.url));
let kept = 0;
for (const b of blanks) { if (kept === 0) { kept++; continue; } try { await fetch(`http://127.0.0.1:9224/json/close/${b.id}`); } catch {} }
for (const t of list.filter(t => t.type === "page" && !/about:blank|bigmodel\.cn/.test(t.url))) {
  try { await fetch(`http://127.0.0.1:9224/json/close/${t.id}`); console.log("closed:", t.url.slice(0, 60)); } catch {}
}
console.log("CLEAN_DONE, blanks kept:", kept);
