<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
DB::table('backlink_publish_logs')->insert([
    'url' => 'https://onemilliondirectory.com/submit?c=8&t=2',
    'note' => 'win1000(C机4号线): onemilliondirectory.com task8 generatorforhouse.org, 登录态(leoxm)直投 t=2免费档 c=8, turnstile无感过, confirmed/787925 ✓——配方复放+1',
    'status' => 'pending_check',
    'created_at' => now(), 'updated_at' => now(),
]);
echo "onemillion log written\n";
