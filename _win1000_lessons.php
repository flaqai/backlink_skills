<?php
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$rows = DB::table('backlink_publish_logs')->where('url','like','%directorynode%')->orderByDesc('id')->get(['id','url','note','status','created_at']);
foreach ($rows as $r) echo "log{$r->id} [{$r->status}] {$r->created_at}\n  url: {$r->url}\n  note: " . substr($r->note,0,400) . "\n";
