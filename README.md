# photo-print-app

本仓库以**门店广告位管理**微信小程序为主（当前为本地演示数据，未对接后端）。

## 仓库

- 远程以你本机 `git remote -v` 为准。

## 目录结构

| 目录 | 说明 |
|------|------|
| `miniprogram/` | 微信小程序：广告位管理 UI |
| `backend/` | 配套 REST API（Express + JSON 文件库，见 `backend/README.md`） |
| `desktop/` | 桌面端相关脚本/配置 |
| `docs/` | 文档（如有） |

## 小程序（`miniprogram`）功能概览

登录后进入 `pages/index` 选择身份。**「中台」仅在使用登录页「管理者登录（演示）」写入 `userRole=admin` 时显示**；普通一键登录仅展示门店 / 广告主 / 巡店员。

| 角色 | 要点 |
|------|------|
| **中台** | 看板、按类型统计、门店管理、广告位与客户分配、待办、广告位价格（制作成本）等 |
| **门店（店主）** | 认领门店、本店广告位工作台；**每月门店打卡**：自然月内需为本店全部广告位各拍照存档一次（以拍摄时间落在当月为准），完成后显示「本月已打卡」 |
| **广告主** | 投放明细、实况照片、价格通知、曝光通知 |
| **巡店员** | 巡店打卡：门店列表；未在本月完成网格打卡的门店靠前；**全部广告位**网格打卡见 `inspector-store-checkin`；按类型巡检见 `inspector-check`；巡店/巡检页可**清空本机数据**（全清 Storage） |

### 数据与演示说明

- 广告位与客户等可在 `utils/demoSlots.js`（`RAW_SLOTS`，可为空）、`utils/demoClients.js` 等中配置；巡店门店列表见 `utils/inspectorStores.js`（本地存储，无预置默认回填）。
- 巡店巡检记录、`gridCheckinMonth`（本月网格打卡完成标记）等见 `utils/inspectorStoreRecords.js`。
- 拍照存档普遍带**时间 + 定位水印**（`utils/photoCaptureMeta.js`）；广告位缩略图取巡店与店主图中较新者（`utils/slotLatestPhoto.js`）。注意 `demoSlots` 不在顶层引用 `slotLatestPhoto`，避免与 `inspectorStores` 形成循环依赖导致白屏。
- **本机数据清空**：不在 `app.js` 自动执行；见 `miniprogram/README.md` 与巡店/巡检「清空」。

更细的页面路径、登录角色、**门店预估收益公式**与模块说明见 **`miniprogram/README.md`**。

## 本地预览（小程序）

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 导入项目目录：`miniprogram/`。
3. 填写测试用 AppID 或使用「测试号」。

## 后端与桌面端

- `backend/`：具体见该目录内说明（如有）。
- `desktop/`：见该目录内说明与 `config.example.json`。

## 更新日志

- **2026-04-03**：新增 `backend/`（Express + JSON 持久化 REST API）；小程序增加 `utils/apiConfig.js`、`utils/apiRequest.js`，登录可选同步 `apiToken`；README 同步登录/数据说明与 `demoSlots`/`inspectorStores` 现状，细节以 `miniprogram/README.md`、`backend/README.md` 为准。
- **2026-04-02**：根目录与 `miniprogram/README.md` 对齐当前能力（多角色、店主/巡店月度与网格打卡、`gridCheckinMonth`、演示数据与水印、`demoSlots` 循环依赖说明等）。

## 版本管理提示

- 根目录 `.gitignore` 会忽略 `.agency-agents/`（若本地克隆了 Cursor Agent 规则仓库，不会随本仓库推送）。
- 换机开发：`git clone` 本仓库后，用微信开发者工具打开 `miniprogram` 即可。
