<?php
// reg0000: pending池 C机可注册候选查询
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$rows = DB::table('blog_accounts')
    ->where('status', 'pending')
    ->whereNull('machine')
    ->where('dr', '>=', 20)
    ->orderByDesc('dr')
    ->get(['id', 'domain', 'platform', 'dr']);

$c = 0;
foreach ($rows as $x) {
    $dom = $x->domain;
    $has = DB::table('blog_accounts')->where('domain', $dom)
        ->whereIn('status', ['registered', 'verified', 'disabled', 'banned', 'suspended'])
        ->where('machine', 'C')->count();
    $anyReg = DB::table('blog_accounts')->where('domain', $dom)
        ->whereIn('status', ['registered', 'verified'])->count();
    if ($has == 0) {
        printf("%s|%s|dr%s|id%s|regCnt%d\n", $dom, $x->platform, $x->dr, $x->id, $anyReg);
        $c++;
    }
    if ($c >= 40) break;
}
echo "TOTAL_SHOWN={$c}\n";
