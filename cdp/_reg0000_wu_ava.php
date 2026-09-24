<?php
// reg0000: GD 生成头像 512x512
$w = 512; $h = 512;
$im = imagecreatetruecolor($w, $h);
$bg = imagecolorallocate($im, 240, 130, 30);
imagefilledrectangle($im, 0, 0, $w, $h, $bg);
$dark = imagecolorallocate($im, 60, 40, 20);
// 简单笑脸: 头圆+眼+弧
imagefilledellipse($im, 256, 256, 300, 300, $dark);
$face = imagecolorallocate($im, 245, 242, 232);
imagefilledellipse($im, 256, 256, 260, 260, $face);
imagefilledellipse($im, 190, 210, 40, 56, $dark);
imagefilledellipse($im, 322, 210, 40, 56, $dark);
imagearc($im, 256, 300, 160, 110, 20, 160, $dark);
// 帽檐
imagefilledrectangle($im, 140, 120, 372, 150, $dark);
imagejpeg($im, 'D:/Github/backlink_skills/cdp/_reg0000_wu_avatar.jpg', 90);
imagedestroy($im);
echo 'avatar=' . filesize('D:/Github/backlink_skills/cdp/_reg0000_wu_avatar.jpg') . "B\n";
