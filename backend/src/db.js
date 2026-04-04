import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_PATH = path.join(__dirname, '..', 'data', 'db.json');

export function emptyState() {
  return {
    version: 1,
    /** 会话 token -> { userId, role, at } */
    sessions: {},
    /** 用户扩展信息（可选） */
    users: {},
    /** 与小程序 Storage 键对齐 */
    inspectorStoresV1: [],
    inspectorSlotRecordsV1: {},
    slotOwnerByCodeV1: {},
    clientSlotQuotesByTypeV1: {},
    clientPlacementScheduleByTypeV1: {},
    adminSlotPriceBook: {},
    storeHomeSlotPhotosV1: {},
    advertiserContractByClientMap: {},
    advertiserContractCaptureMetaByClientV1: {},
    storeRevenueHistoryV1: {},
    storeClaimRegistry: {},
    storePendingClaims: [],
    currentStoreView: '',
    advertiserPriceNotice: '',
    adminPromoteRequests: [],
    adminPersonnelList: [],
    adminTodoAuditLogV1: [],
    storeManagerBindings: {},
    /** 对应 utils/demoClients.js 的 CLIENTS */
    clients: [],
    /** 登录态（若由服务端托管 session，小程序可不写本地 loggedIn） */
    loggedIn: false,
    userPhone: '',
    userRole: 'user',
    currentAdvertiserClientId: '',
  };
}

let cache = null;

export function loadDb() {
  if (cache) return cache;
  const base = emptyState();
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
      cache = { ...base, ...raw, sessions: raw.sessions || {} };
      Object.keys(base).forEach((k) => {
        if (cache[k] === undefined) cache[k] = base[k];
      });
      return cache;
    }
  } catch (e) {
    console.error('[db] load failed', e);
  }
  cache = base;
  return cache;
}

export function saveDb() {
  if (!cache) return;
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(cache, null, 2), 'utf8');
}

export function getDb() {
  return loadDb();
}
