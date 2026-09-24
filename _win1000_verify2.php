<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
// 库内已有
$have = [];
foreach (DB::table('blog_accounts')->get(['domain','platform']) as $a) { $have[strtolower($a->domain ?: $a->platform)] = 1; }
$skip = ['benert.pl','bolha.blog','writefreely.pl','rant.li','write.as','cdn.writeas.net','developers.write.as','discuss.write.as','fedidb.org','api.ahrefs.com','ahrefs.com','sell.g2.com','theresanaiforthat.com','300aidirectories.com','tapscape.com'];

$blogHosts = array_filter(array_map(function($l){ return trim(str_replace('https://','',$l)); }, file('D:/Github/backlink_skills/tmp_recon/wf_hosts.txt')), function($h) use ($have, $skip) {
    return $h && !isset($have[$h]) && !isset($skip[$h]) && strpos($h,'writefreely')===false && strpos($h,'write.as')===false;
});
$dirHosts = array_filter(file('D:/Github/backlink_skills/tmp_recon/fresh_dir.txt', FILE_IGNORE_NEW_LINES), function($h) use ($skip) {
    $b = basename($h); foreach ($skip as $s) { if (strpos($b,$s)!==false) return false; } return $b && !preg_match('/ahrefs|g2\.com|tapscape/',$b);
});
echo "BLOG候选验活: " . count($blogHosts) . " / DIR候选验活: " . count($dirHosts) . "\n";

function probe(array $hosts, array $paths) {
    $qm = curl_multi_init(); $tasks = []; $results = [];
    foreach ($hosts as $h) {
        foreach ($paths as $p) {
            $url = "https://$h/$p";
            $ch = curl_init($url);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_MAXREDIRS=>2, CURLOPT_TIMEOUT=>9, CURLOPT_CONNECTTIMEOUT=>6, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0']);
            curl_multi_add_handle($qm, $ch); $tasks[(int)$ch] = ['host'=>$h, 'path'=>$p, 'ch'=>$ch];
        }
    }
    do { $st = curl_multi_exec($qm, $running); if ($running) curl_multi_select($qm, 0.3); } while ($running && $st == CURLM_OK);
    foreach ($tasks as $t) {
        $html = curl_multi_getcontent($t['ch']);
        $code = curl_getinfo($t['ch'], CURLINFO_HTTP_CODE);
        $results[$t['host']][$t['path']] = ['code'=>$code, 'len'=>strlen((string)$html), 'html'=>$html ? substr($html,0,4000) : ''];
        curl_multi_remove_handle($qm, $t['ch']); curl_close($t['ch']);
    }
    curl_multi_close($qm);
    return $results;
}

$blogRes = probe($blogHosts, ['', 'signup']);
$dirRes = probe($dirHosts, ['submit.php', 'submit']);
echo "两轮探测完成\n";
$blogAlive = []; $dirAlive = [];
foreach ($blogRes as $h => $ps) {
    $home = $ps[''] ?? ['code'=>0]; $su = $ps['signup'] ?? ['code'=>0];
    $emailType = (strpos($home['html'].$su['html'], 'signup') !== false || strpos($home['html'].$su['html'], 'Sign up') !== false || $su['code'] == 200);
    if ($home['code'] == 200 || ($home['code'] > 0 && $home['code'] < 400)) { $blogAlive[$h] = sprintf("home=%d signup=%d email型=%s", $home['code'], $su['code'], $emailType ? 'Y' : '?'); }
}
foreach ($dirRes as $h => $ps) {
    $s1 = $ps['submit.php'] ?? ['code'=>0]; $s2 = $ps['submit'] ?? ['code'=>0];
    $best = $s1['code'] == 200 ? $s1 : ($s2['code'] == 200 ? $s2 : null);
    $hasForm = $best && (strpos($best['html'], '<form') !== false || stripos($best['html'], 'TITLE') !== false);
    if ($best) { $dirAlive[$h] = sprintf("submit入口=%d 表单=%s", $best['code'], $hasForm ? 'Y' : '?'); }
}
echo "\n=== BLOG 活: " . count($blogAlive) . "\n";
foreach ($blogAlive as $h => $s) echo "  $h | $s\n";
echo "\n=== DIR 活: " . count($dirAlive) . "\n";
foreach ($dirAlive as $h => $s) echo "  $h | $s\n";
file_put_contents('D:/Github/backlink_skills/tmp_recon/alive_result.json', json_encode(['blog'=>$blogAlive, 'dir'=>$dirAlive], JSON_PRETTY_PRINT));
