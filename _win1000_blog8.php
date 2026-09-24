<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$have = [];
foreach (DB::table('backlinks')->get(['url']) as $b) { $h = parse_url($b->url, PHP_URL_HOST); if ($h) $have[strtolower(preg_replace('/^www\./','',$h))] = 1; }
foreach (DB::table('blog_accounts')->get(['domain','platform']) as $a) { foreach ([$a->domain,$a->platform] as $v) { if ($v) $have[strtolower(preg_replace('/^www\./','',$v))] = 1; } }
$cands = ['ucoz.com','nethouse.ru','webstarts.com','puzl.com','jigsy.com','page.tl','blogsport.com','freeblogit.com'];
$qm = curl_multi_init(); $tasks = [];
foreach ($cands as $b) {
    $skip = isset($have[$b]) ? 1 : 0;
    $ch = curl_init("https://$b/");
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_TIMEOUT=>12, CURLOPT_CONNECTTIMEOUT=>8, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_ENCODING=>'', CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0']);
    curl_multi_add_handle($qm, $ch); $tasks[$b] = ['skip'=>$skip, 'ch'=>$ch];
}
do { $st = curl_multi_exec($qm, $running); if ($running) curl_multi_select($qm, 0.3); } while ($running && $st == CURLM_OK);
foreach ($tasks as $b => $t) {
    $code = curl_getinfo($t['ch'], CURLINFO_HTTP_CODE);
    $html = (string)curl_multi_getcontent($t['ch']);
    $sig = stripos($html,'sign up')!==false || stripos($html,'register')!==false || stripos($html,'create')!==false || stripos($html,'sing up')!==false || stripos($html,'регистрация')!==false;
    echo "  $b | root={$code} 注册入口=" . ($sig?'Y':'?') . " " . ($t['skip'] ? '库内已有' : '净新') . "\n";
    curl_multi_remove_handle($qm, $t['ch']); curl_close($t['ch']);
}
curl_multi_close($qm);
