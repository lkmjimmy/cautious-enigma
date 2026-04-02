/**
 * 巡店员逐一拍照生成：每个门店的广告位照片/状态记录（本地存储）
 *
 * 新交互（你当前的诉求）：
 * - 新增门店后：不做任何“数量/上限初始化”
 * - 巡检页：每拍一张照片，就生成一条该类型的广告位记录（无数量上限，仅提示）
 * - 最终提交巡检：标记 completed=true
 */
const KEY = 'inspectorSlotRecordsV1';

const SEED_DONE_STORE_ID = 'ins_s_ba';
const SEED_DONE_SLOTS_COUNT = 3;

const STATUS_OPTIONS = ['正常', '遮挡', '脱落'];

const TYPE_ABBR = {
  灯箱: 'LX',
  地贴: 'DT',
  货架: 'HJ',
  LED: 'LED',
  门头: 'MT',
  出库仪: 'CKY',
};

function safeTypeAbbr(type) {
  return TYPE_ABBR[type] || String(type).slice(0, 3);
}

function getMap() {
  const raw = wx.getStorageSync(KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return {};
}

function setMap(map) {
  wx.setStorageSync(KEY, map);
}

function buildSeedSlots(storeId, count) {
  const slots = [];
  for (let i = 0; i < count; i += 1) {
    slots.push({
      code: `${storeId}_LX_${i + 1}`,
      index: i + 1,
      type: '灯箱',
      label: `灯箱 #${i + 1}`,
      status: '正常',
      // 用远程占位图演示“已完成”
      photo: `https://picsum.photos/seed/${storeId}-${i + 1}/600/420`,
    });
  }
  return slots;
}

function ensureRecordForStore(store) {
  const map = getMap();
  const storeId = store.id;
  if (!storeId) return null;
  if (!map[storeId]) {
    const isSeedDone = storeId === SEED_DONE_STORE_ID;

    map[storeId] = {
      storeId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completed: !!isSeedDone,
      // 只有 seed 完成门店预置一些已完成记录；其它门店从空开始，由“逐一拍照生成”产生
      slots: isSeedDone ? buildSeedSlots(storeId, SEED_DONE_SLOTS_COUNT) : [],
    };
    setMap(map);
  }
  return map[storeId];
}

function getRecord(storeId) {
  const map = getMap();
  return map[storeId] || null;
}

function updateSlots(storeId, slots) {
  const map = getMap();
  if (!map[storeId]) {
    map[storeId] = { storeId, createdAt: Date.now(), slots: [], completed: false };
  }
  map[storeId].slots = slots || [];
  map[storeId].updatedAt = Date.now();
  setMap(map);
}

/**
 * 追加/填充一条“已拍照片”的广告位记录
 * - 若 slots 中存在同类型且 photo 为空的占位：优先填充
 * - 否则追加一条新记录
 */
function addGeneratedSlot(storeId, type, status, photo) {
  if (!storeId || !type || !photo) return null;

  const map = getMap();
  if (!map[storeId]) {
    map[storeId] = { storeId, createdAt: Date.now(), updatedAt: Date.now(), completed: false, slots: [] };
  }

  const row = map[storeId];
  const slots = row.slots || [];

  // 兼容旧“初始化占位”逻辑：先填充同类型的空 photo
  const idx = slots.findIndex((s) => s.type === type && !s.photo);
  if (idx >= 0) {
    slots[idx] = {
      ...slots[idx],
      status: status || '正常',
      photo,
    };
  } else {
    const abbr = safeTypeAbbr(type);
    const countSameType = slots.filter((s) => s.type === type).length;
    const n = countSameType + 1;
    slots.push({
      code: `${storeId}_${abbr}_${n}`,
      index: n,
      type,
      label: `${type} #${n}`,
      status: status || '正常',
      photo,
    });
  }

  row.slots = slots;
  row.updatedAt = Date.now();
  map[storeId] = row;
  setMap(map);

  return slots;
}

function buildSlotsForInit(storeId, typeCounts, typeOrder) {
  const slots = [];
  let globalIndex = 0;
  (typeOrder || Object.keys(typeCounts || {})).forEach((type) => {
    const count = Number(typeCounts[type] || 0);
    const n = Math.max(0, Math.floor(count));
    for (let i = 1; i <= n; i += 1) {
      globalIndex += 1;
      const abbr = safeTypeAbbr(type);
      slots.push({
        code: `${storeId}_${abbr}_${i}`,
        index: globalIndex,
        type,
        label: `${type} #${i}`,
        status: '正常',
        photo: '',
      });
    }
  });
  return slots;
}

/**
 * 初始化某门店的广告位列表（由“拍几张/无”决定）
 */
function initSlotsForStore(storeId, typeCounts, typeOrder) {
  if (!storeId) return;
  const map = getMap();
  if (!map[storeId]) {
    map[storeId] = { storeId, createdAt: Date.now(), completed: false, slots: [] };
  }

  map[storeId].slots = buildSlotsForInit(storeId, typeCounts, typeOrder);
  map[storeId].completed = false;
  map[storeId].updatedAt = Date.now();
  setMap(map);
}

function markCompleted(storeId) {
  const map = getMap();
  if (!map[storeId]) return;
  map[storeId].completed = true;
  map[storeId].updatedAt = Date.now();
  setMap(map);
}

module.exports = {
  KEY,
  STATUS_OPTIONS,
  ensureRecordForStore,
  getRecord,
  updateSlots,
  initSlotsForStore,
  addGeneratedSlot,
  markCompleted,
};

