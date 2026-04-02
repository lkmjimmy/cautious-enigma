const contractByClient = require('../../utils/advertiserContractByClient.js');

const STORAGE_CLIENT_ID = 'currentAdvertiserClientId';

Page({
  data: {
    imagePath: '',
    clientName: '',
    watermarkTime: '',
    watermarkAddress: '',
  },

  onShow() {
    const clientId = wx.getStorageSync(STORAGE_CLIENT_ID) || 'c1';
    const imagePath = contractByClient.get(clientId);
    const meta = contractByClient.getCaptureMeta(clientId);
    const name = this._clientNameForId(clientId);
    this.setData({
      imagePath,
      clientName: name,
      watermarkTime: meta && meta.watermarkTime ? meta.watermarkTime : '',
      watermarkAddress: meta && meta.watermarkAddress ? meta.watermarkAddress : '',
    });
  },

  _clientNameForId(id) {
    const demoClients = require('../../utils/demoClients.js');
    const row = demoClients.getById(id);
    return row ? row.name : '';
  },
});
