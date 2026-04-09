# 广告位管理 · 后端 API

与微信小程序 `miniprogram/` 配套的服务端：**Node.js 18+、Express、JSON 文件持久化**（`data/db.json`）。便于本地联调，后续可替换为 PostgreSQL / MySQL 等，只需保持接口契约。

## 快速开始

```bash
cd backend
npm install
npm run dev
```

默认监听 **`0.0.0.0:3000`**（本机可用 `127.0.0.1` 或局域网 IP；环境变量 `PORT` 可改端口）。

可复制 **`backend/.env.example`** 为 **`.env`** 并填写（已依赖 `dotenv`，启动时自动加载）。

### 环境变量（微信登录）

| 变量 | 说明 |
|------|------|
| `WECHAT_APP_ID` 或 `WECHAT_APPID` | 小程序 AppID |
| `WECHAT_APP_SECRET` | 小程序 AppSecret（勿提交仓库） |
| `WECHAT_ADMIN_OPENIDS` | 可选，管理员 **openid**，逗号分隔。配置后 **不再** 由客户端 `role` 决定管理员，避免伪造 |
| `PORT` | 可选，监听端口 |

- **未配置 AppID+Secret**：仍为**演示登录**（不校验 `code`，每次随机 `userId`，`body.role` 可区分 admin，仅本地联调）。
- **已配置**：调用微信 `jscode2session`，`userId` 稳定为 `wx_<openid>`；`role` 由 `WECHAT_ADMIN_OPENIDS` 是否包含当前 openid 决定（未在列表则为 `user`）。

- 健康检查：`GET /health`
- 登录：`POST /api/v1/auth/wechat`  
  Body: `{ "code": "<wx.login 返回的 code>", "role": "user" | "admin" }`（`role` 仅在**演示模式**下生效）  
  响应：`{ token, userId, role, user, authMode: "wechat" | "demo" }`，后续请求头带 `Authorization: Bearer <token>`。

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

## 微信云托管部署

### 1. 准备镜像

在 `backend/` 目录（含 `Dockerfile`）构建并推送到云托管关联的**镜像仓库**（控制台「镜像仓库」里有地址与登录方式），或使用云托管「从代码构建」若已绑定 Git 并指定 Dockerfile 路径为 `backend/Dockerfile`。

本地验证构建：

```bash
cd backend
docker build -t adslot-backend:local .
docker run --rm -p 3000:3000 -e PORT=3000 adslot-backend:local
# 另开终端：curl http://127.0.0.1:3000/health
```

### 2. 服务与环境变量

- **监听端口**：代码使用 `process.env.PORT`；本地直接 `node`/`npm` 未设置时默认为 **3000**。生产镜像 `Dockerfile` 已设置 **`ENV PORT=80`**，与微信云托管常见容器端口/健康检查一致。若仍出现探针连 **80** 被拒，请确认控制台未用空值覆盖 `PORT`，或改为全链路 **3000** 并保持一致。  
- 本地用 Docker 跑在 3000：`docker run -e PORT=3000 -p 3000:3000 ...`
- **健康检查**：路径填 **`/health`**，方法 `GET`。
- **环境变量**（在云托管「服务设置 → 环境变量」配置，勿把密钥提交到 Git）：
  - 小程序正式登录必配：`WECHAT_APP_ID`、`WECHAT_APP_SECRET`；生产管理员：`WECHAT_ADMIN_OPENIDS`（见上文）。
  - 当前仓库后端 **数据仍写在容器内 `data/db.json`**，与控制台里的 `MYSQL_*`、`COS_*` **尚未在代码中对接**；若已填 MySQL/COS，需自行改 `db` 层或做持久化方案，否则仅作占位。无挂载卷时，**重建实例会丢本地 JSON 数据**。

### 3. 小程序端

1. 微信公众平台 → **开发 → 开发管理 → 开发设置 → 服务器域名** → 将云托管默认域名或你的**自定义域名**加入 **request 合法域名**（须 HTTPS）。
2. `miniprogram/utils/apiConfig.js`：`useServer: true`，`baseUrl` 填 **`https://你的域名`**（无尾部斜杠）。

### 4. 安全提醒

- 数据库口令、COS 密钥等 **不要出现在截图、仓库或聊天记录**；若曾泄露，请在对应控制台**立即轮换密码/密钥**。

## 数据文件

- 首次启动会在 `backend/data/db.json` 落库；已加入 `.gitignore`，避免把本地测试数据提交进仓库。需要提交空模板时可删除忽略规则或提交 `data/.gitkeep` 即可。
