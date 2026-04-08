const inspectorStores = require('../../../utils/inspectorStores.js');
const phoneValidate = require('../../../utils/phoneValidate.js');

Page({
  data: {
    storeName: '',
    address: '',
    phone: '',
    /** 地图选点得到的经纬度，保存门店时一并写入 */
    locationLat: null,
    locationLng: null,
  },

  onStoreNameInput(e) {
    this.setData({ storeName: e.detail.value });
  },

  onAddressInput(e) {
    const address = e.detail.value;
    this.setData({
      address,
      locationLat: null,
      locationLng: null,
    });
  },

  _applyPickResult(res) {
    const name = (res.name || '').trim();
    const addr = (res.address || '').trim();
    let text = '';
    if (name && addr) {
      text = name.includes(addr) ? name : `${name} ${addr}`;
    } else {
      text = name || addr;
    }
    const lat = res.latitude;
    const lng = res.longitude;
    this.setData({
      address: text,
      locationLat: typeof lat === 'number' && !Number.isNaN(lat) ? lat : null,
      locationLng: typeof lng === 'number' && !Number.isNaN(lng) ? lng : null,
    });
  },

  /** wx.chooseLocation：地图拖点选位置 */
  onChooseLocation() {
    const that = this;
    wx.chooseLocation({
      success(res) {
        that._applyPickResult(res);
      },
      fail(err) {
        const msg = (err && err.errMsg) || '';
        if (msg.indexOf('cancel') !== -1 || msg.indexOf('fail cancel') !== -1) return;
        if (msg.indexOf('auth deny') !== -1 || msg.indexOf('permission') !== -1) {
          wx.showModal({
            title: '需要位置权限',
            content: '请允许使用位置信息，以便选取门店位置。',
            confirmText: '去设置',
            success(r) {
              if (r.confirm) wx.openSetting({});
            },
          });
          return;
        }
        wx.showToast({ title: '无法打开地图选点', icon: 'none' });
      },
    });
  },

  /** wx.choosePoi：从 POI 列表选点（与公众平台已开通能力一致） */
  onChoosePoi() {
    const that = this;
    if (typeof wx.choosePoi !== 'function') {
      wx.showToast({ title: '当前基础库不支持 POI 选点', icon: 'none' });
      return;
    }
    wx.choosePoi({
      success(res) {
        that._applyPickResult(res);
      },
      fail(err) {
        const msg = (err && err.errMsg) || '';
        if (msg.indexOf('cancel') !== -1 || msg.indexOf('fail cancel') !== -1) return;
        if (msg.indexOf('auth deny') !== -1 || msg.indexOf('permission') !== -1) {
          wx.showModal({
            title: '需要位置权限',
            content: '请允许使用位置信息，以便搜索并选择地点。',
            confirmText: '去设置',
            success(r) {
              if (r.confirm) wx.openSetting({});
            },
          });
          return;
        }
        wx.showToast({ title: '无法打开地点列表', icon: 'none' });
      },
    });
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

    const lat = this.data.locationLat;
    const lng = this.data.locationLng;
    const storeRow = inspectorStores.addStore({
      name: storeName,
      address,
      phone,
      ...(typeof lat === 'number' && typeof lng === 'number' ? { latitude: lat, longitude: lng } : {}),
    });

    wx.showToast({ title: '门店已新增，进入广告位初始化', icon: 'success' });
    setTimeout(() => {
      wx.navigateTo({
        url: `/packageBiz/pages/inspector-store-init/inspector-store-init?storeId=${encodeURIComponent(storeRow.id)}`,
      });
    }, 250);
  },
});

