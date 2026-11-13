# jt-design-review

企业级**方案确认工作台**：聊完需求和规划后，产出一个单文件 HTML「设计评审原型」，让业务方在一页上看懂整个技术方案——页面怎么变、系统怎么协作、数据库和中间件怎么改——直接点选批注、改结构、演示交互，再把结构化反馈交回 Agent 落实。

由 [smyw](https://github.com/) 深度二开 + [Archify](https://github.com/tt-a1i/archify) 集成而来。

## 产出物：单文件 review HTML，包含 7 个 tab

| Tab | 内容 | 交互 |
|---|---|---|
| **界面改动** | 1:1 复刻真实 UI（改动前/后对照）+ 变更徽标（编号+类型） | 点徽标→改动单元详情（前后复刻小图、单屏提取、等比无截断）；点任意元素→自动注册→批注 |
| **流程变化** | 业务流程泳道（改动前后） | 步骤↔界面互相定位 |
| **系统流程** | **Archify 交互图**（architecture/workflow/sequence 等 11 种，点节点批注+导出反馈） | 图内缩放/路径高亮 + 点选批注 |
| **数据库变更** | 逐表独立条目：全量现状清单 → 字段级 diff（+新增/~修改附旧值/−删除/·不变）、SQL 类型、DDL、迁移+回滚徽章 | 逐表逐字段批注 |
| **中间件变更** | 决策块（不引入 Kafka/Redis 及依据数字）+ 出站/入站端点（参数+失败语义）+ 后台任务 + 限流/熔断/可观测 | 逐条目批注 |
| **后端变化** | 模块→条目 改动前后对照 | 逐条目批注 |
| **反馈** | 全部批注汇总 + 待确认问题 + 一键复制结构化反馈 | 交回 Agent |

另有**演示模式**（Figma Present 式）：复刻页直接以真实 UI 演示，点控件执行原型交互（开弹窗/跳页/切状态）。

## 快速开始

```bash
# 1. 写 spec（格式见 references/spec-format.md）
mkdir -p .smyw/20260101-my-feature && vim .smyw/20260101-my-feature/spec.json

# 2. 构建（校验+徽标注入，出错阻断）+ 内嵌截图
node scripts/build.mjs .smyw/20260101-my-feature/spec.json
node scripts/embed.mjs .smyw/20260101-my-feature/preview.html

# 3. （可选）系统流程用 Archify
node ~/.agents/skills/archify/bin/archify.mjs render architecture arch.json arch.html
node scripts/wrap-archify.mjs arch.html -o arch-review.html   # 加点选批注外壳
# 把 arch-review.html 全文塞进 spec.sysflows[i].embedHtml

# 4. 用户看完 → 复制反馈回来
node scripts/apply-feedback.mjs .smyw/.../feedback-v2.md .smyw/.../spec.json
```

## 设计原则

- **编号单一事实源**：徽标编号 build 时从 spec 计算，零手写、零漂移
- **数据库先盘点后变更**：只允许真实存在的表，"不动"也列出
- **中间件最小化**：默认不引入新组件，引入必须选型对比
- **单文件离线**：截图/图全部内嵌，可离线打开、可钉钉直发
- **构建期静态检查**：跨池 id 冲突/悬空引用/缺上下文一律阻断

## 文档

- [完整工作法 + 踩坑记录](references/workflow.md)（第一次使用必读）
- [spec 格式](references/spec-format.md)
- [Archify 集成](references/archify-integration.md)
- [Excalidraw 嵌入](references/excalidraw-embed.md)
- [runtime 二开点](references/assets-notes.md)

## License

同上游 smyw 许可；Archify 部分遵循其 Apache-2.0（独立安装，本仓库只含集成脚本与文档）。
