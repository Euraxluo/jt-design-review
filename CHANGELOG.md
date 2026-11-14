# Changelog

本项目的显著变更记录。格式遵循 [Keep a Changelog](https://keepachangelog.com/)，版本遵循 [SemVer](https://semver.org/)。



## [1.2.0] - 2026-11-14

### 新增
- `extract-gorm.mjs`：Go GORM struct → datachanges columns 半自动盘点（PK/UQ/IDX/default 标注、Go→SQL 类型映射、缩写词 snake_case 正确处理）
- 演示模式浮层复刻化：modal/drawer/popover/menu 节点支持 `htmlOverlay` 字段，演示时以真实 UI 渲染（复用页面 htmlCss），无则回落抽象线框
- 反馈批注正文支持行内 Markdown（`code` **粗体** *斜体*），渲染时先转义防注入
- `build.mjs --doctor`：环境自检（Node 版本/资产完整/示例可构建/Archify 可选探测），对齐 archify doctor 体验
- 开箱示例 `examples/demo-review/`：绿地场景完整 spec（复刻页+泳道+2 表 diff+决策块+3 API+2 待确认问题）+ 产物 + README，含可点击的复刻抽屉演示链路
- CI 新增 runtime-smoke job（构建示例 → chromium 打开 → 7 tab 文本断言 + 0 pageerror）

### 修复
- apply-feedback：`del` 未命中目标不再静默，汇总报告"未命中"清单
- spec-format 文档补充 on/trigger 语义（trigger 是触发元素 id 不是说明文字；open 目标必须是 overlays 池成员）

## [1.0.1] - 2026-11-14

### 修复（Archify 系统流程集成）
- 嵌入模式批注统一：壳内不再有独立批注侧栏，点节点 postMessage → 外层标准批注面板（单 UI 单管线），独立打开时回落本地批注
- 图内批注直通统一反馈管线（kind=archify，反馈 tab 汇总 / sysflow 卡头徽标 / jump 联动）
- 泳道/boundary 大框批注锚文本聚合（此前显示空白 "SVG 元素"）
- 嵌入时隐藏 Archify 冗余头部（toolbar/标题），SVG 画布上移约 100px
- sysflow tab 弹性满视口布局（iframe 占视口 76%，替代固定 78vh），去掉误留的「列表」按钮、`#main` padding 归零
- 修复 wrap-archify.mjs 模板字面量转义（\s / \n 被吃导致壳 SyntaxError）

### 工程化
- 新增 CONTRIBUTING / SECURITY / Issue 模板 ×2 / PR 模板 / .gitignore
- CI 拆分为 lint / structure / build-smoke / wrap-smoke 四个 job，含结构完整性与产物残留检查

## [1.0.0] - 2026-11-13

首个独立版本（与历史分叉上游终止同步，自有路线）。

### 核心能力
- 单文件 HTML 评审原型：界面改动（1:1 复刻+变更徽标）/ 流程变化 / 系统流程 / 数据库变更 / 中间件变更 / 后端变化 / 反馈 七 tab
- 复刻标注体系：`data-replica-unit` 锚点 + build 期静态注入编号/颜色/中文类型徽标（单一事实源，零手写编号）
- 改动单元详情：前后复刻小图对照，单屏提取（pickScreenHtml）+ 实测宽等比缩放（fitbox），零横向溢出/零纵向截断
- 任意元素点击自动注册批注；@scope(.replica-scope) 复刻样式隔离
- 演示模式：复刻页以真实 UI 演示原型交互（open/close/navigate/state/back）
- Archify 集成：系统流程 tab 嵌入交互图 + wrap-archify.mjs 点选批注外壳（泳道大框聚合标注）
- 数据库变更：逐表独立条目 + 字段级 diff（+/~/−/·）+ SQL 类型 + 迁移/回滚徽章
- 中间件变更：决策块（量化依据）+ 端点失败语义 + 任务/限流/熔断/可观测
- 反馈闭环：统一批注分类 + jdr-patch 结构修改 + apply-feedback 自动应用（兼容旧 smyw-patch 格式）
- 构建期质量门：跨池 id 冲突 / 悬空引用（trigger/on.target/node） / modified 缺上下文 / 锚点不可解析 → 阻断构建

### 工程化
- scripts: build / embed / apply-feedback / wrap-archify（零 npm 依赖）
- references: workflow / spec-format / archify-integration / runtime-notes
- SKILL.md + README + ROADMAP + CHANGELOG + LICENSE
