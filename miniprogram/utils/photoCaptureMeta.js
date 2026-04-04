/** 拍照后统一获取：拍摄时间文案 + 定位说明（gcj02），供各业务存库与叠加水印 */

const LOCATION_TIMEOUT_MS = 10000;

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

  let settled = false;
  const finish = (address) => {
    if (settled) return;
    settled = true;
    cb({ timeStr, address, recordedAt });
  };

  const timer = setTimeout(() => {
    const address = addressPrefix ? `${addressPrefix}（定位超时）` : '定位超时';
    finish(address);
  }, LOCATION_TIMEOUT_MS);

  wx.getLocation({
    type: 'gcj02',
    /** 模拟器上高精度常较慢或触发框架 timeout，默认关闭高精度 */
    isHighAccuracy: false,
    success: (loc) => {
      clearTimeout(timer);
      const coord = `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
      const address = addressPrefix ? `${addressPrefix} · ${coord}` : coord;
      finish(address);
    },
    fail: () => {
      clearTimeout(timer);
      const address = addressPrefix ? `${addressPrefix}（未获取定位）` : '未获取定位';
      finish(address);
    },
  });
}

module.exports = {
  formatDateTime,
  getCaptureMeta,
};
