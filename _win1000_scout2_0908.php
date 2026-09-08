<?php
// _win1000_scout2_0908.php: win1000补给第二批（博客长尾+目录新仓库合并去重验活）
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$have = [];
foreach (DB::table('blog_accounts')->get(['domain','platform']) as $a) { foreach ([$a->domain,$a->platform] as $v) { if ($v) $have[strtolower(preg_replace('/^www\./','',$v))] = 1; } }
foreach (DB::table('backlinks')->get(['url']) as $b) { $h = parse_url($b->url, PHP_URL_HOST); if ($h) $have[strtolower(preg_replace('/^www\./','',$h))] = 1; }

// 第一批博客活站回灌（避免第二批重探）
$prev = json_decode(file_get_contents('D:/Github/backlink_skills/tmp_recon/win1000_scout_result.json'), true);
$blogHave = array_fill_keys(array_keys($prev['blogAlive'] ?: []), 1);
$blogHave = array_merge($blogHave, array_fill_keys(array_keys($prev['blogDead'] ?: []), 1));

// 第二批博客候选
$blog2 = ['antville.org','twoday.net','edublogs.org','over-blog.com','emyspot.com','webgarden.com','webnode.com','yola.com','snackwebsites.com','journalspace.com','blogster.com','thoughts.com','blogigo.com','soulcast.com','blogsome.com','spruz.com','seesaa.net','liveinternet.ru','diary.ru','hatena.ne.jp','note.com','penzu.com','postach.io','teletype.in','dzen.ru','sarahah?','writefreely.host','blogs.vt.edu','wordcartoons.com','journal.growkudos.com','thecitylists.com','bloggerteaser.com','fashionindustries.net','winblog.net','blogsbyiam.com','simpleblogs.net','bloghaven.com','voguestoday.com','mybloglicious.com','post-blogs.com'];

// 目录候选合并：第一批文件 + 新仓库提取
$dirNew = ['1000.tools','100apps.org','1payment.tools','ai-hunter.io','ai-search.io','aicenter.ai','aidepot.co','aidreamhub.com','aidude.info','aieducator.tools','ailib.ru','aimarketing.directory','aitogrow.com','aitoolboard.com','aitoolguru.com','aitoolsarena.com','aitoolsguide.com','aitoolsup.com','aitoolswiki.com','aitrendz.xyz','aivalley.ai','aixcollection.com','allthingsai.com','altern.ai','alternative.me','alternatives.co','alteropen.com','anyfp.com','appscribed.com','appsthunder.com','auraplusplus.com','backlinkhubs.com','bestaito.com','betalist.com','chatgptdemo.com','doforai.tools','dokeyai.com','domore.ai','earlyhunt.com','easysaveai.com','easywithai.com','faind.ai','favird.com','fazier.com','findcool.tools','findmyaitool.com','free-ai-tools-directory.com','freeappsai.com','coolstartups.xyz','confettisaas.com','devhunt.org','indieproducts.io','justhunt.co','labstartups.com','launchigniter.com','launchingnext.com','microlaunch.net','nocodelist.co','opensaasdirectory.com','peerpush.net','platformsdirectory.com','theresanai.com','directory.surf','apilist.fun','demos.co','firstocontact.com'];
$dirPrev = array_map('trim', file('D:/Github/backlink_skills/tmp_recon/win1000_dir_cands.txt', FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES));
$dirPrev = array_map(fn($d) => preg_replace('/^www\./','',$d), $dirPrev);
$dirs = array_unique(array_merge($dirPrev, $dirNew));

$blogNet = []; $dirNet = [];
foreach ($blog2 as $b) { $b = preg_replace('/^www\./','',$b); if (strpos($b,'?')!==false) continue; if (!isset($have[$b]) && !isset($blogHave[$b])) $blogNet[$b] = 1; }
foreach ($dirs as $d) { if (!isset($have[$d])) $dirNet[$d] = 1; }
$blogNet = array_keys($blogNet); $dirNet = array_keys($dirNet);
echo "第二批净候选: BLOG=" . count($blogNet) . " DIR=" . count($dirNet) . "\n";

function probe(array $pairs) {
    $qm = curl_multi_init(); $tasks = []; $out = [];
    foreach ($pairs as $i => $p) {
        $ch = curl_init($p['url']);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_MAXREDIRS=>2, CURLOPT_TIMEOUT=>12, CURLOPT_CONNECTTIMEOUT=>8, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_ENCODING=>'', CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0']);
        curl_multi_add_handle($qm, $ch); $tasks[$i] = ['p'=>$p, 'ch'=>$ch];
    }
    do { $st = curl_multi_exec($qm, $running); if ($running) curl_multi_select($qm, 0.3); } while ($running && $st == CURLM_OK);
    foreach ($tasks as $i => $t) {
        $out[$i] = ['code'=>curl_getinfo($t['ch'], CURLINFO_HTTP_CODE), 'html'=>substr((string)curl_multi_getcontent($t['ch']), 0, 4000), 'p'=>$t['p']];
        curl_multi_remove_handle($qm, $t['ch']); curl_close($t['ch']);
    }
    curl_multi_close($qm);
    return $out;
}

// 博客
$pairs = []; foreach ($blogNet as $b) { $pairs[] = ['url'=>"https://$b/", 'host'=>$b]; }
$res = probe($pairs);
$blogAlive = []; $blogDead = []; $p2 = [];
foreach ($res as $r) {
    $h = $r['p']['host'];
    if ($r['code'] == 200 || ($r['code'] > 0 && $r['code'] < 400)) { $blogAlive[$h] = "root={$r['code']}"; $p2[] = ['url'=>"https://$h/signup", 'host'=>$h]; }
    else $blogDead[$h] = $r['code'];
}
foreach (($p2 ? probe($p2) : []) as $r) {
    $h = $r['p']['host'];
    $emailish = stripos($r['html'],'email') !== false;
    if ($r['code'] == 404) { // signup 404 → 试 /register 与根页找入口
        $blogAlive[$h] .= " signup/404(需另找入口)";
    } else $blogAlive[$h] .= " signup/{$r['code']}" . ($emailish ? '+email' : '?');
}
echo "BLOG2 活(" . count($blogAlive) . "):\n"; foreach ($blogAlive as $h => $s) echo "  $h | $s\n";
echo "BLOG2 死(" . count($blogDead) . "): " . implode(' ', array_map(fn($k,$v)=>"$k($v)", array_keys($blogDead), $blogDead)) . "\n";

// 目录
$pairs = []; foreach ($dirNet as $d) { $pairs[] = ['url'=>"https://$d/", 'host'=>$d]; }
$res = probe($pairs);
$dirAlive = []; $dirDead = []; $p3 = [];
foreach ($res as $r) {
    $h = $r['p']['host'];
    if ($r['code'] == 200 || ($r['code'] > 0 && $r['code'] < 400)) {
        $hasForm = stripos($r['html'],'<form') !== false;
        $dirAlive[$h] = "root={$r['code']} form=" . ($hasForm?'Y':'?');
        $p3[] = ['url'=>"https://$h/submit", 'host'=>$h];
    } else $dirDead[$h] = $r['code'];
}
foreach (($p3 ? probe($p3) : []) as $r) {
    $h = $r['p']['host'];
    $dirAlive[$h] .= " | submit/{$r['code']}";
}
echo "DIR2 活(" . count($dirAlive) . "):\n"; foreach ($dirAlive as $h => $s) echo "  $h | $s\n";
echo "DIR2 死(" . count($dirDead) . "): " . implode(' ', array_map(fn($k,$v)=>"$k($v)", array_keys($dirDead), $dirDead)) . "\n";
file_put_contents('D:/Github/backlink_skills/tmp_recon/win1000_scout2_result.json', json_encode(['blogAlive'=>$blogAlive,'blogDead'=>$blogDead,'dirAlive'=>$dirAlive,'dirDead'=>$dirDead], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
