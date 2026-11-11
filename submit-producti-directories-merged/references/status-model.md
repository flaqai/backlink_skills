# 记录说明

新批次用 `Record format: SPD lean 1`。每站保留必要事实，诊断和邮件字段仅在实际适用时添加。旧 V1 记录仍走审计器原有规则；不把格式通过当作公开收录证明。

## 基础字段

批次：`Record format`、`Campaign ID`、`Canonical URL`、`Batch authorization reference`、`Automation authorization`（`authorized` / `not authorized`）。新批记录 `Form authorization: submit allowed` 或 `prefill only`；旧记录可省略，省略不授予执行权限。本公开版只接受 `Record scope: shareable`。

每站：`Queue ID`、`Website`、`Status`、`Duplicate check`、`Exact result`、`Evidence reference`、`Last checked`。规范网址与历史记录用于识别同一产品；换账号或工具不构成重新投递理由。
可增加 `Route`、`Account alias`、`Follow-up`；无需填一堆 `not applicable`。

`Website` 是目录的提交入口；`Target URL` 是实际填写或邮件里提供的产品网址，省略则沿用本批已确认的官网（`Canonical URL`）。子页范围或「只投官网」保存在批次资料或授权证据中，无需另设记录字段；允许的子页均不合适时回退官网。官网也不适格就跳过；不能单凭路径不同判为新产品。

## 状态

| 状态 | 含义 |
| --- | --- |
| `not attempted` | 尚未操作 |
| `form in progress` / `draft saved` | 已填写或存草稿，尚无提交结论 |
| `submitted` / `awaiting approval` | 有明确收件/待审回执 |
| `submitted — user reported` | 用户明确报告已提交，未取得站点回执；单独统计，不重投、不算已发布 |
| `awaiting email verification` | 等待邮箱验证，不算公开收录 |
| `published` | 已核验公开条目，附 `Public listing URL` |
| `submission outcome unknown` | 有最终提交动作但无明确回执 |
| `blocked — manual verification` | 留在人工验证页 |
| `blocked — missing verified data` / `blocked — account or email policy` | 缺必填真实资料或身份/邮箱阻断 |
| `unavailable` / `paid-only` / `ineligible` | 无可用入口、仅付费或不适格；强制互链用不适格并说明 |
| `duplicate — no action` | 发现已有条目或既有联络，不继续重复动作 |
| `terminated by user` | 用户终止；已有不明结果仍写在结果说明中 |
| `email sent — awaiting reply` / `email send outcome unknown` | 联络邮件已发送或发送结果不明 |

用户报告状态的 `Evidence reference` 引用用户消息，`Exact result` 注明未获站点回执；没有观察到的提交次数不补填。仅要求不核验并不是用户报告；确有点击但无结果时用 `submission outcome unknown`，说明未查原因并保留可用页面。核验公开页前不填 `Public listing URL`。

## 去重与动作次数

`Duplicate check` 可用 `not checked`、`cleared`、`duplicate confirmed`、`user-confirmed duplicate`、`inconclusive`、`not available`。沿用旧的 `— user-authorized direct attempt` 值也可。
已填/提交表单应记录搜索证据，可合并在 `Evidence reference`。未能确认时写缺口和已授权直接尝试的引用 `Direct-attempt authorization`。重复状态保留命中证据。

只记录发生的动作，数值格式为“已做次数/授权上限”：

- `Form submit attempts: 1/1`：只记录模型实际点击；获提交授权才可点，默认一次。上限大于一时须有该站 `Retry authorization`。用户自行提交且模型核验到回执时，加 `Form submitted by: user`，不把用户点击计入；已有模型尝试仍保留。仅用户报告则用独立状态。
- `Login-link requests: 1/1`：原生登录邮件链接请求，独立计数，不记成提交或联络邮件；额外请求的授权可写 `Login-link authorization`。
- `Email send attempts: 1/1`：官方联络邮件，只允许一次。
- 有多次提交、重试或登录请求时，附 `### Attempt log`，逐行写时间、动作类型、结果和证据；普通一次成功不另写日志。

人工验证附 `Handover page`（原页及待操作项）、`Fields entered`（验证墙挡住时用 `Prefill limitation`）和 `Follow-up`。表单或邮件结果不明附 `Handover page` 和 `Outcome checks`；无页面可保留时写明原因和恢复入口，按用户要求未查则据实注明，无需凑轮数。

## 邮件条件字段

仅官方联络邮件加 `Action channel: official contact email`、`Email authorization`、`Account alias`（已核验发件身份）、`Recipient contact alias`、`Contact-source evidence`、`Mailbox pre-send check` 与 `Email send attempts`。
发送前去重未完成时，也需直接尝试授权。结果说明写明实际渠道；邮件证据可用该渠道的发送回执或匹配的已发送副本。已发送、站方接收和公开外链分别记录。
一个站的登录链接请求不属于这个邮件渠道，不需要这些邮件投递字段。

## 审计

`python3 scripts/audit_submission_record.py /path/to/record.md --json`
公开版只查可分享记录。审计检验状态、次数、重复记录、交接及敏感数据，不增加浏览器执行步骤，也无法代替网站证据核验。
