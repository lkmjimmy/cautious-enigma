const inspectorStores = require('../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../utils/inspectorStoreRecords.js');
const demoSlots = require('../../utils/demoSlots.js');
const photoCaptureMeta = require('../../utils/photoCaptureMeta.js');

function countDraftTotal(draftByType) {
  const map = draftByType || {};
  return Object.keys(map).reduce((sum, key) => sum + ((map[key] || []).length), 0);
}

Page({
  data: {
    storeId: '',
    storeName: '',
    address: '',
    phone: '',
    types: [],
    typeIndex: 0,
    currentType: '',
    currentDraftPhoto: '',
    draftWatermarkTime: '',
    draftWatermarkAddress: '',
    draftRecordedAt: 0,
    draftByType: {},
    noneByType: {},
    currentTypeCount: 0,
    totalCount: 0,
    isLastType: false,
  },

  onLoad(options) {
    const storeId = options.storeId ? String(options.storeId) : '';
    const stores = inspectorStores.getStores();
    const store = stores.find((s) => s.id === storeId) || null;
    const types = demoSlots.ALL_SLOT_TYPES || [];

    this.setData({
      storeId,
      storeName: store ? store.name : '',
      address: store ? store.address : '',
      phone: store ? store.phone : '',
      types,
      currentType: types[0] || '',
      isLastType: types.length <= 1,
    });
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        const path = file ? file.tempFilePath : '';
        if (!path) return;
        const prefix = `门店：${this.data.storeName || ''}`;
        photoCaptureMeta.getCaptureMeta({ addressPrefix: prefix }, (meta) => {
          this.setData({
            currentDraftPhoto: path,
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
      currentDraftPhoto: '',
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
    });
  },

  onSavePhoto() {
    const { currentType, currentDraftPhoto, draftByType, noneByType } = this.data;
    if (!currentType) return;
    if (!currentDraftPhoto) {
      wx.showToast({ title: '请先拍照', icon: 'none' });
      return;
    }

    const nextDraft = { ...draftByType };
    const nextNone = { ...noneByType, [currentType]: false };
    const list = (nextDraft[currentType] || []).slice();
    list.push({
      photo: currentDraftPhoto,
      watermarkTime: this.data.draftWatermarkTime,
      watermarkAddress: this.data.draftWatermarkAddress,
      recordedAt: this.data.draftRecordedAt,
    });
    nextDraft[currentType] = list;

    this.setData({
      draftByType: nextDraft,
      noneByType: nextNone,
      currentDraftPhoto: '',
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
      currentTypeCount: list.length,
      totalCount: countDraftTotal(nextDraft),
    });
    wx.showToast({ title: '已暂存', icon: 'success' });
  },

  onSetNone() {
    const { currentType, draftByType, noneByType } = this.data;
    const count = ((draftByType[currentType] || []).length);
    if (count > 0) {
      wx.showToast({ title: '当前类型已保存照片，不能设为无', icon: 'none' });
      return;
    }
    const nextNone = { ...noneByType, [currentType]: true };
    this.setData({
      noneByType: nextNone,
      currentDraftPhoto: '',
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
    });
    wx.showToast({ title: `已标记${currentType}为无`, icon: 'success' });
  },

  onNextType() {
    const { types, typeIndex, draftByType, noneByType, currentType } = this.data;
    const currentCount = ((draftByType || {})[currentType] || []).length;
    const isNone = !!(noneByType && noneByType[currentType]);
    if (currentCount <= 0 && !isNone) {
      wx.showToast({ title: `请先保存${currentType}照片，或选择“无”`, icon: 'none' });
      return;
    }

    const nextIndex = typeIndex + 1;
    if (nextIndex >= types.length) return;
    const nextType = types[nextIndex];
    const nextCount = ((draftByType || {})[nextType] || []).length;
    this.setData({
      typeIndex: nextIndex,
      currentType: nextType,
      currentTypeCount: nextCount,
      currentDraftPhoto: '',
      draftWatermarkTime: '',
      draftWatermarkAddress: '',
      draftRecordedAt: 0,
      isLastType: nextIndex === types.length - 1,
    });
  },

  onCancel() {
    wx.navigateBack({ delta: 1 });
  },

  onConfirm() {
    if (!this.data.storeId) return;
    const { types, draftByType, noneByType, storeId } = this.data;
    const hasMissingType = types.some((type) => {
      const hasPhoto = (draftByType[type] || []).length > 0;
      const isNone = !!(noneByType && noneByType[type]);
      return !hasPhoto && !isNone;
    });
    if (hasMissingType) {
      wx.showToast({ title: '请为每个类型拍照或标记为无', icon: 'none' });
      return;
    }

    inspectorStoreRecords.updateSlots(storeId, []);
    types.forEach((type) => {
      const list = draftByType[type] || [];
      list.forEach((item) => {
        inspectorStoreRecords.addGeneratedSlot(storeId, type, '正常', item.photo, {
          watermarkTime: item.watermarkTime,
          watermarkAddress: item.watermarkAddress,
          recordedAt: item.recordedAt,
        });
      });
    });

    wx.showToast({ title: '已确认生成广告位', icon: 'success' });

    wx.redirectTo({ url: '/pages/inspector/inspector' });
  },
});

