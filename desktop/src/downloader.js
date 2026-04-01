/**
 * 定时从后端拉取新任务，按订单号下载照片到本地 tasks/<订单号>/
 * 可单独运行：node src/downloader.js，或由 main.js 一起启动
 */
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const configPath = path.join(__dirname, '../config.json');
const config = fs.existsSync(configPath)
  ? require(configPath)
  : require('../config.example.json');

const API = config.apiBase.replace(/\/$/, '');
const LOCAL_BASE = path.resolve(path.join(__dirname, '..', config.localBase || './tasks'));

if (!fs.existsSync(LOCAL_BASE)) fs.mkdirSync(LOCAL_BASE, { recursive: true });

async function fetchTasks() {
  const res = await fetch(`${API}/api/tasks?status=pending`);
  const json = await res.json();
  return json.ok ? json.data : [];
}

async function fetchTaskDetail(orderId) {
  const res = await fetch(`${API}/api/tasks/${encodeURIComponent(orderId)}`);
  const json = await res.json();
  return json.ok ? json : null;
}

async function downloadFile(url) {
  const fullUrl = url.startsWith('http') ? url : `${API}${url.startsWith('/') ? '' : '/'}${url}`;
  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function run() {
  const tasks = await fetchTasks();
  for (const task of tasks) {
    const detail = await fetchTaskDetail(task.order_id);
    if (!detail || !detail.photos || detail.photos.length === 0) continue;
    const orderDir = path.join(LOCAL_BASE, task.order_id);
    if (!fs.existsSync(orderDir)) fs.mkdirSync(orderDir, { recursive: true });
    for (let i = 0; i < detail.photos.length; i++) {
      const p = detail.photos[i];
      const url = p.url_path ? `${API}${p.url_path}` : (p.download_path ? null : p.url_path);
      if (!url) continue;
      try {
        const buf = await downloadFile(url);
        const ext = path.extname(p.file_name) || '.jpg';
        const outPath = path.join(orderDir, `photo_${i + 1}${ext}`);
        fs.writeFileSync(outPath, buf);
        console.log(`[downloaded] ${task.order_id} / photo_${i + 1}`);
      } catch (e) {
        console.error(`[error] ${task.order_id} ${p.file_name}`, e.message);
      }
    }
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
