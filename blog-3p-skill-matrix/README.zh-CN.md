# 博客 3P Skill 矩阵

[English](README.md) · [术语约定](docs/terminology.zh-CN.md) · 版本 0.13.0 · [MIT 许可证](LICENSE)

这是一个面向高质量、可审计博客生产的开源 Skill 套件。它将文章工作拆解为可恢复的本地流程：建立内容项目与范围、完成有证据支撑的研究型写作、在适用质量路线验收前编译可视化富文本交付包，再进行需求验收和人工交接。常规文章默认由 W 在同一上下文写作并做对抗式自查（WQ）；高风险或用户要求的文章交给独立 R 审稿（WR）。它自动化内容质量工作，而不自动化平台发布。

## 一览

| 本矩阵负责 | 本矩阵明确不做 |
| --- | --- |
| 保存用户范围、研究证据、规范文章、适用路线的质量凭据、需求验收，以及可直接复制的富文本交付页。 | 登录、操作平台编辑器、上传媒体、调用发布 API、发布、删除、回滚、定时发布或修改浏览器指纹。 |

它只适用于人工原生发布交接：人工而非自动化拥有全部平台操作。只需 Python 3.9+ 与本地文件系统；网页、Trends、SERP 和公开页检查是该单一工作流内可选的只读证据能力，而不是另一种执行模式。

## 项目解决的问题

常见的“写一篇 SEO 文章”流程会将调研、写作、审稿、平台适配和发布混在同一对话里，因而容易出现来源丢失、自查被误报为独立审稿、编辑器试错占用交付能力，以及读者页与本地稿脱节的问题。

本项目以职责明确的 Skill 分离这些问题，同时始终保持一篇唯一基准稿和一条可追溯的读者可见改动记录。可见的平台匹配调研子会话先在用户候选范围内评估平台，之后用户才冻结映射；本地流程工具保存范围和状态；唯一可执行的 W 把调研与成稿结合。常规稿由 W 完成同上下文对抗式自查；高风险稿由独立 R 作文章质量判断。G 再确认最终交付没有丢失用户冻结任务；最后由人工通过平台原生编辑器完成发布。`blog-writer-merged` 是编辑核心参考，不是第二条 W 工作流。

## 运行模型

- **G 先取得启动资格。** 在任何文章交付目录或 W/R 出现前，常驻可见主控必须收集并汇报每篇文章完整的写前调研与写作方案；当前 `HUMAN_RELEASE_ONLY_V1` 只允许通过“用户原始回执文件 + 哈希 + 本地确认命令”绑定 `OWNER_PREWRITE_PLAN_CONFIRMED`。在派发 W/R 前，还必须为每篇文章确认一对一的平台／账号映射和兼容的语言－平台记录；之后才把用户已确认的要求写入 `requirements-contract.md`、维护内容项目状态与优先级并验收最终交付。它不能变成不可见的 CLI 审稿会话。
- **每篇文章选择真实质量路线。** 默认 `AUTHOR_QA_INTEGRATED / WQ_SHARED_CONTEXT`：可见 W 在同一上下文完成写作和对抗式自查，结果是 `AUTHOR_QA_READY`，绝不冒充独立 R 的 `APPROVED`。高风险或用户要求时走 `INDEPENDENT_R_ESCALATION / WR_INDEPENDENT`，由独立 R 做 `FULL_REVIEW`。角色可跨文章复用，但每次只绑定一个 `articles/<article_id>/` 路径；各篇仍有独立审稿索引和问题项谱系。W 维护 `requirements-traceability.md`。
- **文章路径隔离是默认。** `CONTINUOUS_CAMPAIGN_MAIN_SESSION` 配合 `MAIN_SESSION_PATH_ISOLATED`，将普通文章放在确定且互不重叠的目录中。可见子任务不等于 Git 工作区。
- **独立 Git 工作区是需记录的例外。** G 仅可因 `TRUE_CONCURRENT_WRITE`、`HIGH_RISK_REWRITE_OR_ROLLBACK` 或 `OWNER_REQUESTED_GIT_ISOLATION` 创建 `GIT_WORKTREE`；槽位、主会话繁忙或节省 token 都不是理由。全项目只登记一个可复用的项目统筹 G，按批次处理就绪文章的紧凑记录，而不是逐篇消耗 G 回合。
- **质量与用户意图分开判断。** WQ 的 W 或 WR 的独立 R 判断文章质量、SEO 和商业平衡；G 只核验该路线的真实质量凭据及已确认要求是否被遗漏、替换、弱化或扩展，不重复语义审稿。
- **常规轮次使用紧凑证据索引。** 启动文章任务时，项目统筹 G／机架创建不可变、哈希绑定的文章契约；WQ 写简短的作者自查回执，WR 的 R 写独立审稿结论，二者都写入审稿索引。上下文压缩后，先重读[流程核心](docs/workflow-core.md)，再读契约、索引和变更交付文件；只有哈希漂移、问题项谱系未解、代理替换或升级时才完整重读历史。范围冲突属于升级条件。
- **读者价值优先，CTA 必须保留但从属。** 每篇文章都冻结读者价值承诺，并且不依赖 CTA 仍须有用；用户要求的 CTA 必须保留其精确可见锚文本、可识别产品、当前落地页、主张依据、读者任务相关性和适用关系披露。WQ 的 W 或 WR 的 R 判断内容含义与商业平衡；G 只核对声明是否保真落地。
- **配图承载叙事，而不是凑数量。** 对实质性指南、教程、对比、评测和长篇解释文，W 至少规划三张原创、有信息价值的图，分别覆盖 `LEAD`、`MIDDLE`、`CLOSING`。WQ 自查或 WR 审稿必须逐张检查图像与相邻主张、可读性、独立读者作用及非重复性；首图、文件名、尺寸或 alt 均不能单独通过。
- **研究在一条有能力的 W 连续工作中完成。** 用户确认 G 的方向性方案后，W 连续完成长尾意图、地区 SERP 用语与主张证据，再写正文、制作图片并编译交付页。常规稿由同一 W 锁定候选稿并以反方视角核查；WR 才由独立 R 整体审查，且只有明确的成文前证据风险才增加研究挑战。
- **模型判断质量；工具只证明完整性。** WQ 的 W 或 WR 的 R 从整篇文章判断读者价值、证据强度、语言、SEO 和图文适配。默认只保留一份 evidence pack，只报告真实 finding 或例外，不生成全绿检查表或重复研究摘要。确定性工具在创作后检查身份、范围、哈希、必保留 CTA 与交付包结构漂移；它们不按字数、关键词次数或可选外部数据给文章打分。
- **平台样本是按需的建议性画像，不是可照搬的模板。** 仅当缺少可复用画像且存在实质读者可见传递风险时，可复用运营协同角色才只读检查范围内公开样本。样本不足即为 `UNVERIFIED`，使用保守通用结构，绝不阻断研究或写作。
- **公开页质检复用项目统筹 G 的批量回合。** 人工在结构化回执中记录 URL、精确的 `HUMAN_ACCEPTED`／`HUMAN_NEEDS_FIX` 状态和已知限制后，同一已登记的 `CAMPAIGN_GATEKEEPER` 一次处理当前可用的只读公开页快照。每篇保留独立的证据、结论与限制；它不重启 W/R、不创建新的公开终审角色，也不重做文章 SEO/文案审稿。
- **标题层级只以公开视觉为准。** 唯一基准稿和可视化富文本交付页的标签仅服务于写作与复制选择，绝不证明平台传输结果。人工不得编辑平台编辑器的 HTML/DOM；`HUMAN_ACCEPTED` 后，项目统筹 G 只能依据各篇公开读者页的渲染视觉验收标题、章节和子章节层级。快照可记录视觉证据路径，但绝不能推断层级结论。
- **平台匹配交给子会话，选择交给用户确认。** 每个当前内容项目都必须在派发 W/R 前冻结人工发布映射；在此之前，唯一可见、可复用的 `CAMPAIGN_PLATFORM_MATCHING_RESEARCHER` 仅在用户提供候选范围内，按冻结语言、市场和格式需求进行匹配。G 不排序、不选址，只保存报告并取得用户对准确平台/账号的确认。
- **CLI 只做机械工作。** 它可运行确定性的本地校验与编译，但不能替代审稿人或伪造证据。

## 架构

```text
用户任务与有来源边界的候选信息
        │
        ▼
G 的逐篇写前调研与写作方案
        │
        ▼
OWNER_PREWRITE_PLAN_CONFIRMED + 回执／哈希绑定
        │
        ▼
内容项目主会话／隔离的 `articles/<article_id>/` 路径
        └─ W：连续研究 → 成稿 → 图片 → 交付页
                 │
                 ├─ 常规 WQ：锁定候选 → 对抗式自查 → 定向修复 → 最终绑定
                 │              └─ AUTHOR_QA_READY（作者凭据）
                 │
                 └─ 高风险／用户要求 WR：独立 R 完整审稿
                                └─ APPROVED（独立审稿凭据）
                                            │
                                            ▼
                      项目统筹 G：按真实路线凭据批量验收冻结任务
                                                               │
                       PASS = HUMAN_RELEASE_READY
                                                               │
                                                               ▼
                          可视化富文本人工交付页
                                                               │
                                                               ▼
    人工原生发布 → 回执 + 只读快照 → 项目统筹 G 的批量公开页检查
```

WQ 有真实高风险、开放问题或用户明确要求独立审稿时，记录触发 ID 并单向升级 WR；升级后不能自动降回 WQ。`PASS` 从不表示机器已经发布文章；它只表示本地编辑产物已准备好供人工使用。真正完成是另一状态：人工保存 URL／状态回执后，对于 `HUMAN_ACCEPTED`，由同一已登记项目统筹 G 利用各篇规范化快照和公开渲染视觉进行一次有边界的只读批量读者页契约检查。公开页差异不会重启 WQ/WR：纯传输修复回到人工并由同一 G 的下一批复检；只有用户明确要求修改唯一基准稿或可视化富文本交付页才重开对应文章的适用质量路线。

对 `N_WQ` 篇常规文章和 `N_WR` 篇独立审稿文章，基线模型阶段是 `N_WQ + 2N_WR + E + 2 + B`：每篇 WQ 一次连续 W（包含同上下文自查），每篇 WR 一次 W 加一次独立 R，`E` 为实际触发的成文前研究挑战，另有一次写前 G、一次成稿批量 G 和 `B` 次按 URL 回传批次执行的公开页 G。`B` 是人工回传批次，不是文章数量；实际修复与人工发布耗时另计。此式描述模型阶段，不能当作 token 成本承诺。

写前方案让用户在文章工作启动前看到每篇文章的方向、读者价值／CTA 边界与风险路线；确认后，W 仍在同一连续工作中完成来源、长尾词与本地化调研。WQ 由 W 对最终交付做对抗式自查，WR 由独立 R 审查这些证据；只有 WR 中明确的成文前风险才要求提前 `RESEARCH_APPROVED`。

## 技能矩阵

| Skill | 职责 | 主要产物 |
| --- | --- | --- |
| `blog-3p-harness` | 初始化独立内容项目、记录用户确认的写前方案、冻结范围、安全恢复并执行结构校验。 | `campaign.json`、`state.json`、`prewrite-plan.md/json`、确认记录、清单 |
| `blog-3p-platform-matching` | 可见、可复用的子会话：只在用户候选源内调研语言/市场/格式适配，为每篇推荐一个平台。 | 匹配报告与待用户确认的提案 |
| `blog-writer-merged` | 关于证据、本地化、读者价值、图片和标题质量的编辑核心参考；绝不是第二个 W。 | 可复用编辑标准与参考资料 |
| `blog-3p-writer` | 唯一文章级写稿角色 W：调研、成稿、图片、载荷；常规 WQ 在同一上下文完成对抗式自查与最终绑定。 | 文章包、内容指纹、`AUTHOR_QA_READY` 回执或交给独立 R 的候选稿 |
| `blog-3p-review` | 仅在 WR 路线执行的独立 R，检查内容、证据、SEO、图片和最终载荷；可跨文章复用。 | 独立 `FULL_REVIEW` 报告与适用增量复审 |
| `blog-3p-gate` | 常驻项目统筹 G，收集并汇报写前方案、等待用户确认后管理范围，并依真实 WQ/WR 质量凭据批量验收需求保真和发布后公开页。 | 方案绑定、`requirements-contract.md`、批量验收行、批量公开页 QA 行 |
| `blog-3p-human-handoff` | 对适用质量路线已绑定的双交付页生成／核对派生交接索引，并在人工发布后生成有边界的回传证据。 | `handoff/visual-payload.html` + `handoff/visual-payload.md`、回传回执、发布卡、公开页快照 |

矩阵在同一个发布边界内保持模块化：本地创作、可选只读证据、WQ 或 WR 的文章质量判断、G 的需求验收、可视化富文本交付页编译、人工原生发布和只读公开页质检都可分开处理；但每个新的当前 schema 内容项目仍必须进入人工发布交接，本地工作或联网取证不是另一种执行模式。

## 核心保证

### 一篇唯一基准稿，按路线判断

WQ 中，W 锁定候选版本后从反方读者视角自查语言、事实、结构、SEO、图片与交付保真；开放问题归零并绑定最终哈希，才写 `AUTHOR_QA_READY`。这只是作者自查凭据，不等于独立 R 的 `APPROVED`。WR 中，独立 R 只审不改并对完整交付包作质量判断。G 掌管状态，只验收适用路线的真实凭据和冻结用户任务是否完整留在最终交付中，不重做语义或 SEO 审稿。用户要求用 `REQ-*`，G 的契约缺口用 `REQUIREMENT-*`，文章质量继续用如 `SEO-LOCALIZATION-001` 的稳定 finding ID。

对唯一基准稿或可视化富文本交付页的读者可见改动都会更新内容指纹，并重新进入适用质量路线：WQ 重新自查并生成新回执，或带触发 ID 单向升级 WR；WR 按情况走独立 R 的增量或完整审查。仅由公开读者页发现的不一致由项目统筹 G 的公开页批量检查处理，不会自动重启文章质量路线。

### 紧凑且哈希绑定的文章上下文

启动文章任务时，项目统筹 G／机架写入 `articles/<article_id>/context/article-contract.json`：它投影已确认的文章范围、适用 `REQ-*`、读者价值／CTA 声明、语言／市场、适用发布映射和来源哈希，且刻意不含动态开放问题项。`reviews/review-index.json` 记录当前唯一基准稿／交付包哈希、WQ 作者回执或 WR 独立 R 报告指针、路线结论和动态的稳定问题项谱系。稳定的项目级证据只能通过精确的 `campaign_shared_evidence` 记录 ID 和本文的 `article_delta` 复用；缓存未命中时既不创建空缓存，也不制造假引用。这些记录减少重复加载上下文，绝不能改写范围或覆盖源证据。

当前文章包只声明允许使用的唯一上游来源：`canonical/article.html`、元数据、证据包和图片清单。W 在质量判断前从这些哈希绑定的输入编译两份可视化富文本交付页。WQ 的 W 锁定候选稿，再对 HTML 主投影和声明来源做对抗式自查；最终绑定后的读者可见改动必须重做自查并更新回执，不能写 `R_DELTA`。WR 的独立 R 对 HTML 主投影和声明来源做完整语义审稿；通过后的有限修复由 W 写 `reviews/review-delta-N.json`，由同一 R 只检查变更及直接依赖。不明风险或承诺变化改走完整 R。Markdown 是经机械验证的可读备用投影，只有校验器输出 `COMPANION_DUAL_READ_REQUIRED` 时才需要第二次语义阅读。派生交接包只能在两份交付页逐字节一致时重复渲染并生成清单；若交付页会变化，脚本会在覆盖前失败。只有哈希漂移、问题项谱系未解或含混、代理替换、范围冲突或明确升级时才完整重读历史。

### 读者价值优先；透明推荐从属

矩阵的首要产物是对读者任务有高质量、证据受限回答的文章。每篇新的 schema `2.2+` 文章都要冻结 `reader_value_promise`；即使移除 CTA，文章仍必须完整、有用。`cta.mode = NONE` 在新的 schema-2.2 内容项目中不合法。

每篇 schema 2.2+ 文章均使用 `cta.mode = SECONDARY_RECOMMENDATION`。当前 schema-2.14 工作流中的 `articles/<article_id>/article-package.json` 使用 schema `1.5`：保留精确可见锚文本、产品身份、当前落地页 URL、主张证据路径、与读者任务的关联及关系披露或 `NOT_APPLICABLE`，再单向引用哈希绑定的 `canonical/article.html`、元数据、证据包与图片清单。元数据是平台标题和 SEO 字段的唯一来源；文章包不得重复标题、SEO、链接、图片或反向交接指针。这些字段只用于追溯推荐，绝不允许声称产品经独立验证、最优、已测试、始终可用或适合所有读者。WQ 的 W 或 WR 的 R 判断文章是否仍以读者为中心、平衡且真实；G 只检查冻结声明是否留在最终交付中。历史 schema-2.13 及更早工作流的独立 R 结论继续按原语义读取和校验，不会被改记为 WQ；历史 `2.12 / 1.4` 及更早文章包仍可读取和校验，但不能替代当前单源路径。这能降低可避免的审核／删除风险，不能保证平台一定保留公开页。

### 用户确认的写前方案

在矩阵创建文章交付目录或启动 W/R 前，G 必须维护覆盖每个已配置文章的唯一 schema-`1.8` `prewrite-plan.json`。每张紧凑卡明确任务／受众、独立读者价值与必保留的次要 CTA、模型主导的编辑简报、风险与待用户决定事项，以及冻结交付映射、`topic_slot`、研究姿态与 WQ/WR 路线。`topic_slot` 冻结读者任务、核心意图、市场、差异化角度与禁止偏离项，不冻结字面关键词或最终标题。交付映射公开文章语言、市场、平台、账号与受众适配模式；研究姿态区分方法模板和有记录的实测。编辑简报集中说明拟定关键词／本地化路径、证据边界、可能的标题／大纲、图文方案及已知人工传递风险，而不把同一事实拆成多份文件反复维护。G 运行 `harnessctl.py sync-prewrite-plan` 后生成供用户阅读的 `prewrite-plan.md`。该 Markdown 是确定性、只读视图：绝不能双份手填，也不能作为第二个范围事实源。

`OWNER_PREWRITE_PLAN_CONFIRMED` 是硬启动门。当前 schema 2.14 中，必须使用 `confirm-prewrite-plan` 绑定 `evidence/owner-confirmations/` 下的用户原始回执文件、哈希、来源定位与带时区时间；只手填状态或确认 ID 不能提升方案。其确认 ID、文章集合、报告哈希、清单哈希、受保护范围快照和回执必须在状态、用户确认记录、需求契约和范围锁中完全一致。快照包含语言、市场、平台、账号、适配模式、跨语言例外、`topic_slot`、研究姿态与审稿路线；其中受保护范围变化必须先显式失效、再重新确认，不能由同步覆盖旧回执。当前模式还要求每篇文章在派发 WQ/WR 前都有用户确认的不同平台／账号映射和兼容的受众／传递记录。在所需绑定重新确认前，G 不能创建文章交付目录、W、仅 WR 所需的 R、文章队列或文章代理。这使用户能在并发工作消耗时间和 token 前纠偏，同时不把 G 的方案伪装成 WQ/WR 的正式调研。

### 图文叙事覆盖

内容项目会与 SEO 和范围一起冻结 `visual_narrative_policy`。标准策略要求适用文章类型以至少三张图片覆盖 `LEAD`、`MIDDLE`、`CLOSING`。图片清单中的每个条目都要将图片关联到章节锚点、相邻主张、读者作用、权利/来源、提示词或视觉简报、本地化 alt、图注与像素审查结果。

若某批次要求所有文章均不得例外，应在启动任务前设置 `all_articles_required: true`。这会使该内容项目的每篇文章都必须满足“三张图、三处覆盖”。其他例外也必须由用户确认并让适用质量路线可见；绝不能因为图片缺失而被默认推断。人工交付页的图片卡会显示覆盖区与读者作用，帮助发布者保持正确位置。

### 不伪造本地证据的跨语言 SEO

对于已冻结的多语言目标，术语与关键词必须按以下严格优先级选择：

```text
CURRENT_BRAND_SITE → REGIONAL_SERP → MODEL_TRANSLATION_FALLBACK
```

- **当前品牌站：** 与目标地区、读者意图一致的现行公开品牌页，是最高优先级的用语来源。这能使博客与品牌用语及品牌语义矩阵保持一致。
- **地区 SERP：** 目标地区的搜索结果用于判断读者意图和自然语义变体。可用时，Google Trends 只比较英文种子词/英文候选，作为全球相对关注度背景，并记录英文概念到地区 SERP 用语的映射；其归一化指数绝不能被表述为搜索量、低基数/高势头、本地需求、热门度、商业意图或模型能力的证据。
- **模型翻译兜底：** 只有在两次独立地区 SERP 核验均记录为没有可用共识变体后才能使用。必须记录候选用语、失败核验、理由与文化/法律风险，且绝不能标注为“SERP 已验证”。

品牌站现有表达也不能无条件照搬：过时、误导、不自然或与本文意图不符时，必须留证拒绝。地区 SERP 只用于理解本地意图和表达，绝不用于复制竞品文本。

### 一体化长尾研究

矩阵不接受空关键词变体、泛化主词、标题文案或编辑创意角度作为研究证据。用户确认 G 的写前方案前，G 只汇报拟定的关键词／本地化路线与不确定性；确认之后，W 在连续创作中、形成有依据的主张前，完成候选与淘汰的长尾词、读者问题、查询／日期／证据和选用表达。多篇英语稿还须保持主意图和读者问题在语义上实质不同。

每个目标语言的证据包须包含目标地区 SERP 查询、自然变体、选词来源和拒绝的机械直译。仅英文的 Google Trends 比较是可选的全球相对关注度背景，不能证明目标语言用词。数据不可用或结论不明确时，W 不得强造趋势信号或反复重试；应根据当前品牌站和目标地区 SERP 意图选择长尾读者问题，并记录支持依据和明确证据边界。该路径不得被表述为搜索量、热门度、势头或商业需求结论。平台画像单独记录，最多可改善技术深度、示例、语气或传递方式，绝不能证明关键词、自然变体、搜索意图、当地需求、热门度或选题成立。两次独立地区核验均没有可用共识时，W 才可用 `MODEL_TRANSLATION_FALLBACK`，并须保存两次核验与语言理由。WQ 的 W 在最终对抗式自查中检查研究与文章；WR 的独立 R 在完整审稿中检查二者。只有 WR 中已明确的成文前证据风险才要求 `RESEARCH_APPROVED`。

### 已授权平台的风格画像

G 冻结准确的平台/账号组合后，仅当缺少可复用画像且存在实质读者可见传递风险时，可复用的平台样本研究角色才能针对同一平台、语言与内容类型的公开样本做尽力而为的只读检查。它记录来源、日期、可见信号和不确定性，并产出两份彼此独立的文件：

- `format-profile.md` 是确定性的交付输入：可用标题/元数据字段、标题/正文传递建议、公开视觉层级观察，以及可观察到的列表、链接、图片、商业披露或版式限制。它绝不指示修改编辑器 HTML/DOM；存在时由人工交付包读取。
- `editorial-style-profile.md` 是建议性的写作输入：只记录能够成立的标题语气、开头方式、段落节奏与结构观察；W 仅可用它优化读者适配。

两份画像均不能证明关键词、自然变体、搜索意图、当地需求、事实主张、平台政策、“热门度”或选题成立。画像不能改变范围、规范事实、本地化选词优先级、必保留次要 CTA 的精确锚文本／链接／披露，或图文叙事要求。不得复制样本标题、措辞、论证路径、互动数据或促销模式。样本不可得、不完整或无法证明可比时，标为 `UNVERIFIED` 并使用保守通用结构；仅因缺少画像，WQ 不升级 WR，WR 的 R 也不得据此提出 finding。只有通过 `PUBLIC_QA_PASSED` 读者页核验的行为，才能沉淀为长期平台技能；`PUBLIC_QA_PASSED_WITH_LIMITATION` 只能沉淀具备完整范围、日期且不可泛化的限制记录。参见[画像模板](docs/platform-style-profiles.md)。

### 人工原生发布边界

常规发布路径不会登录平台、向编辑器输入、上传媒体、点击发布、删除或回滚内容、调用写 API，或修改浏览器指纹。机器只生成由编译器拥有的 `BLOG_3P_VISUAL_PAYLOAD@3` 双交付页：用于直接复制富文本的 `visual-payload.html`，以及与其内容一致、哈希绑定、用于可读追溯的 `visual-payload.md`。所有文章共享同一份刻意简洁的自上而下顺序——博客标题、带精确位置中文图片卡的正文、SEO 标题、标签、描述。W 只能提供唯一基准稿标题、来源大纲/正文、图片清单和元数据，不能为单篇文章设计页面壳、CSS、JavaScript 或操作按钮。唯一基准稿中的每个图片标记（从 `<!-- BLOG_3P_IMAGE:01 -->` 起）都会在原处生成一张图卡；图卡明确写出对应的 `01-lead-*`、`02-middle-*` 或 `03-closing-*` PNG/JPG/JPEG 素材、放置锚点、本地化 Alt 和图注。聚合图片槽位、WebP/GIF/SVG 替代品、缺哈希或未编号素材都会使编译失败。页面不含按钮、剪贴板代码或复制成功承诺；发布者在浏览器中手动选中可见标题与正文，再粘贴至原生编辑器。编译器会拒绝缺失或改写必保留 CTA 精确可见锚文本、href 或适用披露的包/正文，且绝不自行添加促销文案。发布者不得查看或修改平台编辑器 HTML/DOM 来强制标题标签。人工通过平台原生界面发布并验收读者页；若回传 URL 且标注 `HUMAN_ACCEPTED`，同一已登记项目统筹 G 会在批量公开页检查中依据每篇公开读者页的渲染视觉验收标题层级，而不是依据本地交付页、编辑器、源码或 Feed 标记；它绝不会自行执行平台操作或重开 W/R。

人工回传刻意保持轻量：一份 `public-return-receipt.json`，然后仅在 `HUMAN_ACCEPTED` 时生成一份规范化、有边界的公开页快照。快照记录标题／正文指纹、链接／图片／CTA 观察和获取限制，而不是新稿或语义结论。G 用它写紧凑的公开页 QA 报告：纯平台传输问题生成一份合并人工修复清单并回到同一 G；已记录的平台限制只有在读者可见契约仍满足时才可通过；证据不可得时保持未核验；唯一基准稿／交付页变更必须有用户明确的请求 ID。

### 严格的平台范围

冻结平台映射前，唯一可见、可复用的 `CAMPAIGN_PLATFORM_MATCHING_RESEARCHER` 是确认前唯一允许的子角色例外。它只在用户提供 XLSX/表格/消息候选内，以语言、市场和内容格式为条件进行只读比较，并把哈希锁定的推荐输入 G 的方案；它绝不能启动文章调研、文章交付目录、W、R、大纲或正文。G 不预筛、不排序、不选平台；它只校验来源与不重复结构，然后取得用户确认。

平台/账号组合随后只能来自引用该匹配提案、用户确认且哈希锁定的 `owner-platform-selection.json`；`platform_scope.allowed_pairs` 只是其机械校验后的投影，绝不能反过来充当授权来源。每个 pair 收据必须指向用户原始 XLSX/表格/消息、其 SHA-256、精确行/单元格或消息定位、平台原文、账号确认原文和用户确认 ID。套件不会发现、推荐、添加、替代或悄悄排队任何其他平台。若源内匹配没有可辩护的推荐，或缺少用户确认，状态只能是 `OWNER_DECISION_REQUIRED`，绝不是 G 替用户选择平台的授权。

官方登录/注册页、平台公告、公开样本、预检/激活记录、会话恢复证据、内部配置和历史内容项目映射都只能作为适配性或运营证据。它们可以在用户选定**之后**支持单独记录的 `locale_platform_validation`，但绝不能创建允许 pair、成为冻结映射，或反向验证从自身复制出的映射。若授权列表用尽，状态为 `CAPACITY_BLOCKED`，直到用户明确提供并重新确认新的组合。

每个当前内容项目都必须在派发 W/R 前冻结一张一对一的 `article_id → platform → account` 表。每篇文章只绑定一个不同的平台，且其平台/账号对不得被另一篇复用；缺失或重复映射会阻塞受影响文章。G 绝不会默认把多种语言分配到一个已验证平台，也不会从另一篇文章借用平台。

确认表还应为每篇文章记录用户确认的文章语言与市场、映射的平台/账号、主读者语言／市场及受众证据，以及可承载内容语言及传递证据。编辑器能承载某语言只说明传递资格，绝不能说明该语言是平台主受众。普通路线必须是 `PRIMARY_AUDIENCE_MATCH`；语言或市场不匹配时，只有逐篇绑定用户原文的 `CROSS_LANGUAGE_EXCEPTION_OWNER_CONFIRMED` 可继续，否则以 `PLATFORM_AUDIENCE_MISMATCH_RECONFIRM_OWNER` 停住该文章。

标题采用三层契约：字段映射是确定性规则，交付包保真可机械核验，语义质量由 WQ 的 W 或 WR 的 R 依据读者任务、清晰度、价值、自然语言和市场适配判断；G 只核对冻结字段是否保真。字面关键词和长度只是不阻断的风险提示。平台标题默认等于规范文章标题，不能暗中采用更短版本。标题/章节层级则在人工发布后单独以公开视觉验收。

## 自动化范围

| 本地自动化 | 可选只读适配器 | 人工负责或明确不在范围内 |
| --- | --- | --- |
| 工作区创建、JSON 校验、来源台账、关键词/主张审计、稳定问题项 ID、唯一基准稿指纹、可视化富文本交付页编译 | 搜索、Google Trends、公开 SERP 检视、公开页 HTML/Feed/截图比对、外部 SEO 扫描 | 账户创建/登录、CAPTCHA/2FA、编辑器输入、文件上传、发布、删除、回滚、定时发布、写 API、浏览器指纹变更 |

对标题层级，只有公开页的渲染视觉是证据。HTML 或 Feed 可辅助比对正文、链接或元数据，但不能判定标题级别。

不可用的适配器只会记录为 `UNAVAILABLE` 或 `UNVERIFIED`，绝不会伪造成通过。

## 快速开始

环境要求：Python 3.9+ 与本地文件系统。随包脚本仅使用 Python 标准库。

```sh
# 在本仓库目录中执行。
cd blog-3p-skill-matrix

# 请保留完整包：skills/ 和 docs/ 共享同一套契约。
python3 skills/blog-3p-harness/scripts/harnessctl.py init \
  --workspace /absolute/path/to/campaign \
  --campaign-id my-campaign

# 将 templates/campaign-article.json 按文章复制进 campaign.json，再填写唯一可编辑的
# schema-1.8 prewrite-plan.json 并确定性生成用户视图；绝不能双份手填。派发 W/R 前，必须为每篇
# 文章填写用户确认、彼此不同的平台／账号映射和兼容的语言－平台记录。
python3 skills/blog-3p-harness/scripts/harnessctl.py sync-prewrite-plan \
  --workspace /absolute/path/to/campaign

# 向用户汇报生成的 prewrite-plan.md。用户确认后，将原始确认文本保存到
# evidence/owner-confirmations/，并用命令绑定该文件。
python3 skills/blog-3p-harness/scripts/harnessctl.py confirm-prewrite-plan \
  --workspace /absolute/path/to/campaign \
  --confirmation-id owner-confirmation-001 \
  --receipt-file /absolute/path/to/campaign/evidence/owner-confirmations/owner-confirmation.md \
  --receipt-type OWNER_MESSAGE \
  --source-locator "用户消息或文件的定位信息"

# CHECK_PASSED 仅表示本地结构可读；dispatch-readiness 才会明确列出 REQ、已登记 G
# 或平台映射是否仍缺失。
python3 skills/blog-3p-harness/scripts/harnessctl.py check \
  --workspace /absolute/path/to/campaign
python3 skills/blog-3p-harness/scripts/harnessctl.py dispatch-readiness \
  --workspace /absolute/path/to/campaign

# G 写入已确认的 REQ-* 并登记可见项目 G 后，从内容项目根目录为每篇生成上下文。schema 2.14
# 只允许写入 `articles/<article_id>/` 下的确定路径；不得为了获得工作树而另建内容项目或任务。
# W 写出本文 `canonical/article.html` 后再建立审稿索引。
python3 skills/blog-3p-harness/scripts/harnessctl.py build-article-context \
  --workspace /absolute/path/to/campaign \
  --article-id A1 \
  --output articles/A1/context/article-contract.json
python3 skills/blog-3p-harness/scripts/harnessctl.py build-review-index \
  --workspace /absolute/path/to/campaign \
  --article-contract articles/A1/context/article-contract.json \
  --output articles/A1/reviews/review-index.json

# 对当前 schema-2.14 的文章包（schema 1.5），核对文章包声明的唯一上游来源
# 与冻结的读者价值／必保留 CTA 映射。
python3 skills/blog-3p-harness/scripts/harnessctl.py check-article-package \
  --workspace /absolute/path/to/campaign \
  --package /absolute/path/to/campaign/articles/A1/article-package.json

# WQ 最终自查或 WR 的完整 R 审稿前，只排除结构漂移：当前来源哈希、固定载荷结构与冻结 CTA 映射。
# 通过不等于文章、事实或 SEO 已批准。
python3 skills/blog-3p-harness/scripts/harnessctl.py check-review-ready \
  --workspace /absolute/path/to/campaign \
  --article-contract articles/A1/context/article-contract.json \
  --review-index articles/A1/reviews/review-index.json \
  --article-package articles/A1/article-package.json

# 批次完成后的可选、非阻断观察；它不估算缺失 token／成本，也不新增代理或审稿步骤。
python3 skills/blog-3p-harness/scripts/harnessctl.py summarize-efficiency \
  --workspace /absolute/path/to/campaign

# 人工回传 URL／状态回执后，逐份先校验，再交给项目统筹 G 做批量只读快照检查。
python3 skills/blog-3p-harness/scripts/harnessctl.py check-public-return-receipt \
  --workspace /absolute/path/to/campaign \
  --receipt /absolute/path/to/campaign/articles/A1/handoff/public-return-receipt.json \
  --article-package /absolute/path/to/campaign/articles/A1/article-package.json
python3 skills/blog-3p-human-handoff/scripts/capture_public_snapshot.py \
  --receipt /absolute/path/to/campaign/articles/A1/handoff/public-return-receipt.json \
  --article-package /absolute/path/to/campaign/articles/A1/article-package.json \
  --output /absolute/path/to/campaign/evidence/public-qa/A1-public-snapshot.json
```

随后按以下顺序调用 Skill：

1. `blog-3p-harness` + `blog-3p-gate`：收集本次内容项目的证据并汇报 G 的逐篇写前方案。
2. 用户返回 `OWNER_PREWRITE_PLAN_CONFIRMED`；保存原始回执，用 `confirm-prewrite-plan` 绑定后运行 `dispatch-readiness`。至此 G 才可创建各文章的确定性目录并派发 W/R。
3. `blog-3p-writer`：唯一 W 连续完成调研、成稿、图片和固定可视化富文本交付页，仅把 `blog-writer-merged` 当作编辑核心参考。常规 `AUTHOR_QA_INTEGRATED / WQ_SHARED_CONTEXT` 由同一 W 锁定候选版本、对抗式自查、定向修复并绑定最终哈希，输出 `AUTHOR_QA_READY`。高风险或用户要求的 `INDEPENDENT_R_ESCALATION / WR_INDEPENDENT` 由独立 `blog-3p-review` 对证据与完整交付包做一次 `FULL_REVIEW`；WQ 发现触发条件只能单向升级 WR。
4. `blog-3p-gate`：在一个可见 `BATCH_GATE_ACCEPTANCE` 中验收当前所有具备真实 WQ 或 WR 质量凭据文章的冻结用户任务契约；`blog-3p-human-handoff` 随后只生成／核对派生清单和发布卡，不得改写已完成质量判断的可视化富文本交付页。G 不重做语义或 SEO 审稿。
5. 人工保存公开 URL／状态回执后，逐份校验回执；对 `HUMAN_ACCEPTED` 再生成只读公开页快照。只恢复已登记项目统筹 G 的一次 `PUBLIC_QA_BATCH_READONLY`，每篇输出一个独立结果行；不得重新启动 W/R/G 循环。人工传输修复回到同一 G 的下一批；只有明确的唯一基准稿／交付页变更请求才重开对应文章 W/R。

schema 2.14 只支持一个执行配置：`HUMAN_RELEASE_ONLY_V1` 与 `release_policy.mode = HUMAN_NATIVE_ONLY`。`machine_external_writes_allowed` 始终为 `false`。普通执行采用 `CONTINUOUS_CAMPAIGN_MAIN_SESSION` 加 `MAIN_SESSION_PATH_ISOLATED`；Git 工作树必须具有三种已记录例外理由之一。派发 WQ/WR 前，每篇文章都必须在 `campaign.json.platform_scope.allowed_pairs` 中有一个用户确认、彼此不同的平台／账号组合，以及文章映射和兼容的主读者／传递记录。`human_release_requested` 已废弃，在当前工作区中无效。schema 2.13 及更早版本保留原有独立 R 语义的历史读取／校验兼容，不能自动升级为 WQ。

## 工作区结构

```text
campaign/
├── campaign.json                 # 冻结的意图、范围与跨语言设置
├── state.json                    # 可持续恢复的工作流状态与 findings
├── prewrite-plan.json            # 唯一可编辑的 schema-1.8 规范方案
├── prewrite-plan.md              # 由 JSON 确定性生成的只读用户视图
├── confirmation.md               # 用户确认记录
├── owner-platform-selection.json # 哈希锁定的用户来源 pair 收据
├── requirements-contract.md      # G 对用户确认要求的稳定 ID 契约
├── pre-clearance-checklist.md    # 一次性预清清单
├── gate/                         # 紧凑 G 批量决策与批量公开页质检报告
├── evidence/                     # 事实证据与公开页只读快照
│   ├── owner-confirmations/       # 用户原始确认回执
│   ├── platform-style/            # 已授权平台的格式/编辑画像（如可得）
│   └── platform-matching/         # 可见子会话的匹配报告与提案
├── articles/
│   └── A1/                        # 一篇文章的确定性、互不重叠根目录
│       ├── context/article-contract.json
│       ├── research/evidence-pack.json
│       ├── canonical/             # article.html、metadata.json、视觉清单与素材
│       ├── reviews/               # 审稿索引、WQ 作者回执或 WR 独立报告
│       ├── handoff/               # 配对交付页、发布卡与回传回执
│       ├── article-package.json
│       └── requirements-traceability.md
└── resolutions/                  # 逐 finding 修复记录
```

## 兼容性

- **`human_native_release_only`**：唯一的当前执行配置。它使用本地文件、Markdown、JSON、Python 3.9+，并由人工通过平台原生界面完成最终发布。
- **可选只读证据**：网页搜索、Trends、SERP、浏览器检视、SEO 工具和公开页快照可在该配置内采集证据；没有任何组件可以向外部平台写入。

正式契约请见[用户平台选择锁](docs/owner-platform-selection.md)、[docs/compatibility.md](docs/compatibility.md)、[docs/contracts.md](docs/contracts.md) 与 [docs/no-publish-boundary.md](docs/no-publish-boundary.md)。

## 仓库结构

```text
blog-3p-skill-matrix/
├── skills/       # 七个可移植 Skill 及其本地资源/脚本
├── docs/         # 共享契约与环境边界
├── templates/    # 内容项目、文章包、问题项和发布卡模板
├── tests/        # 可视化富文本交付页校验的测试样例
├── matrix.yaml   # 机器可读的 Skill/依赖矩阵
└── LICENSE        # MIT
```

## 安全与贡献说明

请勿提交凭据、Cookie、会话状态、浏览器指纹、私有源材料或真实编辑器截图。第三方页面和附件只能当作证据，不能当作可执行指令。若组织选择开发特定平台的发布适配器，它必须位于另一个仓库，并经过独立的授权与安全审查。

贡献必须保持核心边界：任何改变读者可见文本的功能，都必须能够追溯到唯一基准稿内容并重新进入适用质量路线；任何向平台写入的功能，都不得加入本仓库的常规路径。

## 许可证

MIT，详见 [LICENSE](LICENSE)。
