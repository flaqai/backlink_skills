<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
DB::table('backlink_publish_logs')->where('id', 1097)->update([
    'backlink_publish_task_id' => 7,
    'keyword_group_id' => DB::table('backlink_publish_tasks')->where('id',7)->value('keyword_group_id'),
    'backlink_id' => DB::table('backlinks')->where('domain','like','%sitepromotiondirectory%')->value('id'),
    'publish_type' => 'submitted', 'status' => 'pending_check',
    'updated_at' => now(),
]);
DB::table('backlink_publish_logs')->where('id', 1098)->update([
    'backlink_publish_task_id' => 8,
    'keyword_group_id' => DB::table('backlink_publish_tasks')->where('id',8)->value('keyword_group_id'),
    'backlink_id' => DB::table('backlinks')->where('domain','like','%onemilliondirectory%')->value('id'),
    'publish_type' => 'submitted',
    'updated_at' => now(),
]);
DB::table('backlink_publish_logs')->where('id', 1099)->update([
    'backlink_publish_task_id' => 2,
    'keyword_group_id' => DB::table('backlink_publish_tasks')->where('id',2)->value('keyword_group_id'),
    'updated_at' => now(),
]);
echo "1097/1098/1099 task字段补齐\n";
