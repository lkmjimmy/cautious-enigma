# 微信小程序 · 广告位管理

## 项目说明

本目录为微信小程序项目根（用开发者工具**直接打开本目录**）。数据以**本地存储 + 静态演示**为主，用于预览 UI 与流程，**尚未对接后端接口**。

## 主要页面

| 路径 | 说明 |
|------|------|
| `pages/index` | 角色选择（中台 / 门店 / 广告主 / 巡店员） |
| `pages/admin` | 中台总览、跳转待办/我的/门店管理等 |
| `pages/slots` | 广告位列表（数据源自 `utils/demoSlots.js` 的 `RAW_SLOTS`） |
| `pages/store-slots` | 指定门店下按类型缩略图展示 |
| `pages/store-claim` | 门店认领（可认领门店名与 `claim.js` 中列表一致） |
| `pages/store-home` | 店主本店工作台、**本月门店打卡**进度 |
| `pages/advertiser` | 广告主：投放明细、实况照片、价格通知、曝光通知 |
| `pages/inspector` | 巡店打卡：门店列表、跳转网格打卡 / 按类型巡检 |
| `pages/inspector-check` | 按广告位类型逐一巡检拍照 |
| `pages/inspector-store-checkin` | 按门店**全部广告位**网格打卡，完成后写入本月网格打卡标记 |

## 关键工具模块（`utils/`）

| 文件 | 作用 |
|------|------|
| `demoSlots.js` | 全项目演示广告位 `RAW_SLOTS`、按门店筛选、本店可视化分组（`buildStoreVisualGroups` 内按需引用 `slotLatestPhoto`） |
| `inspectorStores.js` | 巡店侧门店列表（默认演示门店、空列表恢复） |
| `inspectorStoreRecords.js` | 巡检/网格打卡产生的广告位记录、`gridCheckinMonth` |
| `storeHomeSlotPhotos.js` | 店主按广告位编号存档的照片 |
| `storeMonthlyCheckin.js` | 店主端自然月打卡是否完成（全部广告位本月已存档） |
| `photoCaptureMeta.js` | 拍照后统一取时间与 `gcj02` 定位文案 |
| `slotLatestPhoto.js` | 缩略图取巡店与店主较新照片 |
| `claim.js` / `storeManagers.js` | 认领与客户、店主演示绑定 |

## 开发提示

- 微信公众平台配置 `getLocation` 等与隐私说明见 `app.json`。
- 对接后端后：替换各页数据源与存储键，保留页面路由与交互分层即可。

文档最后更新：**2026-04-02**（与仓库根目录 `README.md` 的「更新日志」一致）。
