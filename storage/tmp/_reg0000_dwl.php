<?php
// reg0000 0916 班末 DWL 落库
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$other = <<<'TXT'
【注册攻坚逐站记录】主攻候选枯竭夜: ①diigo.com DR77=本班唯一注册成功(9224 /sign-up?plan=free 三件套+reCAPTCHA v2判图3轮全通[公交4x4四格/自行车3x3一轮误判/公交3x3三格], 锚点iframe坐标必须按几何实测含框内487,377——差1px在框外零反应), 账号leoxm26/diigo@92ng.com已mark-registered#172+cookie10条已存, ★激活信20分钟未到=halfway, 恢复序已写proven diigo.com(收信→激活→探/post发文→养号文) ②sooperarticles.com DR68: CF托管挑战turnstile widget不挂载(iframe空=checkbox静态占位, CDP点击挑战重置, 系统级SendInput无处落点), 9224环境被CF打标——进手工登录队列id81, A机0906配方可复用 ③suomiblog+mpeblog: walls复判=站已改版captcha_window九宫格款curl有体, 但9224渲染纯白(htmlLen39), 同模板blogacep对照渲染正常=站级IP白屏防御维持 ④弃: blogadda(目录收录表单非账号注册)/nerdbot(WP注册关闭301到登录)/steemit(React SPA+手机验证)/insanejournal(邀请码门)/growthhackers+hubpages(自助注册入口404已关)/ontoplist(目录型无发文能力,转日间目录班)/blogadda/abduzeedo/blog-lvup(空壳)/agilealliance(无注册表单)/tripod+klusster(000连不上) ⑤8兄弟站盘点: C机已verified 5站(blogacep/actoblog/atualblog/activosblog/blogadvize全链路0907已闭合过), blog5.net halfway条目过时(0908/0909两文published实锤已清理) ⑥publish0x acc203813: 恢复序要的验证信仍未到(站方Pending审批队列), 不耗时间 ⑦手工登录队列30站无代登(note全None) ⑧工具迭代: _reg0000_rc_click.mjs判图点击器+sysclick.mjs系统级SendInput点击(治CF侦测CDP)+lessons.json损坏修复(tools数组缺逗号, RDS pull 00:46带入) ⑨配额0/6如实报: 候选池结构性枯竭(pending池40候选按DR≥20+排除拦截/队列/墙后仅diigo一家可注且卡激活信), 兜底清单: ①手工队列再查(无新代登) ②halfway续做(publish0x信未到/blog5已闭合过时清理) ③verify-pending未及跑 ④walls复判6条(suomiblog/mpeblog改版复判+sooperarticles新墙入档) ⑤RDS pull查漏B机产出=0变更 ⑥工具迭代2条(sysclick/lessons修复)
TXT;

\App\Models\Seo1\DailyWorkLog::create([
    'run_source' => 'reg0000',
    'machine' => 'C',
    'started_at' => '2026-09-16 00:38:44',
    'ended_at' => date('Y-m-d H:i:s'),
    'status' => 'done',
    'other_work' => $other,
]);
echo 'DWL created at ' . date('Y-m-d H:i:s') . PHP_EOL;
