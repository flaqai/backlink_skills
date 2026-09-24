# B 机定时任务部署包（2026-08-30 V5 版）

> 本文件由 C 机生成。拿到 B 机后：在 B 机的 ZCode（工作区打开 D:\Github\seoadminB）里操作。
> **V5 变更（2026-08-30 用户定架构，与 C 机五线流水线同步）**：
> 1. **删除 B 机旧的两个定时任务**（白天窗流水线 + 21:30 闲时 8h）——五线已完整接管其职责
> 2. 新建一个五线流水线（半点错峰版），每天 10 班 + 14:30/16:30 无效触发
> 3. ★时长双硬线 [110,115] 分钟/班 + 配额底线制（超额更好）
> 4. ★不查额度（耗尽被动停，下一班接力核验自动补录缺失的汇报）
> 5. ★注册全链路制：注册+激活+cookie+双写+探明发文路径+试发首篇养号文，缺一不计配额
> 6. ★新目录配额 ≥5/班，必须第一任务真提交成功才算数

## 双机分工总表（V5）

| 维度 | B 机（本机） | C 机 |
|---|---|---|
| 任务池 | **category='ai'**（当前=任务1/4/5=组101/98/104，以库为准） | category='general'（当前=任务2/7/8/9/10） |
| 五线班次 | **半点**：00:30/06:30/22:30=2号线 · 02:30/04:30/08:30/18:30=3号线 · 10:30=4号线 · 12:30=5号线 · 20:30=1号线 · 14:30/16:30=高峰留白 | **整点**：镜像同结构 |
| run_source | win0030/win0230/.../win2230（半点命名，防与 C 机补录撞车）；daily_work_logs 的 machine 字段写 'B' | win0000/win0200/.../win2200 |
| 博客账号 | 登录态 cookie 在本机的（以库为准；C 机账号 substack62/wordpress60+204/hatena107/pika157/rant.li158/paper.wf179/qiita108/habr106/wattpad77 勿用——cookie 在 C） | 同理勿用 B 机账号 |
| GSC / 写稿 | 不做（写稿统一归 C 银行流程，760 篇存稿） | 不做 GSC（用户另行安排） |

**防冲突四铁律**：①不碰对方任务组/目录池/账号 ②账号归属=cookie 所在机器，不跨机复制 ③注册/提交前查全库去重（RDS 同步保全量可见）④B 半点、C 整点错峰，勿改时刻。

## 环境预检（创建定时器前确认，参照 B-COMPUTER-SETUP.md）

1. `C:/BtSoft/php/82/php.exe -v` 可执行
2. `cd D:/Github/seoadminB && C:/BtSoft/php/82/php.exe artisan seoadmin:sync-rds --direction=both --limit=2000` 跑通
3. backlink_skills 已 git pull 更新到本版本
4. 有头 Chrome 9224 可启动
5. agently-cli 认证状态确认（B 机自己的认证；没有则注册班遇需收码的站跳过留清单）
6. ★先查旧任务为何停摆：B 机 8-29/8-30 连续两天零产出——创建新任务前看一眼旧定时器的 paused/错误状态，把原因记进 PIPELINE-JOURNAL

## 部署步骤

1. B 机 ZCode → 定时任务列表：**删除**旧的两个（白天窗流水线、21:30 闲时任务）
2. **新建**一个定时任务：
   - cron：`30 0,2,4,6,8,10,12,14,16,18,20,22 * * *`
   - 标题：`【B机·五线流水线V5】每班110-115分钟·00:30/06:30/22:30新博客≥3账号全链路·02:30/04:30/08:30/18:30新目录≥5首投·10:30验收+补给·12:30养号+收口·20:30发文复放·14:30/16:30高峰留白`
   - 提示词：下方整段复制

## 提示词（整段复制）

```
五线流水线·B机版（自动触发，无需用户确认，直接执行；每天 00:30/02:30/04:30/06:30/08:30/10:30/12:30/18:30/20:30/22:30 共 10 班+14:30/16:30 两次无效触发。2026-08-30 V5 与 C 机同步定稿：按半点分线各司其职、每班硬性产出配额+硬性时长区间）。

★★时长双硬线（与配额同级）：本班合法时长 [110,115] 分钟（1h50m-1h55m），收尾 date 打卡实测必须落在此区间（额度耗尽被动停止除外）——短于 110=偷懒违约，长于 115=拖窗。★配额只是底线不是收工线：达标后继续多产（多完成更好），直到 115 分钟硬顶才收尾让位下一班。

★无效触发快退：14:30 与 16:30 触发=高峰期留白（用户指定 14:00-18:00 不安排任务）——汇报「无效触发（高峰留白）」立即结束回合，不做任何工作、不打卡、不落库、不跑同步。

★开班必做（全班型，顺序执行缺一不可）：
1. date 打卡，算出本班两条硬线：最短线=打卡+110 分钟，截止线=触发时刻+115 分钟
2. ★接力核验：查上一班（=本班触发时刻减 2 小时的最近工作班，如 00:30 班查昨晚 22:30 班、14:30/16:30 无效班跳过、18:30 班查 12:30 班；只核验 B 机自己的半点班，run_source=win0030/win0230/.../win2230 系列）在 daily_work_logs 有无记录（写临时 PHP bootstrap 查询）；若无记录→立即补录：以库内证据还原该 2 小时窗口实况（该窗口内 blog_writer_posts.published_at 的发文、backlink_publish_logs.created_at+status 的提交、blog_accounts.last_registered_at 的注册、PIPELINE-JOURNAL.md 尾部的中途记录），用 App\Models\Seo1\DailyWorkLog::create 落一条 run_source=上一班的 winXX30、machine='B'，other_work 开头注明「★补录：上一班会话未收尾（疑额度耗尽被动停止）」，四产出数字由模型钩子自动实算——补录完成才开工本班正事
3. RDS pull 后台（cd /d/Github/seoadminB && C:/BtSoft/php/82/php.exe artisan seoadmin:sync-rds --direction=pull --limit=2000，间歇非阻塞回查到完整结束）
4. 读 PIPELINE-JOURNAL.md 最后 30 行接棒：上一班的未完成项、lessons.halfway 区的半成品优先纳入本班

★★班次分线表（本班做什么只看触发时刻）：
- 00:30 / 06:30 / 22:30 →【2号线·新博客攻坚】配额底线：本班完成 ≥3 个新博客账号的注册全链路，★全链路=注册+邮箱激活+login.mjs save+双写 blog_accounts/backlink_accounts+★探查清楚发文路径（编辑器入口、发文流程、字数/格式限制，写进配方）+★试发第一篇养号文（200-400 词自然介绍向短文、无外链，发布成功+落库 blog_writer_posts：theme=account-warming、published_url/published_at 回填）——发文路径没探明或首篇没发出，该账号不计入配额；超额完成更好；timebox 不够时优先保证已完成账号的全链路闭合，不留半成品
- 02:30 / 04:30 / 08:30 / 18:30 →【3号线·新目录攻坚】配额底线：本班完成 ≥5 个新目录站首投——★每个新目录必须把第一个任务真提交成功（对 ai 池某任务的提交拿到回执或 POST 200 确认+backlink_publish_logs 回写）才算数，只探路/只注册/只填表不提交不计入；首投成功后该站配方立即入 proven 供复放；超额完成更好
- 10:30 →【4号线·验收+补给】验收=①verify-pending 全池复核（含 C 机提交的，记录放出/未放出）②近24h 已发文章锚链逐篇线上核查（记录 N/N 与坏链，坏链当班补）③FAIL 积压复核（>0 则抽查≥3条）；补给=新源侦察验活 ≥15 个新候选入档（★AI 向为主：curl 层批量验活：入口真实存在+邮箱型非 OAuth-only+DR≥20，对照 blog_accounts/backlinks 全库去重，博客候选入 blog-platform-sources 档案、目录候选入 new-sources 档案，各排首攻顺序Top5）——验收与补给都是本班正事，都要做
- 12:30 →【5号线·养号+收口】配额两项都要做：①养号巡检近 7 天注册的新账号 ≥6 个——逐号 login.mjs 验登录态：死的标记销账（blog_accounts status=blocked+注明死因）、活的补全资料（头像/简介/个人页链接）、能发第二篇的发（新号发满 2-3 篇存活率才稳，发文走 proven 配方并正常落库），other_work 逐号一行记存活状态与动作；②收口 lessons.halfway 区 ≥1 个——按恢复序列从高 DR 往下清（收口成功=销 halfway 条目+配方入 proven+产出落库）
- 20:30 →【1号线·发文+复放】①发文：blog_accounts status=registered+登录态在本机+今日未发的平台全部发布（银行 status=draft 按 ai 组轮换 101→98→104 取稿，标题对全库已发查重；优先用 lessons proven 已参数化脚本，勿现编流程；发布即线上锚链核查+published_at/published_url 当班回填，用 Eloquent/API 回填勿裸 DB::table；新注册平台的养号文归 2 号线，本班只发带任务站链的正式稿）②目录复放：replay-queue 每日一格（当日已有班补过则跳过，只补 ai 池任务格）+proven 配方站×ai 任务未投组合（同站同任务不重复，同站不同任务可复放）
- ★GSC 不做（用户另行安排）；★写银行新稿不做（C 机银行 760 篇存稿够 3 个月）

★★攻坚班作业规程（2/3 号线适用）：
1. 开班：先执行上方「★开班必做」四步
2. 弹药清点：2 号线查 blog_accounts pending+platform-sources 档案；3 号线查 new-sources 档案+backlinks 池 tried=0 候选；可用候选不足 5 个→当班自己侦察补档（侦察+验活+入档计入产出，写进 other_work）——候选断粮不是收工理由，是当班任务
3. 攻坚循环：候选按 DR 降序逐个攻；单站 ≤30 分钟；验证码 ≤20 分钟（同一挑战 2 轮失败=记墙换下一个）；纯邮箱铁律（只有 Google OAuth 的站直接跳过）；DR>=20（dr=0 视为待查先深挖入口备料不提交）；注册/提交前查全库去重（含 C 机已注册/已提交的，RDS pull 后可见）
4. 每个成功必须三件事：即时落库（账号双写/提交回写）+完整配方入 lessons proven（入口URL/字段与必填规则/选择器与点击方式/成功特征/坑点/恢复序列/★博客含发文路径，域名命名）+同步 sync-data 副本（本机 seoadmin-skill 仓库 sync-data/ 目录，按实际路径）
5. ★配额=底线：达标≠收工（多完成更好）——继续攻下一个候选/沉淀配方/补养号文/收口 halfway，直到 115 分钟硬顶；★未达标同样攻到硬顶绝不提前收工，other_work 如实写「差 N 个+本班攻了哪些站+各站墙原因」
6. 中途状态随手写 PIPELINE-JOURNAL.md（防会话中断丢进度）

通用铁律（全班适用）：
- ★额度不查（2026-08-30 用户指定）：不设熔断——不查 coding_plan_quota_logs、不写 BM_CUTOFF；额度耗尽时会话被动停止属正常现象，勿因此恐慌或提前收工；缺席的收尾汇报由下一班「接力核验」自动补录
- ★CDP：有头 Chrome 9224；三板斧（insertText 真实打字/点击前 scrollIntoView/真实鼠标 Input.dispatchMouseEvent）；★Target.createTarget 建的 tab 必先 Target.activateTarget（未激活=合成器无帧=真实点击落空+截图挂起，2026-08-30 C 机 wattpad 实战确诊）；不关最后一个 tab；tab 用完清理；一律写 .mjs 文件不内联；中文 JSON 走 curl 临时文件
- ★AI 视觉介入：验证码一律视觉识别（难图三路投票）；提交/发文后无论表面成败都渲染+截图确认真实状态（零POST≠成功）；卡死页先截图诊断再定性；复杂页面给子智能体携截图并行分析
- ★纯邮箱注册：禁 Google OAuth；只用邮箱+密码/magic-link/邮箱验证码；邮箱=独立前缀@92ng.com（已有平台前缀勿复用；注册前查 RDS 全库防与 C 机撞前缀）；密码=Xx@平台缩写26!Xm 加强版（≥13位大小写数字符号）；用户名=leoxm（平台要求更长用 leoxm26）；昵称=Leo Xm；收码 agently-cli message +search/+read（B 机未认证或报 refresh token 过期则跳过需收码的注册留清单）；等邮件期间转做其他工作禁原地等待
- ★禁 sleep 空转：唯一例外=脚本内部等页面渲染/等邮件的短等待；脚本外任何单次等待≤60 秒；禁止 sleep 590 类踩线等待；禁止为凑时长磨洋工——填满 110 分钟的唯一方式=超额完成配额的真产出；收尾短报必含「本班 Bash sleep=N 次」
- ★RDS：开班 pull、收尾 push（--direction=push --limit=2000 后台跑间歇回查）；本机半点班与 C 机整点班错峰，勿改时刻
- ★双机分工：只做 category='ai' 池任务（当前任务1/4/5，以库为准：RDS pull 后查 backlink_publish_tasks is_active=1 按 category 分池）；general 池归 C 机勿碰；账号以本机 cdp/cookies/ 登录态为准（C 机账号 substack 62/wordpress 60+204/hatena 107/pika 157/rant.li 158/paper.wf 179/qiita 108/habr 106/wattpad 77 勿用——cookie 在 C 机）
- ★记忆固化：一切产出即时落库落盘（lessons.json+sync-data 副本随写随存；journal 补一行）；收尾必写 journal 交接（给下班≥3条可执行动作含命令或入口，禁写「无弹药/等解锁」类消极交接）+runs/daily/<日期>.md 追加一行
- ★DailyWorkLog：收尾必落一条（写临时 PHP bootstrap 后 App\Models\Seo1\DailyWorkLog::create，run_source=win0030/win0230/win0430/win0630/win0830/win1030/win1230/win1830/win2030/win2230 对应本班、machine='B'；四产出数字由模型 saving 钩子按时间窗自动实算，禁止手填）
- 不创建/修改/删除任何定时任务

收尾（顺序执行缺一不可）：date 打卡实测时长（须落 [110,115] 区间，额度被动停止除外）→RDS push→DailyWorkLog→runs/daily/<日期>.md 一行→PIPELINE-JOURNAL 交接纪要→短版汇报（实测时长/配额达成含超额（如 3/3 或 5/7）/本班攻坚清单与墙/sleep 声明/最重异常一条）→立即结束回合让位下一班。
```

## 部署后验证

1. 等最近的半点班触发，看 B 机是否正常开班（daily_work_logs 出现 winXX30 记录、machine='B'）
2. 对比 C 机同日记录：双机 run_source 不撞车、RDS 无同步冲突
3. C 机 20:50 的 RDS 交接推送提醒邮件仍引用旧 21:30 闲时表述——无害，下次修订时一并更新
