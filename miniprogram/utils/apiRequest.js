const apiConfig = require('./apiConfig.js');

function shouldLogApiRequest() {
  if (apiConfig.debugApiLog === true) return true;
  if (apiConfig.debugApiLog === false) return false;
  try {
    return wx.getAccountInfoSync().miniProgram.envVersion !== 'release';
  } catch (e) {
    return true;
  }
}

function buildUrl(base, path) {
  const b = String(base).replace(/\/$/, '');
  return b + (path.startsWith('/') ? path : `/${path}`);
}

function normalizeBase(b) {
  if (!b) return '';
  return String(b).replace(/\/$/, '');
}

function isPrivateLanHost(hostname) {
  if (!hostname) return false;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
  return false;
}

/**
 * 仅当 baseUrl 为私网 IP 时，生成同端口的 127.0.0.1（本机后端联调）。
 */
function loopbackBaseForPrivateLan(primary) {
  try {
    const u = new URL(primary);
    if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') return null;
    if (!isPrivateLanHost(u.hostname)) return null;
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    return `${u.protocol}//127.0.0.1:${port}`;
  } catch (_) {
    return null;
  }
}

/**
 * 去重后的请求基址列表：私网↔127、可选 secondaryBaseUrl（解决「只配 127 时无法回退局域网」）。
 */
function buildBaseList(primaryRaw) {
  const primary = normalizeBase(primaryRaw);
  const seen = {};
  const list = [];
  const add = function (b) {
    const n = normalizeBase(b);
    if (!n || seen[n]) return;
    seen[n] = true;
    list.push(n);
  };

  const loop = loopbackBaseForPrivateLan(primary);
  if (loop) {
    const preferLoop = apiConfig.preferLoopbackFirst !== false;
    if (preferLoop) {
      add(loop);
      add(primary);
    } else {
      add(primary);
      add(loop);
    }
  } else {
    add(primary);
  }

  const sec = apiConfig.secondaryBaseUrl;
  if (sec) add(sec);

  return list.length ? list : [primary];
}

/**
 * @param {{ path: string, method?: string, data?: object, header?: object, baseUrl: string, timeoutMs?: number }} opts
 */
function requestOnce(opts) {
  const { path, method = 'GET', data, header = {}, baseUrl, timeoutMs = 60000 } = opts || {};
  const token = wx.getStorageSync('apiToken') || '';
  const url = buildUrl(baseUrl, path);
  if (shouldLogApiRequest()) {
    console.log('[apiRequest]', method, url);
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data: data || {},
      timeout: timeoutMs,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        const err = new Error(res.data?.message || `HTTP ${res.statusCode}`);
        err.statusCode = res.statusCode;
        err.data = res.data;
        reject(err);
      },
      fail: (e) => {
        const detail = e && (e.errMsg || e.message || JSON.stringify(e));
        console.error('[apiRequest] fail', method, url, detail, e);
        reject(e || new Error(detail || 'network fail'));
      },
    });
  });
}

/**
 * @param {{ path: string, method?: string, data?: object, header?: object }} opts path 须以 / 开头，如 /api/v1/me
 * @returns {Promise<object>}
 */
function request(opts) {
  const { path, method = 'GET', data, header = {} } = opts || {};
  if (!apiConfig.useServer || !apiConfig.baseUrl) {
    return Promise.reject(new Error('API 未启用：请在 utils/apiConfig.js 设置 useServer 与 baseUrl'));
  }

  const bases = buildBaseList(apiConfig.baseUrl);

  const tryAt = (index) => {
    if (index >= bases.length) {
      return Promise.reject(new Error('network fail'));
    }
    const baseUrl = bases[index];
    const hasNext = index + 1 < bases.length;
    const timeoutMs = hasNext ? 12000 : 60000;

    return requestOnce({
      path,
      method,
      data,
      header,
      baseUrl,
      timeoutMs,
    }).catch((e) => {
      const isWxFail = !!(e && e.errMsg);
      if (hasNext && isWxFail) {
        if (shouldLogApiRequest()) {
          console.warn('[apiRequest] 换备用地址', buildUrl(bases[index + 1], path));
        }
        return tryAt(index + 1);
      }
      const detail = e && (e.errMsg || e.message || JSON.stringify(e));
      if (/timeout/i.test(String(detail || ''))) {
        console.error(
          '[apiRequest] 仍超时：请确认 backend 已运行；若 baseUrl 为 127，可在 apiConfig 填 secondaryBaseUrl 为局域网 IP；工具→设置→代理选「不使用任何代理」；或真机调试'
        );
      }
      throw e;
    });
  };

  return tryAt(0);
}

/** 登录后写入 token：wx.setStorageSync('apiToken', token) */
function setApiToken(token) {
  if (token) wx.setStorageSync('apiToken', token);
  else wx.removeStorageSync('apiToken');
}

/** 控制台联调用：require('./utils/apiRequest.js').pingHealth().then(console.log).catch(console.error) */
function pingHealth() {
  return request({ path: '/health', method: 'GET' });
}

module.exports = {
  request,
  setApiToken,
  apiConfig,
  pingHealth,
};
