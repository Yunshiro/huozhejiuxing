# 活着就行

三十天，一笔债。饥饿、心情、体力有一项归零，这一局就停；第 30 天结束时，手头的钱够不够还债，会走进不同的结局。

纯静态网页，没有账号，没有服务器。构建结果是 `dist/`，部署目标是 Vercel，站点根路径是 `/`。

## 本地运行

需要 Node.js 22。

```bash
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:5173/`。

```bash
npm test
npm run build
npm run build:test
npm run preview
```

`npm run build` 打正式包：类型检查、静态打包，不下载字体。`npm run build:test` 打带测试模式的包，给回归用。`npm run preview` 的地址是 `http://127.0.0.1:4173/`。`npm run sim` 用种子 1–300 跑「最高工资」和「普通玩家」两套策略，打印还债率、死亡率、平均手头的钱。

资源路径默认是 `/`。要挂到子路径，构建时设置 `VITE_BASE`，例如 `VITE_BASE=/preview/ npm run build`。

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

债务 `20000`，水印 `@Yunn260414`，分享图网址 `https://huozhejiuxing.vercel.app`。要改的话只动 `src/data/meta.ts`。

## 测试模式

正式包里没有测试模式。`npm run build` 的产物不包含调试代码，地址上的 `?debug=1` 不会生效。

`npm run dev` 和 `npm run build:test` 会把测试模式编进去。这两种包在地址加上 `?debug=1` 之后可以：

- 跳到任意一天
- 直接改钱、饥饿、心情、体力
- 用指定种子重开（同一颗种子，事件顺序相同）
- 在条件满足时手动触发下一段 NPC 剧情

## 存档

每个选择之后都会写入本机 `localStorage`。菜单里可以导出存档码，换一台浏览器再导入。存档码坏了、缺了一截，或者校验对不上，会提示原因，页面不会崩。

## 字体

界面用 Fusion Pixel 12px（简体），SIL Open Font License 1.1，许可见 `licenses/OFL-FusionPixel.txt`。页面用的是已经裁好的 `src/assets/fonts/fusion-pixel-subset.woff2`，提交在仓库里。`npm run dev` 和 `npm run build` 不会再去 GitHub 下载字库。

要重新裁字：先改文案，再运行 `npm run font`。脚本会扫描 `src` 和 `index.html` 里出现的字，加上 ASCII、数字和标点，从上游完整字库打出一份新的 woff2。完整字库只放在本地 `.font-cache`，不进仓库。CSS 使用 `font-display: swap`，系统里的苹方、思源黑体、微软雅黑会先把字画出来。

## 部署

部署目标是 Vercel。`vercel.json` 指定框架 `vite`、输出目录 `dist`。构建命令是 `npm run build`，站点根路径是 `/`。

这个仓库不会在 push 时自动发布。要上线需要单独确认后再部署，不要把未确认的包发出去。
