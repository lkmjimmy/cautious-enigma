/** 拍照后统一获取：拍摄时间文案 + 定位说明（模糊定位 gcj02），供各业务存库与叠加水印 */

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

  /** 与公众平台已开通能力对齐：使用 wx.getFuzzyLocation，不用 wx.getLocation */
  const runFuzzy = typeof wx.getFuzzyLocation === 'function' ? wx.getFuzzyLocation : null;
  if (!runFuzzy) {
    clearTimeout(timer);
    const address = addressPrefix ? `${addressPrefix}（未支持模糊定位）` : '未支持模糊定位';
    finish(address);
    return;
  }

  runFuzzy({
    type: 'gcj02',
    success: (loc) => {
      clearTimeout(timer);
      const lat = Number(loc && loc.latitude);
      const lng = Number(loc && loc.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        const address = addressPrefix ? `${addressPrefix}（未获取定位）` : '未获取定位';
        finish(address);
        return;
      }
      const coord = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const address = addressPrefix ? `${addressPrefix} · ${coord}（大致位置）` : `${coord}（大致位置）`;
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
