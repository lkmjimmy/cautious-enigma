const demoClients = require('../../utils/demoClients.js');

Page({
  data: {
    clients: demoClients.CLIENTS,
  },

  goClientDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/admin-client-detail/admin-client-detail?id=${encodeURIComponent(id)}`,
    });
  },
});
