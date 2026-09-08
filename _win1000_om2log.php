<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
DB::table('backlink_publish_logs')->insert([
    'backlink_publish_task_id' => 2,
    'keyword_group_id' => DB::table('backlink_publish_tasks')->where('id',2)->value('keyword_group_id'),
    'backlink_id' => DB::table('backlinks')->where('domain','like','%onemilliondirectory%')->value('id'),
    'url' => 'https://onemilliondirectory.com/submit?c=8&t=2',
    'note' => 'win1000(C机4号线): onemilliondirectory.com task2 smogcheck-nearme.com, 登录态直投 t=2 c=8 Business, confirmed/787927 ✓',
    'publish_type' => 'submitted', 'published_at' => now(), 'status' => 'completed',
    'created_at' => now(), 'updated_at' => now(),
]);
echo "om t2 log written\n";
