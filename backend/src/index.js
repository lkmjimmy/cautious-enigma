import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { getDb, loadDb, saveDb } from './db.js';
import { jscode2session, isWechatConfigured } from './wechatAuth.js';

/** 与探针一致：无效/空 PORT 时，生产默认 80，开发默认 3000（避免 PORT="" → 0 → 误用 3000） */
function resolveListenPort() {
  const raw = process.env.PORT;
  if (raw !== undefined && String(raw).trim() !== '') {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return process.env.NODE_ENV === 'production' ? 80 : 3000;
}

const PORT = resolveListenPort();
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'adslot-backend', time: new Date().toISOString() });
});

/** 微信云托管示例 / 控制台常用探测路径；与官方 demo 的 GET /api/count 兼容 */
app.get('/api/count', (_req, res) => {
  res.json({ count: 1, service: 'adslot-backend' });
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

/**
 * 微信登录
 * - 若设置 WECHAT_APP_ID + WECHAT_APP_SECRET：调用 jscode2session，用户以 openid 稳定绑定
 * - 管理员：生产环境以 WECHAT_ADMIN_OPENIDS（逗号分隔 openid）为准，不再信任客户端传来的 admin
 * - 未配置密钥：演示模式（每次随机 userId，仍接受 body.role 区分 admin，仅本地联调）
 */
app.post('/api/v1/auth/wechat', async (req, res) => {
  const { code, role: roleRaw } = req.body || {};
  if (!code) {
    res.status(400).json({ error: 'bad_request', message: '缺少 code' });
    return;
  }

  const db = loadDb();
  const token = randomToken();
  let userId;
  let openid = null;
  let role;

  if (isWechatConfigured()) {
    const appId = process.env.WECHAT_APP_ID || process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_APP_SECRET;
    try {
      const wx = await jscode2session(appId, secret, code);
      openid = wx.openid;
    } catch (e) {
      const msg = e && e.message ? String(e.message) : '微信登录失败';
      const errcode = e && e.errcode;
      res.status(400).json({
        error: 'wechat_auth_failed',
        message: msg,
        ...(errcode != null ? { errcode } : {}),
      });
      return;
    }
    userId = `wx_${openid}`;
    const admins = (process.env.WECHAT_ADMIN_OPENIDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    role = openid && admins.includes(openid) ? 'admin' : 'user';
  } else {
    console.warn(
      '[auth] 未配置 WECHAT_APP_ID / WECHAT_APP_SECRET，使用演示登录（随机用户，勿用于生产）'
    );
    userId = `u_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    role = roleRaw === 'admin' ? 'admin' : 'user';
  }

  db.sessions[token] = { userId, role, at: Date.now(), ...(openid ? { openid } : {}) };

  const prev = db.users[userId];
  db.users[userId] = {
    id: userId,
    role,
    createdAt: prev && prev.createdAt ? prev.createdAt : Date.now(),
    updatedAt: Date.now(),
    ...(openid ? { openid } : {}),
  };

  db.userRole = role;
  db.loggedIn = true;
  db.userPhone = '微信用户';
  saveDb();

  res.json({
    token,
    userId,
    role,
    user: { id: userId, role, ...(openid ? { openid } : {}) },
    authMode: isWechatConfigured() ? 'wechat' : 'demo',
  });
});

app.get('/api/v1/me', requireAuth, (req, res) => {
  res.json({
    userId: req.session.userId,
    role: req.session.role,
    ...(req.session.openid ? { openid: req.session.openid } : {}),
  });
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
  const envPort = process.env.PORT;
  console.log(
    `[adslot-backend] listening on 0.0.0.0:${PORT} | env.PORT=${envPort === undefined ? '(unset)' : JSON.stringify(envPort)} | NODE_ENV=${process.env.NODE_ENV || '(unset)'}`
  );
  console.log(`[adslot-backend] GET /health  |  GET /api/count  |  POST /api/v1/auth/wechat  |  GET /api/v1/bootstrap`);
  if (isWechatConfigured()) {
    const n = (process.env.WECHAT_ADMIN_OPENIDS || '').split(',').filter((s) => s.trim()).length;
    console.log(`[adslot-backend] 微信登录已启用；管理员 openid 数量: ${n}`);
  } else {
    console.log('[adslot-backend] 微信 AppSecret 未配置 → 演示登录模式');
  }
});
