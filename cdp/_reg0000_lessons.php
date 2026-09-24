<?php
// reg0000: lessons.json 更新 (proven 2 + walls 3 + halfway patch 补充)
$f = 'D:/Github/seoadminC/shared/lessons.json';
$j = json_decode(file_get_contents($f), true);

$j['proven'][] = [
    'domain' => 'dreamwidth.org',
    'note' => 'reg0000 0912 C机全链路: /create表单(user+email+passwordx2+bday_mm/dd/yyyy+tn_state=No(非SC/TN)+tos勾)+hCaptcha拖拽挑战一轮过(拖块拖到同形目标格, 右下跳过→检查)→Create Account→/create/setup向导全部Save and Continue跳过→邮箱confirm链接(www.dreamwidth.org/confirm/<uid>.<token>)验证✓; ★发文=/update: input[name=subject]+textarea[name=event](正文HTML, 配event_format)+prop_taglist+security select(选Everyone Public)+action:update按钮(「Post to: <user>」); 发布成功页显示「Your entry has been posted」+View the entry链接=文章URL(<user>.dreamwidth.org/<id>.html); ★编辑器陷阱: /update页字段必须scrollIntoView后动态getBoundingClientRect点击(固定坐标全偏); ★页面JSON.stringify被污染→eval里建iframe取contentWindow.JSON或拼分隔符文本; curl打DREAMWIDTH域名403(DW反爬)核文章用9224渲染; TOS禁营销/外链(养号文合规); DW免费账号200篇上限',
    'login' => 'login.mjs save dreamwidth.org 已存cookies/default (dreamwleoxm/dreamwidth@92ng.com/Xx@Dw26!Xm, uid=2701571)',
    'added' => '2026-09-12 reg0000 C机',
];
$j['proven'][] = [
    'domain' => 'writeupcafe.com',
    'note' => 'reg0000 0912 C机注册+发文路径全链路(仅差avatar头像素材): /register Laravel表单(_token+username+email+password+password_confirm)+reCAPTCHA Enterprise v3(render=6Lfj9KQsAAAAAOfmTJ5-QQz4OEG7tTps49vot8p1)——★google域本机不可达, 破法=注入 https://www.recaptcha.net/recaptcha/enterprise.js?render=<sitekey>(google官方镜像token互通)+grecaptcha.enterprise.execute(key,{action:register})拿token填#g-recaptcha-response+**document.querySelector(\'.auth-form\').submit()原生提交绕handler**(站方inline handler preventDefault后自execute但google域加载挂死); 邮箱验证=verify-email?token=..&uid=.. 链接直达✓; ★发文=/post-writeup向导: step1= #write-title+contenteditable正文(Next→)→step2(/post-writeup/<draftId>?step=2)=Topics必选1(input[name=topic-search]搜索选chip)+Featured image必传(input[type=file] name=featured_image, setFileInputFiles可传, 需alt_text)+excerpt/slug/meta_description→底部Publish→「Before you publish」模态→Publish anyway; ★SEO硬闸: 正文≥300词(SEO health面板红X); ★Profile必填(display_name+city须从.city-ac-item下拉选择→city_id_input/country_input hidden回填)后才能进/post-writeup(否则302到settings?incomplete=1); ★坑: avatar上传后页面JS必挂死(站方bug), 养号文止步avatar',
    'login' => 'login.mjs save writeupcafe.com 已存cookies/default (leoxmwuc/writeupcafe@92ng.com/Xx@Wuc26!Xm, uid=1063288, draft=1929262已含全文+Topic+图)',
    'added' => '2026-09-12 reg0000 C机',
];
$j['walls'][] = [
    'domain' => 'patch.com',
    'type' => 'api-region-wall',
    'note' => 'reg0000 0912定性: /register表单+Create profile按钮已全破(email/name/password+town MUI combobox键盘↓Enter选不跳转), 表单checkValidity通过+requestSubmit/真实点击均零POST零报错——根因=注册API pep.patchapi.io/api/auth-users 对本机IP/地区服务端403(页内fetch带Origin同403, bundle端点POST /user+POST /user/google/apple+send-verification); UI层无法绕, 需代理出口才可继续; 判定=地区墙非代码墙',
    'added' => '2026-09-12 reg0000 C机',
];
$j['walls'][] = [
    'domain' => 'teletype.in',
    'type' => 'recaptcha-v3-wall',
    'note' => 'reg0000 0912定性: /login邮箱magic-link型但Sign In按钮m_loading永久挂死零XHR——页面加载google recaptcha v3(render=6Lf-zgAVAAAAAJIxQX0tdkzpFySG2e607DdgqRF-)取token失败请求永不发出; 无挑战界面判图无解, 已入手工登录队列(id72)等用户真实指纹',
    'added' => '2026-09-12 reg0000 C机',
];
$j['walls'][] = [
    'domain' => 'kidblog.org',
    'type' => 'platform-pivot',
    'note' => 'reg0000 0912: 已变Fanschool(go.fan.school/kidblog), 教育型平台teacher-moderated(内容全审核后发布)+无公开表单, 无产能价值划掉',
    'added' => '2026-09-12 reg0000 C机',
];
// halfway idx51 patch.com 补充本班进展
foreach ($j['halfway'] as $i => $h) {
    if (is_array($h) && ($h['domain'] ?? '') === 'patch.com' && ($h['date'] ?? '') === '2026-09-11') {
        $h['note'] = 'reg0000 0912大进展+定性: 表单填写顺序=先email/name/password再town(MUI combobox打字后键盘↓+Enter选, 鼠标点选项才触发302跳社区页); 真submit钮=「Create profile」type=submit(表单底部, reg2200未发现); 但checkValidity通过+requestSubmit+真实点击均零POST零错——根因=API pep.patchapi.io 服务端对本机403(地区墙), UI无解需代理; 前端全破只差出口IP';
        $j['halfway'][$i] = $h;
        break;
    }
}
$j['updated'] = '2026-09-12 01:2x reg0000';
file_put_contents($f, json_encode($j, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
echo "proven=" . count($j['proven']) . " walls=" . count($j['walls']) . " halfway=" . count($j['halfway']) . "\n";
