const inspectorStores = require('../../utils/inspectorStores.js');

Page({
  data: {
    storeName: '',
    address: '',
    phone: '',
  },

  onStoreNameInput(e) {
    this.setData({ storeName: e.detail.value });
  },

  onAddressInput(e) {
    this.setData({ address: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onCancel() {
    wx.navigateBack({ delta: 1 });
  },

  onSave() {
    const storeName = (this.data.storeName || '').trim();
    const address = (this.data.address || '').trim();
    const phone = (this.data.phone || '').trim();

    if (!storeName || !address || !phone) {
      wx.showToast({ title: '请完善店铺名称/地址/联系电话', icon: 'none' });
      return;
    }

    const storeRow = inspectorStores.addStore({ name: storeName, address, phone });
    // 不在这里生成广告位；巡检时逐一拍照生成广告位记录

    wx.showToast({ title: '门店已新增，进入巡检拍照', icon: 'success' });
    setTimeout(() => {
      wx.navigateTo({
        url: `/pages/inspector-check/inspector-check?storeId=${encodeURIComponent(storeRow.id)}`,
      });
    }, 250);
  },
});

