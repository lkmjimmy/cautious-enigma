# photo-print-app

本仓库以**门店广告位管理**微信小程序为主（当前为本地演示数据，未对接后端）。

## 仓库

- 远程以你本机 `git remote -v` 为准。

## 目录结构

| 目录 | 说明 |
|------|------|
| `miniprogram/` | 微信小程序：广告位管理 UI |
| `backend/` | 服务端示例（可按需扩展） |
| `desktop/` | 桌面端相关脚本/配置 |
| `docs/` | 文档（如有） |

## 小程序（`miniprogram`）功能概览

面向**门店广告位**的运营、认领、巡检与投放演示，多角色入口（登录后 `pages/index`）：

| 角色 | 要点 |
|------|------|
| **中台** | 看板、按类型统计、门店管理、广告位与客户分配、待办等 |
| **门店（店主）** | 认领门店、本店广告位工作台；**每月门店打卡**：自然月内需为本店全部演示广告位各拍照存档一次（以拍摄时间落在当月为准），完成后显示「本月已打卡」 |
| **广告主** | 投放明细、**实况照片**（原安装/巡检示意合并为实况展示）、价格通知、**曝光通知**（在投广告位数量 × 900 估算每日触达人数） |
| **巡店员** | **巡店打卡**页：门店列表；**未在本月完成网格打卡的门店靠前**；完成后显示「本月已打卡」，可 **重新打卡**；**全部广告位**网格打卡见 `inspector-store-checkin`；按类型巡检见 `inspector-check` |

### 数据与演示说明

- 演示门店、广告位清单见 `utils/demoSlots.js`（`RAW_SLOTS`）、`utils/inspectorStores.js`（默认门店；本地为空数组时会恢复默认列表，避免巡店页无门店）。
- 巡店巡检记录、`gridCheckinMonth`（本月网格打卡完成标记）等见 `utils/inspectorStoreRecords.js`。
- 拍照存档普遍带**时间 + 定位水印**（`utils/photoCaptureMeta.js`）；广告位缩略图取巡店与店主图中较新者（`utils/slotLatestPhoto.js`）。注意 `demoSlots` 不在顶层引用 `slotLatestPhoto`，避免与 `inspectorStores` 形成循环依赖导致白屏。

更细的页面路径与开发说明见 **`miniprogram/README.md`**。

## 本地预览（小程序）

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 导入项目目录：`miniprogram/`。
3. 填写测试用 AppID 或使用「测试号」。

## 后端与桌面端

- `backend/`：具体见该目录内说明（如有）。
- `desktop/`：见该目录内说明与 `config.example.json`。

## 更新日志

- **2026-04-02**：根目录与 `miniprogram/README.md` 对齐当前能力（多角色、店主/巡店月度与网格打卡、`gridCheckinMonth`、演示数据与水印、`demoSlots` 循环依赖说明等）。

## 版本管理提示

- 根目录 `.gitignore` 会忽略 `.agency-agents/`（若本地克隆了 Cursor Agent 规则仓库，不会随本仓库推送）。
- 换机开发：`git clone` 本仓库后，用微信开发者工具打开 `miniprogram` 即可。
