const demoClients = require('../../utils/demoClients.js');
const contractByClient = require('../../utils/advertiserContractByClient.js');
const clientPlacementSchedule = require('../../utils/clientPlacementSchedule.js');
const photoCaptureMeta = require('../../utils/photoCaptureMeta.js');

Page({
  data: {
    clientId: '',
    client: null,
    contractPath: '',
    contractWatermarkTime: '',
    contractWatermarkAddress: '',
    scheduleLines: [],
  },

  onLoad(options) {
    const id = options.id || '';
    const client = demoClients.getById(id);
    if (!client) {
      wx.showToast({ title: '客户不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 400);
      return;
    }
    const meta = contractByClient.getCaptureMeta(id);
    this.setData({
      clientId: id,
      client,
      contractPath: contractByClient.get(id),
      contractWatermarkTime: meta && meta.watermarkTime ? meta.watermarkTime : '',
      contractWatermarkAddress: meta && meta.watermarkAddress ? meta.watermarkAddress : '',
    });
    this.refreshScheduleLines();
  },

  onShow() {
    const id = this.data.clientId;
    if (id) {
      const meta = contractByClient.getCaptureMeta(id);
      this.setData({
        contractPath: contractByClient.get(id),
        contractWatermarkTime: meta && meta.watermarkTime ? meta.watermarkTime : '',
        contractWatermarkAddress: meta && meta.watermarkAddress ? meta.watermarkAddress : '',
      });
      this.refreshScheduleLines();
    }
  },

  refreshScheduleLines() {
    const id = this.data.clientId;
    if (!id) return;
    const sched = clientPlacementSchedule.getForClient(id);
    const now = new Date();
    const keys = Object.keys(sched).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const scheduleLines = keys.map((type) => {
      const date = sched[type];
      const d = clientPlacementSchedule.daysUntilExpire(date, now);
      const expireSoon = d !== null && d >= 0 && d <= 7;
      return { type, date, expireSoon };
    });
    this.setData({ scheduleLines });
  },

  goTimeSettings() {
    const id = this.data.clientId;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/admin-client-time/admin-client-time?clientId=${encodeURIComponent(id)}`,
    });
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
            const name = (this.data.client && this.data.client.name) || '';
            const prefix = name ? `合同 · ${name}` : '合同';
            photoCaptureMeta.getCaptureMeta({ addressPrefix: prefix }, (meta) => {
              contractByClient.set(clientId, r.savedFilePath);
              contractByClient.setCaptureMeta(clientId, {
                watermarkTime: meta.timeStr,
                watermarkAddress: meta.address,
              });
              this.setData({
                contractPath: r.savedFilePath,
                contractWatermarkTime: meta.timeStr,
                contractWatermarkAddress: meta.address,
              });
              wx.showToast({ title: '已保存', icon: 'success' });
            });
          },
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
        });
      },
    });
  },

  clearContract() {
    const clientId = this.data.clientId;
    contractByClient.set(clientId, '');
    this.setData({
      contractPath: '',
      contractWatermarkTime: '',
      contractWatermarkAddress: '',
    });
    wx.showToast({ title: '已移除', icon: 'success' });
  },
});
