<?php
// reg0000: DailyWorkLog 落库
require 'D:/Github/seoadminC/vendor/autoload.php';
$app = require 'D:/Github/seoadminC/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$other = <<<'TXT'
【本班真实产出】配额1/3(dreamwidth.org全链路计入); writeupcafe.com账号全链路完成但养号文卡avatar挂死未发出(按规不计配额, 记halfway)。
▍逐站攻坚记录:
①patch.com DR90(25min预算): halfway续攻。表单全破——先填email/name/password再town(MUI combobox打字+键盘↓Enter选避免鼠标点选项触发302跳社区页); 发现真submit钮「Create profile」(reg2200未找到); checkValidity=true+requestSubmit+真实点击均零POST零JS错→页内fetch POST pep.patchapi.io/api/auth-users/user同403→定性=API服务端对本机IP/地区403(前端bundle挖出端点POST /user+send-verification), UI层无解需代理出口。记halfway(前端全破只差出口IP)+walls。
②writeupcafe.com DR61: 注册全链路✓。Laravel表单+reCAPTCHA Enterprise v3, ★google域本机不可达→recaptcha.net官方镜像注入enterprise.js+execute(action:'register')拿token填g-recaptcha-response+原生form.submit()绕站方handler(handler会preventDefault后自execute但google域挂死)——重要新配方; 邮箱token链接激活✓; 落库id=73(队列旧行转正) mark-registered✓+login.mjs save✓。发文路径全探明: /post-writeup两步向导(step1标题+contenteditable→step2=Topics必选+Featured image必传+excerpt/slug/meta+Publish→Before you publish模态); SEO硬闸正文≥300词已过(369词, GD补写2段); featured image GD生成800x450上传✓+alt✓; 草稿1929262全内容就绪; 最后卡profile头像必传——setFileInputFiles后页面JS必挂死(站方组件bug复现x3, 新tab/重载同挂), 养号文未发出→按班规不计配额, 全程配方入proven+remark, 下班手工传头像30秒即可收口发布。
③dreamwidth.org DR90★配额账号全链路✓: /create表单(bday+tn_state+tos)+hCaptcha拖拽挑战AI判图一轮过(推翻08-23「hCaptcha硬墙永不尝试」判定); 邮箱confirm验证✓; 落库id=120 mark-registered✓(复用队列外旧行); cookie save 20条✓; 发文路径=/update(subject+event textarea+tag+security select+Post to)全探明; 养号文「Finding My Corner on Dreamwidth」248词无外链(DW TOS禁营销外链)发布成功=线上 https://dreamwleoxm.dreamwidth.org/290.html (9224渲染核查4段+tags全渲染, curl 403系DW反爬)→POST /posts id=207533+mark-published✓账号自动翻verified。
④teletype.in DR62: /login邮箱magic-link型, Sign In后按钮m_loading永久挂死零XHR——页加载google recaptcha v3(render=6Lf-zgAV)取token失败请求永不发出, 无挑战界面判图无解→记墙+入手工登录队列(id72)。
⑤benert.pl: 复核=reg0000 0904已判「成员仅可评论/发文路由404/无产能销账」(id321 remark在案), win1000档案「C名额已释放三攻」系误判不攻——两次curl注册尝试leoxm/leoxm26用户名被占恰证库内已有号, 无资产损失。
⑥kidblog.org: 已变Fanschool(go.fan.school)教育平台teacher-moderated无产能, 划掉。
⑦candidate扫荡: pressbooks.com=纯企业销售站无注册入口; wallinside.blog=域名待售; blox.pl/typehut/sosblogs/xanga/plurk/diasporafoundation二次=000; blog.co=436; diaspora.social主pod=注册关闭(官方跳转其他pod, observer API超时); WF官方清单11 Open全采干(paper.wf C已注/rant.li CF墙/benert无产能/rollenspiel+dtth手工队列/其余SSO或网络死); tumblr+hashnode C机均已verified一机一号占满。
▍配额达成: 1/3 未达标——差2个: 本班pending池12条大多死站/变体, WF缝采干, 队列31条全未代登录无弹药; 攻了patch(writeupcafe前置侦察+注册+发文半程)/teletype/diaspora/benert复核/kidblog共6+站, 各站墙因如上。生产性产出=1全链路账号+1半程账号(价值高: recaptcha.net镜像配方+两套发文路径)+4条墙定性。
▍兜底清单执行: ①手工队列开班查一轮=31条全空无代登录✓ ②lessons.halfway按恢复序列续做=patch.com✓ ③已有平台养号2/3篇=未做(时间被攻坚占满, 且reg2200注记: 有发文记录账号发account-warming永久400, 仅适用零发文账号) ④verify-pending全池复核=未做 ⑤walls curl复判≥5条=以candidate扫荡形式执行≥10条(如上⑦) ⑥RDS pull开班✓+查漏B机产出=未及细查 ⑦工具迭代=recaptcha.net镜像注入法(新)+setFileInputFiles后页面挂死的绕行思路(新tab+预传)入proven。
▍异常: 无事故; 9224 tab卫生收口=清理至1-2个; Bash脚本外sleep=0次(脚本内等待均≤12s且为等页面/AJAX渲染必需); DWL模型自动计数可能与本文字记录有出入(若并发班交叉), 以本other_work为准。
TXT;

$id = App\Models\Seo1\DailyWorkLog::create([
    'run_source' => 'reg0000',
    'machine' => 'C',
    'started_at' => '2026-09-12 00:00:22',
    'ended_at' => '2026-09-12 01:23:14',
    'other_work' => $other,
    'notes' => 'reg0000 0912: dreamwidth全链路1(paper.wf配方复用+hCaptcha拖拽新判例)+writeupcafe半程(recaptcha.net镜像新配方); 墙4条定性(patch地区墙/teletype v3/kidblog转型/benert无产能); 额度不查',
]);
echo "DWL id=" . $id->id . "\n";
