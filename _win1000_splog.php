<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
DB::table('backlink_publish_logs')->insert([
    'url' => 'https://www.sitepromotiondirectory.com/submit.php',
    'note' => 'win1000(C机4号线): sitepromotiondirectory.com task7 zakaihu.com, 9224 phpLD: normal档+Business420+标题变体(ZA Bank HK: Account Opening Steps...防not unique)+码574655, "Link submitted and awaiting approval"——5站家族矩阵25/25补齐',
    'status' => 'pending_check',
    'created_at' => now(), 'updated_at' => now(),
]);
echo "log written\n";
// 顺带把昨天同站同任务的5条FAIL作废说明更新
$fixed = DB::table('backlink_publish_logs')->where('status','fail')->where('url','like','%sitepromotiondirectory%')->where('note','like','%task7%')->whereNull('url_fixed_at')->count();
echo "相关FAIL记录: {$fixed}\n";
