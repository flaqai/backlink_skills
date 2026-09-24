<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$cols = DB::getSchemaBuilder()->getColumnListing('blog_writer_posts');
echo "columns: " . implode(',', $cols) . "\n";
// 标记两篇死链
DB::table('blog_writer_posts')->where('id', 969)->update(['note' => DB::raw("CONCAT(COALESCE(note,''), ' | [win1000 C机09-01核查] 线上404, 帖子已从公开页消失, B机账号(jar在B机)需补发')")]);
DB::table('blog_writer_posts')->where('id', 972)->update(['note' => DB::raw("CONCAT(COALESCE(note,''), ' | [win1000 C机09-01核查] 线上404+sitemap无此文, 疑仅存草稿未发布, B机账号需补发')")]);
echo "updated 969/972\n";
