/**
 * 照片打印后端 API
 * - 订单号校验、根据 SKU 返回可上传张数
 * - 照片上传、按订单号存储
 * - 任务列表供后台桌面端拉取
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const DB_PATH = path.join(__dirname, '../data.db');

// 确保目录存在
[UPLOAD_DIR, path.join(UPLOAD_DIR, 'photos')].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const db = new Database(DB_PATH);

// 初始化表：订单-SKU 映射、打印任务、上传记录
db.exec(`
  CREATE TABLE IF NOT EXISTS sku_photo_limit (
    sku TEXT PRIMARY KEY,
    photo_count INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    sku TEXT,
    photo_limit INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS print_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    photo_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
  );
  CREATE TABLE IF NOT EXISTS task_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    order_id TEXT,
    file_name TEXT,
    file_path TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES print_tasks(id)
  );
`);

// 示例：插入 SKU 与可打印张数（实际可从电商系统同步）
const insertSku = db.prepare(
  'INSERT OR REPLACE INTO sku_photo_limit (sku, photo_count) VALUES (?, ?)'
);
[['PHOTO-10', 10], ['PHOTO-20', 20], ['PHOTO-50', 50]].forEach(([sku, count]) => insertSku.run(sku, count));

app.use(cors());
app.use(express.json());

// 订单校验：根据订单号返回可上传张数（这里用模拟；实际应对接电商 API）
app.get('/api/order/check', (req, res) => {
  const orderId = (req.query.order_id || '').trim();
  if (!orderId) {
    return res.status(400).json({ ok: false, message: '请填写订单号' });
  }
  // 模拟：根据订单号解析或查询 SKU。示例规则：订单号后两位为张数，或从 orders 表查
  let photoLimit = 10;
  const row = db.prepare('SELECT sku, photo_limit FROM orders WHERE order_id = ?').get(orderId);
  if (row) {
    return res.json({
      ok: true,
      order_id: orderId,
      photo_limit: row.photo_limit,
      message: `该订单可上传 ${row.photo_limit} 张照片`,
    });
  }
  // 新订单：默认给一个 SKU 或由业务规则计算
  const skuRow = db.prepare('SELECT photo_count FROM sku_photo_limit LIMIT 1').get();
  if (skuRow) photoLimit = skuRow.photo_count;
  db.prepare('INSERT OR REPLACE INTO orders (order_id, sku, photo_limit) VALUES (?, ?, ?)').run(orderId, 'DEFAULT', photoLimit);
  res.json({
    ok: true,
    order_id: orderId,
    photo_limit: photoLimit,
    message: `该订单可上传 ${photoLimit} 张照片`,
  });
});

// 上传存储：按订单号分目录
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const orderId = (req.body.order_id || req.query.order_id || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
    const dir = path.join(UPLOAD_DIR, 'photos', orderId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// 创建或更新打印任务并记录照片
app.post('/api/upload', upload.array('photos', 50), (req, res) => {
  const orderId = (req.body.order_id || '').trim();
  if (!orderId) return res.status(400).json({ ok: false, message: '缺少订单号' });

  const order = db.prepare('SELECT photo_limit FROM orders WHERE order_id = ?').get(orderId);
  const limit = order ? order.photo_limit : 10;
  const files = req.files || [];
  if (files.length > limit) {
    return res.status(400).json({ ok: false, message: `最多上传 ${limit} 张照片` });
  }

  let task = db.prepare('SELECT id, photo_count FROM print_tasks WHERE order_id = ?').get(orderId);
  if (!task) {
    db.prepare('INSERT INTO print_tasks (order_id, photo_count, status) VALUES (?, 0, ?)').run(orderId, 'pending');
    task = db.prepare('SELECT id, photo_count FROM print_tasks WHERE order_id = ?').get(orderId);
  }
  const currentCount = db.prepare('SELECT COUNT(*) as c FROM task_photos WHERE task_id = ?').get(task.id).c;
  if (currentCount + files.length > limit) {
    return res.status(400).json({ ok: false, message: `该订单最多 ${limit} 张，已传 ${currentCount} 张，本次最多再传 ${limit - currentCount} 张` });
  }

  const insertPhoto = db.prepare('INSERT INTO task_photos (task_id, order_id, file_name, file_path) VALUES (?, ?, ?, ?)');
  for (const f of files) {
    insertPhoto.run(task.id, orderId, f.filename, path.relative(UPLOAD_DIR, f.path));
  }
  const newCount = db.prepare('SELECT COUNT(*) as c FROM task_photos WHERE task_id = ?').get(task.id).c;
  db.prepare('UPDATE print_tasks SET photo_count = ? WHERE id = ?').run(newCount, task.id);

  res.json({
    ok: true,
    order_id: orderId,
    uploaded: files.length,
    total_photos: newCount,
    photo_limit: limit,
    message: '上传成功，请等待打印',
  });
});

// 任务列表（供后台桌面端拉取：按时间、订单号检索）
app.get('/api/tasks', (req, res) => {
  const { status, order_id, from, to } = req.query;
  let sql = 'SELECT * FROM print_tasks WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (order_id) { sql += ' AND order_id = ?'; params.push(order_id); }
  if (from) { sql += ' AND created_at >= ?'; params.push(from); }
  if (to) { sql += ' AND created_at <= ?'; params.push(to); }
  sql += ' ORDER BY created_at DESC';
  const tasks = db.prepare(sql).all(...params);
  res.json({ ok: true, data: tasks });
});

// 获取某任务的详情与照片列表（含可下载路径）
app.get('/api/tasks/:orderId', (req, res) => {
  const task = db.prepare('SELECT * FROM print_tasks WHERE order_id = ?').get(req.params.orderId);
  if (!task) return res.status(404).json({ ok: false, message: '任务不存在' });
  const photos = db.prepare('SELECT * FROM task_photos WHERE order_id = ? ORDER BY created_at').all(task.order_id);
  res.json({
    ok: true,
    task,
    photos: photos.map(p => ({
      ...p,
      download_path: path.join(UPLOAD_DIR, p.file_path),
      url_path: '/uploads/' + p.file_path.replace(/\\/g, '/'),
    })),
  });
});

// 静态提供已上传文件（供后台下载或预览）
app.use('/uploads', express.static(UPLOAD_DIR));

// 标记任务为已打印（可选，供桌面端回调）
app.post('/api/tasks/:orderId/printed', (req, res) => {
  const r = db.prepare('UPDATE print_tasks SET status = ? WHERE order_id = ?').run('printed', req.params.orderId);
  if (r.changes === 0) return res.status(404).json({ ok: false });
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`照片打印后端已启动: http://localhost:${PORT}`);
});
