/**
 * 后台桌面端主程序
 * - 提供本地 Web 界面：按订单号/时间检索任务，查看是否传完，点击「开始打印」
 * - 定时拉取任务并下载到本地（调用 downloader）
 * - 打印：打开订单文件夹或调用系统打印（需根据操作系统配置）
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const fetch = require('node-fetch');

const configPath = path.join(__dirname, '../config.json');
const config = fs.existsSync(configPath) ? require(configPath) : require('../config.example.json');

const API = config.apiBase.replace(/\/$/, '');
const LOCAL_BASE = path.resolve(path.join(__dirname, '..', config.localBase || './tasks'));
const PORT = config.port || 3980;

if (!fs.existsSync(LOCAL_BASE)) fs.mkdirSync(LOCAL_BASE, { recursive: true });

// 简单 HTML 后台：任务列表、按时间/订单号检索、开始打印
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>照片打印后台</title>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 20px auto; padding: 0 20px; }
    h1 { color: #333; }
    .filters { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
    .filters input, .filters select { padding: 8px 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .btn { padding: 8px 16px; background: #1989fa; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status.pending { background: #fff3e0; }
    .status.printed { background: #e8f5e9; }
    .open-folder { margin-left: 8px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>照片打印后台</h1>
  <div class="filters">
    <input type="text" id="orderId" placeholder="订单号">
    <input type="datetime-local" id="from" placeholder="开始时间">
    <input type="datetime-local" id="to" placeholder="结束时间">
    <select id="status">
      <option value="">全部状态</option>
      <option value="pending">待打印</option>
      <option value="printed">已打印</option>
    </select>
    <button class="btn" onclick="loadTasks()">检索</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>订单号</th>
        <th>照片数</th>
        <th>提交时间</th>
        <th>状态</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody id="list"></tbody>
  </table>
  <script>
    const API = ${JSON.stringify(API)};
    function qs(s) { return document.querySelector(s); }
    function formatTime(t) { return t ? new Date(t).toLocaleString() : '-'; }
    async function loadTasks() {
      const params = new URLSearchParams();
      if (qs('#orderId').value) params.set('order_id', qs('#orderId').value);
      if (qs('#from').value) params.set('from', qs('#from').value.replace('T',' '));
      if (qs('#to').value) params.set('to', qs('#to').value.replace('T',' '));
      if (qs('#status').value) params.set('status', qs('#status').value);
      const res = await fetch(API + '/api/tasks?' + params);
      const json = await res.json();
      const tasks = json.data || [];
      const tbody = qs('#list');
      tbody.innerHTML = tasks.map(t => '
        <tr>
          <td>' + t.order_id + '</td>
          <td>' + t.photo_count + '</td>
          <td>' + formatTime(t.created_at) + '</td>
          <td><span class="status ' + t.status + '">' + (t.status === 'printed' ? '已打印' : '待打印') + '</span></td>
          <td>
            <button class="btn start-print" data-order="' + t.order_id + '" ' + (t.status === 'printed' ? 'disabled' : '') + '>开始打印</button>
            <button class="btn open-folder" data-order="' + t.order_id + '">打开文件夹</button>
          </td>
        </tr>
      ').join('');
      tbody.querySelectorAll('.start-print').forEach(btn => {
        btn.onclick = () => startPrint(btn.dataset.order);
      });
      tbody.querySelectorAll('.open-folder').forEach(btn => {
        btn.onclick = () => openFolder(btn.dataset.order);
      });
    }
    function openFolder(orderId) {
      window.location.href = '/open?order_id=' + encodeURIComponent(orderId);
    }
    async function startPrint(orderId) {
      if (!confirm('确认开始打印订单 ' + orderId + '？')) return;
      const res = await fetch(API + '/api/tasks/' + encodeURIComponent(orderId) + '/printed', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        window.location.href = '/print?order_id=' + encodeURIComponent(orderId);
        loadTasks();
      } else alert('操作失败');
    }
    loadTasks();
  </script>
</body>
</html>
`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }
  // 打开本地文件夹（返回说明页，实际需用 file:// 或 electron 打开）
  if (url.pathname === '/open') {
    const orderId = url.searchParams.get('order_id') || '';
    const dir = path.join(LOCAL_BASE, orderId);
    if (orderId && fs.existsSync(dir)) {
      const cmd = process.platform === 'win32' ? `explorer "${dir}"` : process.platform === 'darwin' ? `open "${dir}"` : `xdg-open "${dir}"`;
      exec(cmd);
    }
    res.writeHead(302, { Location: '/' });
    return res.end();
  }
  // 打印：打开文件夹供人工选择打印；或在此调用系统打印命令
  if (url.pathname === '/print') {
    const orderId = url.searchParams.get('order_id') || '';
    const dir = path.join(LOCAL_BASE, orderId);
    if (orderId && fs.existsSync(dir)) {
      // 可根据 config.printers 按尺寸调用不同打印机（需系统支持或第三方工具）
      const cmd = process.platform === 'win32' ? `explorer "${dir}"` : process.platform === 'darwin' ? `open "${dir}"` : `xdg-open "${dir}"`;
      exec(cmd);
    }
    res.writeHead(302, { Location: '/' });
    return res.end();
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`后台界面: http://localhost:${PORT}`);
  console.log(`任务目录: ${LOCAL_BASE}`);
});

// 定时下载新任务
let timer;
async function pollDownload() {
  try {
    const { spawn } = require('child_process');
    const child = spawn(process.execPath, [path.join(__dirname, 'downloader.js')], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    await new Promise((resolve, reject) => child.on('close', code => (code === 0 ? resolve() : reject(new Error('code ' + code)))));
  } catch (e) {
    console.error('下载任务失败', e.message);
  }
  timer = setTimeout(pollDownload, config.pollIntervalMs || 60000);
}
setTimeout(pollDownload, 5000);
