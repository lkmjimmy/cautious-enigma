/**
 * 巡店员新增门店：演示数据（本地存储）
 * 正式环境：由后端创建门店、下发巡检任务
 */
const KEY = 'inspectorStoresV1';

const demoSlots = require('./demoSlots.js');

const TEMPLATE_STORE_NAMES = [
  '福田中心店',
  '南山科技园店',
  '宝安壹方城店',
  '龙岗万达店',
  '龙华红山店',
  '罗湖万象店',
];

function typeInventoryForTemplateStore(storeName) {
  const slots = demoSlots.slotsForStore(storeName);
  const m = {};
  slots.forEach((s) => {
    m[s.type] = (m[s.type] || 0) + 1;
  });
  return m;
}

function pickRandomTemplateInventory() {
  const tpl = TEMPLATE_STORE_NAMES[Math.floor(Math.random() * TEMPLATE_STORE_NAMES.length)] || TEMPLATE_STORE_NAMES[0];
  return typeInventoryForTemplateStore(tpl);
}

const DEFAULT_STORES = [
  {
    id: 'ins_s_ft',
    name: '福田中心店',
    address: '福田中心店示例地址',
    phone: '138****2160',
    distance: '1.2km',
    sequenceNo: 0,
    typeInventory: typeInventoryForTemplateStore('福田中心店'),
  },
  {
    id: 'ins_s_ns',
    name: '南山科技园店',
    address: '南山科技园店示例地址',
    phone: '159****8832',
    distance: '2.8km',
    sequenceNo: 0,
    typeInventory: typeInventoryForTemplateStore('南山科技园店'),
  },
  {
    id: 'ins_s_ba',
    name: '宝安壹方城店',
    address: '宝安壹方城店示例地址',
    phone: '186****5091',
    distance: '7.1km',
    sequenceNo: 0,
    typeInventory: typeInventoryForTemplateStore('宝安壹方城店'),
  },
  {
    id: 'ins_s_lg',
    name: '龙岗万达店',
    address: '龙岗区布吉街道万达广场 1F',
    phone: '137****1101',
    distance: '4.2km',
    sequenceNo: 0,
    typeInventory: typeInventoryForTemplateStore('龙岗万达店'),
  },
  {
    id: 'ins_s_hs',
    name: '龙华红山店',
    address: '龙华区红山地铁站旁天虹商圈',
    phone: '136****2202',
    distance: '5.6km',
    sequenceNo: 0,
    typeInventory: typeInventoryForTemplateStore('龙华红山店'),
  },
  {
    id: 'ins_s_lw',
    name: '罗湖万象店',
    address: '罗湖区宝安南路万象城二期',
    phone: '135****3303',
    distance: '3.4km',
    sequenceNo: 0,
    typeInventory: typeInventoryForTemplateStore('罗湖万象店'),
  },
];

function getStores() {
  let list = wx.getStorageSync(KEY);
  // 未初始化、非数组、或空数组：均回填演示默认门店（清空测试数据后也会恢复，避免巡店页无门店）
  if (!Array.isArray(list)) {
    list = DEFAULT_STORES.map((x) => ({ ...x }));
    wx.setStorageSync(KEY, list);
  } else if (list.length === 0) {
    list = DEFAULT_STORES.map((x) => ({ ...x }));
    wx.setStorageSync(KEY, list);
  } else {
    const ids = new Set((list || []).map((r) => r && r.id));
    const missing = DEFAULT_STORES.filter((d) => d && d.id && !ids.has(d.id)).map((x) => ({ ...x }));
    if (missing.length) {
      list = list.concat(missing);
      wx.setStorageSync(KEY, list);
    }
  }

  // 兼容旧数据：为历史门店补齐 typeInventory 字段
  const fixed = list.map((row) => {
    const hasInventory = row && row.typeInventory && typeof row.typeInventory === 'object';
    if (hasInventory) return row;
    const inv = TEMPLATE_STORE_NAMES.includes(row.name) ? typeInventoryForTemplateStore(row.name) : pickRandomTemplateInventory();
    return { ...row, typeInventory: inv, distance: row.distance || '—' };
  });

  // 如果有变化，回写一次（避免每次都重复计算）
  // 简单判断：只要长度相同就直接 set，成本极低
  wx.setStorageSync(KEY, fixed);
  return fixed;
}

function saveStores(list) {
  wx.setStorageSync(KEY, list);
}

function addStore({ name, address, phone }) {
  const list = getStores();
  const nextSequenceNo = list.reduce((max, row) => {
    const n = Number(row && row.sequenceNo);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0) + 1;
  const id = `ins_s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const distanceOptions = ['0.8km', '1.2km', '1.6km', '2.3km', '3.1km', '4.7km', '7.9km'];
  const distance = distanceOptions[Math.floor(Math.random() * distanceOptions.length)] || '—';

  // 生成该门店“实际可用广告位数量”上限（演示：从模板门店分布随机）
  const typeInventory = pickRandomTemplateInventory();

  const row = { id, name, address, phone, distance, typeInventory, sequenceNo: nextSequenceNo };
  list.unshift(row);
  saveStores(list);
  return row;
}

module.exports = { KEY, getStores, addStore };

