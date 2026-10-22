# 素材与许可

## 字体

- 名称：Fusion Pixel Font（12px proportional，简体中文）
- 作者：TakWolf（https://takwolf.com）
- 来源：https://github.com/TakWolf/fusion-pixel-font
- 版本：2026.10.16
- 许可：SIL Open Font License 1.1（全文见 `licenses/OFL-FusionPixel.txt`）
- 使用方式：构建时从完整的 `fusion-pixel-12px-proportional-zh_hans` 裁出游戏文案实际用到的字形，输出 `src/assets/fonts/fusion-pixel-subset.woff2`。页面不请求字体仓库，也不加载完整字库。

OFL 允许嵌入、再分发和商业使用。裁切后的字体仍然沿用同一份 OFL，不能单独改成别的许可出售。

## 画面

出租屋、工地、街道、便利店、吃的地方，以及结局分享图上的城市剪影，都是这个项目里用 SVG / Canvas 画的像素图，没有使用第三方贴图。

## 代码

游戏代码沿用仓库根目录的 MIT License。
