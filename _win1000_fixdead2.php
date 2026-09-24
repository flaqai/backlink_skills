<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$statuses = DB::table('blog_writer_posts')->selectRaw('status, count(*) c')->groupBy('status')->get();
foreach ($statuses as $s) echo "status={$s->c} x {$s->c}\n";
echo "---\n";
DB::table('blog_writer_posts')->where('id', 969)->update([
    'fail_reason' => '[win1000 C机09-01核查] 线上404, 帖子已从公开页消失; B机账号(jar在B机)补发后清此标记',
    'is_active' => 0,
]);
DB::table('blog_writer_posts')->where('id', 972)->update([
    'fail_reason' => '[win1000 C机09-01核查] 线上404+sitemap无此文, 疑仅存草稿未发布; B机账号补发后清此标记',
    'is_active' => 0,
]);
echo "969/972 marked is_active=0 + fail_reason\n";
