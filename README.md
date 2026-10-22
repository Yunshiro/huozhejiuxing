# 活着就行

三十天，一笔债。饥饿、心情、体力有一项归零，这一局就停；第 30 天结束时，手头的钱够不够还债，会走进不同的结局。

纯静态网页，没有账号，没有服务器。构建结果可以放到 GitHub Pages 的 `/huozhejiuxing/` 路径下。

## 本地运行

需要 Node.js 22。

```bash
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:5173/huozhejiuxing/`。

```bash
npm test
npm run build
npm run preview
```

`npm run build` 会先按游戏文案裁剪像素字体，再做类型检查和静态打包。预览地址同样是 `/huozhejiuxing/`。

## 改数值、改文案

逻辑在 `src/game/`。下面这些文件只放数据和文案，改它们不用动流程：

| 文件 | 内容 |
| --- | --- |
| `src/data/meta.ts` | 债务金额、分享图水印、游戏网址、天数、事件重复上限 |
| `src/data/balance.ts` | 开局数值、每时段自然消耗、低数值警告线 |
| `src/data/actions.ts` | 吃饭、休息、洗澡、逛街、睡觉，以及三顿饭 |
| `src/data/jobs.ts` | 工作收入、消耗、熟练度、解锁条件 |
| `src/data/events.ts` | 随机事件。新事件追加一条，`id` 别和已有的重复 |
| `src/data/npcs.ts` | NPC 故事线 |
| `src/data/endings.ts` | 结局名称和正文 |

债务和水印还是占位：债务 `20000`，水印 `@Yunn260414`，网址 `https://yunshiro.github.io/huozhejiuxing/`。确认后只改 `src/data/meta.ts`。

## 测试模式

正式打开没有调试面板。地址加上 `?debug=1` 之后可以：

- 跳到任意一天
- 直接改钱、饥饿、心情、体力
- 用指定种子重开（同一颗种子，事件顺序相同）
- 在条件满足时手动触发下一段 NPC 剧情

## 存档

每个选择之后都会写入本机 `localStorage`。菜单里可以导出存档码，换一台浏览器再导入。存档码坏了、缺了一截，或者校验对不上，会提示原因，页面不会崩。

## 字体

界面用 Fusion Pixel 12px（简体），SIL Open Font License 1.1。完整字库不进页面。`npm run font` / `npm run build` 会扫描 `src` 和 `index.html` 里实际出现的字，加上 ASCII，打成一份 woff2。CSS 使用 `font-display: swap`，系统里的苹方、思源黑体、微软雅黑会先把字画出来。

## 部署

仓库里的 `.github/workflows/pages.yml` 只保留了手动触发（`workflow_dispatch`），push 不会发布。要上线需要先确认，并在仓库设置里把 GitHub Pages 的来源改成 GitHub Actions，再手动跑这个流程。
