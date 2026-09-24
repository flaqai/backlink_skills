<?php
// reg0000: C机 pending/manual_login 候选按DR降序
$d = json_decode(file_get_contents("D:/Github/backlink_skills/cdp/_reg0000_accs.json"), true);
$rows = $d['data']['data'] ?? $d['data'];
echo "total_rows=" . count($rows) . "\n";
$cand = [];
foreach ($rows as $r) {
    if (($r['machine'] ?? '') == 'C' && in_array($r['status'], ['pending', 'manual_login'])) {
        $cand[] = $r;
    }
}
usort($cand, function ($a, $b) {
    return ($b['dr'] ?? 0) <=> ($a['dr'] ?? 0);
});
foreach ($cand as $r) {
    echo $r['id'] . " " . $r['domain'] . " dr=" . ($r['dr'] ?? '-') . " st=" . $r['status'] . " pl=" . ($r['platform'] ?? '-') . "\n";
}
echo "C-pending=" . count($cand) . "\n";

// 全库前缀防撞检查
echo "\n== prefix check (92ng) ==\n";
foreach (['patch', 'flickr', 'instruct', 'slashdot'] as $p) {
    $hit = 0;
    foreach ($rows as $r) {
        if (stripos($r['email'] ?? '', $p . '@92ng.com') === 0) $hit++;
    }
    echo "$p@92ng.com hits=$hit\n";
}
