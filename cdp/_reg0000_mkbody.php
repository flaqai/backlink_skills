<?php
// reg0000: 组装 dreamwidth mark-registered body
$c = json_decode(file_get_contents("D:/Github/backlink_skills/cookies/default/dreamwidth.org.json"), true);
echo "cookies=" . count($c) . "\n";
$body = [
    'username' => 'dreamwleoxm',
    'email' => 'dreamwidth@92ng.com',
    'password' => 'Xx@Dw26!Xm',
    'login_method' => 'email_password',
    'cookies' => $c,
    'remark' => 'reg0000 0912注册全链路: /create表单(user/email/passwordx2/bday1988-05-15/tn_state=No/tos勾)+hCaptcha拖拽挑战一轮过(推翻08-23硬墙判定)+邮箱confirm验证OK; 发文路径=/update(subject+event正文textarea+prop_taglist+security select+Post to按钮右下); journal=https://dreamwleoxm.dreamwidth.org; TOS禁营销外链故养号文必须无链',
];
file_put_contents("D:/Github/backlink_skills/cdp/_reg0000_mr.json", json_encode($body, JSON_UNESCAPED_UNICODE));
echo "body_written\n";
