# V4.5 三入口 P0 实施与交接

本批已完成候选代码、真实数据回放、定向测试及一次独立审查，并按审查发现修复。**这是一份候选实施记录，不是生产部署或全套测试通过证明。** 工作分支为 `codex/v45-parallel-p0-20261113`；实际远端提交 SHA 和推送读回结果由本次交付消息报告。

固定初始基线：`530beea8f3c3edd082d777cbe316b4b0322080ee`。本次接续的已有实施 HEAD：`9f813e8e6a60e20c38d0594d5fd92aa7ac49261c`。沿用已有八个提交，没有重建历史或覆盖其他分支。

推送前发现远端新增 `5440a4c1eb836e3761fb349dc407768582b97658`，仅增加独立离线审计输入 workflow。本批本地提交已重放到它之后，该 workflow 原字节保留；没有 force push 或合并到主分支。重放前后运行时代码字节未变。

## 1. 三个入口与内容

| 入口 | 首版可用内容 | 原读取 owner |
|---|---|---|
| `/v45/selection/` 今日选股 | A/HK 完整候选、日期/市场/搜索/来源/来源状态过滤、每页 50 只展示、多来源关系、原排名/分数/理由/行情时点、逐来源 SHA、历史公式逐股对照、交付断点 | `/api/v4/preselection-pools`，每次最多 300 行，持续读取原分页 |
| `/v45/research/` 个股研究 | A 股数值日包、量价/关键 K 原判定、原图入口、公司材料缺口、分组事件成熟度；HK 原 0.2 候选资料及原工作台个股研究、风险和批次 | A 股 `research/a-share` 原接口；HK `manager-workbench/days → run_id → stocks` |
| `/v45/review/` 复盘验证 | A/HK 原精确日复盘、原分母/缺失阶段/模式；A 股同来源日与分组 D+2/D+5、最新未成熟事件；HK 原保存计划同批复盘 | 原 `/api/v3/review` 兼容路由（与 `/api/v4/review` 同 owner），A 股 `daily-product/event-cases`，HK `manager-workbench/reviews` |

观察日、材料来源日、市场、证券、分组和返回选股筛选上下文可在页面间传递。多来源日期不一致时分别给出日期链接；选定来源后使用该来源日期。HK 同日链接固定已选择的计划批次，显式切换观察日会解除旧日批次再读新日计划。

公式对照使用原文件的 118 条精简记录：D11/O12 共 69 条（原公式 44、v1.9.2 25、共同 0）；D12/O13 共 49 条（40、10、共同 1）。保留原条件、原分数、UNKNOWN、差异理由和 checkpoint SHA。两天成员集合已核；缺少独立的双方输入版本比较 manifest，**同版在线可比性仍为 CANNOT_CONFIRM**。没有重算公式、跨策略总分或港股 v1.9.2 比较。

交付状态明确区分所选日期和历史批次。历史四组 D11/O12 是 426 只、541 条组别关系，历史富途回执 426/426；其研究回包 PARTIAL、64 个范围不兼容、NOT_IMPORTED。该回执不用于证明当前候选或今天的同步完成。当前富途、研究接收/校验/导入/页面可见均不由本页反推成功。

## 2. 原页面、入口和来源边界

首页采用准确 API 角色的 `App.vue`，与指定 `a3594906…` overlay 逐字节相同。`index.html` 单独加载幂等 `v45/entry-nav.js`，在原“原版 Vibe · 8910”后追加三项；原阶段选股、D-1 预选池、研报决策台、研究看板、经理选股工作台、SOP、任务状态、A 股复盘、研究复盘和 Vibe 保留。原 URL、事件处理器、默认页均未改写。

本次补齐 52 项准确 API 前端依赖/测试/静态文件，前后 SHA 及冻结来源见 [API_DEPENDENCY_ALIGNMENT.json](API_DEPENDENCY_ALIGNMENT.json)。这是原角色版本的逐字节派生，不是重写旧业务逻辑。API 角色 138 个 web 文件中，**136 项完全匹配**；只有 `index.html` 追加入口脚本和 `vite.config.ts` 追加三个 MPA 输入是明确差异。

三份原 API CSS/预览资源带 CRLF；为防止仓库默认 LF 规范化破坏精确 SHA，`.gitattributes` 仅对这三条路径设置 `-text`，保留原字节。暂存区和远端读回继续核 SHA。

原 `docs/source-baseline-20261112`、SHA 命名 overlays、六份角色矩阵未改。固定 Git 树核验通过：6 个角色、3,053 条引用、1,746 个唯一原文件。原 materializer 按当前路径验 SHA；候选根变动后不应用它把漂移“修正”为原始来源。本批新增只读工具从固定初始 Git 树核原字节，并单独核候选对齐。

### 代码与 owner 地图

| 本批可维护路径 | 职责与依赖 | 生产 owner 保持位置 |
|---|---|---|
| `apps/web/index.html`、`v45/entry-nav.js` | 原首页追加入口 | 原 API 前端，不改 Vibe 8910 |
| `apps/web/v45/{selection,research,review}/` | 三个独立 MPA 投影页面 | 原 V4/8873 静态资源挂载 |
| `apps/web/v45/shared/data.js` | GET 适配、身份绑定、完整性、坏件隔离 | 原 API/产物合同；不落新的权威表 |
| `apps/web/v45/shared/ui.js`、`v45.css` | 日期链接、状态、成熟度与响应式样式 | 仅新页使用 |
| `apps/web/public/v45/shared/formula-comparison.v1.bin` | 118 行历史精简对照；修复继承文件的 gzip EOF 损坏 | 原对照文件的展示投影，不是新选股输出 |
| `tools/v45/` | 固定 Git 树核验、外置真实样例临时回放及 HTTP 检查 | 仅测试；不常驻、不调度、用后关闭 |

原静态服务 `_RevalidatingStaticFiles(..., html=True)` 可承载新 MPA 目录。原研究看板另有 `APIResearchUI` allowlist/manifest 绑定；本批没有复制或伪造那套部署材料。旧页原完成事件保留；新页在加载/用户刷新时 GET 读取，不新增后台轮询、producer 或自造完成事件。

## 3. 真实数据验收

Drive ZIP：274,318 bytes，SHA256 `21fe95c541eac216dfbc2b9b4dee94ede1e9a4756e50ebf15a150e962f5be11a`。23/23 manifest 成员字节数与 SHA 通过。八份 API 样例按 `{reader,payload}` 解包，完整名单来自原 CSV，不把 limit=1 样例当作全池。

| 观察日 / 来源日 | A 去重股票 | HK 去重股票 | 全部去重股票 | 来源关系 |
|---|---:|---:|---:|---:|
| 20261112 / 20261111 | 421 | 100 | 521 | 554 |
| 20261113 / 20261112 | 272 | 100 | 372 | 386 |

逐市场分母、逐池关系分母、分页 offset/next_offset、fingerprint、source_digests 和 SHA 均核对。缺分母保持未知；已核的 0 与未生成分开。Stage7 缺失/部分可用不抹除其他有效来源；后页 HTTP/网络/JSON 错误保留已读有效数据并标未完整。畸形单池/行单独隔离。跨日期/分页版本冲突不混合展示。

`000159.SZ` 是独立研究验收样例，**不在这两天的汇总候选池中**。真实 D11 数值日包和原图描述 READY，公司材料 NOT_MATERIALIZED。`nav_pullback` D+2 总 2、有效 1、未成熟 1；D+5 总 2、有效 0、未成熟 2。最新 11/11 事件在该来源时点仍未成熟；没有因为当前墙钟变晚或历史案例存在收益就改写它。历史覆盖 10 个已评估样本、full_history=false、PIT=false、最高 DIRECTION_ONLY 原样显示。

HK 样例 `HK.02659` 宝济药业-B 在 O13 原 0.2 池中，原排名 1、原分数 `1.004231309893722`。真实池和 D12 原复盘内容可核；本包没有现役 HK days/stock 的完整快照，因此真实工作台个股材料验收仍缺件。接口合同与同批、跨日期行为已用原 schema 的定向测试覆盖，不能把这些测试算作线上 HK 数据验收。

本批未上传原始 ZIP、完整候选 CSV、API 回包、图形资产、账户、运行数据、日志、`dist` 或 `node_modules`。仅原方案允许的精简公式对照随源码提交；gzip 为 9,488 bytes，SHA256 `2ff8b3b749f40fb4e20af2a48399238a8585805ff4ba970412e3e904b5574f32`。

## 4. 测试结果与实际限制

环境：Node 24.22.1、npm 11.9.0、Vite 7.3.6、Vitest 4.1.10、Vue 3.5.40、vue-tsc 3.3.8、TypeScript 5.9.3、JSDOM 28.1.0。机器结果见 [VERIFICATION_RESULTS.json](VERIFICATION_RESULTS.json)。

| 验证层 | 实际结果 |
|---|---|
| 新页合同、实际 main.js DOM 交互、导航幂等、真实数据回放 | **33/33 PASS，0 skip**；其中 2 项依赖外置真实样例 |
| Vite 构建 | **PASS**，125 modules、6 个新旧 MPA HTML |
| 冻结回放 HTTP | **PASS**，6 个 HTML 入口、13 个构建资源、两天候选 API；完成即关闭临时服务 |
| 冻结源与准确 API 对齐 | **PASS**，3,053 引用 / 1,746 原文件；136 精确 API 文件 + 2 明确入口差异 |
| 保留的完整 web 测试 | **FAIL**：691 条中 615 通过、74 失败、2 跳过；50 文件中 22 失败、27 通过、1 跳过 |
| 完整 typecheck | **FAIL**，36 处；准确 API 基线原 31 处全部保留，另 5 处来自非 API 残留测试 |
| 桌面与 638px 真实浏览器视觉验收 | **NOT_RUN**；云浏览器无法连接隔离回放 loopback，不能以 JSDOM/HTTP 代替渲染证据 |
| 原图 HTML/projection 实际加载 | **NOT_RUN**；提供的 ZIP 只有原图描述和绑定 URL，没有资产本体 |
| 现役 API/UI、自然时段、PIT 认证 | **NOT_RUN / CANNOT_CONFIRM** |

准确 API 角色基线单独从固定 Git 树构造。35 个测试文件共 538 条，477 通过、59 失败、2 跳过；候选中的 **538 条名称与状态逐条完全一致**，包含重复名称用例。四个依赖 fixture 的套件使用固定 Git 树已存在、但角色清单排除的两份原文件补验，没有伪造原机器资料。

额外 15 项失败属于 7 个未在 API 角色清单中的原根测试文件：11 条为 canonical/API 合同预期差异，4 条读取原机器公告 fixture 时失败。原 59 项失败含真实旧断言不一致，不能统称环境问题。失败名称与分组保留在机器结果中。本次没有删测试、放松原 owner 合同或补造私有 fixture 来变绿。

CI 将 P0、构建与完整旧套件分为独立作业；完整旧套件/typecheck 仍然可以使流水线失败，没有 `continue-on-error` 隐藏失败。CI 没有外置真实包时，两项回放测试明确 SKIP，与本地真实回放 PASS 分开报告。远端 CI 是否已运行，以 GitHub 具体运行结果为准。

## 5. 独立审查与修复闭环

一次全新、只读 Reviewer 的原 verdict 为 **REQUEST_CHANGES：0 Critical、3 Important**。发现为：部分材料身份/manifest 校验不一致；JSON 结构异常连带清空有效兄弟数据；港股改日保留旧 run_id。Writer 均先以回归测试复现 RED，再修改并取得 GREEN；最终 33 项定向测试通过。

审查没有改写为“独审全绿”。遵守约定的一次独审流程，未开展第二轮独立复审。各项定位、修复及证据见 [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md)。

## 6. 复现与后续接入 SOP

在 `apps/web`：

```bash
npm ci
V45_REPLAY_DIR=/external/verified-replay node --test v45/shared/data.contract-check.mjs v45/shared/p0.contract-check.mjs v45/entry-nav.contract-check.mjs v45/pages.contract-check.mjs v45/real-data.contract-check.mjs
npm run build
npm test -- --maxWorkers 2
npm run typecheck
```

在仓库根，固定源核验与外置样例检查：

```bash
python tools/v45/verify_frozen_sources.py
python tools/v45/frozen_replay.py --samples /external/V45_DATA_DELTA_20261113 --export /external/verified-replay
python tools/v45/frozen_replay.py --samples /external/V45_DATA_DELTA_20261113 --dist apps/web/dist --check-http
```

`/external/...` 是操作者已有真实包的示例位置，不是随仓库交付的数据。工具先核 manifest 后才投影；没有包时不得宣称完成真实回放。新页仅 GET，没有提交订单、关注写入、富途分组或业务任务操作。

后续如实施部署，应由原 API 静态资源 owner 集成此候选构建，并补现役身份/旧 URL 与按钮/638px/原图资产/HK 真回包/自然时段验收。当前没有更改生产发布目录，因此本次无需执行生产回滚。代码推送不构成部署授权；本报告未执行合并、部署、服务启停、调度、富途或研究材料写入。

`RESEARCH_ONLY=true` · `production_allowed=false` · `buy_gate_updated=false` · `orders_sent=false`
