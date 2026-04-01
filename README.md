# photo-print-app

本仓库以**门店广告位管理**微信小程序为主（当前为静态演示数据，未对接后端）。

## 仓库

- 远程示例：`https://github.com/lkmjimmy/cautious-enigma.git`（以你本机 `git remote -v` 为准）

## 目录结构

| 目录 | 说明 |
|------|------|
| `miniprogram/` | 微信小程序：广告位管理 UI |
| `backend/` | 服务端示例（可按需扩展） |
| `desktop/` | 桌面端相关脚本/配置 |
| `docs/` | 文档（如有） |

## 小程序（`miniprogram`）概览

面向**门店广告位**的运营与巡检场景，支持三种角色入口：

- **管理者**：核心看板（总投放、空置、7 天内到期）、按广告位类型统计（灯箱、地贴、货架、出库仪、LED、门头）、门店分类型投放概览；看板数字可跳转至筛选后的广告位列表（按门店 + 类型分组）。
- **广告主用户**：我的投放与安装现场照片展示（演示数据）。
- **巡店员**：今日任务、到店打卡、拍照与状态提交（演示交互）。

主要页面：

- 角色选择 → `pages/index`
- 管理者总览 → `pages/admin`
- 广告位列表（含筛选与分组）→ `pages/slots`
- 门店下按类型缩略图（已投放 / 空置 / 即将到期标注）→ `pages/store-slots`
- 广告主、巡店员 → `pages/advertiser`、`pages/inspector`

**说明**：当前列表与看板数据为**前端写死的静态数据**，便于在微信开发者工具中预览布局与交互；后续接入后端时替换各页 `*.js` 中的数据源即可。

## 本地预览（小程序）

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 导入项目目录：`miniprogram/`。
3. 填写测试用 AppID 或使用「测试号」。

更细说明见 `miniprogram/README.md`。

## 后端与桌面端

- `backend/`：具体见该目录内说明（如有）。
- `desktop/`：见该目录内说明与 `config.example.json`。

## 版本管理提示

- 根目录 `.gitignore` 会忽略 `.agency-agents/`（若本地克隆了 Cursor Agent 规则仓库，不会随本仓库推送）。
- 换机开发：`git clone` 本仓库后，用微信开发者工具打开 `miniprogram` 即可。
