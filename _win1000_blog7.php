<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$have = [];
foreach (DB::table('backlinks')->get(['url']) as $b) { $h = parse_url($b->url, PHP_URL_HOST); if ($h) $have[strtolower(preg_replace('/^www\./','',$h))] = 1; }
foreach (DB::table('blog_accounts')->get(['domain','platform']) as $a) { foreach ([$a->domain,$a->platform] as $v) { if ($v) $have[strtolower(preg_replace('/^www\./','',$v))] = 1; } }
foreach (['blog.shinobi.jp','svbtle.com','blogpaper?','mblg?'] as $c) {
    if (strpos($c,'?')!==false) continue;
    if (isset($have[$c])) { echo "  $c 库内已有跳过\n"; continue; }
    $ch = curl_init("https://$c/");
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_TIMEOUT=>12, CURLOPT_CONNECTTIMEOUT=>8, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_ENCODING=>'', CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0']);
    $html = (string)curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    $sig = stripos($html,'sign up')!==false || stripos($html,'signup')!==false || stripos($html,'register')!==false || stripos($html,'登録')!==false || stripos($html,'新規')!==false;
    echo "  $c | root={$code} 注册入口=" . ($sig?'Y':'?') . " len=" . strlen($html) . "\n";
}
