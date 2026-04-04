import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { emptyState, getDb, loadDb, saveDb } from './db.js';

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'adslot-backend', time: new Date().toISOString() });
});

function randomToken() {
  return crypto.randomBytes(24).toString('hex');
}

function getSession(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  const token = h.slice(7).trim();
  const db = getDb();
  return db.sessions[token] ? { token, ...db.sessions[token] } : null;
}

function requireAuth(req, res, next) {
  const s = getSession(req);
  if (!s) {
    res.status(401).json({ error: 'unauthorized', message: '缺少或无效的 Authorization: Bearer <token>' });
    return;
  }
  req.session = s;
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.role !== 'admin') {
    res.status(403).json({ error: 'forbidden', message: '需要管理者角色' });
    return;
  }
  next();
}

/** 微信登录（演示）：不校验 code，签发会话 */
app.post('/api/v1/auth/wechat', (req, res) => {
  const { code, role: roleRaw } = req.body || {};
  if (!code) {
    res.status(400).json({ error: 'bad_request', message: '缺少 code' });
    return;
  }
  const role = roleRaw === 'admin' ? 'admin' : 'user';
  const db = loadDb();
  const userId = `u_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const token = randomToken();
  db.sessions[token] = { userId, role, at: Date.now() };
  db.users[userId] = { id: userId, role, createdAt: Date.now() };
  db.userRole = role;
  db.loggedIn = true;
  db.userPhone = '微信用户';
  saveDb();
  res.json({
    token,
    userId,
    role,
    user: { id: userId, role },
  });
});

app.get('/api/v1/me', requireAuth, (req, res) => {
  res.json({ userId: req.session.userId, role: req.session.role });
});

/** 导出与小程序 wx.storage 对齐的快照（不含 sessions） */
function publicSnapshot(db) {
  const { sessions: _s, version: _v, ...rest } = db;
  return rest;
}

app.get('/api/v1/bootstrap', requireAuth, (_req, res) => {
  const db = loadDb();
  res.json(publicSnapshot(db));
});

/** 合并写入（用于同步本地多键；管理者可写全部，普通用户仅部分键可按需在前端限制） */
app.put('/api/v1/bootstrap', requireAuth, (req, res) => {
  const patch = req.body || {};
  const db = loadDb();
  const forbidden = ['sessions', 'version'];
  Object.keys(patch).forEach((k) => {
    if (forbidden.includes(k)) return;
    if (patch[k] !== undefined) db[k] = patch[k];
  });
  saveDb();
  res.json({ ok: true, snapshot: publicSnapshot(db) });
});

/** ——— 巡店门店 ——— */
app.get('/api/v1/inspector-stores', requireAuth, (_req, res) => {
  res.json({ list: loadDb().inspectorStoresV1 || [] });
});

app.post('/api/v1/inspector-stores', requireAuth, (req, res) => {
  const { name, address, phone } = req.body || {};
  if (!name) {
    res.status(400).json({ error: 'bad_request', message: '缺少 name' });
    return;
  }
  const db = loadDb();
  const list = Array.isArray(db.inspectorStoresV1) ? db.inspectorStoresV1 : [];
  const nextSequenceNo =
    list.reduce((max, row) => {
      const n = Number(row && row.sequenceNo);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;
  const id = `ins_s_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
  const distanceOptions = ['0.8km', '1.2km', '1.6km', '2.3km', '3.1km', '4.7km', '7.9km'];
  const distance = distanceOptions[Math.floor(Math.random() * distanceOptions.length)] || '—';
  const row = {
    id,
    name,
    address: address || '',
    phone: phone || '',
    distance,
    typeInventory: {},
    sequenceNo: nextSequenceNo,
  };
  list.unshift(row);
  db.inspectorStoresV1 = list;
  saveDb();
  res.json({ ok: true, store: row });
});

/** ——— 巡检记录（按门店 id） ——— */
app.get('/api/v1/inspector-records/:storeId', requireAuth, (req, res) => {
  const db = loadDb();
  const map = db.inspectorSlotRecordsV1 || {};
  res.json(map[req.params.storeId] || null);
});

app.put('/api/v1/inspector-records/:storeId', requireAuth, (req, res) => {
  const db = loadDb();
  if (!db.inspectorSlotRecordsV1) db.inspectorSlotRecordsV1 = {};
  db.inspectorSlotRecordsV1[req.params.storeId] = req.body || {};
  saveDb();
  res.json({ ok: true });
});

/** ——— 客户 ——— */
app.get('/api/v1/clients', requireAuth, (_req, res) => {
  res.json({ list: loadDb().clients || [] });
});

app.put('/api/v1/clients', requireAuth, requireAdmin, (req, res) => {
  const db = loadDb();
  db.clients = Array.isArray(req.body?.list) ? req.body.list : [];
  saveDb();
  res.json({ ok: true, list: db.clients });
});

/** ——— 键值直读直写（便于逐步替换前端 Storage） ——— */
const KV_KEYS = [
  'slotOwnerByCodeV1',
  'clientSlotQuotesByTypeV1',
  'clientPlacementScheduleByTypeV1',
  'adminSlotPriceBook',
  'storeHomeSlotPhotosV1',
  'advertiserContractByClientMap',
  'advertiserContractCaptureMetaByClientV1',
  'storeRevenueHistoryV1',
  'storeClaimRegistry',
  'storePendingClaims',
  'advertiserPriceNotice',
  'adminPromoteRequests',
  'adminPersonnelList',
  'adminTodoAuditLogV1',
  'storeManagerBindings',
];

app.get('/api/v1/kv/:key', requireAuth, (req, res) => {
  if (!KV_KEYS.includes(req.params.key)) {
    res.status(400).json({ error: 'unknown_key', allowed: KV_KEYS });
    return;
  }
  const db = loadDb();
  res.json({ key: req.params.key, value: db[req.params.key] });
});

app.put('/api/v1/kv/:key', requireAuth, (req, res) => {
  if (!KV_KEYS.includes(req.params.key)) {
    res.status(400).json({ error: 'unknown_key', allowed: KV_KEYS });
    return;
  }
  const db = loadDb();
  db[req.params.key] = req.body?.value !== undefined ? req.body.value : req.body;
  saveDb();
  res.json({ ok: true });
});

/** 监听 0.0.0.0，便于本机 127.0.0.1、局域网 IP、真机访问同一端口 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[adslot-backend] listening on http://127.0.0.1:${PORT} (and LAN IP:${PORT})`);
  console.log(`[adslot-backend] GET /health  |  POST /api/v1/auth/wechat  |  GET /api/v1/bootstrap`);
});
