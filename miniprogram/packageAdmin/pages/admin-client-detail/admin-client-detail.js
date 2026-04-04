const demoClients = require('../../../utils/demoClients.js');
const contractByClient = require('../../../utils/advertiserContractByClient.js');
const clientPlacementSchedule = require('../../../utils/clientPlacementSchedule.js');
const clientSlotQuotes = require('../../../utils/clientSlotQuotes.js');
const photoCaptureMeta = require('../../../utils/photoCaptureMeta.js');

Page({
  data: {
    clientId: '',
    client: null,
    contractPath: '',
    contractWatermarkTime: '',
    contractWatermarkAddress: '',
    scheduleLines: [],
    periodLabels: clientSlotQuotes.PERIOD_LABELS,
    quoteRows: [],
    quoteSaveBtnText: '保存报价',
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
    this.loadQuoteRows(id);
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
      this.loadQuoteRows(id);
    }
  },

  loadQuoteRows(clientId) {
    const id = clientId || this.data.clientId;
    if (!id) return;
    this.setData({ quoteRows: clientSlotQuotes.getQuoteRowsForView(id) });
  },

  onQuotePeriodChange(e) {
    const type = e.currentTarget.dataset.type;
    const idx = Number(e.detail.value);
    if (Number.isNaN(idx)) return;
    const keys = clientSlotQuotes.PERIOD_KEYS;
    const period = keys[idx] || 'month';
    const quoteRows = (this.data.quoteRows || []).map((r) =>
      r.type === type ? { ...r, periodIndex: idx, period } : r
    );
    this.setData({ quoteRows });
  },

  onQuotePriceInput(e) {
    const type = e.currentTarget.dataset.type;
    const value = e.detail.value;
    const quoteRows = (this.data.quoteRows || []).map((r) =>
      r.type === type ? { ...r, price: value } : r
    );
    this.setData({ quoteRows });
  },

  saveClientQuotes() {
    const clientId = this.data.clientId;
    if (!clientId) return;
    const map = {};
    (this.data.quoteRows || []).forEach((r) => {
      map[r.type] = {
        period: r.period || 'month',
        price: (r.price || '').trim(),
      };
    });
    clientSlotQuotes.setForClient(clientId, map);
    this.setData({ quoteSaveBtnText: '修改报价' });
    wx.showToast({ title: '报价已保存', icon: 'success' });
  },

  refreshScheduleLines() {
    const id = this.data.clientId;
    if (!id) return;
    const sched = clientPlacementSchedule.getForClient(id);
    const now = new Date();
    const keys = Object.keys(sched).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const scheduleLines = keys.map((type) => {
      const date = clientPlacementSchedule.expireAtFromEntry(sched[type]);
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
      url: `/packageAdmin/pages/admin-client-time/admin-client-time?clientId=${encodeURIComponent(id)}`,
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
