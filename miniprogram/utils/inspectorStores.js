/**
 * 巡店员新增门店：演示数据（本地存储）
 * 正式环境：由后端创建门店、下发巡检任务
 */
const KEY = 'inspectorStoresV1';

const demoSlots = require('./demoSlots.js');

const TEMPLATE_STORE_NAMES = ['福田中心店', '南山科技园店', '宝安壹方城店'];

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
    typeInventory: typeInventoryForTemplateStore('福田中心店'),
  },
  {
    id: 'ins_s_ns',
    name: '南山科技园店',
    address: '南山科技园店示例地址',
    phone: '159****8832',
    distance: '2.8km',
    typeInventory: typeInventoryForTemplateStore('南山科技园店'),
  },
  {
    id: 'ins_s_ba',
    name: '宝安壹方城店',
    address: '宝安壹方城店示例地址',
    phone: '186****5091',
    distance: '7.1km',
    typeInventory: typeInventoryForTemplateStore('宝安壹方城店'),
  },
];

function getStores() {
  let list = wx.getStorageSync(KEY);
  // 仅在“未初始化/结构异常”时回填默认门店；允许空数组（用于清空测试数据）
  if (!Array.isArray(list)) {
    list = DEFAULT_STORES.map((x) => ({ ...x }));
    wx.setStorageSync(KEY, list);
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
  const id = `ins_s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const distanceOptions = ['0.8km', '1.2km', '1.6km', '2.3km', '3.1km', '4.7km', '7.9km'];
  const distance = distanceOptions[Math.floor(Math.random() * distanceOptions.length)] || '—';

  // 生成该门店“实际可用广告位数量”上限（演示：从模板门店分布随机）
  const typeInventory = pickRandomTemplateInventory();

  const row = { id, name, address, phone, distance, typeInventory };
  list.unshift(row);
  saveStores(list);
  return row;
}

module.exports = { KEY, getStores, addStore };

