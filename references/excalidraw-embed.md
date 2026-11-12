# Excalidraw 嵌入（build-excalidraw.mjs 用法）

## 原理

把 `.excalidraw` 场景 + React + @excalidraw/excalidraw（npm 本地包）用 esbuild 打成**单文件 HTML**：
- `window.__SCENE__ = <JSON.stringify(场景)>`（必须是字符串化 JSON，代码里 `JSON.parse`——塞对象字面量会报 "[object Object] is not valid JSON"）
- 顶栏放「导出 PNG」「导出 .excalidraw」按钮（exportToBlob / getSceneElements 序列化下载）——iframe 拿不到宿主文件系统，保存走 导出→回传→Agent 落盘
- esbuild 入口示例：
  ```js
  import React from "react";
  import { createRoot } from "react-dom/client";
  import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
  const scene = JSON.parse(window.__SCENE__); let api = null;
  // Excalidraw 组件 + excalidrawAPI 回调 + 导出按钮，initialData: { elements: scene.elements }
  ```
- 前置条件：某个目录里有 `node_modules/{react,react-dom,@excalidraw/excalidraw,esbuild}`（本机在 /tmp/ztocc-diagram；`pnpm add` 一次即可复用）
- `define: { "process.env.IS_PREACT": "false" }`，jsx: automatic，bundle+minify，产出 js 内联进 HTML body 尾部（head 里执行时 #app 未解析→白屏）

## 嵌入 spec

sysflows[].embedHtml = 该 HTML 全文，但 `</` 必须转义。做法（哨兵法）：
```python
sentinel = "\x00S\x00"
val = html.replace("</", sentinel)
spec["sysflows"][0]["embedHtml"] = val
out = json.dumps(spec, ensure_ascii=False, indent=2).replace("\\u0000S\\u0000", "<\\u002f")
```
即最终 JSON 文本里是 `<\u002f`（单反斜杠），JSON.parse 后还原 `</`。双层错误（双反斜杠/漏替换）都会导致 iframe 空白或外层脚本终止——build 后必须 Playwright 验证 iframe canvas 数 ≥2。

## 画图纪律（Excalidraw 场景生成）

- 生成场景用代码（node 脚本拼 elements JSON），不要手画；**每个元素必须有非 null 的 width/height/points**——任何一个 null 坐标会让 Excalidraw 整画布静默变白
- 连线走泳道间隙通道，禁止对角线穿卡片；箭头语义：实线=请求流、虚线=回调/轮询、灰虚线=对照/引用
- 渲染验证：headless Chrome 截图 + 盯"线是否穿卡/标签是否压线"；已知问题修完再交付

## 场景文件管理

`.excalidraw` 源文件放 `docs/plans/<area>/` 进 git；大版本存档复制进 `archive/`。会议页需要"编辑后导出新 HTML"时，用 SCENE-START/SCENE-END 标记包裹场景 JSON，导出按钮读标记替换后整页下载。
