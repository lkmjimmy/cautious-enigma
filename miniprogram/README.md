# 微信小程序 · 广告位管理

## 项目说明

本目录为微信小程序项目根（用开发者工具**直接打开本目录**）。数据以**本地存储 + 静态配置**为主；可按 `utils/apiConfig.js` 开启后端，与仓库 `backend/` 联调。

## 主包与分包（页面路径）

为控制主包体积与首屏，`app.json` 仅保留三个主包页面，其余按业务拆到分包：

| 类型 | 根目录 | 说明 |
|------|--------|------|
| 主包 | `pages/` | `login`、`index`、`role-first-profile` |
| 分包 `packageAdmin` | `packageAdmin/pages/` | 中台总览、客户/门店/广告位管理、`slots` 等 |
| 分包 `packageStore` | `packageStore/pages/` | 门店认领、店主工作台、预估收益、门店广告位 |
| 分包 `packageBiz` | `packageBiz/pages/` | 广告主、巡店、巡检、新增门店等 |

- **`lazyCodeLoading`** 已设为 `requiredComponents`，自定义组件按需注入。
- 跳转时须使用**完整路径**，例如：`/packageAdmin/pages/admin/admin`，不能仍写旧版 `/pages/admin/admin`（会 `onPageNotFound`）。
- **`utils/routes.js`**：集中维护各页路径（`packageStore` / `packageAdmin` / `packageBiz` 嵌套对象），新增页面时请同步更新，业务代码优先 `require` 该模块再拼 query，避免硬编码散落。

### 与 `app.json` 一致的页面清单

以下与仓库内 `app.json` 中 `pages` / `subPackages` 逐项对应；**增删页面时须同时改 `app.json`、`utils/routes.js` 与本段**，避免遗漏。

**主包（`pages` 数组，顺序影响小程序默认首页为列表第一项）**

| `app.json` 中的路径 | 运行时完整路径 |
|---------------------|----------------|
| `pages/login/login` | `/pages/login/login` |
| `pages/index/index` | `/pages/index/index` |
| `pages/role-first-profile/role-first-profile` | `/pages/role-first-profile/role-first-profile` |

**分包 `packageAdmin`（`name`: `admin`，磁盘目录：`packageAdmin/`）**

`subPackages[].pages` 为相对 **`packageAdmin/`** 的路径；完整 URL 为 **`/packageAdmin/` + 该项**。

| 配置中的路径 | 完整路径 |
|--------------|----------|
| `pages/admin/admin` | `/packageAdmin/pages/admin/admin` |
| `pages/admin-publish/admin-publish` | `/packageAdmin/pages/admin-publish/admin-publish` |
| `pages/admin-todo/admin-todo` | `/packageAdmin/pages/admin-todo/admin-todo` |
| `pages/admin-mine/admin-mine` | `/packageAdmin/pages/admin-mine/admin-mine` |
| `pages/admin-slot-prices/admin-slot-prices` | `/packageAdmin/pages/admin-slot-prices/admin-slot-prices` |
| `pages/admin-store-manage/admin-store-manage` | `/packageAdmin/pages/admin-store-manage/admin-store-manage` |
| `pages/admin-personnel/admin-personnel` | `/packageAdmin/pages/admin-personnel/admin-personnel` |
| `pages/admin-slot-manage/admin-slot-manage` | `/packageAdmin/pages/admin-slot-manage/admin-slot-manage` |
| `pages/admin-clients/admin-clients` | `/packageAdmin/pages/admin-clients/admin-clients` |
| `pages/admin-client-detail/admin-client-detail` | `/packageAdmin/pages/admin-client-detail/admin-client-detail` |
| `pages/admin-client-time/admin-client-time` | `/packageAdmin/pages/admin-client-time/admin-client-time` |
| `pages/admin-store-detail/admin-store-detail` | `/packageAdmin/pages/admin-store-detail/admin-store-detail` |
| `pages/slots/slots` | `/packageAdmin/pages/slots/slots` |

**分包 `packageStore`（`name`: `store`，磁盘目录：`packageStore/`）**

| 配置中的路径 | 完整路径 |
|--------------|----------|
| `pages/store-claim/store-claim` | `/packageStore/pages/store-claim/store-claim` |
| `pages/store-home/store-home` | `/packageStore/pages/store-home/store-home` |
| `pages/store-revenue/store-revenue` | `/packageStore/pages/store-revenue/store-revenue` |
| `pages/store-slots/store-slots` | `/packageStore/pages/store-slots/store-slots` |

**分包 `packageBiz`（`name`: `biz`，磁盘目录：`packageBiz/`）**

| 配置中的路径 | 完整路径 |
|--------------|----------|
| `pages/advertiser/advertiser` | `/packageBiz/pages/advertiser/advertiser` |
| `pages/advertiser-contract/advertiser-contract` | `/packageBiz/pages/advertiser-contract/advertiser-contract` |
| `pages/advertiser-placements/advertiser-placements` | `/packageBiz/pages/advertiser-placements/advertiser-placements` |
| `pages/inspector/inspector` | `/packageBiz/pages/inspector/inspector` |
| `pages/inspector-check/inspector-check` | `/packageBiz/pages/inspector-check/inspector-check` |
| `pages/inspector-store-checkin/inspector-store-checkin` | `/packageBiz/pages/inspector-store-checkin/inspector-store-checkin` |
| `pages/inspector-store-init/inspector-store-init` | `/packageBiz/pages/inspector-store-init/inspector-store-init` |
| `pages/inspector-add-store/inspector-add-store` | `/packageBiz/pages/inspector-add-store/inspector-add-store` |

**全局组件**：`components/selector-sheet/` 仍在小程序根目录，分包页面通过绝对路径引用（如 `"/components/selector-sheet/selector-sheet"`），无需随分包搬迁。

## 登录与角色（首页入口）

- **微信一键登录**：在 `pages/login/login`；若 `useServer === true` 且配置了 `baseUrl`，会先请求 `/api/v1/auth/wechat` **换票成功后再**写入本地登录态与 `userRole = user`，减少进首页时 `apiToken` 未就绪的竞态。
- **管理者登录（演示）**：同一页第二个按钮，写入 `userRole = admin`；用于在首页显示「中台」入口。
- **首页 `pages/index`**：
  - `userRole === 'admin'`：显示 **中台** + 门店 + 广告主 + 巡店员。
  - 其他身份：仅显示 **门店**、**广告主**、**巡店员**（不显示中台）。
- **首次进入门店 / 广告主 / 巡店员**：若本地未完成 `utils/userRoleProfile.js` 所要求的资料，会先进入 `pages/role-first-profile` 填表再进入对应分包页。
- **退出登录**：会清除 `loggedIn`、`userPhone`、`currentAdvertiserClientId`、`userRole`、`apiToken` 等本地键。

## 本机数据清空

- **不再**在 `app.js` 启动时自动全清 Storage（避免误清登录与业务数据）。
- 需要一次性清空本机全部缓存时：在 **巡店** / **巡检** 页面使用「清空」确认（内部调用 `utils/clearAppLocalStorage.js` 的 `clearAll()`），或使用开发者工具 **清除缓存 → 清除数据存储**。

## 主要页面

下表为**小程序内实际路径**（含分包前缀）。开发时也可只记「页面目录名」，完整路径以 `utils/routes.js` 为准。

| 路径 | 说明 |
|------|------|
| `/pages/login/login` | 微信一键登录、管理者登录（演示） |
| `/pages/index/index` | 按角色展示入口；退出登录 |
| `/pages/role-first-profile/role-first-profile` | 首次进入某角色前的资料填写 |
| `/packageAdmin/pages/admin/admin` | 中台总览、待办/我的/门店与广告位管理等 |
| `/packageAdmin/pages/slots/slots` | 广告位列表（数据来自 `slotOwnership` 等与演示/巡检记录合并） |
| `/packageStore/pages/store-slots/store-slots` | 指定门店下按类型展示（可按需接接口填充） |
| `/packageStore/pages/store-claim/store-claim` | 门店认领（可认领门店 = 演示广告位门店 ∪ 巡店已添加门店） |
| `/packageStore/pages/store-home/store-home` | 店主本店工作台、本月打卡、缩略图/「拍照更新」存档 |
| `/packageStore/pages/store-revenue/store-revenue` | 门店预估收益（本月/历史快照，见 `storeRevenueCalc` / `storeRevenueHistory`） |
| `/packageAdmin/pages/admin-slot-prices/admin-slot-prices` | 各类型广告位制作成本（`slotPriceBook`） |
| `/packageBiz/pages/advertiser/advertiser` | 广告主：投放明细、实况照片、价格通知、曝光通知 |
| `/packageBiz/pages/inspector/inspector` | 巡店：门店列表、网格打卡、巡检、新增门店 |
| `/packageBiz/pages/inspector-check/inspector-check` | 按类型巡检拍照 |
| `/packageBiz/pages/inspector-store-init/inspector-store-init` | 新门店广告位初始化（按类型拍照生成记录） |
| `/packageBiz/pages/inspector-store-checkin/inspector-store-checkin` | 门店内全部广告位网格打卡；缩略图下可「拍照更新」 |

## 门店预估收益（业务规则，前端本地计算）

- **统计周期**：按自然月；**门店工作台 → 预估收益** 展示 **本月预估合计**，**历史收益合计** 为早于当前月的各月快照之和（`storeRevenueHistory` 本地存储）。
- **单广告位月收入（元）**：  
  `max(0, 客户该类型「折算月单价」− 该类型「制作成本」) × 30%`  
  与按类型汇总后的 `(数量×单价 − 数量×成本) × 30% ÷ 数量` 在数学上等价。
- **折算月单价**：在 **客户详情** 中按类型维护投放期与报价后，由 `clientSlotQuotes` 折算（月=原价，季度÷3，年度÷12）。
- **制作成本**：在 **广告位价格管理**（`slotPriceBook`）中按类型维护。
- **计收条件**：广告位须 **已绑定客户**，且状态 **不是**「空置」「待定」；其余为 0。
- 计算实现见 `utils/storeRevenueCalc.js`；规则变更时请同步改该模块与页面文案。

## 关键工具模块（`utils/`）

| 文件 | 作用 |
|------|------|
| `demoSlots.js` | 广告位清单 `RAW_SLOTS`（可为空）、类型列表 `ALL_SLOT_TYPES`、本店可视化分组等 |
| `demoClients.js` | 客户列表（可按需维护模拟客户） |
| `claim.js` | 门店认领；可认领门店名 = 演示广告位中的门店 ∪ `inspectorStores` 中门店 |
| `inspectorStores.js` | 巡店侧门店列表（本地存储，无预置默认门店回填） |
| `inspectorStoreRecords.js` | 巡检/网格打卡产生的广告位记录、打卡月份标记 |
| `storeHomeSlotPhotos.js` | 店主按广告位编号存档的照片 |
| `storeMonthlyCheckin.js` | 店主端自然月打卡是否完成 |
| `slotPriceBook.js` | 各类型制作成本（本地存储） |
| `clientSlotQuotes.js` | 客户侧按类型报价（投放期 + 单价，折算月单价） |
| `storeRevenueCalc.js` / `storeRevenueHistory.js` | 门店预估收益计算与历史月快照 |
| `advertiserContractByClient.js` | 按客户存合同图路径与水印元数据 |
| `clearAppLocalStorage.js` | `wx.clearStorageSync` 封装，供巡店/巡检「清空」使用 |
| `routes.js` | 主包与各分包页面完整路径，供跳转统一引用 |
| `phoneValidate.js` | 中国大陆手机号格式校验（与角色资料、新增门店等表单一致） |
| `photoCaptureMeta.js` | 拍照后时间与定位文案 |
| `slotLatestPhoto.js` | 缩略图取巡店与店主较新照片 |

## 后端 API（仓库 `backend/`）

- Node.js + Express，JSON 文件持久化；接口说明见 **`../backend/README.md`**。
- 小程序侧：`utils/apiConfig.js`（`useServer`、`baseUrl`、`secondaryBaseUrl`、`debugApiLog`）、`utils/apiRequest.js`；登录页在 `useServer: true` 且配置了 `baseUrl` 时，会先完成 `/api/v1/auth/wechat` 再写入本地登录态，并写入 `apiToken`。
- **`useServer` 默认值以 `apiConfig.js` 为准**；若仅本地演示可将 `useServer` 设为 `false`，不发起网络请求。

### 后端联调：`baseUrl` 怎么配（照抄即可）

| 场景 | `useServer` | `baseUrl` 示例 | 说明 |
|------|-------------|----------------|------|
| 不用后端 | `false` | `''` | 全部走本地 `wx.storage`，与现在一致 |
| 本机模拟器 + 本机跑 `backend` | `true` | `http://127.0.0.1:3000` | 后端默认端口 3000；先访问 `/health` 确认已启动 |
| 真机预览（手机与 Mac 同 WiFi） | `true` | `http://192.168.x.x:3000` | 把 `192.168.x.x` 换成 Mac 的**局域网 IP**（终端 `ipconfig getifaddr en0` 或系统设置 → 网络）；**不能**用 `127.0.0.1`（那是手机自己） |
| 已部署的 HTTPS 域名 | `true` | `https://api.你的域名.com` | 在微信公众平台配置 **request 合法域名**，并关闭开发者工具里「不校验合法域名」做真机验收 |

**必做（开发阶段）**：微信开发者工具 → **详情 → 本地设置** → 勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**，否则请求 `http://127.0.0.1` 会被拦截。

**检查后端是否活着**：浏览器打开 `http://127.0.0.1:3000/health`，应返回 `{"ok":true,"service":"adslot-backend",...}`。

更细的注释已写在 **`utils/apiConfig.js` 文件顶部**。

### 控制台出现 `Error: timeout`（连本机后端）

多为 **`wx.request` 在时限内没收到响应**。注意：**开发者工具模拟器里 `127.0.0.1` 常常访问不到你 Mac 上的 Node**，请先 **`baseUrl` 直接用 Mac 局域网 IP**（如 `http://192.168.1.8:3000`），不要用 127.0.0.1 试到绝望。

可按顺序试：

1. **终端里后端仍在跑**（`npm run dev`），且监听 `0.0.0.0`（本仓库 backend 已如此）。
2. **`baseUrl`**：`http://<Mac局域网IP>:3000`（终端 `ipconfig getifaddr en0` 查看 IP）。**优先不要用 127.0.0.1 做模拟器联调。**
3. 仍不行可试 `http://localhost:3000`（少数环境有效）。
4. 关闭 **VPN / 系统代理**。
5. 终端：`curl http://127.0.0.1:3000/health` 应返回 JSON；curl 只说明本机浏览器能访问，**不等于模拟器能访问 127.0.0.1**。
6. **`project.private.config.json` → `useLanDebug: true`**（仓库已开），改后**重新编译**。
7. `useServer: true` 且 `baseUrl` 已填时，Console：`require('./utils/apiRequest.js').pingHealth().then(console.log).catch(console.error)` 测 `/health`。

控制台里 **`[Deprecation] SharedArrayBuffer...`** 来自 Chrome/开发者工具，**可忽略**，与小程序业务无关。

## 开发提示

- 新增 `navigateTo` / `redirectTo` 目标页时，务必使用分包完整路径或 `utils/routes.js`，避免旧路径 `/pages/xxx` 导致无法打开。
- 微信公众平台配置 `getLocation` 等与隐私说明见 `app.json`。
- 若控制台出现 **`Error: timeout`** 且发生在拍照叠加水印前后：多为 **`wx.getLocation` 在模拟器/未授权场景耗时或挂起**。`utils/photoCaptureMeta.js` 已对定位增加超时回落（约 10s）并默认关闭高精度；真机请确认已授权定位。
- 对接后端后：可逐步把各 `utils/*.js` 改为请求 `apiRequest` + 本地缓存，保留页面路由与交互分层即可。

文档最后更新：**2026-04-03**（已同步主包/分包与 `routes.js` 说明）
