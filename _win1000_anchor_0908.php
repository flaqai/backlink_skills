<?php
// _win1000_anchor_0908.php: 近24h已发文章线上锚链批量核查（win1000验收②）
// 输出: N/N 通过率 + 坏链清单（无锚/非200/页面丢失）
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$rows = DB::table('blog_writer_posts as p')
    ->where('p.status', 'published')
    ->where('p.published_at', '>=', now()->subDay())
    ->orderBy('p.published_at')
    ->get(['p.id', 'p.title', 'p.published_url', 'p.published_at', 'p.target_url as target']);

$items = [];
foreach ($rows as $r) {
    if (!$r->published_url || !$r->target) continue;
    $items[] = ['id' => $r->id, 'url' => $r->published_url, 'target' => $r->target, 'title' => $r->title];
}
echo "待核查(有url+target): " . count($items) . " / 总" . count($rows) . "\n";

function probe(array $items) {
    $qm = curl_multi_init(); $tasks = []; $out = [];
    foreach ($items as $i => $it) {
        $ch = curl_init($it['url']);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 3,
            CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
            CURLOPT_ENCODING => '',
        ]);
        curl_multi_add_handle($qm, $ch); $tasks[$i] = ['it' => $it, 'ch' => $ch];
    }
    do { $st = curl_multi_exec($qm, $running); if ($running) curl_multi_select($qm, 0.4); } while ($running && $st == CURLM_OK);
    foreach ($tasks as $i => $t) {
        $html = curl_multi_getcontent($t['ch']);
        $out[$i] = [
            'code' => curl_getinfo($t['ch'], CURLINFO_HTTP_CODE),
            'final' => curl_getinfo($t['ch'], CURLINFO_EFFECTIVE_URL),
            'html' => (string)$html,
            'it' => $t['it'],
        ];
        curl_multi_remove_handle($qm, $t['ch']); curl_close($t['ch']);
    }
    curl_multi_close($qm);
    return $out;
}

$pass = 0; $fail = [];
$bad = [];
foreach (array_chunk($items, 40) as $ci => $chunk) {
    foreach (probe($chunk) as $r) {
        $it = $r['it'];
        $host = strtolower(preg_replace('/^www\./', '', parse_url($it['target'], PHP_URL_HOST) ?: ''));
        $ok = false; $why = '';
        if ($r['code'] != 200) {
            $why = "HTTP {$r['code']}";
        } else {
            if ($host && stripos($r['html'], $host) !== false) {
                // 域名出现 + 带锚链标签才算
                if (preg_match('#<a[^>]+href=["\'][^"\']*' . preg_quote($host, '/') . '[^>]*>#i', $r['html'])) $ok = true;
                else $why = '域名出现但无<a>锚链';
            } else {
                $why = '页面无目标域痕迹';
            }
        }
        if ($ok) { $pass++; }
        else { $fail[] = "id{$it['id']} [{$why}] {$it['url']} -> {$it['target']}"; $bad[$why][] = $it['id']; }
    }
}
echo "\n=== 结果: {$pass}/" . count($items) . " 锚链在线 ===\n";
foreach ($fail as $f) echo $f . "\n";
echo "\n坏因汇总: " . json_encode(array_map('count', $bad)) . "\n";
file_put_contents('D:/Github/backlink_skills/tmp_recon/anchor_0908.json', json_encode(['pass' => $pass, 'total' => count($items), 'fail' => $fail, 'bad' => array_map('count', $bad)], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
