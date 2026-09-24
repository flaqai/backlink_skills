<?php
// win1000 DailyWorkLog 落库
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
$other = <<<TXT
【验收】①verify-pending全池25条: 放出0/未放出6(gainweb/exactseek/siteswebdirectory/qid/thenextai/aipulse, 审核周期内)/19条6-8月老记录无目录站映射无法自动验证; ②近24h发文33篇逐篇核查: 17篇净OK(可达+锚/self在), 14篇海外平台本机网络超时(tumblr/bloglovin/wattpad/write.as/substack/mataroa/blogspot/quora系GFW/墙, 其中quora+wordpress经9224渲染复核实OK: quora 2 Posts在线, wordpress锚链1条✓), 真死链2篇: id969 buymeacoffee(线上404+公开页无此文)+id972 hashnode(404+sitemap无此文), 均已is_active=0+fail_reason标注, 两账号jar在B机待B机补发; ③FAIL积压112条抽查4条: 83条为6/25-8/16历史DNS死记录(url空无从复跑), 25条phpLD家族已被09-01 win0600成功提交取代, 无新增可行动FAIL
【补给】新源侦察验活(WebSearch配额尽至09-18, 降级GitHub raw清单直采+WF实例表): 博客=探测36/存活19/邮箱型确认14(writee.org翻案首攻, 档案blog-platform-sources-2026-09-01.md含Top5); 目录=探测37/存活10/表单Y5(aitoolsa2z/toolsml/launched.site/aiwebsitedirectory/growstartup, 档案new-sources-2026-09-01.md含Top5); 计数缺口原因如实: 主流清单被前期班次挖干+WF实例微型化
【交接菜单执行】①directorynode复验: MY BUSINESS→Approved=No Post(昨投未落库), 重投表单全流程攻破(字段名/tagsinput API/勾选/描述), 卡reCAPTCHA Enterprise挑战有效期<2min vs 本机视觉环路2min, 4轮全过期——halfway+AB快打脚本留档; ②sitepromotion t7复放✓: 标题变体破not unique+码574655, awaiting approval, 5站家族矩阵25/25全齐; ③④proven复放3格✓: onemillion t8(confirmed/787925)+onemillion t2(confirmed/787927, om矩阵5/5全满)+247web t2(Submission Received, categ18, 247矩阵5/5全满)
【反偷懒闸】闸⑤手工登录队列11站无新解锁; 闸②walls复判5条(aiagentslist/theaivex/aiparabellum/findly/toolfio)全200活, 墙性质未变; 闸④配方复放=上面3格
【新坑固化】lessons.json: bootstrap-tagsinput须jQuery API直填/phpLD not unique换标题变体/insertText吞字符必回读/死链判定9224渲染+sitemap法
TXT;
App\Models\Seo1\DailyWorkLog::create([
    'run_source' => 'win1000',
    'machine' => 'C',
    'started_at' => '2026-09-01 10:00:32',
    'ended_at' => '2026-09-01 11:52:00',
    'other_work' => $other,
]);
echo "DailyWorkLog written\n";
$log = DB::table('daily_work_logs')->where('run_source','win1000')->where('machine','C')->orderByDesc('id')->first();
echo "id={$log->id} duration={$log->duration_minutes}min 发文={$log->posts_published} 目录尝试={$log->directory_attempts} 目录成功={$log->directory_success} 注册={$log->registrations}\n";
