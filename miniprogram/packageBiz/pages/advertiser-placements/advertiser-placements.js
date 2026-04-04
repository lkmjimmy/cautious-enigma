const demoSlots = require('../../../utils/demoSlots.js');
const storeManagers = require('../../../utils/storeManagers.js');
const promoteRequestInbox = require('../../../utils/promoteRequestInbox.js');
const advertiserExpandEstimate = require('../../../utils/advertiserExpandEstimate.js');
const clientSlotQuotes = require('../../../utils/clientSlotQuotes.js');

const STORAGE_AD_CLIENT = 'currentAdvertiserClientId';

function enrichVacantQuotes(clientId, rows) {
  return (rows || []).map(function (r) {
    return Object.assign({}, r, {
      quoteMonthly: clientSlotQuotes.getMonthlyPriceYuan(clientId, r.type),
    });
  });
}

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

function getAdvertiserClientId() {
  const demoClients = require('../../../utils/demoClients.js');
  return (
    wx.getStorageSync(STORAGE_AD_CLIENT) ||
    (demoClients.getList()[0] && demoClients.getList()[0].id) ||
    ''
  );
}

Page({
  data: {
    rows: [],
    pendingEntry: '',
    showPromoteModal: false,
    showExpandModal: false,
    vacantSlotRows: [],
    selectedVacantCodes: [],
    estimateTotalYuan: 0,
    estimateTotalMonths: 0,
    estimateLines: [],
    estimateMissingQuote: false,
    estimatePeriodLabel: '',
    stores: storeManagers.ALL,
    storeIndex: 0,
    typeOptions: [],
    periodUnitIndex: 0,
    periodUnitLabels: ['按月', '按季度', '按年'],
    durationIndex: 0,
    durations: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    showPickerSheet: false,
    pickerSheetKind: '',
    pickerSheetTitle: '',
    pickerSheetOptions: [],
    pickerSheetRangeKey: '',
    pickerSheetSelectedIndex: 0,
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
      const cid = getAdvertiserClientId();
      const vacantSlotRows = enrichVacantQuotes(cid, advertiserExpandEstimate.buildVacantSlotRows());
      this.setData({
        showExpandModal: true,
        vacantSlotRows,
        selectedVacantCodes: [],
      });
      this.refreshExpandEstimate();
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

  openExpandFromPage() {
    const cid = getAdvertiserClientId();
    const vacantSlotRows = enrichVacantQuotes(cid, advertiserExpandEstimate.buildVacantSlotRows());
    this.setData({
      showExpandModal: true,
      vacantSlotRows,
      selectedVacantCodes: [],
    });
    this.refreshExpandEstimate();
  },

  stopPromoteBubble() {},

  stopExpandBubble() {},

  refreshExpandEstimate() {
    const clientId = getAdvertiserClientId();
    const {
      totalYuan,
      lines,
      totalMonths,
      missingQuote,
    } = advertiserExpandEstimate.computeEstimate(
      clientId,
      this.data.selectedVacantCodes,
      this.data.vacantSlotRows,
      this.data.periodUnitIndex,
      this.data.durations[this.data.durationIndex]
    );
    const estimatePeriodLabel = advertiserExpandEstimate.periodLabel(
      this.data.periodUnitIndex,
      this.data.durations[this.data.durationIndex]
    );
    this.setData({
      estimateTotalYuan: totalYuan,
      estimateLines: lines,
      estimateTotalMonths: totalMonths,
      estimateMissingQuote: missingQuote,
      estimatePeriodLabel,
    });
  },

  toggleVacantSlot(e) {
    const code = e.currentTarget.dataset.code;
    if (!code) return;
    const row = (this.data.vacantSlotRows || []).find((r) => r.code === code);
    if (!row || !row.isVacant) return;
    const selectedVacantCodes = this.data.selectedVacantCodes.slice();
    const i = selectedVacantCodes.indexOf(code);
    if (i >= 0) selectedVacantCodes.splice(i, 1);
    else selectedVacantCodes.push(code);
    this.setData({ selectedVacantCodes });
    this.refreshExpandEstimate();
  },

  openPickerSheet(e) {
    const kind = e.currentTarget.dataset.kind;
    if (!kind) return;
    const titles = { store: '选择门店', period: '时间单位', duration: '时长' };
    let options = [];
    let selectedIndex = 0;
    if (kind === 'store') {
      options = this.data.stores;
      selectedIndex = this.data.storeIndex;
    } else if (kind === 'period') {
      options = this.data.periodUnitLabels;
      selectedIndex = this.data.periodUnitIndex;
    } else if (kind === 'duration') {
      options = this.data.durations;
      selectedIndex = this.data.durationIndex;
    }
    this.setData({
      showPickerSheet: true,
      pickerSheetKind: kind,
      pickerSheetTitle: titles[kind],
      pickerSheetOptions: options,
      pickerSheetRangeKey: '',
      pickerSheetSelectedIndex: selectedIndex,
    });
  },

  onPickerSheetSelect(e) {
    const idx = e.detail.index;
    const k = this.data.pickerSheetKind;
    const patch = { showPickerSheet: false };
    if (k === 'store') patch.storeIndex = idx;
    else if (k === 'period') patch.periodUnitIndex = idx;
    else if (k === 'duration') patch.durationIndex = idx;
    const self = this;
    this.setData(patch, function () {
      if (self.data.showExpandModal && (k === 'period' || k === 'duration')) {
        self.refreshExpandEstimate();
      }
    });
  },

  onPickerSheetClose() {
    this.setData({ showPickerSheet: false });
  },

  toggleType(e) {
    const type = e.currentTarget.dataset.type;
    if (!type) return;
    const typeOptions = this.data.typeOptions.map((item) =>
      item.type === type ? { ...item, checked: !item.checked } : item
    );
    this.setData({ typeOptions });
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
      title: '已通知中台安排商务',
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
    const expandSelections = (this.data.vacantSlotRows || [])
      .filter((r) => r.isVacant && codeSet.has(r.code))
      .map((r) => ({ code: r.code, store: r.store, type: r.type }));

    promoteRequestInbox.push({
      planMode: 'expand',
      expandSelections,
      periodUnitLabel,
      durationRaw: n,
      spanText,
      estimateTotalYuan: this.data.estimateTotalYuan,
      estimateTotalMonths: this.data.estimateTotalMonths,
      estimateLines: this.data.estimateLines,
      estimateMissingQuote: this.data.estimateMissingQuote,
    });

    wx.showToast({
      title: '已通知中台安排商务',
      icon: 'success',
      duration: 2200,
    });
    this.setData({ showExpandModal: false });
  },
});
