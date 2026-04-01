/**
 * 自动排版：将 tasks/<订单号>/ 下的照片按预设尺寸生成排版图或 PDF（可选）
 * 当前实现：仅按订单号分目录存放，如需拼版可在此用 sharp 拼大图
 */
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');
const config = fs.existsSync(configPath) ? require(configPath) : require('../config.example.json');
const LOCAL_BASE = path.resolve(path.join(__dirname, '..', config.localBase || './tasks'));

if (!fs.existsSync(LOCAL_BASE)) {
  console.log('无 tasks 目录，跳过排版');
  process.exit(0);
}

const orders = fs.readdirSync(LOCAL_BASE).filter(f => {
  const p = path.join(LOCAL_BASE, f);
  return fs.statSync(p).isDirectory();
});

for (const orderId of orders) {
  const dir = path.join(LOCAL_BASE, orderId);
  const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();
  console.log(`[layout] 订单 ${orderId}：${files.length} 张照片，目录 ${dir}`);
  // 扩展：可在此用 sharp 将多图拼成一张大图或生成 PDF，便于整版打印
}

process.exit(0);
