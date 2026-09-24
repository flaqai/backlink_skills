<?php
// _win1000_scout3_0908.php: win1000补给第三批（813目录候选批量去重验活 + 博客入口确认）
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$have = [];
foreach (DB::table('backlinks')->get(['url']) as $b) { $h = parse_url($b->url, PHP_URL_HOST); if ($h) $have[strtolower(preg_replace('/^www\./','',$h))] = 1; }
foreach (DB::table('blog_accounts')->get(['domain','platform']) as $a) { foreach ([$a->domain,$a->platform] as $v) { if ($v) $have[strtolower(preg_replace('/^www\./','',$v))] = 1; } }

$prev2 = json_decode(file_get_contents('D:/Github/backlink_skills/tmp_recon/win1000_scout2_result.json'), true);
$done2 = array_fill_keys(array_keys(array_merge($prev2['dirAlive'], $prev2['dirDead'])), 1);

$cands = array_map('trim', file('D:/Github/backlink_skills/tmp_recon/win1000_dir_cands3.txt', FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES));
$cands = array_map(fn($d) => preg_replace('/^www\./','',$d), $cands);
$cands = array_values(array_unique(array_diff($cands, array_keys($have), array_keys($done2))));
echo "第三批净候选 DIR=" . count($cands) . "\n";

function probe(array $pairs) {
    $qm = curl_multi_init(); $tasks = []; $out = [];
    foreach ($pairs as $i => $p) {
        $ch = curl_init($p['url']);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_MAXREDIRS=>2, CURLOPT_TIMEOUT=>10, CURLOPT_CONNECTTIMEOUT=>6, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_ENCODING=>'', CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0']);
        curl_multi_add_handle($qm, $ch); $tasks[$i] = ['p'=>$p, 'ch'=>$ch];
    }
    do { $st = curl_multi_exec($qm, $running); if ($running) curl_multi_select($qm, 0.3); } while ($running && $st == CURLM_OK);
    foreach ($tasks as $i => $t) {
        $out[$i] = ['code'=>curl_getinfo($t['ch'], CURLINFO_HTTP_CODE), 'html'=>substr((string)curl_multi_getcontent($t['ch']), 0, 3000), 'p'=>$t['p']];
        curl_multi_remove_handle($qm, $t['ch']); curl_close($t['ch']);
    }
    curl_multi_close($qm);
    return $out;
}

$alive = []; $dead = []; $p2 = [];
foreach (array_chunk($cands, 60) as $chunk) {
    $pairs = []; foreach ($chunk as $d) $pairs[] = ['url'=>"https://$d/", 'host'=>$d];
    foreach (probe($pairs) as $r) {
        $h = $r['p']['host'];
        if ($r['code'] == 200 || ($r['code'] > 0 && $r['code'] < 400)) { $alive[$h] = "root={$r['code']}"; $p2[] = ['url'=>"https://$h/submit", 'host'=>$h]; }
        else $dead[$h] = $r['code'];
    }
}
foreach (array_chunk($p2, 60) as $chunk) {
    $pairs = []; foreach ($chunk as $p) $pairs[] = $p;
    foreach (probe($pairs) as $r) {
        $h = $r['p']['host'];
        $alive[$h] .= " submit/{$r['code']}" . (stripos($r['html'],'<form')!==false ? '+form' : '');
    }
}
arsort($alive);
echo "DIR3 活(" . count($alive) . "):\n"; foreach ($alive as $h => $s) echo "  $h | $s\n";
echo "DIR3 死(" . count($dead) . ")\n";
file_put_contents('D:/Github/backlink_skills/tmp_recon/win1000_scout3_result.json', json_encode(['alive'=>$alive,'dead'=>$dead], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
