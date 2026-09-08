<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
foreach ([115, 216] as $id) {
    $a = DB::table('blog_accounts')->where('id', $id)->first();
    if ($a) echo "id{$id} platform={$a->platform} domain=" . ($a->domain ?? '') . " email=" . ($a->email ?? '') . " status={$a->status} cookies_len=" . strlen($a->cookies ?? '') . " note=" . substr(($a->manual_login_note ?? $a->note ?? ''), 0, 100) . "\n";
}
// 974 同账号文章再确认
$p = DB::table('blog_writer_posts')->whereIn('id', [969, 972, 974])->get(['id','blog_account_id','title','published_url','theme']);
foreach ($p as $r) echo "post{$r->id} acct={$r->blog_account_id} {$r->published_url}\n";
