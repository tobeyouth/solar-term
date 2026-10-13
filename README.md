# 岁时 · 二十四节气

一册可以游玩的节气图鉴。纯前端，无账号、数据库、远程接口或运行时 CDN。

## 直接使用

双击 **`dist/index.html`** 即可打开。可以将这一个文件复制到其他设备；在线部署建议使用下述 `release/` 版本。全部图片、样式、代码和内容均已内嵌，阅读和游玩不需要联网。站内的外部资料链接需要网络。

推荐使用当前版本 Chrome、Edge、Safari 或 Firefox。手机如果默认把 HTML 打开为文件预览，请选择浏览器打开；部分系统文件预览器不运行 JavaScript。

## 内容与功能

- **24 节气手札**：节气含义、自然变化、地域习俗、观察建议、日期与资料来源。
- **72 道问答**：每节气 3 题，答案反馈与解析；全对后完成「问时令」。
- **24 幅九宫拼图**：点选两片即可交换，支持原图参考、重新打乱和落子计数；支持键盘 Tab 与 Enter / Space 操作。
- **24 枚岁时印记**：问答全对并完成拼图后收集；游玩记录只保存在当前浏览器。
- **四季图鉴**：季节筛选、名称及物候搜索、当下节气定位、前后节气切换。
- **节气明信片**：点击手札右侧下载按钮，生成含当年日期的 PNG 明信片。
- **适配桌面与手机**，支持键盘标签页导航、系统减少动态效果偏好。

浏览器允许时，进度通过 `localStorage` 保留；限制本地文件存储的环境仍可正常游玩，只在本次会话保存。移动 HTML 文件、换浏览器或清理浏览器数据，可能丢失原有进度。

## GitHub Pages 预览

发布地址：<https://tobeyouth.github.io/solar-term/>（首次部署成功后生效）。

首次启用：

1. 打开仓库 **Settings → Pages → Build and deployment**。
2. 将 **Source** 设为 **GitHub Actions**。
3. 打开 **Actions → Deploy GitHub Pages → Run workflow**，选择 `main` 运行。

工作流从源码安装锁定依赖，运行 `npm run build:release` 并发布 `release/`，不需要 API Key、服务器或额外配置 Secrets。
后续将源码、素材或构建配置的更新推送到 `main`，即可自动构建和部署。`release/` 是生成目录，不提交到 Git；需要同步离线成品时，另运行 `npm run build` 并提交 `dist/index.html`。

仓库根目录的 `index.html` 是 Vite 开发入口，请勿选择从 `main` 根目录直接发布。部署工作流只上传 `release/`，原始插画和开发文件不会进入 Pages 网站。

## 本地开发

需要 Node.js 20.19+ 或 22.12+。

```sh
git clone https://github.com/tobeyouth/solar-term.git
cd solar-term
npm ci
npm run dev
```

Vite 仅用于开发预览。生产文件无服务器依赖。

```sh
npm run build            # 离线版：dist/index.html，全部内嵌，可双击打开
npm run build:release    # 在线版：release/，独立图片、CSS 与 ESM 分块
npm run build:all        # 同时更新两种产物
npm run check:dist       # 检查离线单文件
npm run check:release    # 检查在线体积、相对路径和独立资源
npm run preview          # 通过 HTTP 预览离线版
npm run preview:release  # 通过 HTTP 预览在线版
```

在线版使用相对资源路径，可部署在 `/solar-term/` 等子路径。Vite 将应用、天文计算库和图标库拆为 ESM 分块，浏览器通过 modulepreload 并行加载；WebP 图片独立缓存，首屏只请求当前大图和可见头像，其余图片随浏览加载。在线版需要 HTTP 静态托管，不能像离线版一样直接用 `file://` 打开。

## 验证

```sh
npm test           # 内容完整性、24 个交节日期、边界、拼图与存储容错
npm run build:all  # 浏览器回归前准备两种构建产物
npm run test:e2e   # 独立 Chrome：离线 file:// 与在线 /solar-term/ 子路径
```

浏览器测试使用本机安装的 Google Chrome，不读取个人浏览器配置。换为 Playwright 自带 Chromium 时，先安装其浏览器并移除 `playwright.config.js` 中的 `channel: 'chrome'`。测试会覆盖 24 个节气、答错重试、完整集章流程、页面刷新后的进度保留、明信片导出、搜索、资料弹窗、手机布局和键盘导航。

审阅图位于 `output/review/`，测试截图和导出的示例明信片会被测试更新。

## 插画与素材

- `output/imagegen/`：24 幅由 **gpt-image-2** 生成的 1536 × 1024 PNG 原始插画。
- `src/assets/terms/`：24 张 1440 × 960 WebP 大图，同时作为拼图素材。
- `src/assets/avatars/`：24 张 480 × 480 WebP 头像，从各节气原图按视觉主体裁切。
- `scripts/image-prompts.jsonl`、`scripts/lichun-prompt.txt`、`scripts/image-style.txt`：可复用的创作提示词与统一美术方向。
- `output/review/artwork-24.webp`：整套插画总览。

图片为 AI 辅助创作的节气意象，融合工笔线条、矿物色与山水画构图，不是具体地点的纪实照片。更新原始图片后运行：

```sh
npm run assets
npm run art:review
npm run build
```

生图属于构建前的素材制作环节，浏览和重新打包已完成的站点都不需要 API Key。项目中不包含任何凭据。重新调用生图服务需自行配置服务和密钥；原始文件已经存在时，请另选输出目录，避免重复生成或覆盖。

## 内容来源与日期

文字依据香港天文台、中国气象局、中国农业博物馆、中国非物质文化遗产网等公开资料重新编写，详细来源链接见页面底部「资料与创作」和 `src/data.js`。

核心资料：

- [香港天文台：二十四节气](https://www.hko.gov.hk/tc/gts/time/24solarterms.htm)
- [香港天文台：2026 年历](https://www.hko.gov.hk/tc/gts/time/calendar/pdf/files/2026.pdf)
- [中国农业博物馆：二十四节气](https://jgs.agri.gov.cn/twenty/zh/four_solar_terms.html)
- [中国非物质文化遗产网：节气与民俗](https://www.ihchina.cn/luntan_details/7486.html)

用 Astronomy Engine 计算太阳到达相应黄经的时刻，统一以北京时间（UTC+8）展示日期，不依赖在线日历。自动定位到浏览器当前日期所在的节气；图鉴日期为当前公历年。计算模块支持 1900—2100 年，页面自动年份使用 1901—2099 年以留出跨年边界。

节气表示天文时序，不等同于全国同步入季或当天的天气预报。露与霜、惊蛰与虫醒、大小寒的冷热关系等，均在题目中作了区别说明。习俗使用「部分地区」等限定，不把地域传统写成全国规则。

## 代码结构

```text
src/data.js             节气、题库、来源
src/core.js             日期、拼图、进度逻辑
src/main.js             页面与交互
src/style.css           响应式视觉
scripts/                素材处理与单文件产物检查
tests/                  逻辑与浏览器回归测试
dist/index.html         最终离线成品
release/                在线部署产物（生成目录，不提交）
```

运行时依赖为 Astronomy Engine（MIT）和 Lucide（ISC）；Vite、vite-plugin-singlefile、Sharp 与 Playwright 仅用于开发、打包和验证。
