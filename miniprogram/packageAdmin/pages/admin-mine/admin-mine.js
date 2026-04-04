Page({
  goPersonnel() {
    wx.navigateTo({ url: '/packageAdmin/pages/admin-personnel/admin-personnel' });
  },

  goSlotManage() {
    wx.navigateTo({ url: '/packageAdmin/pages/admin-slot-manage/admin-slot-manage' });
  },

  goSlotPrices() {
    wx.navigateTo({ url: '/packageAdmin/pages/admin-slot-prices/admin-slot-prices' });
  },

  goClients() {
    wx.navigateTo({ url: '/packageAdmin/pages/admin-clients/admin-clients' });
  },

  goStoreDetailCurrent() {
    wx.navigateTo({ url: '/packageAdmin/pages/admin-store-manage/admin-store-manage' });
  },
});
