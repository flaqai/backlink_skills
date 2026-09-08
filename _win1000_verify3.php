<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$have = [];
foreach (DB::table('blog_accounts')->get(['domain','platform']) as $a) { $have[strtolower($a->domain ?: $a->platform)] = 1; }
foreach (DB::table('backlinks')->get(['url']) as $b) { $h = parse_url($b->url, PHP_URL_HOST); if ($h) $have[strtolower(preg_replace('/^www\./','',$h))] = 1; }
$skip = ['benert.pl','musing.studio','blog.dtth.ch','fedidb.org','fedi.dev','the-federation.info','o0o0.o0o0.my','api.ahrefs.com','ahrefs.com','sell.g2.com','theresanaiforthat.com','300aidirectories.com'];
$txt = file_get_contents('D:/Github/backlink_skills/tmp_recon/payaix.md');
preg_match_all('#https?://([a-z0-9][a-z0-9\.\-]+\.[a-z]{2,})#i', $txt, $m);
$dirs = [];
foreach ($m[1] as $host) {
    $host = strtolower(preg_replace('/^www\./','',$host));
    if (preg_match('/github|shields|twitter|discord|telegram/i', $host)) continue;
    if (isset($have[$host]) || isset($skip[$host])) continue;
    $dirs[$host] = 1;
}
$dirs = array_diff(array_keys($dirs), ['aikaptan.com','aitoolsa2z.com','toolsml.com','launched.site','webtoolsweekly.com','growstartup.co','aiwebsitedirectory.com','best-ai-tools.org']);
$blogs = array_map('trim', file('D:/Github/backlink_skills/tmp_recon/fresh_blog2.txt', FILE_IGNORE_NEW_LINES));
$blogs = array_filter($blogs, function($h) use ($skip) { return $h && !in_array($h, $skip); });
echo "第三批: DIR=" . count($dirs) . " BLOG=" . count($blogs) . "\n";

function probe(array $pairs) {
    $qm = curl_multi_init(); $tasks = []; $results = [];
    foreach ($pairs as $i => $p) {
        $ch = curl_init($p['url']);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_FOLLOWLOCATION=>true, CURLOPT_MAXREDIRS=>2, CURLOPT_TIMEOUT=>9, CURLOPT_CONNECTTIMEOUT=>6, CURLOPT_SSL_VERIFYPEER=>false, CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0']);
        curl_multi_add_handle($qm, $ch); $tasks[$i] = ['p'=>$p, 'ch'=>$ch];
    }
    do { $st = curl_multi_exec($qm, $running); if ($running) curl_multi_select($qm, 0.3); } while ($running && $st == CURLM_OK);
    foreach ($tasks as $i => $t) {
        $html = curl_multi_getcontent($t['ch']);
        $results[$i] = ['code'=>curl_getinfo($t['ch'], CURLINFO_HTTP_CODE), 'html'=> substr((string)$html, 0, 3000)];
        curl_multi_remove_handle($qm, $t['ch']); curl_close($t['ch']);
    }
    curl_multi_close($qm);
    return $results;
}
$pairs = []; $map = [];
foreach ($dirs as $d) { $pairs[] = ['url'=>"https://$d/", 'kind'=>'dir', 'host'=>$d]; }
foreach ($blogs as $b) { $pairs[] = ['url'=>"https://$b/signup", 'kind'=>'blog', 'host'=>$b]; }
$res = probe($pairs);
$dirAlive = []; $blogAlive = [];
foreach ($res as $i => $r) {
    $p = $pairs[$i];
    if ($p['kind'] == 'dir') {
        if ($r['code'] == 200 || ($r['code'] > 0 && $r['code'] < 400)) {
            $hasForm = strpos($r['html'], '<form') !== false || stripos($r['html'], 'submit') !== false;
            $dirAlive[$p['host']] = "code={$r['code']} submit痕迹=" . ($hasForm ? 'Y' : '?');
        }
    } else {
        $email = stripos($r['html'], 'email') !== false || stripos($r['html'], 'sign up') !== false;
        if ($r['code'] == 200) $blogAlive[$p['host']] = "signup=200 邮箱型=" . ($email ? 'Y' : '?');
    }
}
echo "DIR 活:\n"; foreach ($dirAlive as $h => $s) echo "  $h | $s\n";
echo "BLOG 活:\n"; foreach ($blogAlive as $h => $s) echo "  $h | $s\n";
file_put_contents('D:/Github/backlink_skills/tmp_recon/alive_result3.json', json_encode(['blog'=>$blogAlive,'dir'=>$dirAlive], JSON_PRETTY_PRINT));
