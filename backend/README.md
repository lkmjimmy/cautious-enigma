# 照片打印后端

## 功能

- `GET /api/order/check?order_id=xxx` 校验订单号，返回可上传张数（根据 SKU）
- `POST /api/upload` 上传照片（form: order_id, photos[]），受订单张数限制
- `GET /api/tasks` 任务列表，支持 ?status=&order_id=&from=&to=
- `GET /api/tasks/:orderId` 任务详情与照片列表
- `POST /api/tasks/:orderId/printed` 标记已打印
- 静态资源 `GET /uploads/*` 用于下载照片

## 配置

- 上传目录：`backend/uploads/`，照片按订单号存于 `uploads/photos/<订单号>/`
- 数据库：`backend/data.db`（SQLite）
- SKU 张数：表 `sku_photo_limit`，可插入或从电商系统同步；新订单默认取一条 SKU 的 photo_count

## 运行

```bash
npm install
npm run dev
```

默认端口 3000。部署时请配置 HTTPS 与域名，微信小程序要求 request 合法域名为 https。
