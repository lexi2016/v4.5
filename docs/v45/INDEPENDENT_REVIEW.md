# 一次独立审查及 Writer 修复记录

Reviewer 为未参与实现和前置源/数据调查的全新代理，仅执行只读审查，无写入、提交、服务或子代理操作。审查固定原基线 `530beea8f3c3edd082d777cbe316b4b0322080ee`、继承 HEAD `9f813e8e6a60e20c38d0594d5fd92aa7ac49261c` 之上的候选工作树。

**原 verdict：REQUEST_CHANGES；Critical 0，Important 3。** 下列修复和验收由唯一 Writer 完成，不冒充第二次 Reviewer 签核。

| 发现 | 可复现影响 | Writer 修复 | 回归证据 |
|---|---|---|---|
| I1 部分材料身份和 manifest 校验不一致 | 缺日期/证券的 PARTIAL_RECEIVED 仍展示材料；通用 manifest 与 numeric manifest 的存在/相等检查不一致 | 有内容的 READY/PARTIAL_RECEIVED 统一要求日期、证券、generation、input、manifest；所有已提供 numeric/product/通用 manifest 与数值包比对；异常项移除内容、独立降级 | `malformed or unbound received materials…`：先 RED，修复后 GREEN |
| I2 JSON 结构异常影响兄弟数据 | 坏池 rows 对象导致有效池丢失；公司 HTTP 200 JSON null 使数值/原图 bundle 整体失败 | 池/行及证据对象形状先核；畸形来源计入隔离项、完整性未确认，保留独立有效候选；异常材料只降级本模块 | `a malformed optional pool…` 与材料异常用例：先 RED，修复后 GREEN |
| I3 港股改观察日仍携带旧计划 | O13/run13 链接改 O14 后仍以 run13 请求新日，正常 run14 被报冲突 | pin 绑定原观察日；同日保留，改日清除请求及 URL 中的旧 runId，再读新日原计划 | 实际 review/main.js JSDOM 测试 `Hong Kong review releases the old plan pin…`：先 RED，修复后 GREEN |

Reviewer 独立执行当时定向测试 30/30 PASS，核准冻结树未变、API web 136 项精确 + 2 项入口差异、52 项派生记录、118 行公式压缩文件；逐项比较原 API 35 文件 538 条测试，与候选状态完全一致。以上通过项没有掩盖三个新适配层缺陷。

Writer 修复后最终定向验收 **33/33 PASS、0 SKIP**。完整旧套件仍为 615 PASS / 74 FAIL / 2 SKIP，typecheck 仍 FAIL 36 处。构建与临时回放 HTTP PASS。独审要求的三个 Important 均有针对性修复与测试证据；第二轮独审 **NOT_RUN**，没有把原 REQUEST_CHANGES 改成 APPROVED。

桌面/638px 浏览器渲染、生产 API/UI、真实 HK 当前工作台材料、原图资产、自然运行均不在已通过范围内。Review 不授权部署，也没有给生产可部署结论。
