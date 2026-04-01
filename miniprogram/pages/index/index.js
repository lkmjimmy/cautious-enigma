Page({
  goAdmin() {
    wx.navigateTo({
      url: '/pages/admin/admin',
    });
  },

  goAdvertiser() {
    wx.navigateTo({
      url: '/pages/advertiser/advertiser',
    });
  },

  goInspector() {
    wx.navigateTo({
      url: '/pages/inspector/inspector',
    });
  },
});
