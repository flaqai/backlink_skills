<?php
// _win1000_scout4_0908.php: 入口精化——目录活站根页找真实提交入口链接 + 博客404-signup站入口确认
require 'D:/Github/seoadminC/vendor/autoload.php';

function probeFull(array $pairs) {
    $qm = curl_multi_init(); $tasks = []; $out = [];
    foreach ($pairs as $i => $p) {
        $ch = curl_init($p['url']);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_MAXREDIRS=>2, CURLOPT_TIMEOUT=>14, CURLOPT_CONNECTTIMEOUT=>8, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_ENCODING=>'', CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0']);
        curl_multi_add_handle($qm, $ch); $tasks[$i] = ['p'=>$p, 'ch'=>$ch];
    }
    do { $st = curl_multi_exec($qm, $running); if ($running) curl_multi_select($qm, 0.3); } while ($running && $st == CURLM_OK);
    foreach ($tasks as $i => $t) {
        $out[$i] = ['code'=>curl_getinfo($t['ch'], CURLINFO_HTTP_CODE), 'html'=>(string)curl_multi_getcontent($t['ch']), 'p'=>$t['p']];
        curl_multi_remove_handle($qm, $t['ch']); curl_close($t['ch']);
    }
    curl_multi_close($qm);
    return $out;
}

// ---- 目录：根页找提交入口 ----
$alive = json_decode(file_get_contents('D:/Github/backlink_skills/tmp_recon/win1000_scout3_result.json'), true)['alive'];
$hosts = array_keys($alive);
echo "目录活站复验入口: " . count($hosts) . "\n";
$dirEntry = [];
foreach (array_chunk($hosts, 50) as $chunk) {
    $pairs = []; foreach ($chunk as $h) $pairs[] = ['url'=>"https://$h/", 'host'=>$h];
    foreach (probeFull($pairs) as $r) {
        $h = $r['p']['host'];
        if ($r['code'] != 200 || strlen($r['html']) < 500) continue;
        // 根页里找提交入口链接/表单
        $hit = [];
        if (preg_match('#href=["\'][^"\']*(submit|add[-_]?url|add[-_]?site|add[-_]?listing|suggest[-_]?listing|submit[-a-z]*tool)[^"\']*["\']#i', $r['html'], $m)) $hit[] = 'link:' . strtolower(substr($m[1], 0, 18));
        if (preg_match('#<form[^>]*(submit|add[-_]?url|add[-_]?site)#i', $r['html'])) $hit[] = 'form:submit';
        if (stripos($r['html'], 'submit your') !== false || stripos($r['html'], 'add your') !== false || stripos($r['html'], 'list your') !== false) $hit[] = 'text:submit-your';
        if ($hit) $dirEntry[$h] = implode(',', $hit);
    }
}
echo "有提交入口实锤: " . count($dirEntry) . "\n";
foreach ($dirEntry as $h => $s) echo "  $h | $s\n";
file_put_contents('D:/Github/backlink_skills/tmp_recon/win1000_direntry.json', json_encode($dirEntry, JSON_PRETTY_PRINT));

// ---- 博客：404-signup站根页找注册入口 ----
$blogCheck = ['antville.org','soulcast.com','writefreely.host','wordcartoons.com','thecitylists.com','journals.worldnomads.com','blogigo.com','diary.ru','journalspace.com','bloghaven.com'];
echo "\n博客入口确认:\n";
$blogEntry = [];
$pairs = []; foreach ($blogCheck as $b) { $pairs[] = ['url'=>"https://$b/", 'host'=>$b]; }
foreach (probeFull($pairs) as $r) {
    $h = $r['p']['host'];
    $hits = [];
    if (preg_match('#href=["\'][^"\']*(signup|sign-up|register|create[^"\']*(blog|account)|join)[^"\']*["\']#i', $r['html'], $m)) $hits[] = 'link:' . strtolower(substr($m[1], 0, 20));
    if (stripos($r['html'], '<form') !== false && (stripos($r['html'], 'email') !== false)) $hits[] = 'form+email';
    echo "  $h | root={$r['code']} " . (implode(',', $hits) ?: '无入口痕迹') . "\n";
    if ($hits) $blogEntry[$h] = implode(',', $hits);
}
file_put_contents('D:/Github/backlink_skills/tmp_recon/win1000_blogentry.json', json_encode($blogEntry, JSON_PRETTY_PRINT));
