const demoClients = require('../../utils/demoClients.js');
const contractByClient = require('../../utils/advertiserContractByClient.js');

Page({
  data: {
    clientId: '',
    client: null,
    contractPath: '',
  },

  onLoad(options) {
    const id = options.id || '';
    const client = demoClients.getById(id);
    if (!client) {
      wx.showToast({ title: '客户不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    this.setData({
      clientId: id,
      client,
      contractPath: contractByClient.get(id),
    });
  },

  onShow() {
    const id = this.data.clientId;
    if (id) {
      this.setData({ contractPath: contractByClient.get(id) });
    }
  },

  chooseContractImage() {
    const clientId = this.data.clientId;
    if (!clientId) return;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const temp = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!temp) return;
        wx.getFileSystemManager().saveFile({
          tempFilePath: temp,
          success: (r) => {
            contractByClient.set(clientId, r.savedFilePath);
            this.setData({ contractPath: r.savedFilePath });
            wx.showToast({ title: '已保存', icon: 'success' });
          },
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
        });
      },
    });
  },

  clearContract() {
    const clientId = this.data.clientId;
    contractByClient.set(clientId, '');
    this.setData({ contractPath: '' });
    wx.showToast({ title: '已移除', icon: 'success' });
  },
});
