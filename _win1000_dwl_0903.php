<?php
// win1000 DWL writer (temporary bootstrap, 0903)
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$other = <<<TXT
[验收①verify-pending] 全池复核: 放出0/未放出6(gainweb/exactseek/siteswebdirectory/qualityinternetdirectory/thenextai/aipulse周期内未放正常)/无法自动验证23, 无恶化
[验收②近24h发文锚链] 21篇curl层逐篇核查: 17/21净OK(页200+目标域锚串在raw HTML); 坏链1=#1002 wordpress204(正文无generatorforhouse串, DB已标failed=前班已定性, 修复需wp编辑器会话归发文班); 3条假阴性嫌疑=#155 journoportfolio/#1004 hatena/#1007 reddit(页200但curl无锚串, 均客户端渲染平台且前班渲染实证过✓); 本班无新增坏链无需当班补
[验收③FAIL积压] backlink_publish_logs status=fail=0, 无积压无抽查需求(pending=14与验收①对应)
[补给侦察验活] 档案提取1054域名→对backlinks.domain+blog_accounts.platform全库去重941→剔除19已知walls→curl_multi全量验活(12s超时): 博客类live=325/dead=96, 目录类live=395/dead=122, 交叉both=3 — 博客325+目录395远超30+30双达标
[补给档案] new-sources-2026-09-03.md + blog-platform-sources-2026-09-03.md + _win1000_supply_result.json 已cp sync-data; Top5目录=bunny.directory/backlinkbot.ai/aihunted.com/startuptrusted.com/solopush.com; Top5博客=micro.blog/typeshare.co/pika.page/thoughts.page/blot.im(备选bolha.blog/writefreely.pl两writefreely实例live)
[交接菜单处置] win0800菜单: ①startups.watch确认信08:36提交至11:38仍未到(>3h异常, 待重发确认信或弃号, 本班agently搜索实证空) ②topsimilarsites t8/t10复放未做=本班主责验收+补给吃满窗口 ③SPA三站探入口未做=同因 ④startupslab排期halfway未攻=同因; 本班晚触发11:32(定时10:00), 用户令工作至11:55, 实际执行窗约23分钟全数投入验收+补给
[其他] Bash sleep=0次全程无sleep空转; 9224本班未动(纯curl/tinker班); WebSearch未用(前班配额尽)
TXT;

\App\Models\Seo1\DailyWorkLog::create([
  'run_source' => 'win1000',
  'machine' => 'C',
  'started_at' => '2026-09-03 11:32:25',
  'ended_at' => date('Y-m-d H:i:s'),
  'other_work' => $other,
]);
echo 'DWL_OK id='. \DB::table('daily_work_logs')->where('run_source','win1000')->where('machine','C')->orderByDesc('id')->value('id') . PHP_EOL;
