# [批次名称] — SPD 投递记录

## Campaign controls

- Record format: SPD lean 1
- Campaign ID: [批次标识]
- Canonical URL: [已核实的规范网址]
- Batch authorization reference: [本批授权引用]
- Automation authorization: [authorized / not authorized]
- Form authorization: [submit allowed / prefill only]
- Record scope: shareable

## [站点编号] — [站点名称]

- Queue ID: [站点编号]
- Website: [当前公开入口网址]
- Status: not attempted
- Duplicate check: not checked
- Exact result: 尚未操作
- Evidence reference: not applicable
- Last checked: [含时区的日期时间]

<!-- 实际需要时添加以下字段，具体状态见 references/status-model.md。
选择子页：Target URL: [用户提前限定范围内的合适子页]；不适合时用批次 Canonical URL，在现有说明中简记原因
一次模型提交：Form submit attempts: 1/1；仅预填不记提交次数
用户自行提交且已核验回执：Form submitted by: user；Evidence reference 引用站点回执
仅用户报告已提交：Status: submitted — user reported；Evidence reference 引用用户消息，Exact result 注明未获站点回执；不补填未观察到的提交次数或公开页
去重未能确认后直接尝试：Direct-attempt authorization: [授权引用]
多次提交：Retry authorization: [该站及次数授权]，并写 Attempt log
登录链接请求：Login-link requests: 1/1
人工验证：Handover page、Fields entered、Follow-up
提交结果不明：Handover page、Outcome checks
公开收录：Public listing URL
官方联络邮件：Action channel、Email authorization、Account alias、Recipient contact alias、
Contact-source evidence、Mailbox pre-send check、Email send attempts（各为独立字段）。
渠道写在 Exact result；普通站不填写邮件字段。 -->
