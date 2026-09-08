<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$have = [];
foreach (DB::table('blog_accounts')->get(['domain','platform']) as $a) { $have[strtolower($a->domain ?: $a->platform)] = 1; }
foreach (DB::table('backlinks')->get(['url']) as $b) { $h = parse_url($b->url, PHP_URL_HOST); if ($h) $have[strtolower(preg_replace('/^www\./','',$h))] = 1; }
$skip = ['benert.pl','bolha.blog','writefreely.pl','rant.li','write.as','cdn.writeas.net','developers.write.as','discuss.write.as','fedidb.org','api.ahrefs.com','ahrefs.com','sell.g2.com','theresanaiforthat.com','300aidirectories.com','tapscape.com','musing.studio','blog.dtth.ch','i11l.blog','matterofti.me','prra.xyz','val-vgms.gay','wiredplay.space','write.c7.io','write.owu.one','writee.org','people.kernel.org','tales.tiggi.es','myldring.finstova.no','blogs.gayfr.social','blog.transistor.one','blog.rollenspiel.monster','blog.kaisbettaieb.dev','aikaptan.com','aitoolsa2z.com','toolsml.com','launched.site','webtoolsweekly.com','growstartup.co','aiwebsitedirectory.com'];
// bestofai 目录
$txt = file_get_contents('D:/Github/backlink_skills/tmp_recon/bestofai.md');
preg_match_all('#https?://([a-z0-9][a-z0-9\.\-]+\.[a-z]{2,})#i', $txt, $m);
$dirs = [];
foreach ($m[1] as $host) {
    $host = strtolower(preg_replace('/^www\./','',$host));
    if (preg_match('/github|shields|creativecommons|youtube|twitter|reddit|discord|telegram|LICENSE/i', $host)) continue;
    if (isset($have[$host]) || isset($skip[$host])) continue;
    $found = false; foreach ($skip as $s) { if (strpos($host, $s) !== false) { $found = true; break; } }
    if ($found) continue;
    $dirs[$host] = 1;
}
$dirs = array_keys($dirs);
echo "DIR 补充候选: " . count($dirs) . "\n" . implode(', ', $dirs) . "\n";
file_put_contents('D:/Github/backlink_skills/tmp_recon/fresh_dir2.txt', implode("\n", $dirs));
// WF 细提（wf.html 里所有 href+纯文本域名）
$html = file_get_contents('D:/Github/backlink_skills/tmp_recon/wf.html');
preg_match_all('#>([a-z0-9][a-z0-9\.\-]+\.[a-z]{2,})<#i', $html, $m2);
$blogs = [];
foreach ($m2[1] as $host) {
    $host = strtolower(preg_replace('/^www\./','',$host));
    if (isset($have[$host]) || isset($skip[$host])) continue;
    $found = false; foreach ($skip as $s) { if (strpos($host, $s) !== false) { $found = true; break; } }
    if ($found || preg_match('/writefreely|write\.as|github|matrix|fedidb|pleroma/', $host)) continue;
    $blogs[$host] = 1;
}
$blogs = array_keys($blogs);
echo "BLOG 补充候选: " . count($blogs) . "\n" . implode(', ', $blogs) . "\n";
file_put_contents('D:/Github/backlink_skills/tmp_recon/fresh_blog2.txt', implode("\n", $blogs));
