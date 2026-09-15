<?php
// reg0000 0909 固化: Netscape curl cookie 文件 → login.mjs JSON (cookies/default/<域名>.json)
// 用法: php _reg0000_ckconv.php <netscape.txt> <domain> [scope]
// ★坑: #HttpOnly_ 前缀行必须先去前缀再判注释(reg2200/reg0000 两班踩同坑)
$in = $argv[1] ?? ''; $dom = $argv[2] ?? ''; $scope = $argv[3] ?? 'default';
if (!$in || !$dom) { fwrite(STDERR, "usage: php _reg0000_ckconv.php <netscape.txt> <domain> [scope]\n"); exit(1); }
$lines = explode("\n", file_get_contents($in));
$cookies = [];
foreach ($lines as $l) {
    $l = rtrim($l, "\r");
    if ($l === '') continue;
    $ho = false;
    if (strpos($l, '#HttpOnly_') === 0) { $ho = true; $l = substr($l, 10); }
    elseif ($l[0] === '#') continue;
    if (substr_count($l, "\t") < 6) continue;
    $p = explode("\t", $l);
    $cookies[] = ['domain'=>$p[0], 'path'=>$p[2], 'secure'=>($p[3]==='TRUE'), 'httpOnly'=>$ho, 'expires'=>(int)$p[4], 'name'=>$p[5], 'value'=>$p[6]];
}
$out = ['domain'=>$dom, 'scope'=>$scope, 'saved_at'=>date('c'), 'cookies'=>$cookies];
$file = "D:/Github/backlink_skills/cookies/{$scope}/{$dom}.json";
file_put_contents($file, json_encode($out, JSON_PRETTY_PRINT));
echo "converted=".count($cookies)." -> {$file}\n";
