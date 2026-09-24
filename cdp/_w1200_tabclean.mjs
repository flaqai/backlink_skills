// win1200: 清理本班开的tab (保留最后1个)
const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
const pages = list.filter(t => t.type === 'page');
console.log('TOTAL TABS:', pages.length);
const mine = pages.filter(t => /poordirectory|blogminds|manifo|blog-ezine|virily|micro\.blog|creatorlink/.test(t.url || ''));
for (const t of mine) { await fetch('http://127.0.0.1:9224/json/close/' + t.id); console.log('closed', (t.url||'').slice(0, 50)); }
const rest = (await (await fetch('http://127.0.0.1:9224/json/list')).json()).filter(t => t.type === 'page');
console.log('REMAIN:', rest.length, rest.map(t => (t.url || '').slice(0, 40)));
