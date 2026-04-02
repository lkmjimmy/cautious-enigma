const demoSlots = require('../../utils/demoSlots.js');
const storeManagers = require('../../utils/storeManagers.js');
const promoteRequestInbox = require('../../utils/promoteRequestInbox.js');

function buildGroupedRows() {
  const active = demoSlots.RAW_SLOTS.filter(
    (s) => s.status === '已投放' || s.status === '即将到期'
  );
  const map = {};
  active.forEach((s) => {
    const k = `${s.store}\0${s.type}`;
    if (!map[k]) map[k] = { store: s.store, type: s.type, qty: 0 };
    map[k].qty += 1;
  });
  return Object.values(map)
    .sort((a, b) =>
      a.store === b.store ? a.type.localeCompare(b.type, 'zh-CN') : a.store.localeCompare(b.store, 'zh-CN')
    )
    .map((row) => ({ ...row, rowKey: `${row.store}_${row.type}` }));
}

function uniquePlacedTypes(rows) {
  return [...new Set(rows.map((r) => r.type))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function buildAllSlotRows() {
  return demoSlots.RAW_SLOTS.map((s) => ({
    ...s,
    rowKey: s.code,
    expireDisplay: s.expireAt === '--' ? '—' : s.expireAt,
    isVacant: s.status === '空置',
    statusClass: s.status === '空置' ? 'vacant' : s.status === '已投放' ? 'on' : 'soon',
  })).sort((a, b) =>
    a.store === b.store ? a.code.localeCompare(b.code) : a.store.localeCompare(b.store, 'zh-CN')
  );
}

Page({
  data: {
    rows: [],
    pendingEntry: '',
    showPromoteModal: false,
    showExpandModal: false,
    allSlotRows: [],
    selectedVacantCodes: [],
    stores: storeManagers.ALL,
    storeIndex: 0,
    typeOptions: [],
    periodUnitIndex: 0,
    periodUnitLabels: ['按月', '按季度', '按年'],
    durationIndex: 0,
    durations: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  },

  onLoad(options) {
    const e = options.entry;
    if (e === 'expand' || e === 'renew') {
      this.setData({ pendingEntry: e });
    }
  },

  onShow() {
    const rows = buildGroupedRows();
    this.setData({ rows });
    const pe = this.data.pendingEntry;
    if (!pe) return;
    this.setData({ pendingEntry: '' });
    if (pe === 'expand') {
      this.setData({
        showExpandModal: true,
        allSlotRows: buildAllSlotRows(),
        selectedVacantCodes: [],
      });
    } else if (pe === 'renew') {
      const types = uniquePlacedTypes(rows);
      if (types.length === 0) {
        wx.showToast({ title: '暂无已投放，无法续期', icon: 'none' });
        return;
      }
      const typeOptions = types.map((t) => ({ type: t, checked: true }));
      this.setData({ showPromoteModal: true, typeOptions });
    }
  },

  /** 本页底部「继续推广」= 原推广续期 */
  openRenewPromoteModal() {
    const rows = buildGroupedRows();
    const types = uniquePlacedTypes(rows);
    if (types.length === 0) {
      wx.showToast({ title: '暂无已投放，无法续期', icon: 'none' });
      return;
    }
    const typeOptions = types.map((t) => ({ type: t, checked: true }));
    this.setData({ rows, showPromoteModal: true, typeOptions });
  },

  closePromoteModal() {
    this.setData({ showPromoteModal: false });
  },

  closeExpandModal() {
    this.setData({ showExpandModal: false });
  },

  stopPromoteBubble() {},

  stopExpandBubble() {},

  toggleVacantSlot(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) return;
    const row = this.data.allSlotRows.find((r) => r.code === code);
    if (!row || !row.isVacant) return;
    const selectedVacantCodes = this.data.selectedVacantCodes.slice();
    const i = selectedVacantCodes.indexOf(code);
    if (i >= 0) selectedVacantCodes.splice(i, 1);
    else selectedVacantCodes.push(code);
    this.setData({ selectedVacantCodes });
  },

  onStoreChange(e) {
    this.setData({ storeIndex: Number(e.detail.value) });
  },

  toggleType(e) {
    const type = e.currentTarget.dataset.type;
    if (!type) return;
    const typeOptions = this.data.typeOptions.map((item) =>
      item.type === type ? { ...item, checked: !item.checked } : item
    );
    this.setData({ typeOptions });
  },

  onPeriodUnitChange(e) {
    this.setData({ periodUnitIndex: Number(e.detail.value) });
  },

  onDurationChange(e) {
    this.setData({ durationIndex: Number(e.detail.value) });
  },

  submitPromote() {
    const store = this.data.stores[this.data.storeIndex];
    const selectedTypes = this.data.typeOptions.filter((x) => x.checked).map((x) => x.type);
    if (selectedTypes.length === 0) {
      wx.showToast({ title: '请至少选择一种类型', icon: 'none' });
      return;
    }
    const unitIdx = this.data.periodUnitIndex;
    const n = this.data.durations[this.data.durationIndex];
    let spanText = '';
    if (unitIdx === 0) spanText = `${n}个月`;
    else if (unitIdx === 1) spanText = `${n}个季度`;
    else spanText = `${n}年`;

    const periodUnitLabel = this.data.periodUnitLabels[unitIdx];
    promoteRequestInbox.push({
      planMode: 'renew',
      store,
      types: selectedTypes,
      periodUnitLabel,
      durationRaw: n,
      spanText,
    });

    wx.showToast({
      title: '已通知管理者安排商务',
      icon: 'success',
      duration: 2200,
    });
    this.setData({ showPromoteModal: false });
  },

  submitExpandPromote() {
    const codes = this.data.selectedVacantCodes;
    if (!codes.length) {
      wx.showToast({ title: '请勾选意向加投的空置广告位', icon: 'none' });
      return;
    }
    const unitIdx = this.data.periodUnitIndex;
    const n = this.data.durations[this.data.durationIndex];
    let spanText = '';
    if (unitIdx === 0) spanText = `${n}个月`;
    else if (unitIdx === 1) spanText = `${n}个季度`;
    else spanText = `${n}年`;
    const periodUnitLabel = this.data.periodUnitLabels[unitIdx];

    const codeSet = new Set(codes);
    const expandSelections = this.data.allSlotRows
      .filter((r) => r.isVacant && codeSet.has(r.code))
      .map((r) => ({ code: r.code, store: r.store, type: r.type }));

    promoteRequestInbox.push({
      planMode: 'expand',
      expandSelections,
      periodUnitLabel,
      durationRaw: n,
      spanText,
    });

    wx.showToast({
      title: '已通知管理者安排商务',
      icon: 'success',
      duration: 2200,
    });
    this.setData({ showExpandModal: false });
  },
});
