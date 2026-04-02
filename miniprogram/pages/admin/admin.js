const storeManagers = require('../../utils/storeManagers.js');
const demoSlots = require('../../utils/demoSlots.js');
const inspectorStores = require('../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../utils/inspectorStoreRecords.js');

function summarizeSlotByType(slots, allTypes) {
  const types = allTypes && allTypes.length ? allTypes : [];
  const map = {};
  types.forEach((t) => {
    map[t] = { type: t, total: 0, filled: 0, vacant: 0, expiring: 0 };
  });
  slots.forEach((s) => {
    const row = map[s.type];
    if (!row) return;
    row.total += 1;
    if (s.status === '已投放') row.filled += 1;
    else if (s.status === '空置') row.vacant += 1;
    else if (s.status === '即将到期') row.expiring += 1;
  });
  return types.map((t) => map[t]);
}

Page({
  data: {
    storeNameList: [],
    storeRows: [],
    storePickerIndex: 0,
    selectedStore: '',
    slotList: [],
    slotTypeSummary: [],
    slotStats: [],
    hasOwner: false,
    ownerName: '',
    ownerPhone: '',
    showStorePickerModal: false,
    stats: [
      { label: '总广告位', value: 286, tone: 'default', filter: '全部' },
      { label: '已投放', value: 214, tone: 'success', filter: '已投放' },
      { label: '空置中', value: 72, tone: 'danger', filter: '空置' },
      { label: '7天内到期', value: 19, tone: 'warning', filter: '即将到期' },
    ],
    typeStats: [
      { type: '灯箱', filled: 62, vacant: 14, expiring: 6 },
      { type: '地贴', filled: 38, vacant: 18, expiring: 3 },
      { type: '货架', filled: 54, vacant: 11, expiring: 4 },
      { type: '出库仪', filled: 27, vacant: 9, expiring: 2 },
      { type: 'LED', filled: 18, vacant: 9, expiring: 2 },
      { type: '门头', filled: 15, vacant: 11, expiring: 2 },
    ],
    urgentSlots: [
      { code: 'SZ-FT-01-A3', store: '福田中心店', status: '空置', expireAt: '--' },
      { code: 'SZ-NS-03-B2', store: '南山科技园店', status: '即将到期', expireAt: '2026-04-07' },
      { code: 'SZ-BA-02-C1', store: '宝安壹方城店', status: '即将到期', expireAt: '2026-04-05' },
    ],
  },

  onShow() {
    this.refreshStorePanel(this.data.storePickerIndex);
  },

  goAdminPublish() {
    wx.navigateTo({ url: '/pages/admin-publish/admin-publish' });
  },

  goAdminTodo() {
    wx.navigateTo({ url: '/pages/admin-todo/admin-todo' });
  },

  goAdminMine() {
    wx.navigateTo({ url: '/pages/admin-mine/admin-mine' });
  },

  getSlotsForStoreRow(storeRow) {
    if (!storeRow) return [];

    const rec = inspectorStoreRecords.getRecord(storeRow.id);
    const generated = ((rec && rec.slots) || []).filter((s) => !!s.photo);
    if (generated.length) {
      return generated.map((s) => ({
        code: s.code,
        type: s.type,
        status: '已投放',
        expireAt: '--',
      }));
    }

    return demoSlots.slotsForStore(storeRow.name);
  },

  buildStoreRows() {
    const rows = inspectorStores.getStores().map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address || '',
      phone: s.phone || '',
    }));
    return rows;
  },

  rebuildDashboardStats(storeRows) {
    const allSlots = [];
    (storeRows || []).forEach((r) => {
      allSlots.push(...this.getSlotsForStoreRow(r));
    });

    const total = allSlots.length;
    const filled = allSlots.filter((s) => s.status === '已投放').length;
    const vacant = allSlots.filter((s) => s.status === '空置').length;
    const expiring = allSlots.filter((s) => s.status === '即将到期').length;

    const typeMap = {};
    demoSlots.ALL_SLOT_TYPES.forEach((t) => {
      typeMap[t] = { type: t, filled: 0, vacant: 0, expiring: 0 };
    });
    allSlots.forEach((s) => {
      if (!typeMap[s.type]) typeMap[s.type] = { type: s.type, filled: 0, vacant: 0, expiring: 0 };
      if (s.status === '已投放') typeMap[s.type].filled += 1;
      else if (s.status === '空置') typeMap[s.type].vacant += 1;
      else if (s.status === '即将到期') typeMap[s.type].expiring += 1;
    });

    const urgentSlots = allSlots
      .filter((s) => s.status === '空置' || s.status === '即将到期')
      .slice(0, 3)
      .map((s) => ({
        code: s.code,
        store: (storeRows.find((r) => this.getSlotsForStoreRow(r).some((x) => x.code === s.code)) || {}).name || '—',
        status: s.status,
        expireAt: s.expireAt || '--',
      }));

    this.setData({
      stats: [
        { label: '总广告位', value: total, tone: 'default', filter: '全部' },
        { label: '已投放', value: filled, tone: 'success', filter: '已投放' },
        { label: '空置中', value: vacant, tone: 'danger', filter: '空置' },
        { label: '7天内到期', value: expiring, tone: 'warning', filter: '即将到期' },
      ],
      typeStats: demoSlots.ALL_SLOT_TYPES.map((t) => typeMap[t] || { type: t, filled: 0, vacant: 0, expiring: 0 }),
      urgentSlots,
    });
  },

  refreshStorePanel(pickerIndex) {
    const rows = this.buildStoreRows();
    if (!rows.length) {
      this.setData({
        storeRows: [],
        storeNameList: [],
        storePickerIndex: 0,
        selectedStore: '',
        slotList: [],
        slotTypeSummary: summarizeSlotByType([], demoSlots.ALL_SLOT_TYPES),
        slotStats: [
          { label: '已投放', value: 0, tone: 'success' },
          { label: '空置', value: 0, tone: 'danger' },
          { label: '即将到期', value: 0, tone: 'warning' },
        ],
        hasOwner: false,
        ownerName: '',
        ownerPhone: '',
      });
      this.rebuildDashboardStats([]);
      return;
    }

    const i = Math.min(Math.max(0, pickerIndex), rows.length - 1);
    const row = rows[i];
    const name = row.name;
    const slots = this.getSlotsForStoreRow(row);
    const filled = slots.filter((s) => s.status === '已投放').length;
    const vacant = slots.filter((s) => s.status === '空置').length;
    const expiring = slots.filter((s) => s.status === '即将到期').length;
    const owner = storeManagers.getOwner(name);
    const slotTypeSummary = summarizeSlotByType(slots, demoSlots.ALL_SLOT_TYPES);
    this.setData({
      storeRows: rows,
      storeNameList: rows.map((r) => r.name),
      storePickerIndex: i,
      selectedStore: name,
      slotList: slots,
      slotTypeSummary,
      slotStats: [
        { label: '已投放', value: filled, tone: 'success' },
        { label: '空置', value: vacant, tone: 'danger' },
        { label: '即将到期', value: expiring, tone: 'warning' },
      ],
      hasOwner: !!owner,
      ownerName: owner ? owner.name : '',
      ownerPhone: owner ? owner.phone : '',
    });
    this.rebuildDashboardStats(rows);
  },

  openStorePickerModal() {
    this.setData({ showStorePickerModal: true });
  },

  closeStorePickerModal() {
    this.setData({ showStorePickerModal: false });
  },

  stopPickBubble() {},

  onSelectStoreItem(e) {
    const i = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(i)) return;
    this.refreshStorePanel(i);
    this.setData({ showStorePickerModal: false });
  },

  goStoreDetailCurrent() {
    const store = this.data.selectedStore;
    if (!store) return;
    wx.navigateTo({
      url: `/pages/admin-store-detail/admin-store-detail?store=${encodeURIComponent(store)}`,
    });
  },

  goFilteredSlots(e) {
    const filter = e.currentTarget.dataset.filter || '全部';
    wx.navigateTo({
      url: `/pages/slots/slots?status=${encodeURIComponent(filter)}`,
    });
  },
});
