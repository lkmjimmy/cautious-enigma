/** 拍照后统一获取：拍摄时间文案 + 定位说明（gcj02），供各业务存库与叠加水印 */

function formatDateTime(d) {
  const p = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * @param {{ addressPrefix?: string }} opts addressPrefix 如「门店：xxx」
 * @param {(meta: { timeStr: string, address: string, recordedAt: number }) => void} cb
 */
function getCaptureMeta(opts, cb) {
  const addressPrefix = (opts && opts.addressPrefix) || '';
  const timeStr = formatDateTime(new Date());
  const recordedAt = Date.now();
  wx.getLocation({
    type: 'gcj02',
    isHighAccuracy: true,
    highAccuracyExpireTime: 5000,
    success: (loc) => {
      const coord = `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
      const address = addressPrefix ? `${addressPrefix} · ${coord}` : coord;
      cb({ timeStr, address, recordedAt });
    },
    fail: () => {
      const address = addressPrefix ? `${addressPrefix}（未获取定位）` : '未获取定位';
      cb({ timeStr, address, recordedAt });
    },
  });
}

module.exports = {
  formatDateTime,
  getCaptureMeta,
};
