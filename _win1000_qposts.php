<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$since = now()->subDay();
$rows = DB::table('blog_writer_posts')->where('published_at', '>=', $since)->orderBy('published_at')->get(['id','blog_account_id','target_url','published_url','title','theme','published_at']);
echo "近24h发文: ".count($rows)." 条\n";
foreach ($rows as $r) {
    echo "id{$r->id} acct={$r->blog_account_id} at={$r->published_at}\n  title: {$r->title}\n  pub: {$r->published_url}\n  target: {$r->target_url}\n";
}
$fail = DB::table('backlink_publish_logs')->whereIn('status',['fail','failed'])->count();
$pend = DB::table('backlink_publish_logs')->whereIn('status',['pending','pending_check'])->count();
echo "\nFAIL积压: {$fail} / 待审: {$pend}\n";
