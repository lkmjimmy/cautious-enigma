const inspectorStores = require('../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../utils/inspectorStoreRecords.js');
const demoSlots = require('../../utils/demoSlots.js');
const photoCaptureMeta = require('../../utils/photoCaptureMeta.js');

const STATUS_DEFAULT = '正常';

function countGenerated(slots) {
  return (slots || []).filter((s) => !!s.photo).length;
}

function countDraftTotal(draftByType) {
  const map = draftByType || {};
  let n = 0;
  Object.keys(map).forEach((k) => {
    n += (map[k] || []).length;
  });
  return n;
}

Page({
  data: {
    checkedInStoreId: '',
    checkedInStoreName: '',
    generatedCount: 0,
    isStoreCompleted: false,
    isGeneratedFromDraft: false,

    types: demoSlots.ALL_SLOT_TYPES || [],
    typeIndex: 0,

    // 门店 picker
    storePickerNames: [],
    storePickerStoreIds: [],
    storePickerIndex: 0,
    showStoreSheet: false,
    storeSheetSelectedIndex: 0,

    draftPhoto: '',
    draftByType: {}, // { [type]: Array<{photo, status}> }
    draftTotalCount: 0,
    currentDraftCount: 0,
    currentStatus: '正常',

    // 当前类型是否选择了“无”（不自动跳过，需点“完成该类型”）
    isNoneForType: false,

    draftWatermarkTime: '',
    draftWatermarkAddress: '',
    draftRecordedAt: 0,

    storeListRows: [],
  },

  onLoad(options) {
    const storeId = options && options.storeId;
    if (storeId) {
      this.checkInById(storeId);
    } else {
      this.refreshStorePicker();
    }
  },

  onShow() {
    this.refreshStorePicker();
  },

  onStoreCheckin(e) {
    const storeId = e.currentTarget.dataset.storeId;
    if (!storeId) return;
    wx.navigateTo({
      url: `/pages/inspector-store-checkin/inspector-store-checkin?storeId=${encodeURIComponent(storeId)}`,
    });
  },

  goAddStore() {
    wx.navigateTo({ url: '/pages/inspector-add-store/inspector-add-store' });
  },

  clearInspectorTestData() {
    wx.showModal({
      title: '清空确认',
      content: '将清空巡店门店与巡检记录，仅用于测试。是否继续？',
      success: (res) => {
        if (!res.confirm) return;
        try {
          wx.setStorageSync(inspectorStores.KEY, []);
          wx.removeStorageSync(inspectorStoreRecords.KEY);
          this.setData({
            checkedInStoreId: '',
            checkedInStoreName: '',
            generatedCount: 0,
            isStoreCompleted: false,
            isGeneratedFromDraft: false,
            typeIndex: 0,
            draftPhoto: '',
            draftByType: {},
            draftTotalCount: 0,
            currentDraftCount: 0,
            currentStatus: STATUS_DEFAULT,
            isNoneForType: false,
            draftWatermarkTime: '',
            draftWatermarkAddress: '',
            draftRecordedAt: 0,
          });
          this.refreshStorePicker();
          wx.showToast({ title: '测试数据已清空', icon: 'success' });
        } catch (e) {
          wx.showToast({ title: '清空失败', icon: 'none' });
        }
      },
    });
  },

  refreshStorePicker() {
    const stores = inspectorStores.getStores();
    const storePickerNames = stores.map((s) => s.name);
    const storePickerStoreIds = stores.map((s) => s.id);

    let storePickerIndex = 0;
    if (this.data.checkedInStoreId) {
      const idx = storePickerStoreIds.indexOf(this.data.checkedInStoreId);
      storePickerIndex = idx >= 0 ? idx : 0;
    }

    const storeListRows = stores
      .map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address || '—',
        checkinDoneThisMonth: inspectorStoreRecords.isGridCheckinDoneThisMonth(s.id),
      }))
      .sort((a, b) => {
        if (a.checkinDoneThisMonth !== b.checkinDoneThisMonth) {
          return a.checkinDoneThisMonth ? 1 : -1;
        }
        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
      });

    this.setData({
      storePickerNames,
      storePickerStoreIds,
      storePickerIndex,
      storeListRows,
    });
  },

  checkInById(storeId) {
    const stores = inspectorStores.getStores();
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    const record = inspectorStoreRecords.ensureRecordForStore(store);
    const generatedCount = countGenerated(record && record.slots);

    this.setData({
      checkedInStoreId: storeId,
      checkedInStoreName: store.name,
      generatedCount,
      isStoreCompleted: !!(record && record.completed),
      isGeneratedFromDraft: false,
      typeIndex: 0,
      draftPhoto: '',
      draftByType: {},
      draftTotalCount: 0,
      currentDraftCount: 0,
      currentStatus: STATUS_DEFAULT,
      isNoneForType: false,
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
    });
  },

  onCheckIn(e) {
    const storeId = e.currentTarget.dataset.storeId;
    if (!storeId) return;

    const stores = inspectorStores.getStores();
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    const record = inspectorStoreRecords.ensureRecordForStore(store);
    const generatedCount = countGenerated(record && record.slots);

    this.setData({
      checkedInStoreId: storeId,
      checkedInStoreName: store.name,
      generatedCount,
      isStoreCompleted: !!(record && record.completed),
      isGeneratedFromDraft: false,
      typeIndex: 0,
      draftPhoto: '',
      draftByType: {},
      draftTotalCount: 0,
      currentDraftCount: 0,
      currentStatus: STATUS_DEFAULT,
      isNoneForType: false,
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
    });
  },

  onStatusChange(e) {
    const st = e.currentTarget.dataset.status;
    if (!st) return;
    this.setData({ currentStatus: st });
  },

  openStorePickerSheet() {
    const names = this.data.storePickerNames || [];
    if (!names.length) {
      wx.showToast({ title: '请先在新增门店中添加', icon: 'none' });
      return;
    }
    this.setData({ showStoreSheet: true, storeSheetSelectedIndex: this.data.storePickerIndex });
  },

  onStoreSheetSelect(e) {
    const idx = e.detail.index;
    if (Number.isNaN(idx)) return;
    const storeId = (this.data.storePickerStoreIds || [])[idx];
    if (!storeId) {
      this.setData({ showStoreSheet: false });
      return;
    }
    this.setData({ showStoreSheet: false });
    this.checkInById(storeId);
  },

  onStoreSheetClose() {
    this.setData({ showStoreSheet: false });
  },

  choosePhoto() {
    if (!this.data.checkedInStoreId) return;
    if (this.data.isStoreCompleted) {
      wx.showToast({ title: '该门店已提交', icon: 'none' });
      return;
    }
    if (this.data.isGeneratedFromDraft) {
      wx.showToast({ title: '已生成广告位，请关闭后进入下一步', icon: 'none' });
      return;
    }
    if (this.data.typeIndex >= (this.data.types || []).length) {
      wx.showToast({ title: '请先完成拍摄并生成广告位', icon: 'none' });
      return;
    }
    if (this.data.draftPhoto) {
      wx.showToast({ title: '请先确认或重拍当前照片', icon: 'none' });
      return;
    }

    // 如果之前点过“无”，开始拍照则取消“无”的选择
    if (this.data.isNoneForType) this.setData({ isNoneForType: false });

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        const path = file ? file.tempFilePath : '';
        if (!path) return;
        const prefix = `门店：${this.data.checkedInStoreName || ''}`;
        photoCaptureMeta.getCaptureMeta({ addressPrefix: prefix }, (meta) => {
          this.setData({
            draftPhoto: path,
            draftWatermarkTime: meta.timeStr,
            draftWatermarkAddress: meta.address,
            draftRecordedAt: meta.recordedAt,
          });
        });
      },
      fail: () => {
        wx.showToast({ title: '未选择照片', icon: 'none' });
      },
    });
  },

  onRetake() {
    this.setData({
      draftPhoto: '',
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
    });
  },

  onConfirmPhoto() {
    if (!this.data.checkedInStoreId) return;
    if (this.data.isStoreCompleted) return;
    if (this.data.isGeneratedFromDraft) return;
    if (this.data.typeIndex >= (this.data.types || []).length) return;
    if (!this.data.draftPhoto) return wx.showToast({ title: '请先拍照', icon: 'none' });

    // 确认阶段：仅缓存照片，不立即写入广告位记录
    const types = this.data.types || [];
    const type = types[this.data.typeIndex] || types[0] || '灯箱';

    const draftByType = { ...(this.data.draftByType || {}) };
    const list = (draftByType[type] || []).slice();
    list.push({
      photo: this.data.draftPhoto,
      status: this.data.currentStatus || STATUS_DEFAULT,
      watermarkTime: this.data.draftWatermarkTime,
      watermarkAddress: this.data.draftWatermarkAddress,
      recordedAt: this.data.draftRecordedAt,
    });
    draftByType[type] = list;

    const draftTotalCount = countDraftTotal(draftByType);
    const currentDraftCount = list.length;

    this.setData({
      draftByType,
      draftPhoto: '',
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
      draftTotalCount,
      currentDraftCount,
      isNoneForType: false,
    });

    wx.showToast({ title: '确认成功，继续拍摄', icon: 'success' });
  },

  onFinishType() {
    if (this.data.isStoreCompleted) return;
    if (this.data.isGeneratedFromDraft) return;
    if (this.data.typeIndex >= (this.data.types || []).length) return;
    if (this.data.draftPhoto) return wx.showToast({ title: '请先确认或重拍当前照片', icon: 'none' });
    if (this.data.currentDraftCount === 0 && !this.data.isNoneForType) {
      return wx.showToast({ title: '该类型请先确认至少1张，或点击“无”后再点“完成该类型”', icon: 'none' });
    }

    const next = this.data.typeIndex + 1;
    const nextType = (this.data.types || [])[next];
    const draftByType = this.data.draftByType || {};
    const nextList = nextType ? (draftByType[nextType] || []) : [];

    this.setData({
      typeIndex: next,
      currentDraftCount: nextList.length,
      draftPhoto: '',
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
      currentStatus: STATUS_DEFAULT,
      isNoneForType: false,
    });
  },

  // 跳过当前类型（该门店可能没有该类型广告位）
  onSkipType() {
    if (this.data.isStoreCompleted) return;
    if (this.data.isGeneratedFromDraft) return;
    if (this.data.typeIndex >= (this.data.types || []).length) return;
    if (this.data.draftPhoto) return wx.showToast({ title: '请先确认或重拍当前照片', icon: 'none' });
    if (this.data.currentDraftCount > 0) {
      return wx.showToast({ title: '已有该类型确认照片，请点击“完成该类型”', icon: 'none' });
    }

    // “无”不自动跳到下一个类型；只标记当前类型为“无”
    this.setData({ isNoneForType: true });

    wx.showToast({ title: '已选择“无”，请点击“完成该类型”进入下一步', icon: 'success' });
  },

  onGenerateAds() {
    if (!this.data.checkedInStoreId) return;
    if (this.data.isStoreCompleted) return;
    if (this.data.isGeneratedFromDraft) return;
    if (this.data.draftTotalCount <= 0) {
      wx.showToast({ title: '暂无已确认的广告位', icon: 'none' });
      return;
    }

    const storeId = this.data.checkedInStoreId;
    const types = this.data.types || [];
    const draftByType = this.data.draftByType || {};

    types.forEach((type) => {
      const list = draftByType[type] || [];
      list.forEach((item) => {
        inspectorStoreRecords.addGeneratedSlot(storeId, type, item.status || STATUS_DEFAULT, item.photo, {
          watermarkTime: item.watermarkTime,
          watermarkAddress: item.watermarkAddress,
          recordedAt: item.recordedAt,
        });
      });
    });

    const record = inspectorStoreRecords.ensureRecordForStore({ id: storeId });
    const generatedCount = countGenerated(record && record.slots);

    // 生成完成后直接视为巡检结束（无需再“提交巡检”）
    inspectorStoreRecords.markCompleted(storeId);

    wx.showToast({ title: '生成广告位并完成巡检', icon: 'success' });

    // 清空本次表单，回到门店 picker
    this.setData({
      checkedInStoreId: '',
      checkedInStoreName: '',
      generatedCount: 0,
      isStoreCompleted: false,
      isGeneratedFromDraft: false,
      typeIndex: 0,
      draftPhoto: '',
      draftByType: {},
      draftTotalCount: 0,
      currentDraftCount: 0,
      currentStatus: STATUS_DEFAULT,
      isNoneForType: false,
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
    });

    this.refreshStorePicker();
  },
});

