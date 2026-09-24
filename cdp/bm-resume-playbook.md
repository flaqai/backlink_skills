# 熔断续跑手册（bm-resume-playbook）

本文件由额度流水线的「恢复分支」拉起的 ZCode 无头会话读取。
使命：①补做被中断窗口缺失的收官汇总（会话没 token 跑自己的收尾就暴毙了）②续接剩余窗口把活干满。

## 第一步：找被中断的窗口并补收官
1. `date "+%Y-%m-%d %H:%M:%S %A"` 打卡
2. 查 dv/daily-work-logs 最近 1-2 条：定位被熔断中断的窗口（run_source）、other_work 里写到哪一步
3. **补收官**（若该窗口没有正常收尾记录——收尾缺失的直接证据是：窗口时段已过或接近，但最后一条 DailyWorkLog 没有结束时间/汇总）：
   - 从库重建该窗口战果：blog_writer_posts（发文）、backlink_publish_logs（目录提交）、blog_accounts（注册）按窗口时间段聚合
   - 补一条 DailyWorkLog 收尾记录（run_source=原窗口名+rescue，other_work 注明「熔断暴毙,事后补记收官」）
   - 若该窗口属闲时班3/班4（收官三件套被跳过）：补 RDS push 已由流水线自动做过（bm-rescue-push.out），补 lessons.json 合并回传（python D:/Github/backlink_skills/lessons-merge.py，与定时任务同参数）
4. 防重：发文查 blog_writer_posts 今日该平台记录；目录提交查 backlink_publish_logs；勿重复劳动

## 第二步：定位当前窗口决定续跑
1. 按下表判断当前是否处于活跃窗口：
   - **工作日**：00:00-04:55(task4) / 05:00-09:55(task1) / 10:00-13:55(task5) / 18:00-21:00(task2) / 21:00-01:00(闲时班1: 21-23、班2: 23-01) / 02:00-06:00(闲时班3: 02-04、班4: 04-06)
   - **周末**：06:00-11:55(task1) / 12:00-17:55(task5) / 18:00-23:55(task2) / 21:00-01:00 与 02:00-06:00(闲时)
2. **不在任何窗口** → 补收官做完即结束（勿做任何窗口外工作）
3. 在窗口内 → 继续该窗口定义的工作，直到窗口结束时刻为止

## 工作内容（按窗口类型，与定时任务定义一致）
- 定时窗口(task1/2/4/5)：文章发布(优先) → 博客注册 → 目录提交(runner.mjs <taskId> 7200 + replay-queue.php) → 兜底(FAIL复核/待审验证/写银行文章)
- 闲时班1(21-23)：开班RDS同步 + 文章发布 + 非AI目录提交；班2(23-01)：博客注册流水线
- 闲时班3(02-04)：银行文章工厂(组101/22/98)；班4(04-06)：FAIL复核+待审验证，06:00 前收官三件套(RDS终推/lessons合并回传/后半夜汇总)

## 铁律（与定时任务完全一致）
- 产量：文章 ≥3 篇/窗口（组101→22→98→104→106→108 轮换；substack id62 / wordpress id60 / bearblog 151 每平台每天 1 篇）；注册尝试 ≥3 平台
- ★纯邮箱注册（禁 Google OAuth）：邮箱=独立前缀@92ng.com，收码 agently-cli
- DR>=20 才提交；AI 目录只投 AI 任务(1/4/5)，非 AI 任务(2/7/8/9)只投通用目录
- Chrome 9224 有头；CDP 三板斧（insertText 真实打字/点击前 scrollIntoView/真实鼠标事件）；写 .mjs 不内联；中文 JSON 走 curl 临时文件
- 文章必须 seo-writer + humanizer 技能；外链只指向对应任务站
- ★额度熔断继续生效：每 10 分钟查 coding_plan_quota_logs 最新一条，usage>=90% 且无券 → 保存进度 + date 打卡 + DailyWorkLog 收尾 + **写熔断标记 file_put_contents('D:/Github/backlink_skills/cdp/BM_CUTOFF',(string)time())** + 结束会话（额度恢复后流水线会再次自动续跑）
- ★每个工作单元完成立即落库（这是熔断后能补汇总的唯一依据，宁多勿少）
- 禁用 sleep 空转；**不要创建/修改任何定时任务**

## 收尾
窗口结束时刻到 → date 打卡 → DailyWorkLog 落一条（run_source=resume+窗口名，注明本次为熔断续跑）→ 简要汇报

## 数据纪律（2026-08-28 用户指定，所有窗口收尾必须遵守）
- ★DailyWorkLog 三个数字必须按库实算：收尾时 SQL count 当日 blog_writer_posts(published)/backlink_publish_logs(completed)/blog_accounts(registered)，禁止手填 0
- ★目录提交 completed 必须带目标 url + 截图：runner 引擎已自动在提交成功瞬间截图存 seoadmin/public/backlink-shots/ 并写入 proof_image（后台外链发布记录页可点开看图）；临时 PHP 直写日志的也要带上 url
- ★blog_writer_posts 的 published_at 必须写真实发布时刻（今天 335 曾错写成凌晨 02:05 导致统计归错窗口）
- 提交成功即算成功（completed），不强制等收录验证；截图就是提交凭证
