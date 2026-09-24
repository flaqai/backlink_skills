<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
DB::table('backlink_publish_logs')->where('id', 1098)->update(['status' => 'completed', 'updated_at' => now()]);
echo "1098 -> completed\n";
