const inspectorStores = require('../../../utils/inspectorStores.js');
const phoneValidate = require('../../../utils/phoneValidate.js');

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
    this.setData({ phone: phoneValidate.sanitizePhoneInput(e.detail.value) });
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
    if (!phoneValidate.isValidMainlandMobile(phone)) {
      wx.showToast({ title: phoneValidate.invalidToastTitle(), icon: 'none' });
      return;
    }

    const storeRow = inspectorStores.addStore({ name: storeName, address, phone });

    wx.showToast({ title: '门店已新增，进入广告位初始化', icon: 'success' });
    setTimeout(() => {
      wx.navigateTo({
        url: `/packageBiz/pages/inspector-store-init/inspector-store-init?storeId=${encodeURIComponent(storeRow.id)}`,
      });
    }, 250);
  },
});

