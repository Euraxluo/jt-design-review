# Archify 集成（系统流程图/架构图优先渲染器）

## 何时用 Archify vs Excalidraw vs 内嵌 sysflow

| 场景 | 用什么 |
|---|---|
| 方案确认页里的"系统流程" tab（spec.sysflows） | 保留内嵌 sysflow（可批注、与单元联动） |
| 独立交付的流程图/架构图 HTML（发钉钉、开会投屏、放设计文档） | **Archify** |
| 需要手工拖拽编辑的架构草图（开会现场共创） | Excalidraw（.excalidraw + build-excalidraw.mjs） |
| 代码库/多源真实数据溯源的架构图 | **Archify**（sources 字段带 repo 溯源） |

## Archify 是什么
- 开源 Apache-2.0，`tt-a1i/archify`（96k★，skills.sh 130k+ 安装），官方支持 OpenCode
- 11 种图类型：architecture / workflow / sequence / dataflow / lifecycle / erd / tree / class / timeline / waterfall / explainer
- 输出 = 单文件交互式 HTML（缩放/高亮路径/暗色切换/导出 PNG）

## 本机安装
`~/.agents/skills/archify/`（从 GitHub main 分支逐文件下载，examples 渲染物已省略）
健康检查：`node ~/.agents/skills/archify/bin/archify.mjs doctor` → "Archify is ready."

## 常用命令（cwd 必须在输出目录，meta.output 必须是相对路径）
```bash
archify="node ~/.agents/skills/archify/bin/archify.mjs"
# 渲染（校验 schema + 产出单文件 HTML）
$archify render <type> <input.json> <out.html>     # input 的 meta.output 必须等于 out 相对路径
# 架构对比（改动前/后 diff 图）
$archify compare architecture <base.json> <head.json> <out.html>
# 校验/检查
$archify validate <type> <input.json>
$archify check <out.html>                          # 产物完整性
```

## schema 要点（workflow 为例，schema_version 2）
- `meta`: title + **output（相对路径，必填）** + visual_preset（signal-flow 等）
- `lanes[]`: 泳道（id/label/variant: exception…）
- `phases[]`: 阶段带（fromCol/toCol/variant: emphasis…）
- `nodes[]`: { id, lane, col, label, type }，type ∈ frontend/backend/database/cloud/security/messagebus/external（组件类型，不是流程语义）
- `edges[]`: { from, to, variant: dashed… }
- 报错信息自带 Fix 提示；`schemas/<type>.schema.json` 是唯一真相
- 参考 examples/ 下各类型样例（如 agent-tool-call.workflow.json）

## 陷阱
- meta.output 绝对路径会被拒（output/meta-absolute）
- nodes 不允许额外属性（kind 之类会被 additionalProperties 拒绝）
- 大文件下载 GitHub 直连易超时：用 raw.githubusercontent 逐文件 + examples 只下 json 不下 rendered html
