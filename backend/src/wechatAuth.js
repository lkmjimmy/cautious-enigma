/**
 * 微信小程序登录：code → openid（需配置 WECHAT_APP_ID + WECHAT_APP_SECRET）
 * 文档：https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
 */

/**
 * @param {string} appId
 * @param {string} secret
 * @param {string} jsCode wx.login 返回的 code，仅可使用一次
 * @returns {Promise<{ openid: string, sessionKey: string, unionid?: string }>}
 */
export async function jscode2session(appId, secret, jsCode) {
  if (!appId || !secret || !jsCode) {
    const err = new Error('缺少 appId、secret 或 code');
    err.errcode = -1;
    throw err;
  }
  const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', secret);
  url.searchParams.set('js_code', jsCode);
  url.searchParams.set('grant_type', 'authorization_code');

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.errcode != null && data.errcode !== 0) {
    const err = new Error(data.errmsg || `微信接口错误 errcode=${data.errcode}`);
    err.errcode = data.errcode;
    throw err;
  }
  if (!data.openid) {
    const err = new Error('微信未返回 openid');
    err.errcode = -2;
    throw err;
  }
  return {
    openid: data.openid,
    sessionKey: data.session_key,
    unionid: data.unionid,
  };
}

export function isWechatConfigured() {
  const appId = process.env.WECHAT_APP_ID || process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;
  return !!(appId && secret);
}
