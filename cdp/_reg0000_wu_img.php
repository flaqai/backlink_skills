<?php
// reg0000: GD 生成 featured image 800x450
$w = 800; $h = 450;
$im = imagecreatetruecolor($w, $h);
// 底色: 深青
$bg = imagecolorallocate($im, 32, 74, 74);
imagefilledrectangle($im, 0, 0, $w, $h, $bg);
// 装饰条
$bar = imagecolorallocate($im, 240, 130, 30);
imagefilledrectangle($im, 60, 300, 340, 312, $bar);
// 文字
$white = imagecolorallocate($im, 245, 242, 232);
$grey = imagecolorallocate($im, 170, 195, 195);
imagestring($im, 5, 60, 120, 'FIRST NOTES', $white);
imagestring($im, 3, 60, 170, 'small repairs / ordinary weeks / slow writing', $grey);
imagestring($im, 2, 60, 340, 'a bicycle mechanic writes it down', $grey);
imagejpeg($im, 'D:/Github/backlink_skills/cdp/_reg0000_wu_cover.jpg', 88);
imagedestroy($im);
echo 'img=' . filesize('D:/Github/backlink_skills/cdp/_reg0000_wu_cover.jpg') . "B\n";
