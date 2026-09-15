<?php
// reg0000: writeupcafe mark-registered body
$c = json_decode(file_get_contents("D:/Github/backlink_skills/cookies/default/writeupcafe.com.json"), true);
$body = [
    'username' => 'leoxmwuc',
    'email' => 'writeupcafe@92ng.com',
    'password' => 'Xx@Wuc26!Xm',
    'login_method' => 'email_password',
    'cookies' => $c,
    'remark' => 'reg0000 0912注册全链路: /register表单(username/email/password/password_confirm)+reCAPTCHA Enterprise v3(render=6Lfj9KQsAAAAAOfmTJ5)——google域本机不可达, recaptcha.net镜像注入enterprise.js+execute(action:register)拿token填g-recaptcha-response+原生form.submit()绕handler(★站方handler会preventDefault后自execute但google域挂死); 邮箱verify-email token链接激活✓; 登录态/verify-pending页有resend入口; 发文=顶部Create菜单(待探明细节); uid=1063288',
];
file_put_contents("D:/Github/backlink_skills/cdp/_reg0000_wu_mr.json", json_encode($body, JSON_UNESCAPED_UNICODE));
echo "cookies=" . count($c) . " body_written\n";
