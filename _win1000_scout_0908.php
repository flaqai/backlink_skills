<?php
// _win1000_scout_0908.php: win1000补给·新源侦察验活（博客≥30+目录≥30 分开计数）
// 候选: writefreely实例表+经典邮箱型博客平台 / bestofai目录清单 → 对 blog_accounts+backlinks 全库去重 → curl层验活
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

// ---------- 1. 全库已占域名 ----------
$have = [];
foreach (DB::table('blog_accounts')->get(['domain', 'platform']) as $a) {
    foreach ([$a->domain, $a->platform] as $v) { if ($v) $have[strtolower(preg_replace('/^www\./', '', $v))] = 1; }
}
foreach (DB::table('backlinks')->get(['url']) as $b) {
    $h = parse_url($b->url, PHP_URL_HOST);
    if ($h) $have[strtolower(preg_replace('/^www\./', '', $h))] = 1;
}

// ---------- 2. 候选清单 ----------
$wfRaw = ['benert.pl','bilog.tr','blog.bananahackers.net','blog.dtth.ch','blog.kaisbettaieb.dev','blog.liberta.vip','blog.rollenspiel.monster','blog.transistor.one','blogs.dgplug.org','blogs.gayfr.social','blogs.toot.wales','bolha.blog','escritura.social','fedi.dev','hai.haus','i11l.blog','infosec.press','krem.tooot.im','littera.blog','log.livellosegreto.it','matterofti.me','musing.studio','myldring.finstova.no','noblogo.org','o0o0.o0o0.my','paper.wf','prra.xyz','qua.name','rant.li','sharedblog.it','sopadeletras.club','tales.tiggi.es','text.tchncs.de','val-vgms.gay','wiredplay.space','withwhomis.top','wordsmith.social','write.bz','write.c7.io','write.linuxromania.ro','write.literatur.social','write.otter.homes','write.owu.one','write.tedomum.net','writeas.xyz','writee.org','writefreely.debian.social','writefreely.pl','demo.writefreely.host','publish.ministryofinternet.eu'];
// 经典邮箱型平台补充（writefreely 之外的 veins）
$classic = ['bearblog.dev','bearblog.com','mataroa.blog','dreamwidth.org','insanejournal.com','livejournal.com','blog.fc2.com','justpaste.it','telegra.ph','poetrypoem.com','banglalibrary.net','bloggersmeet.com','blogspot.com','blogger.com','modoology.com','thinkspot.com','blogs.baruch.edu','journals.worldnomads.com','write.as','vingle.net','plurk.com','ok.ru','virily.com','creatorlink.com','stripo.blog'];
$blogs = array_unique(array_merge($wfRaw, $classic));

$dirs = array_map('trim', file('D:/Github/backlink_skills/tmp_recon/win1000_dir_cands.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES));
$dirs = array_map(fn($d) => preg_replace('/^www\./', '', $d), $dirs);
$dirs = array_unique($dirs);

// ---------- 3. 去重 ----------
$skip = ['mataroa.blog','write.as','benert.pl','musing.studio','blog.dtth.ch','fedi.dev','the-federation.info','o0o0.o0o0.my','telegra.ph','justpaste.it','blogspot.com','blogger.com','livejournal.com','blog.fc2.com','dreamwidth.org','insanejournal.com'];
$blogNet = []; $dirNet = [];
foreach ($blogs as $b) { $b = preg_replace('/^www\./', '', $b); if (!isset($have[$b]) && !in_array($b, $skip)) $blogNet[$b] = 1; }
foreach ($dirs as $d) { if (!isset($have[$d])) $dirNet[$d] = 1; }
$blogNet = array_keys($blogNet); $dirNet = array_keys($dirNet);
echo "净候选(去重后): BLOG=" . count($blogNet) . " DIR=" . count($dirNet) . "\n";

// ---------- 4. curl_multi 验活 ----------
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

// 4a. 博客: root 探活 → 活站探 /signup
$pairs = []; $map = [];
foreach ($blogNet as $i => $b) { $pairs[$i] = ['url'=>"https://$b/", 'host'=>$b, 'stage'=>1]; }
$res = probe($pairs);
$blogAlive = []; $blogDead = [];
$pairs2 = []; 
foreach ($res as $i => $r) {
    $h = $r['p']['host'];
    if ($r['code'] == 200) { $blogAlive[$h] = ['code'=>200]; $pairs2[] = ['url'=>"https://$h/signup", 'host'=>$h, 'stage'=>2]; }
    elseif ($r['code'] > 0 && $r['code'] < 400) { $blogAlive[$h] = ['code'=>$r['code']]; $pairs2[] = ['url'=>"https://$h/register", 'host'=>$h, 'stage'=>2]; }
    else { $blogDead[$h] = "root {$r['code']}"; }
}
$res2 = $pairs2 ? probe($pairs2) : [];
foreach ($res2 as $r) {
    $h = $r['p']['host'];
    $emailish = stripos($r['html'], 'email') !== false || stripos($r['html'], 'username') !== false;
    $blogAlive[$h]['signup'] = ($r['code'] == 200 ? "signup/{$r['code']}" : "signup/{$r['code']}") . ($emailish ? '+email痕迹' : '?');
}
echo "\n=== BLOG 活(" . count($blogAlive) . ") ===\n";
foreach ($blogAlive as $h => $s) echo "  $h | root={$s['code']} {$s['signup']}\n";
echo "=== BLOG 死(" . count($blogDead) . ") ===\n" . implode(' ', array_map(fn($k, $v) => "$k($v)", array_keys($blogDead), $blogDead)) . "\n";

// 4b. 目录: root 探活 → 活站找 submit 入口
$pairs = [];
foreach ($dirNet as $d) { $pairs[] = ['url'=>"https://$d/", 'host'=>$d]; }
$res = probe($pairs);
$dirAlive = []; $dirDead = []; $pairs3 = [];
foreach ($res as $r) {
    $h = $r['p']['host'];
    if ($r['code'] == 200 || ($r['code'] > 0 && $r['code'] < 400)) {
        $hasForm = stripos($r['html'], '<form') !== false;
        $dirAlive[$h] = "root={$r['code']} form=" . ($hasForm ? 'Y' : '?');
        $pairs3[] = ['url'=>"https://$h/submit", 'host'=>$h];
    } else { $dirDead[$h] = $r['code']; }
}
$res3 = $pairs3 ? probe($pairs3) : [];
$dirSubmit = [];
foreach ($res3 as $r) {
    $h = $r['p']['host'];
    $formish = stripos($r['html'], '<form') !== false || stripos($r['html'], 'title') !== false;
    $dirSubmit[$h] = "submit/{$r['code']}" . ($formish ? '+表单痕迹' : '');
}
arsort($dirDead);
echo "\n=== DIR 活(" . count($dirAlive) . ") ===\n";
foreach ($dirAlive as $h => $s) echo "  $h | $s | {$dirSubmit[$h]}\n";
echo "=== DIR 死(" . count($dirDead) . ") ===\n" . implode(' ', array_map(fn($k, $v) => "$k($v)", array_keys($dirDead), $dirDead)) . "\n";

file_put_contents('D:/Github/backlink_skills/tmp_recon/win1000_scout_result.json', json_encode(['blogAlive'=>$blogAlive,'blogDead'=>$blogDead,'dirAlive'=>$dirAlive,'dirDead'=>$dirDead,'dirSubmit'=>$dirSubmit], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
echo "\n结果已存 tmp_recon/win1000_scout_result.json\n";
