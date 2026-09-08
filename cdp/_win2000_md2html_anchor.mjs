// MD(库)→HTML + 结论前注入任务站锚链段（供无锚存稿用）
// 用法: node _win2000_md2html_anchor.mjs <id> <out.html> <url> <锚文本> <注入句(不含链接)>
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
const BS = String.fromCharCode(92);
const NL = String.fromCharCode(10);
const [id, out, url, anchorText, sentence] = process.argv.slice(2);
const raw = execSync(`"C:/BtSoft/mysql/MySQL8.0/bin/mysql.exe" -h127.0.0.1 -uroot -proot seoadmin --default-character-set=utf8mb4 -N -B -e "SELECT body FROM blog_writer_posts WHERE id=${id}"`, {encoding:'utf8', maxBuffer: 10*1024*1024});
const md = raw.split(BS + 'n').join(NL).split(BS + BS).join(BS).trim();
const lines = md.split(NL);
const outLines = [];
for (let l of lines) {
  l = l.trim();
  if (!l) continue;
  let tag = 'p';
  if (l.startsWith('### ')) { tag='h3'; l=l.slice(4); }
  else if (l.startsWith('## ')) { tag='h2'; l=l.slice(3); }
  else if (l.startsWith('# ')) { continue; }
  while (true) {
    const b = l.indexOf('**');
    if (b < 0) break;
    const e = l.indexOf('**', b+2);
    if (e < 0) break;
    l = l.slice(0,b) + '<strong>' + l.slice(b+2,e) + '</strong>' + l.slice(e+2);
  }
  outLines.push('<' + tag + '>' + l + '</' + tag + '>');
}
const inject = '<p>' + sentence + ' See <a href="' + url + '">' + anchorText + '</a> for the full walkthrough.</p>';
outLines.splice(Math.max(outLines.length - 2, 0), 0, inject);
writeFileSync(out, outLines.join(NL));
console.log('blocks:', outLines.length, 'injected anchor:', url);
