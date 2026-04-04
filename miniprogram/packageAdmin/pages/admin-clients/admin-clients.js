const demoClients = require('../../../utils/demoClients.js');
const clientAdStatus = require('../../../utils/clientAdStatus.js');
const deleteGuard = require('../../../utils/deleteGuard.js');

Page({
  data: {
    clients: [],
  },

  onLoad() {
    this.refreshClients();
  },

  onShow() {
    this.refreshClients();
  },

  refreshClients() {
    this.setData({
      clients: clientAdStatus.enrichClientsForList(demoClients.getList()),
    });
  },

  goClientDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/packageAdmin/pages/admin-client-detail/admin-client-detail?id=${encodeURIComponent(id)}`,
    });
  },

  onDeleteClient(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const block = deleteGuard.clientCannotDeleteReason(id);
    if (block) {
      wx.showModal({ title: '无法删除', content: block, showCancel: false });
      return;
    }
    const self = this;
    deleteGuard.confirmDeleteTwice(
      {
        title1: '删除客户',
        content1: '将解除该客户与广告位的绑定，并清除本地合同与投放设置（演示数据）。',
        title2: '再次确认删除',
        content2: '请确认是否删除该客户？删除后不可恢复。',
      },
      function () {
        demoClients.removeById(id);
        self.refreshClients();
        wx.showToast({ title: '已删除', icon: 'success' });
      }
    );
  },
});
