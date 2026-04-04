/**
 * 巡店员逐一拍照生成：每个门店的广告位照片/状态记录（本地存储）
 *
 * 新交互（你当前的诉求）：
 * - 新增门店后：不做任何“数量/上限初始化”
 * - 巡检页：每拍一张照片，就生成一条该类型的广告位记录（无数量上限，仅提示）
 * - 最终提交巡检：标记 completed=true
 */
const KEY = 'inspectorSlotRecordsV1';
const inspectorStores = require('./inspectorStores.js');

const SEED_DONE_STORE_ID = 'ins_s_ba';
const SEED_DONE_SLOTS_COUNT = 3;

const STATUS_OPTIONS = ['正常', '遮挡', '脱落'];

const TYPE_ABBR = {
  灯箱: 'DX',
  地贴: 'DT',
  货架: 'HJ',
  LED: 'LED',
  门头: 'MT',
  出库仪: 'CKY',
};

function safeTypeAbbr(type) {
  return TYPE_ABBR[type] || String(type).slice(0, 3);
}

function pad2(n) {
  const num = Number(n) || 0;
  return String(num).padStart(2, '0');
}

function getStoreSequenceNo(storeId) {
  const stores = inspectorStores.getStores();
  const row = stores.find((s) => s.id === storeId);
  const seq = Number(row && row.sequenceNo);
  return Number.isFinite(seq) && seq > 0 ? seq : 0;
}

function buildSlotCode(storeId, type, serialInType) {
  const storeSeq = pad2(getStoreSequenceNo(storeId));
  const typeCode = safeTypeAbbr(type).toUpperCase();
  const typeSeq = pad2(serialInType);
  return `${storeSeq}-${typeCode}-${typeSeq}`;
}

function isDemoStyleSlotCode(code) {
  return code && typeof code === 'string' && code.startsWith('SZ-');
}

function normalizeSlotsForStore(storeId, slots) {
  const list = Array.isArray(slots) ? slots : [];
  const typeCounter = {};
  return list.map((slot, idx) => {
    const type = slot && slot.type ? slot.type : '灯箱';
    typeCounter[type] = (typeCounter[type] || 0) + 1;
    const serial = typeCounter[type];
    const keepCode = isDemoStyleSlotCode(slot && slot.code);
    const code = keepCode ? slot.code : buildSlotCode(storeId, type, serial);
    return {
      ...slot,
      index: Number(slot && slot.index) > 0 ? slot.index : idx + 1,
      code,
      type,
      label: slot && slot.label ? slot.label : `${type} #${serial}`,
    };
  });
}

function normalizeMapCodes(map) {
  let changed = false;
  Object.keys(map || {}).forEach((storeId) => {
    const row = map[storeId] || {};
    const before = JSON.stringify(row.slots || []);
    const normalized = normalizeSlotsForStore(storeId, row.slots || []);
    const after = JSON.stringify(normalized);
    if (before !== after) {
      map[storeId] = { ...row, slots: normalized, updatedAt: Date.now() };
      changed = true;
    }
  });
  return changed;
}

function getMap() {
  const raw = wx.getStorageSync(KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const map = raw;
    if (normalizeMapCodes(map)) {
      setMap(map);
    }
    return map;
  }
  return {};
}

function setMap(map) {
  wx.setStorageSync(KEY, map);
}

function buildSeedSlots(storeId, count) {
  const slots = [];
  const ts = Date.now();
  for (let i = 0; i < count; i += 1) {
    slots.push({
      code: buildSlotCode(storeId, '灯箱', i + 1),
      index: i + 1,
      type: '灯箱',
      label: `灯箱 #${i + 1}`,
      status: '正常',
      // 用远程占位图演示“已完成”
      photo: `https://picsum.photos/seed/${storeId}-${i + 1}/600/420`,
      photoTakenAt: ts + i,
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

function getAllRecords() {
  return getMap();
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

/** 从所有门店记录中删除指定编号的广告位（巡检生成） */
function removeSlotByCode(slotCode) {
  if (!slotCode) return false;
  const map = getMap();
  let changed = false;
  Object.keys(map || {}).forEach((storeId) => {
    const row = map[storeId];
    const slots = row && row.slots ? row.slots : [];
    const idx = slots.findIndex((s) => s && s.code === slotCode);
    if (idx >= 0) {
      slots.splice(idx, 1);
      row.slots = slots;
      row.updatedAt = Date.now();
      map[storeId] = row;
      changed = true;
    }
  });
  if (changed) setMap(map);
  return changed;
}

/** 删除某门店的全部巡检记录（删门店时调用） */
function deleteRecordForStore(storeId) {
  if (!storeId) return;
  const map = getMap();
  if (map[storeId]) {
    delete map[storeId];
    setMap(map);
  }
}

/**
 * 追加/填充一条“已拍照片”的广告位记录
 * - 若 slots 中存在同类型且 photo 为空的占位：优先填充
 * - 否则追加一条新记录
 */
function addGeneratedSlot(storeId, type, status, photo, meta) {
  if (!storeId || !type || !photo) return null;

  const map = getMap();
  if (!map[storeId]) {
    map[storeId] = { storeId, createdAt: Date.now(), updatedAt: Date.now(), completed: false, slots: [] };
  }

  const row = map[storeId];
  const slots = row.slots || [];

  const wmTime = meta && meta.watermarkTime ? String(meta.watermarkTime) : '';
  const wmAddr = meta && meta.watermarkAddress ? String(meta.watermarkAddress) : '';
  const takenAt = meta && meta.recordedAt != null ? Number(meta.recordedAt) : Date.now();

  // 兼容旧“初始化占位”逻辑：先填充同类型的空 photo
  const idx = slots.findIndex((s) => s.type === type && !s.photo);
  if (idx >= 0) {
    slots[idx] = {
      ...slots[idx],
      status: status || '正常',
      photo,
      photoTakenAt: takenAt,
      watermarkTime: wmTime,
      watermarkAddress: wmAddr,
    };
  } else {
    const countSameType = slots.filter((s) => s.type === type).length;
    const n = countSameType + 1;
    slots.push({
      code: buildSlotCode(storeId, type, n),
      index: n,
      type,
      label: `${type} #${n}`,
      status: status || '正常',
      photo,
      photoTakenAt: takenAt,
      watermarkTime: wmTime,
      watermarkAddress: wmAddr,
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
      slots.push({
        code: buildSlotCode(storeId, type, i),
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

/**
 * 门店打卡页：若巡检记录尚无广告位，且该门店名在演示数据中有清单，则写入空照片占位（保留 SZ- 编号）
 */
function ensureDemoSlotsSeededInRecord(storeId, storeName) {
  const demoSlots = require('./demoSlots.js');
  const map = getMap();
  if (!map[storeId]) {
    map[storeId] = { storeId, createdAt: Date.now(), slots: [], completed: false };
  }
  const row = map[storeId];
  if ((row.slots || []).length > 0) return row.slots;
  const demo = demoSlots.slotsForStore(storeName);
  if (!demo.length) return [];
  row.slots = demo.map((d, i) => ({
    code: d.code,
    type: d.type,
    status: d.status === '空置' ? '空置' : '正常',
    label: `${d.type} #${i + 1}`,
    index: i + 1,
    photo: '',
    expireAt: d.expireAt,
  }));
  row.updatedAt = Date.now();
  map[storeId] = row;
  setMap(map);
  return row.slots;
}

/**
 * 按广告位编号更新/插入照片（门店打卡网格）
 */
function upsertSlotPhotoByCode(storeId, code, photo, meta) {
  if (!storeId || !code || !photo) return null;

  const map = getMap();
  if (!map[storeId]) {
    map[storeId] = { storeId, createdAt: Date.now(), slots: [], completed: false };
  }

  const row = map[storeId];
  const slots = row.slots || [];

  const wmTime = meta && meta.watermarkTime ? String(meta.watermarkTime) : '';
  const wmAddr = meta && meta.watermarkAddress ? String(meta.watermarkAddress) : '';
  const takenAt = meta && meta.recordedAt != null ? Number(meta.recordedAt) : Date.now();
  const type = meta && meta.type ? meta.type : '灯箱';
  const status = meta && meta.status ? meta.status : '正常';

  const idx = slots.findIndex((s) => s && s.code === code);
  if (idx >= 0) {
    slots[idx] = {
      ...slots[idx],
      photo,
      photoTakenAt: takenAt,
      watermarkTime: wmTime,
      watermarkAddress: wmAddr,
      status: status || slots[idx].status || '正常',
    };
  } else {
    const n = slots.filter((s) => s.type === type).length + 1;
    slots.push({
      code,
      type,
      label: `${type} #${n}`,
      index: slots.length + 1,
      status,
      photo,
      photoTakenAt: takenAt,
      watermarkTime: wmTime,
      watermarkAddress: wmAddr,
    });
  }

  row.slots = slots;
  row.updatedAt = Date.now();
  map[storeId] = row;
  setMap(map);

  return slots;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** 门店「全部广告位」网格打卡完成时写入，用于巡店列表展示本月是否已打卡 */
/**
 * 清空某广告位巡店侧照片（用于：超过 7 天未在客户管理中设置投放时间时回收展示）
 */
function clearSlotPhotoByCode(slotCode) {
  if (!slotCode) return false;
  const map = getMap();
  let changed = false;
  Object.keys(map || {}).forEach((storeId) => {
    const row = map[storeId];
    if (!row || !row.slots) return;
    let rowChanged = false;
    const nextSlots = row.slots.map((s) => {
      if (!s || s.code !== slotCode || !s.photo) return s;
      rowChanged = true;
      return {
        ...s,
        photo: '',
        photoTakenAt: undefined,
        watermarkTime: '',
        watermarkAddress: '',
      };
    });
    if (rowChanged) {
      map[storeId] = { ...row, slots: nextSlots, updatedAt: Date.now() };
      changed = true;
    }
  });
  if (changed) setMap(map);
  return changed;
}

function markGridCheckinDoneForMonth(storeId) {
  if (!storeId) return;
  const map = getMap();
  if (!map[storeId]) {
    map[storeId] = { storeId, createdAt: Date.now(), slots: [], completed: false };
  }
  const row = map[storeId];
  row.gridCheckinMonth = currentMonthKey();
  row.updatedAt = Date.now();
  map[storeId] = row;
  setMap(map);
}

function isGridCheckinDoneThisMonth(storeId) {
  const rec = getRecord(storeId);
  if (!rec || !rec.gridCheckinMonth) return false;
  return rec.gridCheckinMonth === currentMonthKey();
}

module.exports = {
  KEY,
  STATUS_OPTIONS,
  ensureRecordForStore,
  getRecord,
  getAllRecords,
  updateSlots,
  removeSlotByCode,
  deleteRecordForStore,
  initSlotsForStore,
  addGeneratedSlot,
  markCompleted,
  ensureDemoSlotsSeededInRecord,
  upsertSlotPhotoByCode,
  clearSlotPhotoByCode,
  markGridCheckinDoneForMonth,
  isGridCheckinDoneThisMonth,
};

