# 广告位管理 · 后端 API

与微信小程序 `miniprogram/` 配套的服务端：**Node.js 18+、Express、JSON 文件持久化**（`data/db.json`）。便于本地联调，后续可替换为 PostgreSQL / MySQL 等，只需保持接口契约。

## 快速开始

```bash
cd backend
npm install
npm run dev
```

默认监听 **`0.0.0.0:3000`**（本机可用 `127.0.0.1` 或局域网 IP；环境变量 `PORT` 可改端口）。

- 健康检查：`GET /health`
- 登录（演示，不校验微信 `code` 真伪）：`POST /api/v1/auth/wechat`  
  Body: `{ "code": "<wx.login 返回的 code>", "role": "user" | "admin" }`  
  响应：`{ token, userId, role, user }`，后续请求头带 `Authorization: Bearer <token>`。

## 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/me` | 当前会话用户信息 |
| GET | `/api/v1/bootstrap` | 导出与小程序本地存储对齐的快照（不含 sessions） |
| PUT | `/api/v1/bootstrap` | 合并写入多键（用于整体同步） |
| GET | `/api/v1/inspector-stores` | 巡店门店列表 |
| POST | `/api/v1/inspector-stores` | 新增门店 `{ name, address?, phone? }` |
| GET | `/api/v1/inspector-records/:storeId` | 某店巡检记录 |
| PUT | `/api/v1/inspector-records/:storeId` | 覆盖该店巡检记录 |
| GET | `/api/v1/clients` | 客户列表 |
| PUT | `/api/v1/clients` | 覆盖客户列表（需 **admin**）Body: `{ list: [...] }` |
| GET | `/api/v1/kv/:key` | 读取单个存储键（见下方允许列表） |
| PUT | `/api/v1/kv/:key` | 写入单个存储键，Body 为要保存的值或 `{ value: ... }` |

### `kv` 允许的 key（与小程序 Storage 键名一致）

`slotOwnerByCodeV1`、`clientSlotQuotesByTypeV1`、`clientPlacementScheduleByTypeV1`、`adminSlotPriceBook`、`storeHomeSlotPhotosV1`、`advertiserContractByClientMap`、`advertiserContractCaptureMetaByClientV1`、`storeRevenueHistoryV1`、`storeClaimRegistry`、`storePendingClaims`、`advertiserPriceNotice`、`adminPromoteRequests`、`adminPersonnelList`、`adminTodoAuditLogV1`、`storeManagerBindings`

## 小程序联调

1. 在微信开发者工具中打开 `miniprogram/`，**详情 → 本地设置 → 不校验合法域名**。
2. 编辑 `miniprogram/utils/apiConfig.js`：`useServer: true`，`baseUrl` 按场景填写（**本机模拟器**用 `http://127.0.0.1:3000`；**真机**用 Mac 局域网 IP，如 `http://192.168.1.8:3000`，不能用 127.0.0.1）。文件内有完整说明。
3. 登录页在 `useServer: true` 时会请求 `/api/v1/auth/wechat` 并自动写入 `apiToken`；`utils/apiRequest.js` 会带 `Authorization`。

更完整的 **baseUrl 对照表** 见 **`miniprogram/README.md` →「后端联调：baseUrl 怎么配」**。

当前仓库内 **前端仍以本地存储为主**；接入后端时可在各 `utils/*.js` 中逐步改为 `api` 请求 + 本地缓存。

## 数据文件

- 首次启动会在 `backend/data/db.json` 落库；已加入 `.gitignore`，避免把本地测试数据提交进仓库。需要提交空模板时可删除忽略规则或提交 `data/.gitkeep` 即可。
