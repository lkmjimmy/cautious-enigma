/**
 * 后端 API 开关与基地址（与仓库 `backend/` 配套）
 *
 * 控制台里 [Deprecation] SharedArrayBuffer、getSystemInfo 提示等来自开发者工具/基础库，可忽略。
 *
 * 若仅配 127.0.0.1 仍 timeout：请填 secondaryBaseUrl 为本机局域网 IP（与终端 curl 一致），
 * 请求会按顺序尝试（私网 IP 时仍可与 preferLoopbackFirst 组合）。
 *
 * 必做：开发者工具 → 详情 → 本地设置 → 勾选
 * 「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
 *
 * baseUrl / secondaryBaseUrl 不要末尾 /
 *
 * debugApiLog：是否打印每条 wx.request URL。未设置时：体验版/开发版为 true，正式版为 false。
 */
module.exports = {
  /** 是否请求后端（false 时仅用本地 wx.storage） */
  useServer: true,

  /** 可选：true/false 覆盖自动判断；正式上架建议显式 false */
  debugApiLog: undefined,

  /**
   * 主地址，例如 http://127.0.0.1:3000 或 http://192.168.x.x:3000
   */
  baseUrl: 'http://127.0.0.1:3000',

  /**
   * 备用地址（强烈建议在 baseUrl 为 127 时填写）：http://192.168.x.x:3000
   * 模拟器常出现 127 与局域网二选一才可通的情况。
   */
  secondaryBaseUrl: 'http://192.168.2.100:3000',

  /**
   * baseUrl 为私网 IP 时：true 先 127 再私网；false 先私网再 127。
   * 后端在局域网另一台机器上时请 false，并勿填错 secondaryBaseUrl。
   */
  preferLoopbackFirst: true,
};
