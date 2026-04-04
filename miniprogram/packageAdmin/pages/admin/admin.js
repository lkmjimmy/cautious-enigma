const storeManagers = require('../../../utils/storeManagers.js');
const demoSlots = require('../../../utils/demoSlots.js');
const inspectorStores = require('../../../utils/inspectorStores.js');
const slotOwnership = require('../../../utils/slotOwnership.js');
const demoClients = require('../../../utils/demoClients.js');
const claim = require('../../../utils/claim.js');
const promoteRequestInbox = require('../../../utils/promoteRequestInbox.js');

function clientLabelForSlotCode(code) {
  const ownerId = slotOwnership.getOwner(code);
  if (!ownerId) return '未分配客户';
  const c = demoClients.getById(ownerId);
  if (!c) return '未知客户';
  return c.company ? `${c.name} · ${c.company}` : c.name;
}

function summarizeSlotByType(slots, allTypes) {
  const types = allTypes && allTypes.length ? allTypes : [];
  const map = {};
  types.forEach((t) => {
    map[t] = { type: t, total: 0, filled: 0, vacant: 0, pending: 0, expiring: 0 };
  });
  slots.forEach((s) => {
    const row = map[s.type];
    if (!row) return;
    row.total += 1;
    if (s.status === '已投放') row.filled += 1;
    else if (s.status === '空置') row.vacant += 1;
    else if (s.status === '待定') row.pending += 1;
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
      { label: '总广告位', value: 0, tone: 'default', filter: '全部' },
      { label: '已投放', value: 0, tone: 'success', filter: '已投放' },
      { label: '空置', value: 0, tone: 'danger', filter: '空置' },
      { label: '待定', value: 0, tone: 'default', filter: '待定' },
      { label: '即将到期', value: 0, tone: 'warning', filter: '即将到期' },
    ],
    typeStats: demoSlots.ALL_SLOT_TYPES.map((t) => ({
      type: t,
      filled: 0,
      vacant: 0,
      pending: 0,
      expiring: 0,
    })),
    urgentSlots: [],
    todoHasPending: false,
  },

  refreshTodoBadge() {
    const claimN = (claim.getPendingForAdmin() || []).length;
    const promoteN = (promoteRequestInbox.list() || []).length;
    this.setData({ todoHasPending: claimN + promoteN > 0 });
  },

  onShow() {
    this.refreshStorePanel(this.data.storePickerIndex);
    this.refreshTodoBadge();
  },

  goAdminPublish() {
    wx.navigateTo({ url: '/packageAdmin/pages/admin-publish/admin-publish' });
  },

  goAdminTodo() {
    wx.navigateTo({ url: '/packageAdmin/pages/admin-todo/admin-todo' });
  },

  goAdminMine() {
    wx.navigateTo({ url: '/packageAdmin/pages/admin-mine/admin-mine' });
  },

  getSlotsForStoreRow(storeRow) {
    if (!storeRow) return [];
    return slotOwnership.getAllSlots().filter((s) => s.store === storeRow.name);
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

  rebuildDashboardStats() {
    const allSlots = slotOwnership.getAllSlots();

    const total = allSlots.length;
    const filled = allSlots.filter((s) => s.status === '已投放').length;
    const vacant = allSlots.filter((s) => s.status === '空置').length;
    const pending = allSlots.filter((s) => s.status === '待定').length;
    const expiring = allSlots.filter((s) => s.status === '即将到期').length;

    const typeMap = {};
    demoSlots.ALL_SLOT_TYPES.forEach((t) => {
      typeMap[t] = { type: t, filled: 0, vacant: 0, pending: 0, expiring: 0 };
    });
    allSlots.forEach((s) => {
      if (!typeMap[s.type]) typeMap[s.type] = { type: s.type, filled: 0, vacant: 0, pending: 0, expiring: 0 };
      if (s.status === '已投放') typeMap[s.type].filled += 1;
      else if (s.status === '空置') typeMap[s.type].vacant += 1;
      else if (s.status === '待定') typeMap[s.type].pending += 1;
      else if (s.status === '即将到期') typeMap[s.type].expiring += 1;
    });

    const expiringSoon = allSlots
      .filter((s) => s.status === '即将到期')
      .sort((a, b) => String(a.expireAt || '').localeCompare(String(b.expireAt || ''), 'zh-CN'));
    const vacantUrgent = allSlots.filter((s) => s.status === '空置');
    const urgentSlots = [...expiringSoon, ...vacantUrgent].slice(0, 5).map((s) => ({
      code: s.code,
      store: s.store,
      type: s.type,
      status: s.status,
      expireAt: s.expireAt || '--',
      priority: s.status === '即将到期' ? 'high' : 'mid',
      priorityText: s.status === '即将到期' ? '高优' : '中优',
      clientLabel: clientLabelForSlotCode(s.code),
    }));

    this.setData({
      stats: [
        { label: '总广告位', value: total, tone: 'default', filter: '全部' },
        { label: '已投放', value: filled, tone: 'success', filter: '已投放' },
        { label: '空置', value: vacant, tone: 'danger', filter: '空置' },
        { label: '待定', value: pending, tone: 'default', filter: '待定' },
        { label: '即将到期', value: expiring, tone: 'warning', filter: '即将到期' },
      ],
      typeStats: demoSlots.ALL_SLOT_TYPES.map((t) => typeMap[t] || { type: t, filled: 0, vacant: 0, pending: 0, expiring: 0 }),
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
          { label: '待定', value: 0, tone: 'default' },
          { label: '即将到期', value: 0, tone: 'warning' },
        ],
        hasOwner: false,
        ownerName: '',
        ownerPhone: '',
      });
      this.rebuildDashboardStats();
      return;
    }

    const i = Math.min(Math.max(0, pickerIndex), rows.length - 1);
    const row = rows[i];
    const name = row.name;
    const slots = this.getSlotsForStoreRow(row);
    const filled = slots.filter((s) => s.status === '已投放').length;
    const vacant = slots.filter((s) => s.status === '空置').length;
    const pending = slots.filter((s) => s.status === '待定').length;
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
        { label: '待定', value: pending, tone: 'default' },
        { label: '即将到期', value: expiring, tone: 'warning' },
      ],
      hasOwner: !!owner,
      ownerName: owner ? owner.name : '',
      ownerPhone: owner ? owner.phone : '',
    });
    this.rebuildDashboardStats();
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
      url: `/packageAdmin/pages/admin-store-detail/admin-store-detail?store=${encodeURIComponent(store)}`,
    });
  },

  goFilteredSlots(e) {
    const filter = e.currentTarget.dataset.filter || '全部';
    wx.navigateTo({
      url: `/packageAdmin/pages/slots/slots?status=${encodeURIComponent(filter)}`,
    });
  },
});
