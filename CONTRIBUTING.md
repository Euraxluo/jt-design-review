# 贡献指南

感谢关注 design-change-review！

## 这个项目是什么

一个面向任何技术栈团队的「方案确认原型工作台」Agent Skill：把一次技术方案的变更
（页面 / 流程 / 数据库 / 中间件 / 后端）产出一个单文件可交互 HTML 评审原型，
业务方点选批注、试玩交互，结构化反馈交回 Agent 落实。

## 如何参与

### 报告问题
- 先搜 issue 区避免重复
- 报 bug 请附：spec.json 最小复现 + 构建命令输出 + 浏览器 console 错误
- 提需求请说明真实评审场景（什么角色、要确认什么）

### 提交 PR
1. Fork 并从 `main` 拉分支
2. 改动前先跑通本地检查（见下）
3. commit 信息用中文/英文均可，说清"改了什么、为什么"
4. PR 描述里附验证证据：改动的 Playwright 实测截图/断言输出

### 本地检查（PR 必须）
```bash
for f in scripts/*.mjs; do node --check "$f"; done   # 语法
node --check assets/runtime.js
node scripts/build.mjs <任意 spec> --check           # 构建
```
涉及 `assets/runtime.js` 的改动，必须按 `references/workflow.md` 的
「Playwright 必测清单」逐项验证并在 PR 中给出结果。

### 改 runtime 的约定
- `assets/runtime.js` 与 `scripts/build.mjs` 中存在**成对镜像逻辑**
  （改动单元编号：computeUnits/unitOf 两份实现）——改一处必须同步另一处
- 构建脚本与 runtime 均为 vanilla JS 零依赖，保持这个性质
- 徽标编号是单一事实源，禁止引入手写编号路径

### 文档改动
`references/` 下的工作法文档与字段契约改动无需跑浏览器验证，
但请保证示例可复制执行。

## 设计原则（评审 PR 的依据）

见 README.md「设计原则」。凡增加新依赖、新中间件偏好、绕过构建期校验的改动默认拒绝。

## 行为准则

遵循 [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) 精神：
保持专业、对事不对人、欢迎新手。
