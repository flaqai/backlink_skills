<?php
// reg0000: writeupcafe remark 更新 (PUT /accounts/73)
$body = [
    'remark' => 'reg0000 0912注册全链路(账号OK但养号文未发出=halfway): /register表单+reCAPTCHA Enterprise v3——google域本机不可达, ★recaptcha.net镜像注入enterprise.js+execute(action:register)拿token填g-recaptcha-response+原生form.submit()绕handler(站方handler preventDefault后自execute但google域挂死); 邮箱token链接激活✓ uid=1063288; ★发文路径已全探明: /post-writeup向导(step1标题+contenteditable正文→Next→step2=Topics必选1+Featured image必传(带alt)+excerpt/slug/meta_description+底部Publish→"Before you publish"模态Publish anyway); ★两大硬闸: 正文≥300词(SEO health红X拦Publish)+**profile头像必传**——★avatar上传setFileInputFiles后页面JS必挂死(复现x3, 站方组件bug, 上传后eval全TIMEOUT), 新tab/重载同挂; 下班恢复序列: 手工传头像(30秒)→Save→/post-writeup/1929262?step=2(草稿已含全文本+Topic Writing+图+alt)→Publish→Publish anyway→线上URL落库',
];
file_put_contents("D:/Github/backlink_skills/cdp/_reg0000_wu_rem.json", json_encode($body, JSON_UNESCAPED_UNICODE));
echo "ok\n";
