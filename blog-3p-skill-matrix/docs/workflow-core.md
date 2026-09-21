# 博客 3P 工作流核心

这是恢复工作的唯一简明规则页。每次上下文压缩、恢复或交接后，先完整重读本页；再读取本文的 `context/article-contract.json`、`reviews/review-index.json` 和发生变化的文件。只有哈希漂移、问题项谱系不清、角色替换或明确升级时，才回读历史报告。

## 目标与边界

- 目标是先交付独立、可信、对读者有用的文章；用户冻结的 CTA 必须逐字保留为次要、透明且有依据的推荐，不能取代正文价值。
- 平台、账号、文章—语言—市场映射仅来自用户确认的范围。当前人工发布模式要求每篇文章在派发 W/R 前都有一个不同的平台／账号映射，并分开记录主读者语言／市场的受众证据与编辑器／格式的传递证据；“可承载英语”不等于“英语是主读者”。默认必须是 `PRIMARY_AUDIENCE_MATCH`；跨语言只能凭逐篇、逐字绑定的 `CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED` 继续。不得发现、补充、替换或借用平台。
- 自动化只写本地文件和做只读公开页检查。人工使用平台原生界面登录、粘贴、上传、发布、修复和删除。
- 标题层级是否合格只由公开读者页的渲染视觉决定；编辑器 HTML/DOM、载荷标签、源码与 Feed 都不是此项证据。

## 模型优先；机械校验后置

- W 在默认 WQ 路线按读者任务、证据边界和文章整体效果完成写作及同上下文的对抗式自查；高风险 WR 路线再由独立 R 审稿。不得用表格、关键词次数、字符数或格式启发式代替编辑判断。G 只守住用户确认的范围和交付保真，不重做 WQ/R 的语义审稿。
- 默认只维护能够支持下一次决策的最小来源：一份 evidence pack、唯一基准稿、最终视觉清单、WQ 的短回执或 WR 的一次完整 R 报告，以及短的需求映射。正常通过时不生成逐项 `PASS` 表、重复研究摘要或额外审稿报告；只记录实际 finding、风险或例外。
- 可复用的稳定观察可放入内容项目范围内、哈希固定的共享证据包；接收文章只能按精确匹配的记录 ID 引用，在 `campaign_shared_evidence` 写 `path`、`sha256`、`record_ids`，并在 `article_delta` 写 `decision`、`freshness_or_scope_check`、`additional_evidence_refs`。缓存未命中时两字段都省略，继续本篇调研，不创建空共享包、空引用或“未采用”占位记录。共享包不跨内容项目、不代替用户确认，也不承载易变、账号或文章专属事实。
- 脚本在创作完成后做结构/身份/范围/哈希/必保留 CTA 与交付模板完整性检查，也检查证据层没有把平台画像当成选词证据，并把“方法模板”与“有记录实测”分开。它们不能根据文字长度、词频、评分或可选外部数据替模型判定文章质量；无法满足的语义问题仍由 R 以有理由的 finding 提出。
- 常规上下文只读本页、文章契约、审稿索引和当前变更产物。只有某个风险、finding 或路线明确关联一段契约/参考资料时才按段读取；不得为了“以防万一”装载整套历史、Skill 或参考目录。
- `HUMAN_RELEASE_ONLY_V1` 将用户确认保存为本地回执，再用 `confirm-prewrite-plan` 绑定。它要求每篇文章的用户确认平台／账号映射和受众／传递记录均已就绪；语言、市场、平台、账号、适配模式、跨语言例外或研究姿态变化时必须重新确认。只有 `dispatch-readiness` 显示 `DISPATCH_READY` 才能建立 W/R 协作组。它只是本地防错步骤，不增加模型审稿回合。
- 角色输入分三层：不可压缩核心（冻结范围、语言/市场、CTA、当前唯一基准稿哈希，以及审稿索引中的开放 finding ID）、活跃工作集（当前稿、直接证据、当前差异）和冷历史（旧报告、网页快照、已关闭 finding）。文章契约只绑定冻结输入；动态 finding 只能写入审稿索引和状态。冷历史只以路径和哈希留在索引中，按需回源；模型摘要不得替代不可压缩核心或来源原文。
- 在 WQ 的最终自查或 WR 的完整 R 前先运行无模型的 `harnessctl.py check-review-ready`。它只确认上下文、文章包、当前上游文件哈希与固定可视化富文本载荷是否可审，失败直接回 W 修复；通过不代表质量、事实或 SEO 已批准。

## 角色和顺序

1. 项目统筹 G 收集范围内的写前方案、平台匹配调研与文章计划，逐篇冻结 `topic_slot`（读者任务、核心意图、市场、差异化角度、禁止偏离项），等待用户一次确认；G 保存该确认的原始回执并完成本地绑定后才可启动文章协作组。它冻结选题边界，不冻结最终关键词或标题。
2. 常规文章默认在同一持续项目主会话内处理，每篇使用互不重叠的 `articles/<article_id>/` 交付根目录；可见 W 可跨常规文章复用上下文。只有 WR 才派独立 R；项目统筹 G 是全项目唯一、持续复用的控制面。
3. 当前 schema-2.14 默认 `AUTHOR_QA_INTEGRATED / WQ_SHARED_CONTEXT`：W 连续完成 `RESEARCH → DRAFT → VISUALS → PAYLOAD`，随后在同一工作上下文执行 `CANDIDATE_LOCK → ADVERSARIAL_SELF_QA → TARGETED_REPAIR → FINAL_BIND`。自查须从读者价值、SEO/本地化、事实边界、标题、CTA、图文语义及交付保真中主动找反例；只保留真实 finding、升级理由和最终哈希回执。无开放问题时结果为 `AUTHOR_QA_READY`，绝不能写成独立 R 的 `APPROVED`。高风险或用户要求时使用 `INDEPENDENT_R_ESCALATION / WR_INDEPENDENT`：W 完成同样来源链后，独立 R 对证据、正文、图片、元数据及 HTML 主交付页做 `FULL_REVIEW`；只有明确的额外风险需要时，才在 WR 内加成文前独立研究挑战。Markdown 是机械备用投影，仅 `COMPANION_DUAL_READ_REQUIRED` 才语义双读。
4. WQ 发现不能自洽的高风险主张、核心证据冲突、误导性视觉/实测、重大传递风险或开放质量问题，应记录触发 ID 并单向升级到 WR；用户明确要求独立审稿也进入 WR。普通多语言写作、缺少 Trends/平台样本、有边界的模型翻译或例行 CTA 不单独触发升级。升级后不得自动降回 WQ，W 的同上下文自查不得冒充 R 的批准。
5. G 在一个可见 `BATCH_GATE_ACCEPTANCE` 回合中处理**当前所有具有适用质量凭据的文章**：WQ 为 `AUTHOR_QA_READY` 及 W 的可见回执，WR 为独立 R 的 `APPROVED`；已升级的 WQ 必须有后者。每篇仍有独立哈希行和 `HUMAN_RELEASE_READY`／`CHANGES_REQUIRED` 结论；G 不重读全文、不重做 SEO 审稿，也不等待未就绪文章。
6. 人工发布后回传 URL 与精确 `HUMAN_ACCEPTED`；G 在 `PUBLIC_QA_BATCH_READONLY` 回合中处理当前已回传的文章。每篇 URL、回执、快照、视觉证据和结果保持独立，不默认恢复 WQ/WR、不创建新的公开审稿角色。

W 在 `topic_slot` 内以证据调整关键词、标题和本地自然变体时，只在 evidence pack 记录 `ALIGNED` 与调整说明，不重开 G 或 R。只有证据表明必须换读者问题、市场或承诺时才写 `TOPIC_EVIDENCE_CONFLICT` 并暂停；同一 G 在既有可见账本做一次短决策。`KEEP_SLOT` / `NARROW_WITHIN_SLOT` 留下带理由和证据引用的决策记录后继续原路线；`PAUSE` / `OWNER_RECONFIRM_REQUIRED` 维持阻断。任何变更冻结槽位仍走用户重新确认，不把例外伪装成同槽位优化。

Git 工作树是文件与 Git 状态隔离的例外，不是 token 优化手段。只有发生真实并发写入、需要高风险重写／回滚隔离，或用户明确要求 Git 隔离时，才可建立工作树，并在状态中记录 `worktree_dispatch_decision.reason`。运行槽位充足、主会话繁忙或“希望降低 token”都不是理由。普通的路径不重叠文章可顺序处理，或在不共享写入目标时做安全批次；不得因此重开十份任务背景、技能和仓库阅读。

对 `N_WQ` 篇常规文章和 `N_WR` 篇独立审稿文章，基线模型阶段为 `N_WQ + 2N_WR + E + 2 + B`：每篇 WQ 一次 W（含同上下文自查），每篇 WR 一次 W 与一次独立 R，`E` 是确实触发的成文前研究挑战；加一次写前 G、一次成稿批量 G，以及 `B` 次按实际 URL 回传批次的公开页 G。`B` 是人工回传批次而不是文章数。WQ 自查不另算独立模型阶段；实际修复、升级与人工发布耗时另计，不能把此式当作 token 成本承诺。

`TOPIC_EVIDENCE_CONFLICT` 是罕见例外，不计入这条基线；它复用同一 G 和既有任务账本，不创建新的 W、R、研究报告或整轮审批。正常的本地化、标题和关键词优化不应触发它。

## 当前最小文件链

当前 schema-2.14 的每篇文件都位于 `articles/<article_id>/` 下：唯一基准稿 `canonical/article.html`、`canonical/metadata.json`、本篇研究差异与引用索引 `research/evidence-pack.json`、`canonical/visual-manifest.json`、WQ 短回执或 WR 的 R 报告及 `reviews/review-index.json`、`requirements-traceability.md`、配对的 `handoff/visual-payload.html` 与 `handoff/visual-payload.md`、单向 `handoff/handoff-manifest.json`，以及人工回传后的 receipt 和公开快照。若本篇实际采用共享证据，evidence pack 仅记录 `campaign_shared_evidence.path`、`.sha256`、`.record_ids` 与 `article_delta` 的三个本篇字段；否则不出现共享引用。HTML 是人工富文本复制及适用质量路线语义核验的主投影；Markdown 是同一内容和图片注释的可读／追溯备用投影。二者只能从 package 声明的上游来源由同一编译器生成，并各自哈希绑定。G 的成稿验收与公开页 QA 分别使用一份批量报告；报告内每篇保留独立、可校验的行和哈希。关键词、来源、跨语言、简报与图片计划可由 evidence pack 渲染为查阅视图；不得为同一事实手工维护多份彼此独立的研究包。

当前 schema-2.14 的 `article-package.json@1.5` 位于各自文章根目录，只索引冻结声明和上游唯一来源，并固定该根内的 `canonical/article.html` 为唯一基准稿；它不得反向指向派生的 handoff manifest，也不重复 SEO 字段、链接或图片清单。编译器只接受 package 所声明且哈希相符的 canonical、metadata、evidence pack 与 visual manifest，不能以命令行的另一份正文或元数据替换它们。图片以 visual manifest 为唯一最终事实；文章标题与 SEO 元数据以 metadata 为唯一事实。schema-2.13 及更早工作流的独立 R 语义继续历史读取/校验，不得被新 WQ 路线默默重写。

## 审稿成本控制

写前计划为每篇冻结 `review_effort`。默认 `AUTHOR_QA_INTEGRATED / WQ_SHARED_CONTEXT / INTEGRATED_IN_AUTHOR_QA`：W 不等待研究批准，而是在连续创作中建立足以支撑主张的研究证据，完成正文、元数据、最终视觉清单和交付页，再锁定候选版本，以反方读者/审稿人的角度检查论证和来源、地区表达与标题、CTA、图文对应及载荷。发现问题只做有边界修复，再对最终的 evidence pack、唯一基准稿、metadata、visual manifest、HTML/Markdown payload 与 package 作哈希绑定；开放问题为零才登记 `AUTHOR_QA_READY`。这是一位作者同上下文的自查凭据，绝不是独立 R 的 `APPROVED`。Markdown 仍是机械投影，只有校验器要求才语义双读。

`INDEPENDENT_R_ESCALATION / WR_INDEPENDENT` 用于用户要求或真实高风险，例如高后果/易变主张、来源冲突/关键证据不足、定量比较/性能/排名结论、可能被当作实测的图片、CTA 主张依据不清、重大传递风险或 WQ 的核心问题无法关闭。它仍是一条连续 W 后接一次独立 `FULL_REVIEW`；仅已明确的成文前证据风险才另设 `SEPARATE_RESEARCH_REVIEW_REQUIRED` 并取得 `RESEARCH_APPROVED`。`MODEL_TRANSLATION_FALLBACK` 只有叠加重大不确定性或上述风险才升级；它自身不是阻塞条件。WQ 可记录触发 ID 单向升级 WR；不可由 W、R 或 G 自动降回 WQ，也不能以升级替代需要的用户范围再确认。

平台样本/风格资料同样按需：只在已冻结范围内、没有可复用匹配资料且存在实质性的读者传输风险时收集。它不是写作前门，也不会因样本不足、缓存未命中或 `UNVERIFIED` 阻塞连续创作；此时使用保守通用结构。

研究证据分层同样不增加默认成本：`reader_intent_basis` 只能引用当前品牌站、地区 SERP，或两次地区核验无共识后的 `MODEL_TRANSLATION_FALLBACK`；平台资料只可记录为 `TOPIC_FRAMING` 或 `FORMAT_ADAPTATION`。`METHOD_TEMPLATE_NO_EXECUTION` 只能写读者可自行执行的方法、清单或记录模板，不能声称 A/B 结果、验证、性能、稳定性或因果；只有 `DOCUMENTED_EMPIRICAL_RECORD` 且有协议、设置、运行日志、评价标准和局限时才可作有边界的实测陈述。由 WQ 在同上下文对抗式自查中判断；若风险不适合自查闭合则升级 WR，不新增默认检索或审稿回合。

WQ 的任何最终哈希绑定后内容/视觉/交付页变更，必须重新运行同一 W 的对抗式自查并生成新的 `AUTHOR_QA_READY` 回执，或带触发原因单向升级 WR；WQ 绝不使用 `R_DELTA`。WR 在完整审稿批准后的有限修复由同一 W 完成，再由同一 R 以 `R_DELTA` 审变更及直接依赖；不明风险、谱系不清或承诺变化转完整 R，纯视觉变更可走 `R_VISUAL_DELTA`。读者可见变更都要按各自质量路线更新绑定，但不自动新增 G 回合。

R 的完整审稿采用“问题 → 收窄 → 取证 → 判定”：先从冻结读者任务、CTA、当前稿、本篇 evidence delta 和已引用共享记录提出有限的审查问题，再读取直接相关段落和来源，最后记录可复现的 finding 或 `APPROVED`。首次 `FULL_REVIEW` 仍必须独立审完整的文章语义包，不能被差异审或机器检查替代；但不得把已通过的清单、全文摘要或 W 的自评重复写进报告。通过 `check-review-ready` 的正常投影只需审 HTML；只有 `COMPANION_DUAL_READ_REQUIRED` 才要求 Markdown 的第二次语义读取。

事实核验优先处理会显著改变读者决定或易过期的主张，例如价格/日期、排名或比较、性能/能力、平台政策、受监管或高后果信息。低风险背景表述不要求为了“凑台账”拆成大量原子记录；但任何模型置信度只可提示是否升级核验，不能充当证据。来源冲突、实体混淆或跨语言歧义必须扩大读取范围。

停止条件由 finding 驱动：结构预检通过、适用来源边界已记录、开放 finding 为零、当前 WQ `AUTHOR_QA_READY` 或 WR `FULL_REVIEW`/必要 R-Δ 的哈希未漂移时停止。不得为了“再保险”追加一轮通过项复述、同类自我批评或多代理辩论；若出现新风险、矛盾或范围变化，WQ 先升级 WR 或取得用户确认。相同稳定 finding 连续三次实际修复仍不能闭合时，升级人工决定，而不是无限重试。

本轮不冻结模型或推理强度分层：W/R 的创作和语义判断继续使用项目已配置的模型；哈希、字段映射、文件清单、固定载荷编译等走程序。后续如要改变路由，必须以独立的本地影子评测和用户／项目配置决定，不能由本矩阵的降本规则自动降级或升级模型。任何路由都不改变人工发布边界。

每个批次可选运行 `harnessctl.py summarize-efficiency`。它仅汇总可见模型阶段、返修信号和运行时**已提供**的 token/耗时/工具调用；缺失数据必须标记 `UNAVAILABLE`，不得估算或成为发布门。先用 3–5 个真实历史文章做影子对照，再决定是否扩大某项优化。

## 公开页结果

- `PUBLIC_QA_PASSED` / `PUBLIC_QA_PASSED_WITH_LIMITATION`：完成本文。
- `HUMAN_TRANSPORT_FIX_REQUIRED`：G 在下一次只读批量回合中为受影响文章生成一张人工平台侧修复清单；人工修复后回传新 receipt，再由同一 G 复核。
- `PUBLIC_QA_UNVERIFIED`：最多一次同一 G 的重新捕获；不得推断通过。
- `CANONICAL_CHANGE_REQUESTED`：仅在用户给出明确变更请求 ID 后，按本篇 WQ 或 WR 的适用质量路线修复，再由 G 验收。
