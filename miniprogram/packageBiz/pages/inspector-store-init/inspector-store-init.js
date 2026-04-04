const inspectorStores = require('../../../utils/inspectorStores.js');
const inspectorStoreRecords = require('../../../utils/inspectorStoreRecords.js');
const demoSlots = require('../../../utils/demoSlots.js');
const photoCaptureMeta = require('../../../utils/photoCaptureMeta.js');

function countDraftTotal(draftByType) {
  const map = draftByType || {};
  return Object.keys(map).reduce(function (sum, key) {
    return sum + ((map[key] || []).length);
  }, 0);
}

function buildTypeSections(types, draftByType, noneByType) {
  return (types || []).map(function (type) {
    return {
      type: type,
      shots: draftByType[type] ? draftByType[type].slice() : [],
      isNone: !!(noneByType && noneByType[type]),
    };
  });
}

Page({
  data: {
    storeId: '',
    storeName: '',
    address: '',
    phone: '',
    types: [],
    draftByType: {},
    noneByType: {},
    typeSections: [],
    totalCount: 0,
    /** 从门店打卡页进入，确认后回到打卡 */
    returnToCheckin: false,
  },

  onLoad: function (options) {
    const storeId = options.storeId ? String(options.storeId) : '';
    const returnToCheckin = options && options.returnTo === 'checkin';
    const stores = inspectorStores.getStores();
    const store = stores.find(function (s) {
      return s.id === storeId;
    }) || null;
    const types = demoSlots.ALL_SLOT_TYPES || [];

    this.setData({
      storeId: storeId,
      storeName: store ? store.name : '',
      address: store ? store.address : '',
      phone: store ? store.phone : '',
      types: types,
      typeSections: buildTypeSections(types, {}, {}),
      returnToCheckin: returnToCheckin,
    });
  },

  refreshDerived: function () {
    const types = this.data.types;
    const draftByType = this.data.draftByType;
    const noneByType = this.data.noneByType;
    this.setData({
      typeSections: buildTypeSections(types, draftByType, noneByType),
      totalCount: countDraftTotal(draftByType),
    });
  },

  previewShot: function (e) {
    const type = e.currentTarget.dataset.type;
    const index = Number(e.currentTarget.dataset.index);
    if (!type || Number.isNaN(index)) return;
    const list = this.data.draftByType[type] || [];
    if (!list.length) return;
    const urls = list
      .map(function (s) {
        return s.photo;
      })
      .filter(Boolean);
    const cur = list[index] && list[index].photo;
    if (!cur || !urls.length) return;
    wx.previewImage({ current: cur, urls: urls });
  },

  onDeleteShot: function (e) {
    const type = e.currentTarget.dataset.type;
    const index = Number(e.currentTarget.dataset.index);
    if (!type || Number.isNaN(index)) return;
    const self = this;
    wx.showModal({
      title: '删除此照片？',
      content: '删除后可点击拍照框重新拍摄',
      confirmText: '删除',
      confirmColor: '#dc2626',
      success: function (res) {
        if (!res.confirm) return;
        const nextDraft = Object.assign({}, self.data.draftByType);
        const list = (nextDraft[type] || []).slice();
        if (index < 0 || index >= list.length) return;
        const removed = list.splice(index, 1)[0];
        nextDraft[type] = list;
        self.setData({ draftByType: nextDraft });
        self.refreshDerived();
        if (removed && removed.photo) {
          wx.getFileSystemManager().unlink({ filePath: removed.photo, fail: function () {} });
        }
      },
    });
  },

  choosePhotoForType: function (e) {
    const type = e.currentTarget.dataset.type;
    if (!type) return;
    if (this.data.noneByType[type]) {
      wx.showToast({ title: '该类型已标记为无', icon: 'none' });
      return;
    }

    const self = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: function (res) {
        const file = res.tempFiles && res.tempFiles[0];
        const path = file ? file.tempFilePath : '';
        if (!path) return;
        const prefix = '门店：' + (self.data.storeName || '');
        photoCaptureMeta.getCaptureMeta({ addressPrefix: prefix }, function (meta) {
          wx.getFileSystemManager().saveFile({
            tempFilePath: path,
            success: function (r) {
              const saved = r.savedFilePath;
              const nextDraft = Object.assign({}, self.data.draftByType);
              const list = (nextDraft[type] || []).slice();
              const item = {
                photo: saved,
                watermarkTime: meta.timeStr,
                watermarkAddress: meta.address,
                recordedAt: meta.recordedAt,
              };
              list.push(item);
              nextDraft[type] = list;
              const nextNone = Object.assign({}, self.data.noneByType);
              nextNone[type] = false;
              self.setData({ draftByType: nextDraft, noneByType: nextNone });
              self.refreshDerived();
              wx.showToast({ title: '已添加', icon: 'success' });
            },
            fail: function () {
              wx.showToast({ title: '保存照片失败', icon: 'none' });
            },
          });
        });
      },
      fail: function () {
        wx.showToast({ title: '未拍照', icon: 'none' });
      },
    });
  },

  onSetNoneForType: function (e) {
    const type = e.currentTarget.dataset.type;
    if (!type) return;
    const count = (this.data.draftByType[type] || []).length;
    if (count > 0) {
      wx.showToast({ title: '该类型已有照片，不能设为无', icon: 'none' });
      return;
    }
    const nextNone = Object.assign({}, this.data.noneByType);
    nextNone[type] = true;
    this.setData({ noneByType: nextNone });
    this.refreshDerived();
    wx.showToast({ title: '「' + type + '」已标记为无', icon: 'success' });
  },

  onCancel: function () {
    wx.navigateBack({ delta: 1 });
  },

  onConfirm: function () {
    if (!this.data.storeId) return;
    const types = this.data.types;
    const draftByType = this.data.draftByType;
    const noneByType = this.data.noneByType;
    const storeId = this.data.storeId;

    const hasMissingType = types.some(function (type) {
      const hasPhoto = (draftByType[type] || []).length > 0;
      const isNone = !!(noneByType && noneByType[type]);
      return !hasPhoto && !isNone;
    });
    if (hasMissingType) {
      wx.showToast({ title: '请为每个类型拍照或标记为无', icon: 'none' });
      return;
    }

    inspectorStoreRecords.updateSlots(storeId, []);
    types.forEach(function (type) {
      const list = draftByType[type] || [];
      list.forEach(function (item) {
        inspectorStoreRecords.addGeneratedSlot(storeId, type, '正常', item.photo, {
          watermarkTime: item.watermarkTime,
          watermarkAddress: item.watermarkAddress,
          recordedAt: item.recordedAt,
        });
      });
    });

    wx.showToast({ title: '已确认生成广告位', icon: 'success' });
    const sid = storeId;
    if (this.data.returnToCheckin) {
      setTimeout(function () {
        wx.redirectTo({
          url: '/packageBiz/pages/inspector-store-checkin/inspector-store-checkin?storeId=' + encodeURIComponent(sid),
        });
      }, 400);
    } else {
      wx.redirectTo({ url: '/packageBiz/pages/inspector/inspector' });
    }
  },
});
