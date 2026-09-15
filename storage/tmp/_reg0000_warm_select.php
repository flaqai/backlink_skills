<?php
// reg0000: C机verified账号发文机会盘点
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$acs = DB::table('blog_accounts')
    ->where('machine', 'C')
    ->whereIn('status', ['registered', 'verified'])
    ->orderBy('domain')
    ->get(['id', 'domain', 'status', 'username', 'email', 'cookies', 'last_published_at']);

foreach ($acs as $a) {
    $ckLen = $a->cookies ? strlen($a->cookies) : 0;
    // 今日已发?
    $today = DB::table('blog_writer_posts')
        ->where('blog_account_id', $a->id)
        ->whereDate('created_at', today())->count();
    $total = DB::table('blog_writer_posts')->where('blog_account_id', $a->id)->count();
    printf("%s|#%s|%s|ck%d|today%d|total%d|last:%s\n", $a->domain, $a->id, $a->status, $ckLen, $today, $total, $a->last_published_at);
}
