<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$rows = DB::table('backlink_publish_logs')->where('note','like','%win1000%')->orderByDesc('id')->get(['id','url','status']);
echo "win1000 本班日志 " . count($rows) . " 条:\n";
foreach ($rows as $r) echo "  #{$r->id} [{$r->status}] {$r->url}\n";
$dead = DB::table('blog_writer_posts')->whereIn('id',[969,972])->get(['id','is_active']);
foreach ($dead as $d) echo "  死链 post{$d->id} is_active={$d->is_active}\n";
