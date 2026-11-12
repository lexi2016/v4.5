# V4.5 三入口并行升级

这是用户为本次 V4 升级新建的专用开发仓库，原仓库及原服务继续保留。

先读 [本次实施任务与用户决定](docs/v45/IMPLEMENTATION_BRIEF.md)、[已审源码定位入口](V4_SOURCE_ENTRY.md) 和 [原始完整方案及本次覆盖规则](docs/v45/PLAN.md)。

## 当前内容与身份

- 源自 `lexi2016/v4` 的完整审查交付 commit `60457d189b130a7050942addee60d7e694d57b15`（源码 commit `bb0de9311b82e0c3f749be3dc7e450bd57524131`）。
- 当前 Main/API/Stage/SharedPackage/APIResearchUI 的 3053 个角色引用、1746 个唯一源码目标逐字节保留，角色变体通过 SOURCE_MATRIX 精确定位。
- 根路径是整合候选，角色映射保存实际运行来源；不能把二者当作同一可直接部署版本。原有固定 SHA overlay 文件不可原地编辑。
- 本仓库使用独立初始历史，旧 commit 的原始对象在 [原 V4 仓库](https://github.com/lexi2016/v4/tree/60457d189b130a7050942addee60d7e694d57b15)，不冒称旧 SHA 是本仓库的祖先。
- [来源与排除清单](docs/v45/BASELINE_ORIGIN.json) 记录原始基线、运行绑定及排除的旧数据/归档/本机软链接。真实联调数据在用户新建的 V4.5 Drive 文件夹，通过交接 Prompt 提供；不放公开源码仓库。

## 固定范围

同一 V4/8873 导航“原版 Vibe · 8910”附近追加 **今日选股、个股研究、复盘验证**。旧按钮、旧页面、默认页和原业务行为保留，新旧页面并行使用原数据、API、计算和完成事件。A 股与港股都覆盖，P0 优先，三个页面均交付可用首版。

这是开发升级工作区，不是第二个生产系统。本次初始化未实现三页面、未部署、未改调度/富途/交易。后续实施在 `codex/v45-parallel-p0-20261113` 分支提交并推送本仓库，完成验收后再另行确认部署。

`RESEARCH_ONLY=true` · `production_allowed=false` · `buy_gate_updated=false` · `orders_sent=false`
