const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const DEFAULT_SETTINGS = {
  cookie: '',
  wecomWebhook: '',
  webdavUrl: '',
  webdavUser: '',
  webdavPass: '',
  downloadApi: 'https://bili.kedaya.gq/api/download?url=',
  rsshubBase: 'https://rsshub.liumingye.cn',
  intervalMinutes: 5,
  notifyOnFirstRun: false,
  parseApiBase: 'https://bili.kedaya.gq/api?url=',
  parseWebdavUrl: 'https://alistv6.zjftsl.cf/dav/天翼/我的视频/视频/哔哩哔哩',
  parseWebdavUser: '',
  parseWebdavPass: '',
  parseDefaultFolder: '默认',
  logWebdavUrl: '',
  successLogWebdavUrl: '',
  ups: []
};

const MD5_K = [
  0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
  0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
  0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
  0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
  0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
  0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
  0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
  0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
];
const MD5_S = [
  7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
  5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
  4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
  6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21
];
const MIXIN_TAB = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function html(str) {
  return new Response(str, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } });
}

function rotl(x, c) { return ((x << c) | (x >>> (32 - c))) >>> 0; }

function md5(str) {
  const bytes = new TextEncoder().encode(String(str));
  const len = bytes.length;
  const total = (((len + 8) >> 6) + 1) * 64;
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, (len * 8) >>> 0, true);
  dv.setUint32(total - 4, Math.floor((len * 8) / 0x100000000), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let i = 0; i < total; i += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(i + j * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let j = 0; j < 64; j++) {
      let F, g;
      if (j < 16) { F = (B & C) | ((~B) & D); g = j; }
      else if (j < 32) { F = (D & B) | ((~D) & C); g = (5 * j + 1) % 16; }
      else if (j < 48) { F = B ^ C ^ D; g = (3 * j + 5) % 16; }
      else { F = C ^ (B | (~D)); g = (7 * j) % 16; }
      F = (F + A + MD5_K[j] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, MD5_S[j])) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, a0, true); odv.setUint32(4, b0, true); odv.setUint32(8, c0, true); odv.setUint32(12, d0, true);
  let hex = '';
  for (let i = 0; i < 16; i++) hex += ('0' + out[i].toString(16)).slice(-2);
  return hex;
}

function biliHeaders(cookie, referer) {
  return {
    'User-Agent': UA,
    'Referer': referer || 'https://www.bilibili.com/',
    'Accept': 'application/json, text/plain, */*',
    'Cookie': cookie || ''
  };
}

async function getFingerCookie(cookie) {
  const old = String(cookie || '');
  try {
    const resp = await fetch('https://api.bilibili.com/x/frontend/finger/spi', {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://www.bilibili.com/',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    const j = await resp.json();
    const b3 = j && j.data && j.data.b_3 ? String(j.data.b_3) : '';
    const b4 = j && j.data && j.data.b_4 ? String(j.data.b_4) : '';
    const parts = [];
    if (b3 && old.indexOf('buvid3=') < 0) parts.push('buvid3=' + b3);
    if (b4 && old.indexOf('buvid4=') < 0) parts.push('buvid4=' + b4);
    if (!parts.length) return old;
    return old ? old + '; ' + parts.join('; ') : parts.join('; ');
  } catch (e) {
    return old;
  }
}

function stripRssHtml(s){ return String(s || '').replace(/<[^>]*>/g, ''); }
function decodeXmlEntities(s){ return String(s || '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'); }
function extractBvid(s){ var m = String(s || '').match(/(BV[0-9A-Za-z]+)/); return m ? m[1] : ''; }
function parseRssItems(xml){
  var out = [];
  var raw = String(xml || '');
  var pieces = raw.split('<item');
  for (var i = 1; i < pieces.length; i++){
    var chunk = pieces[i];
    var gt = chunk.indexOf('>');
    if (gt < 0) continue;
    chunk = chunk.slice(gt + 1);
    var close = chunk.indexOf('</item>');
    if (close >= 0) chunk = chunk.slice(0, close);
    function readTag(tag){
      var open = '<' + tag;
      var start = chunk.indexOf(open);
      if (start < 0) return '';
      var tail = chunk.slice(start);
      var endTag = '</' + tag + '>';
      var bodyStart = tail.indexOf('>');
      var bodyEnd = tail.indexOf(endTag);
      if (bodyStart < 0 || bodyEnd < 0) return '';
      return tail.slice(bodyStart + 1, bodyEnd);
    }
    out.push({ title: readTag('title'), link: readTag('link'), guid: readTag('guid'), description: readTag('description'), pubDate: readTag('pubDate'), author: readTag('author') });;
  }
  return out;
}

function getRsshubBases(raw) {
  var s = String(raw || DEFAULT_SETTINGS.rsshubBase || '');
  var parts = s.split(/[\r\n,]+/);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var b = String(parts[i] || '').trim();
    while (b.slice(-1) === '/') b = b.slice(0, -1);
    if (b && /^https?:\/\//i.test(b) && out.indexOf(b) < 0) out.push(b);
  }
  return out;
}

async function updatePreferredRsshub(env, base) {
  if (!env || !base) return;
  try {
    var settings = await getSettings(env);
    var bases = getRsshubBases(settings.rsshubBase);
    if (!bases.length || bases[0] === base) return;
    var next = [base];
    for (var i = 0; i < bases.length; i++) if (bases[i] !== base) next.push(bases[i]);
    settings.rsshubBase = next.join('\n');
    await saveSettings(env, settings);
  } catch (e) {}
}

async function fetchRssVideos(mid, rawBases, env){
  var bases = getRsshubBases(rawBases);
  if (!bases.length) throw new Error('未配置RSSHub地址');
  var lastErr = '';
  for (var i = 0; i < bases.length; i++){
    var root = bases[i];
    try {
      var url = root + '/bilibili/user/video/' + encodeURIComponent(String(mid));
      var resp = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } });
      if (!resp.ok) throw new Error('RSSHub HTTP ' + resp.status);
      var xml = await resp.text();
      var items = parseRssItems(xml);
      var vlist = [];
      for (var k = 0; k < items.length; k++){
        var bvid = extractBvid(items[k].link || items[k].guid);
        if (bvid) vlist.push({ bvid: bvid, title: decodeXmlEntities(stripRssHtml(items[k].title)) || bvid, created: 0, author: '' });
      }
      if (!vlist.length) throw new Error('RSSHub未解析到视频');
      await updatePreferredRsshub(env, root);
      return { base: root, data: { code: 0, message: '0', data: { list: { vlist: vlist } } } };
    } catch (e) {
      lastErr = String(e && e.message || e);
    }
  }
  throw new Error('所有RSSHub实例均不可用，最后错误：' + lastErr);
}
async function fetchRssDynamics(mid, rawBases, env){
  var bases = getRsshubBases(rawBases);
  if (!bases.length) throw new Error('未配置RSSHub地址');
  var lastErr = '';
  for (var i = 0; i < bases.length; i++){
    var root = bases[i];
    try {
      var url = root + '/bilibili/user/dynamic/' + encodeURIComponent(String(mid));
      var resp = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } });
      if (!resp.ok) throw new Error('RSSHub HTTP ' + resp.status);
      var xml = await resp.text();
      var rssItems = parseRssItems(xml);
      var items = [];
      for (var k = 0; k < rssItems.length; k++){
        var link = rssItems[k].link || rssItems[k].guid || '';
var desc = rssItems[k].description || '';
var idMatch = String(link).match(/([0-9]{6,})/);
var id = idMatch ? idMatch[1] : '';
var bvid = extractBvid(desc) || extractBvid(rssItems[k].title || '') || extractBvid(link);
var text = decodeXmlEntities(stripRssHtml(desc || rssItems[k].title || ''));
var title = decodeXmlEntities(stripRssHtml(rssItems[k].title || ''));
var archive = null;
if (bvid) archive = { bvid: bvid, title: title || bvid };
items.push({ id_str: id, id: id, type: '动态', modules: { module_author: { name: decodeXmlEntities(rssItems[k].author || '') }, module_dynamic: { desc: { text: text }, major: { archive: archive } } } });      }
      if (!items.length) throw new Error('RSSHub未解析到动态');
      await updatePreferredRsshub(env, root);
      return { base: root, data: { code: 0, message: '0', data: { items: items } } };
    } catch (e) {
      lastErr = String(e && e.message || e);
    }
  }
  throw new Error('所有RSSHub实例均不可用，最后错误：' + lastErr);
}

function getMixinKey(orig) {
  return MIXIN_TAB.map(function (i) { return orig[i]; }).join('').slice(0, 32);
}

async function getWbiKeys(cookie) {
  const resp = await fetch('https://api.bilibili.com/x/web-interface/nav', { headers: biliHeaders(cookie) });
  const data = await resp.json();
  const wbi = data && data.data && data.data.wbi_img;
  if (!wbi || !wbi.img_url || !wbi.sub_url) throw new Error('获取WBI密钥失败，Cookie可能无效');
  return {
    img: wbi.img_url.split('/').pop().split('.')[0],
    sub: wbi.sub_url.split('/').pop().split('.')[0]
  };
}

function encodeWbi(params, mixinKey) {
  const all = Object.assign({}, params, { wts: Math.round(Date.now() / 1000) });
  const keys = Object.keys(all).sort();
  const parts = keys.map(function (k) {
    const val = String(all[k]).replace(/[!'()*]/g, '');
    return encodeURIComponent(k) + '=' + encodeURIComponent(val);
  });
  const query = parts.join('&');
  return query + '&w_rid=' + md5(query + mixinKey);
}

async function fetchVideos(mid, cookie, rsshubBase, env) {
  const cookie2 = await getFingerCookie(cookie);
  const params = { mid: String(mid), ps: '10', pn: '1', tid: '0', keyword: '', order: 'pubdate' };
  try {
    const keys = await getWbiKeys(cookie2);
    const mixin = getMixinKey(keys.img + keys.sub);
    const query = encodeWbi(params, mixin);
    const resp = await fetch('https://api.bilibili.com/x/space/wbi/arc/search?' + query, { headers: biliHeaders(cookie2, 'https://space.bilibili.com/' + String(mid) + '/video') });
    const data = await resp.json();
    if (data && data.code === 0 && data.data && data.data.list && data.data.list.vlist && data.data.list.vlist.length) return data;
  } catch (e) {}
  try {
    const query = 'mid=' + encodeURIComponent(String(mid)) + '&ps=10&pn=1&tid=0&keyword=&order=pubdate';
    const resp = await fetch('https://api.bilibili.com/x/space/arc/search?' + query, { headers: biliHeaders(cookie2, 'https://space.bilibili.com/' + String(mid) + '/video') });
    const data = await resp.json();
    if (data && data.code === 0 && data.data && data.data.list && data.data.list.vlist && data.data.list.vlist.length) return data;
  } catch (e) {}
  var rssRes = await fetchRssVideos(mid, rsshubBase, env);
  return rssRes.data;
}

async function fetchDynamics(mid, cookie, rsshubBase, env) {
  try {
    var rssRes = await fetchRssDynamics(mid, rsshubBase, env);
    if (rssRes && rssRes.data && rssRes.data.data && rssRes.data.data.items) return rssRes.data;
  } catch (e) {}
  const cookie2 = await getFingerCookie(cookie);
  try {
    const url = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=' + encodeURIComponent(String(mid)) + '&timezone_offset=-480&features=itemOpusStyle';
    const resp = await fetch(url, { headers: biliHeaders(cookie2, 'https://space.bilibili.com/' + String(mid) + '/dynamic') });
    const data = await resp.json();
    if (data && data.code === 0 && data.data && data.data.items && data.data.items.length) return data;
  } catch (e) {}
  var fallbackRss = await fetchRssDynamics(mid, rsshubBase, env);
  return fallbackRss.data;
}async function kvGet(env, key, def) {
  try {
    const raw = await env.BILI_MONITOR_KV.get(key);
    return raw ? JSON.parse(raw) : def;
  } catch (e) {
    return def;
  }
}

async function kvPut(env, key, val) {
  await env.BILI_MONITOR_KV.put(key, JSON.stringify(val));
}

async function getSettings(env) {
  const s = await kvGet(env, 'settings', DEFAULT_SETTINGS);
  const merged = Object.assign({}, DEFAULT_SETTINGS, s);
  if (!Array.isArray(merged.ups)) merged.ups = [];
  merged.intervalMinutes = Number(merged.intervalMinutes) || 5;
  return merged;
}

async function saveSettings(env, input) {
  const next = Object.assign({}, DEFAULT_SETTINGS, input);
  if (!Array.isArray(next.ups)) next.ups = [];
  next.intervalMinutes = Number(next.intervalMinutes) || 5;
  await kvPut(env, 'settings', next);
  return next;
}

async function webdavFetchLogged(rawUrl, method, authHeader, body) {
  var baseHeaders = { 'User-Agent': UA };
  if (authHeader) baseHeaders['Authorization'] = authHeader;
  if (body !== undefined) { baseHeaders['Content-Type'] = 'application/json; charset=utf-8'; }
  var resp = await fetch(rawUrl, { method: method, headers: baseHeaders, body: body, redirect: 'manual' });
  if (resp.status >= 300 && resp.status < 400) {
    var location = resp.headers.get('location');
    if (location) {
      var followHeaders = { 'User-Agent': UA };
      if (body !== undefined) { followHeaders['Content-Type'] = 'application/json; charset=utf-8'; }
      resp = await fetch(new URL(location, rawUrl).toString(), { method: method, headers: followHeaders, body: body, redirect: 'follow' });
    }
  }
  return resp;
}

async function getLogsFromWebdav(settings) {
  if (!settings || !settings.logWebdavUrl) return [];
  var logUser = settings.logWebdavUser || settings.webdavUser || '';
  var logPass = settings.logWebdavPass || settings.webdavPass || '';
  var authHeader = (logUser && logPass) ? ('Basic ' + base64Encode(logUser + ':' + logPass)) : '';
  var logUrl = encodeURI(settings.logWebdavUrl);
  var resp = await webdavFetchLogged(logUrl, 'GET', authHeader);
  if (resp.status === 404) return [];
  if (!resp.ok) {
    var errText = '';
    try { errText = String(await resp.text()).slice(0, 400); } catch (e) {}
    throw new Error('读取日志失败 HTTP ' + resp.status + errText);
  }
  var text = await resp.text();
  if (!text || !text.trim()) return [];
  try { var j = JSON.parse(text); return Array.isArray(j) ? j : []; } catch (e) { return []; }
}

async function saveLogsToWebdav(settings, logs) {
  if (!settings || !settings.logWebdavUrl) return false;
  var logUser = settings.logWebdavUser || settings.webdavUser || '';
  var logPass = settings.logWebdavPass || settings.webdavPass || '';
  var authHeader = (logUser && logPass) ? ('Basic ' + base64Encode(logUser + ':' + logPass)) : '';
  var logUrl = encodeURI(settings.logWebdavUrl);
  var resp = await webdavFetchLogged(logUrl, 'PUT', authHeader, JSON.stringify(logs));
  if (resp.status === 405 || resp.status === 409) return true;
  if (!resp.ok) {
    var errText = '';
    try { errText = String(await resp.text()).slice(0, 400); } catch (e) {}
    throw new Error('日志写入 WebDAV 失败 HTTP ' + resp.status + errText);
  }
  return true;
}

async function appendSuccessLogToWebdav(settings, entry) {
  if (!settings || !settings.successLogWebdavUrl) return false;
  var logUser = settings.logWebdavUser || settings.webdavUser || '';
  var logPass = settings.logWebdavPass || settings.webdavPass || '';
  var authHeader = (logUser && logPass) ? ('Basic ' + base64Encode(logUser + ':' + logPass)) : '';
  var logUrl = encodeURI(settings.successLogWebdavUrl);
  var logs = [];
  try {
    var getResp = await webdavFetchLogged(logUrl, 'GET', authHeader);
    if (getResp.ok) {
      var text = await getResp.text();
      try {
        var parsed = text && text.trim() ? JSON.parse(text) : [];
        if (Array.isArray(parsed)) logs = parsed;
      } catch (e) { logs = []; }
    }
  } catch (e) {}
  logs.unshift({
    t: Date.now(),
    type: 'download_success',
    mid: entry.mid || '',
    upName: entry.upName || '',
    title: entry.title || '',
    bvid: entry.bvid || '',
    videoUrl: entry.videoUrl || '',
    webdavPath: entry.webdavPath || '',
    message: entry.message || ''
  });
  if (logs.length > 300) logs.length = 300;
  var putResp = await webdavFetchLogged(logUrl, 'PUT', authHeader, JSON.stringify(logs));
  if (putResp.status === 405 || putResp.status === 409) return true;
  if (!putResp.ok) {
    var putErr = '';
    try { putErr = String(await putResp.text()).slice(0, 400); } catch (e) {}
    throw new Error('下载成功日志写入失败 HTTP ' + putResp.status + putErr);
  }
  return true;
}

async function initD1Logs(env) {
  if (!env.BILI_MONITOR_D1) throw new Error('未绑定 BILI_MONITOR_D1');
  await env.BILI_MONITOR_D1.exec('CREATE TABLE IF NOT EXISTS bili_monitor_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, level TEXT NOT NULL, msg TEXT NOT NULL, created_at TEXT DEFAULT (datetime(\'now\')))');
}
async function getLogsFromD1(env) {
  await initD1Logs(env);
  var r = await env.BILI_MONITOR_D1.prepare('SELECT t, level, msg FROM bili_monitor_logs ORDER BY id DESC LIMIT 300').all();
  return (r.results || []).map(function(x){ return { t: Number(x.t), level: x.level || 'info', msg: String(x.msg || '') }; });
}
async function saveLogsToD1(env, logs) {
  await initD1Logs(env);
  var db = env.BILI_MONITOR_D1;
  for (var i=0;i<logs.length;i++) {
    var it = logs[i];
    await db.prepare('INSERT INTO bili_monitor_logs (t, level, msg) VALUES (?, ?, ?)').bind(Number(it.t)||Date.now(), String(it.level||'info'), String(it.msg||'')).run();
  }
  await db.exec('DELETE FROM bili_monitor_logs WHERE id NOT IN (SELECT id FROM bili_monitor_logs ORDER BY id DESC LIMIT 1000)');
}
async function clearLogsFromD1(env) {
  await initD1Logs(env);
  await env.BILI_MONITOR_D1.exec('DELETE FROM bili_monitor_logs');
}
async function initDownloadSuccessD1(env) {
  if (!env.BILI_MONITOR_D1) throw new Error("未绑定 BILI_MONITOR_D1");
  await env.BILI_MONITOR_D1.exec("CREATE TABLE IF NOT EXISTS bili_monitor_downloads (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, mid TEXT NOT NULL, upName TEXT NOT NULL, bvid TEXT NOT NULL, title TEXT NOT NULL, videoUrl TEXT NOT NULL, webdavPath TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))");
}
async function getDownloadSuccessD1(env) {
  await initDownloadSuccessD1(env);
  var r = await env.BILI_MONITOR_D1.prepare('SELECT id, t, mid, upName, bvid, title, videoUrl, webdavPath FROM bili_monitor_downloads ORDER BY id DESC LIMIT 500').all();
  return (r.results || []).map(function(x){ return { id: Number(x.id), t: Number(x.t), mid: String(x.mid || ''), upName: String(x.upName || ''), bvid: String(x.bvid || ''), title: String(x.title || ''), videoUrl: String(x.videoUrl || ''), webdavPath: String(x.webdavPath || '') }; });
}
async function saveDownloadSuccessD1(env, rec) {
  await initDownloadSuccessD1(env);
  await env.BILI_MONITOR_D1.prepare('INSERT INTO bili_monitor_downloads (t, mid, upName, bvid, title, videoUrl, webdavPath) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(Number(rec.t)||Date.now(), String(rec.mid||''), String(rec.upName||''), String(rec.bvid||''), String(rec.title||''), String(rec.videoUrl||''), String(rec.webdavPath||'')).run();
}
var kvLogBuffer=[];
var kvLogDirty=false;
async function addLog(env, level, msg) {
  var settings = await getSettings(env);
  if (env.BILI_MONITOR_D1) {
    try {
      await saveLogsToD1(env, [{ t: Date.now(), level: level, msg: String(msg) }]);
    } catch (e) {}
    return;
  }
  if (settings.logWebdavUrl) {
    try {
      var wdLogs = await getLogsFromWebdav(settings);
      wdLogs.unshift({ t: Date.now(), level: level, msg: String(msg) });
      if (wdLogs.length > 300) wdLogs.length = 300;
      await saveLogsToWebdav(settings, wdLogs);
    } catch (e) {}
    return;
  }
  kvLogBuffer.unshift({ t: Date.now(), level: level, msg: String(msg) });
  if (kvLogBuffer.length > 200) kvLogBuffer.length = 200;
  kvLogDirty = true;
}
async function flushKvLogs(env) {
  if (!kvLogDirty) return;
  kvLogDirty = false;
  await kvPut(env, 'logs', kvLogBuffer);
}

function parseMid(input) {
  const s = String(input || '').trim();
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/(?:space\.bilibili\.com\/|uid[=:])(\d+)/);
  if (m) return m[1];
  const any = s.match(/(\d{5,})/);
  return any ? any[1] : '';
}

function sanitize(s) {
  if (!s) return 'untitled';
  const r = String(s).replace(/[\\\/:*?"<>|#%&{}\r\n\t]+/g, '_').trim();
  return r ? r.slice(0, 80) : 'untitled';
}

function stripHtml(s) {
  return String(s || '').replace(/<[^>]*>/g, '');
}

function truncate(s, n) {
  n = n || 300;
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '...' : t;
}

function base64Encode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = new TextEncoder().encode(str);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += chars[b0 >> 2];
    out += chars[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? chars[b2 & 63] : '=';
  }
  return out;
}

async function sendWeCom(webhook, kind, author, title, url, env) {
  const lines = [
    '**B站更新提醒：' + kind + '**',
    'UP主：' + (author || '未知'),
    '内容：' + truncate(title, 500),
    '链接：' + url
  ];
  const resp = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgtype: 'markdown', markdown: { content: lines.join('\n') } })
  });
  const data = await resp.json().catch(function () { return null; });
  if (!resp.ok || (data && data.errcode !== undefined && data.errcode !== 0)) {
    throw new Error('企微返回 ' + resp.status + ' ' + JSON.stringify(data || ''));
  }
  await addLog(env, 'info', '已发送企微通知：' + kind + ' / ' + truncate(title, 60) + ' / ' + JSON.stringify(data || ''));
  return data;
}


var dlProgressKey = 'dlProgress';

async function writeDlProgress(env, p) {
  try {
    await env.BILI_MONITOR_KV.put(dlProgressKey, JSON.stringify(p));
  } catch (e) {}
}

async function readDlProgress(env) {
  try {
    var raw = await env.BILI_MONITOR_KV.get(dlProgressKey);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function ensureWebdavFolder(base, folder, auth) {
  try {
    var url = base + '/' + folder;
    var r = await fetch(url, { method: 'MKCOL', headers: { 'Authorization': 'Basic ' + auth, 'User-Agent': UA } });
    if (r.status === 405 || r.status === 409 || r.status === 201 || r.status === 204) return;
  } catch (e) {}
}
async function downloadAndUploadVideo(settings, up, bvid, title, env, manual) {
  if (!settings.webdavUrl) throw new Error('未配置 WebDAV 地址');
  var videoUrl = 'https://www.bilibili.com/video/' + bvid;
  var apiUrl = settings.downloadApi + encodeURIComponent(videoUrl);
  if (manual) await writeDlProgress(env, { stage: 'start', message: '准备下载...', percent: 1 });
  var download = await fetch(apiUrl, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA } });
  if (!download.ok) throw new Error('下载接口 HTTP ' + download.status);
  if (!download.body) throw new Error('下载接口未返回内容');
  var folder = encodeURIComponent(sanitize(up.name || up.mid || String(up.mid)) + '_' + String(up.mid));
  var filename = encodeURIComponent((fallbackToDefault && ownerName ? sanitize(ownerName) + '_' : '') + sanitize(title) + '_' + bvid + '.mp4');
  var base = String(settings.webdavUrl).replace(/\/+$/, '');
  var dest = base + (folder ? '/' + folder : '') + '/' + filename;
  var logUser = settings.logWebdavUser || settings.webdavUser || '';
  var logPass = settings.logWebdavPass || settings.webdavPass || '';
  if (!logUser || !logPass) throw new Error('WebDAV凭据缺失：请填写 WebDAV 用户名和密码');
  var auth = base64Encode(logUser + ':' + logPass);
  await ensureWebdavFolder(base, folder, auth);
  var uploadHeaders = { 'Authorization': 'Basic ' + auth, 'User-Agent': UA, 'Content-Type': 'application/octet-stream' };
  var upload;
  if (manual && typeof download.body.tee === 'function') {
    var branches = download.body.tee();
    var uploadStream = branches[0];
    var progressStream = branches[1];
    var total = Number(download.headers.get('content-length') || 0);
    var progressPromise = (async function () {
      var reader = progressStream.getReader();
      var downloaded = 0;
      var last = 0;
      while (true) {
        var part = await reader.read();
        if (part.done) break;
        downloaded += part.value.byteLength || part.value.length || 0;
        if (Date.now() - last > 1000) {
          last = Date.now();
          var pct = total ? Math.min(99, Math.round((downloaded / total) * 85) + 10) : null;
          await writeDlProgress(env, { stage: 'download', message: '下载中...', bytes: downloaded, total: total, percent: pct });
        }
      }
      await writeDlProgress(env, { stage: 'upload', message: '上传中...', bytes: downloaded, total: total, percent: total ? 90 : null });
    })();
    upload = await fetch(dest, { method: 'PUT', headers: uploadHeaders, body: uploadStream });
    await progressPromise;
  } else {
    if (manual) await writeDlProgress(env, { stage: 'upload', message: '上传中...', percent: null });
    upload = await fetch(dest, { method: 'PUT', headers: uploadHeaders, body: download.body });
  }
  if (upload.status === 405) {
    var verifyOk = false;
    try {
      var checkHead = await fetch(dest, { method: 'HEAD', headers: { 'Authorization': 'Basic ' + auth, 'User-Agent': UA } });
      if (checkHead.status >= 200 && checkHead.status < 300) verifyOk = true;
    } catch (e2) {}
    if (!verifyOk) {
      try {
        var checkProp = await fetch(dest, { method: 'PROPFIND', headers: { 'Authorization': 'Basic ' + auth, 'User-Agent': UA, 'Depth': '0' } });
        if (checkProp.status >= 200 && checkProp.status < 300) verifyOk = true;
      } catch (e3) {}
    }
    if (verifyOk) upload = { status: 207 };
  }
  if (upload.status < 200 || upload.status >= 300) {
    if (manual) await writeDlProgress(env, { stage: 'error', message: 'WebDAV 上传失败 HTTP ' + upload.status, percent: 0 });
    throw new Error('WebDAV 上传失败 HTTP ' + upload.status);
  }
  if (manual) await writeDlProgress(env, { stage: 'done', message: '上传完成', percent: 100 });
  await addLog(env, 'info', '[' + (up.name || up.mid) + '] 已上传：' + bvid + '_' + sanitize(title) + '.mp4');
    if (!manual) {
    try {
      await appendSuccessLogToWebdav(settings, {
        mid: up.mid,
        upName: up.name || up.mid,
        title: title,
        bvid: bvid,
        videoUrl: videoUrl,
        webdavPath: dest,
        message: '监控到更新并成功下载上传'
      });
    } catch (e) {
      await addLog(env, 'error', '下载成功日志写入失败：' + (e && e.message || e));
    }
    try {
      await saveDownloadSuccessD1(env, {
        t: Date.now(),
        mid: up.mid,
        upName: up.name || up.mid,
        title: title,
        bvid: bvid,
        videoUrl: videoUrl,
        webdavPath: dest
      });
    } catch (e) {
      await addLog(env, 'error', 'D1下载成功日志写入失败：' + (e && e.message || e));
    }
  }
}

function extractDynamicInfo(item) {
  const mod = item && item.modules && item.modules.module_dynamic ? item.modules.module_dynamic : {};
  const author = item && item.modules && item.modules.module_author ? (item.modules.module_author.name || '') : '';
  const archive = mod.major && mod.major.archive ? mod.major.archive : null;
  let text = (mod.desc && mod.desc.text) || (archive && archive.desc) || '';
  const bvid = archive && archive.bvid ? archive.bvid : '';
  const title = archive && archive.title ? archive.title : '';
  return {
    id: String(item && (item.id_str || item.id) || ''),
    type: item && item.type ? item.type : '动态',
    author: author,
    text: stripHtml(text).replace(/\s+/g, ' ').trim(),
    bvid: bvid,
    title: title
  };
}

async function handleVideo(item, up, settings, env) {
  const bvid = item.bvid;
  const title = item.title || '无标题';
  const author = item.author || up.name || up.mid;
  const url = 'https://www.bilibili.com/video/' + bvid;
  if (up.notify !== false && settings.wecomWebhook) {
    await sendWeCom(settings.wecomWebhook, '新视频', author, title, url, env);
  }
  if (up.download !== false) {
    await downloadAndUploadVideo(settings, up, bvid, title, env);
  }
}

async function handleDynamic(item, up, settings, env) {
  const info = extractDynamicInfo(item);
  if (!info.bvid) return;
  const url = info.id ? 'https://t.bilibili.com/' + info.id : 'https://space.bilibili.com/' + String(up.mid) + '/dynamic';
  const text = info.text || info.type || '（无文字）';
  if (up.notify !== false && settings.wecomWebhook) {
    await sendWeCom(settings.wecomWebhook, '新动态', info.author || up.name || up.mid, text, url, env);
  }
  if (info.bvid && up.download !== false) {
    await downloadAndUploadVideo(settings, up, info.bvid, info.title || info.text || info.id, env);
  }
}

async function checkVideos(up, settings, old, next, result, seen, env) {
  const data = await fetchVideos(up.mid, settings.cookie, settings.rsshubBase, env);
  if (!data || data.code !== 0 || !data.data) throw new Error('视频接口风控：code ' + (data && data.code) + ' ' + (data && data.message || '返回异常') + '（请使用含 buvid3/buvid4/SESSDATA 的完整Cookie，并降低检查频率）');
  const list = (data.data.list && data.data.list.vlist) || [];
  const first = list[0];
  if (!first) return;
  if (!old.video) {
    next.video = first.bvid;
    next.videoTitle = first.title || '';
    await addLog(env, 'info', '[' + (up.name || up.mid) + '] 首次成功解析，已记录视频基线，不下载：' + (first.title || first.bvid));
    return;
  }
  const foundOld = list.some(function(item){ return item.bvid === old.video; });
  if (!foundOld) {
    next.video = first.bvid;
    next.videoTitle = first.title || '';
    await addLog(env, 'info', '[' + (up.name || up.mid) + '] 最新视频可能已下架或列表变化，已重新记录基线，不触发通知或下载');
    return;
  }
  const fresh = [];
  for (const item of list) {
    if (item.bvid === old.video) break;
    fresh.push(item);
  }
  if (!fresh.length) {
    next.video = first.bvid;
    next.videoTitle = first.title || '';
    return;
  }
  const latest = fresh[0];
  try {
    await handleVideo(latest, up, settings, env);
    if (seen && latest.title) seen[up.mid] = String(latest.title).trim().toLowerCase();
    result.videos.push({ up: up.name || up.mid, bvid: latest.bvid, title: latest.title || '' });
  } catch (e) {
    const msg = '[' + (up.name || up.mid) + '] 视频处理失败：' + String(e.message || e);
    result.errors.push(msg);
    await addLog(env, 'error', msg);
  }
  next.video = first.bvid;
  next.videoTitle = first.title || '';
}
async function checkDynamics(up, settings, old, next, result, seen, env) {
  const data = await fetchDynamics(up.mid, settings.cookie, settings.rsshubBase, env);
  if (!data || data.code !== 0 || !data.data) throw new Error('动态接口风控：code ' + (data && data.code) + ' ' + (data && data.message || '返回异常') + '（请使用含 buvid3/buvid4/SESSDATA 的完整Cookie，并降低检查频率）');
  const items = data.data.items || [];
  var latestVideoItem = null;
  for (var scanIndex = 0; scanIndex < items.length; scanIndex++) {
    var scanInfo = extractDynamicInfo(items[scanIndex]);
    if (scanInfo.bvid) { latestVideoItem = items[scanIndex]; break; }
  }
  if (latestVideoItem) {
    var latestInfo = extractDynamicInfo(latestVideoItem);
    next.dynVideo = latestInfo.bvid;
    next.dynVideoTitle = latestInfo.title || latestInfo.text || latestInfo.bvid;
  }
  const first = items[0];
  if (!first) { next.dyn = old.dyn || ''; return; }
  const firstId = String(first.id_str || first.id || '');
  if (!old.dyn) {
    next.dyn = firstId;
    if (latestVideoItem) {
      await addLog(env, 'info', '[' + (up.name || up.mid) + '] 首次成功解析动态，已记录动态视频基线：' + next.dynVideoTitle);
    } else {
      await addLog(env, 'info', '[' + (up.name || up.mid) + '] 首次成功解析动态，已记录动态基线');
    }
    return;
  }
  if (firstId === old.dyn) { next.dyn = firstId; return; }
  const fresh = [];
  for (const item of items) {
    if (String(item.id_str || item.id || '') === old.dyn) break;
    fresh.push(item);
  }
  var videoItems = fresh.filter(function(item) { var info = extractDynamicInfo(item); return !!info.bvid; });
  if (!videoItems.length) { next.dyn = firstId; return; }
  var newestVideo = videoItems[0];
  for (var dynIndex = videoItems.length - 1; dynIndex >= 0; dynIndex--) {
    var dynItem = videoItems[dynIndex];
    var dynInfo = extractDynamicInfo(dynItem);
    var dynCompareTitle = String(dynInfo.title || dynInfo.text || '').trim().toLowerCase();
    if (seen && seen[up.mid] && dynCompareTitle && dynCompareTitle === seen[up.mid]) {
      await addLog(env, 'info', '[' + (up.name || up.mid) + '] 动态视频与最新投稿视频标题一致，已跳过重复处理：' + (dynInfo.title || dynInfo.bvid));
      continue;
    }
    try {
      await handleDynamic(dynItem, up, settings, env);
      result.dynamics.push({ up: up.name || up.mid, id: String(dynItem.id_str || dynItem.id || ''), type: dynItem.type || '动态', bvid: extractDynamicInfo(dynItem).bvid });
    } catch (e) {
      var msg = '[' + (up.name || up.mid) + '] 动态视频处理失败：' + String(e.message || e);
      result.errors.push(msg);
      await addLog(env, 'error', msg);
    }
  }
  var newestInfo = extractDynamicInfo(newestVideo);
  next.dynVideo = newestInfo.bvid;
  next.dynVideoTitle = newestInfo.title || newestInfo.text || newestInfo.bvid;
  next.dyn = firstId;
}async function rawFetch(url, opts) {
  try {
    var resp = await fetch(url, opts || {});
    var text = await resp.text().catch(function(){ return ''; });
    return { status: resp.status, ok: resp.ok, contentType: (resp.headers.get('content-type') || ''), length: text.length, body: text.slice(0, 5000) };
  } catch (e) {
    return { status: 0, ok: false, contentType: '', length: 0, body: String(e && e.message || e) };
  }
}

function maskSettingsForDebug(s) {
  var c = Object.assign({}, s);
  if (c.cookie) c.cookie = '***masked*** length=' + String(c.cookie).length;
  if (c.webdavPass) c.webdavPass = '***masked***';
  return c;
}

async function debugInfo(env) {
  var out = { time: Date.now(), cookie: 'unset', settings: null, logs: [], lastSeen: null, lastRunAt: null, ups: [], errors: [] };
  try { out.settings = maskSettingsForDebug(await getSettings(env)); } catch (e) { out.errors.push('getSettings: ' + String(e && e.message || e)); }
  try { out.logs = (await kvGet(env, 'logs', [])).slice(0, 50); } catch (e) { out.errors.push('logs: ' + String(e && e.message || e)); }
  try { out.lastSeen = await kvGet(env, 'lastSeen', {}); } catch (e) { out.errors.push('lastSeen: ' + String(e && e.message || e)); }
  try { out.lastRunAt = await env.BILI_MONITOR_KV.get('lastRunAt'); } catch (e) { out.errors.push('lastRunAt: ' + String(e && e.message || e)); }
  var settings = null;
  try { settings = await getSettings(env); } catch (e) { return out; }
  var cookie = settings.cookie || '';
  out.cookie = cookie ? 'length=' + cookie.length + ' head=' + cookie.slice(0, 12) : 'empty';
  var rssBase = String(settings.rsshubBase || '');
  while (rssBase.slice(-1) === '/') rssBase = rssBase.slice(0, -1);
  var ups = (settings.ups || []).slice(0, 5);
  for (var i = 0; i < ups.length; i++) {
    var up = ups[i] || {};
    var mid = String(up.mid || '');
    var item = { mid: mid, name: up.name || '', videoBili: null, videoRss: null, dynBili: null, dynRss: null };
    try {
      item.videoBili = await rawFetch('https://api.bilibili.com/x/space/arc/search?mid=' + encodeURIComponent(mid) + '&ps=5&pn=1&tid=0&keyword=&order=pubdate', { headers: biliHeaders(cookie, 'https://space.bilibili.com/' + mid + '/video') });
    } catch (e) { item.videoBili = { status: 0, ok: false, body: String(e && e.message || e) }; }
    if (rssBase) {
      try { item.videoRss = await rawFetch(rssBase + '/bilibili/user/video/' + encodeURIComponent(mid), { headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } }); } catch (e) { item.videoRss = { status: 0, ok: false, body: String(e && e.message || e) }; }
      try { item.dynRss = await rawFetch(rssBase + '/bilibili/user/dynamic/' + encodeURIComponent(mid), { headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml, */*' } }); } catch (e) { item.dynRss = { status: 0, ok: false, body: String(e && e.message || e) }; }
    }
    try {
      item.dynBili = await rawFetch('https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=' + encodeURIComponent(mid) + '&timezone_offset=-480&features=itemOpusStyle', { headers: biliHeaders(cookie, 'https://space.bilibili.com/' + mid + '/dynamic') });
    } catch (e) { item.dynBili = { status: 0, ok: false, body: String(e && e.message || e) }; }
    out.ups.push(item);
  }
  return out;
}


async function overview(env) {
  var settings = await getSettings(env);
  var lastSeen = await kvGet(env, 'lastSeen', {});
  var latest = {};
  var ups = settings.ups || [];
  for (var i = 0; i < ups.length; i++) {
    var u = ups[i] || {};
    var s = lastSeen[u.mid] || {};
    latest[u.mid] = { video: s.video || '', videoTitle: s.videoTitle || '', dynVideo: s.dynVideo || '', dynVideoTitle: s.dynVideoTitle || '' };
  }
  return { latest: latest };
}
async function checkAll(env) {
  const settings = await getSettings(env);
  const oldMap = await kvGet(env, 'lastSeen', {});
  kvLogBuffer = await kvGet(env, 'logs', []);
  kvLogDirty = false;
  await addLog(env, 'info', '开始检查：' + settings.ups.length + ' 个UP主');
  const nextMap = {};
  const result = { videos: [], dynamics: [], errors: [] };
  const processedVideoTitles = {};
  for (const up of settings.ups) {
    const old = oldMap[up.mid] || {};
    nextMap[up.mid] = { video: old.video || '', videoTitle: old.videoTitle || '', dyn: old.dyn || '', dynVideo: old.dynVideo || '', dynVideoTitle: old.dynVideoTitle || '' };
    if (up.monitorVideo !== false) {
      try {
        await checkVideos(up, settings, old, nextMap[up.mid], result, processedVideoTitles, env);
      } catch (e) {
        const msg = '[' + (up.name || up.mid) + '] 视频检查失败：' + String(e.message || e);
        result.errors.push(msg);
        await addLog(env, 'error', msg);
      }
    }
    if (up.monitorDynamic !== false) {
      try {
        await checkDynamics(up, settings, old, nextMap[up.mid], result, processedVideoTitles, env);
      } catch (e) {
        const msg = '[' + (up.name || up.mid) + '] 动态检查失败：' + String(e.message || e);
        result.errors.push(msg);
        await addLog(env, 'error', msg);
      }
    }
  }
  if (JSON.stringify(nextMap) !== JSON.stringify(oldMap)) {
    await kvPut(env, 'lastSeen', nextMap);
  }
  await addLog(env, 'info', '检查完成：视频 ' + result.videos.length + '，动态 ' + result.dynamics.length + '，错误 ' + result.errors.length);
  await flushKvLogs(env);
  return result;
}

async function scheduledCheck(env) {
  const settings = await getSettings(env);
  const lastRaw = await env.BILI_MONITOR_KV.get('lastRunAt');
  const now = Date.now();
  if (lastRaw && now - Number(lastRaw) < (settings.intervalMinutes || 5) * 60000) return;
  await env.BILI_MONITOR_KV.put('lastRunAt', String(now));
  await checkAll(env);
}

async function readJson(req) {
  try { return await req.json(); } catch (e) { return null; }
}

async function webdavFolderExists(base, folder, auth) {
  try {
    var url = base + '/' + folder;
    var r = await fetch(url, { method: 'PROPFIND', headers: { 'Authorization': 'Basic ' + auth, 'Depth': '0', 'User-Agent': UA } });
    return r.status >= 200 && r.status < 300;
  } catch (e) { return false; }
}


async function webdavFileExists(base, folder, filename, auth) {
  try {
    var url = base + '/' + folder + '/' + filename;
    var baseHeaders = { 'Authorization': 'Basic ' + auth, 'User-Agent': UA };
    var methods = [
      { method: 'PROPFIND', extra: { 'Depth': '0' } },
      { method: 'HEAD', extra: {} }
    ];
    for (var i = 0; i < methods.length; i++) {
      var h = Object.assign({}, baseHeaders, methods[i].extra);
      var r = await fetch(url, { method: methods[i].method, headers: h });
      if (r.status >= 200 && r.status < 300) return true;
    }
    var rr = await fetch(url, { method: 'GET', headers: Object.assign({ 'Range': 'bytes=0-0' }, baseHeaders) });
    if (rr.status === 206 || (rr.status >= 200 && rr.status < 300)) return true;
    return false;
  } catch (e) { return false; }
}

async function parseAndUploadVideo(settings, link, env) {
  var targetPath = '';
  var target = '';
  if (typeof link === 'string') {
    target = String(link || '').trim();
  } else {
    target = String(link && link.url || '').trim();
    targetPath = String(link && link.targetPath || '').trim();
  }
  if (!target) return { ok: false, error: '链接为空' };
  if (!settings.parseApiBase) return { ok: false, error: '未配置解析接口前缀' };
  if (!settings.parseWebdavUrl) return { ok: false, error: '未配置解析下载WebDAV地址' };
  var parseResp = await fetch(settings.parseApiBase + encodeURIComponent(target), { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  var parseJson = await parseResp.json().catch(function(){ return null; });
  if (!parseResp.ok || !parseJson || parseJson.code !== 0 || !parseJson.data || !parseJson.data.durl || !parseJson.data.durl.length || !parseJson.data.durl[0].url) {
    return { ok: false, error: '解析失败：' + String((parseJson && parseJson.message) || ('HTTP ' + parseResp.status)) };
  }
  var data = parseJson.data;
  var bvid = data.bvid || extractBvid(target) || 'unknown';
  var title = data.title || bvid;
  var ownerName = data.owner && data.owner.name ? String(data.owner.name) : '';
  var base = String(settings.parseWebdavUrl).replace(/\/+$/, '');
  var auth = base64Encode((settings.parseWebdavUser || '') + ':' + (settings.parseWebdavPass || ''));
  var defaultFolderRaw = settings.parseDefaultFolder ? sanitize(settings.parseDefaultFolder) : '默认';
  var fallbackToDefault = false;
  var folderRaw;
  var folder;
  if (targetPath) {
    folderRaw = targetPath.replace(/^\/+|\/+$/g, '');
    folder = folderRaw.split('/').filter(Boolean).map(function(seg){ return encodeURIComponent(sanitize(seg)); }).join('/');
  } else {
    folderRaw = ownerName ? sanitize(ownerName) : defaultFolderRaw;
    folder = encodeURIComponent(folderRaw);
    if (ownerName && !(await webdavFolderExists(base, folder, auth))) {
      folderRaw = defaultFolderRaw;
      folder = encodeURIComponent(defaultFolderRaw);
      fallbackToDefault = true;
    }
  }
  var filename = encodeURIComponent(sanitize(title) + '_' + bvid + '.mp4');
  var dest = base + '/' + folder + '/' + filename;
  var videoResp = await fetch(data.durl[0].url, { headers: { 'User-Agent': UA, 'Referer': 'https://www.bilibili.com/' }, redirect: 'follow' });
  if (!videoResp.ok) return { ok: false, error: '视频下载失败 HTTP ' + videoResp.status };
  var uploadResp = await fetch(dest, { method: 'PUT', headers: { 'Authorization': 'Basic ' + auth, 'User-Agent': UA, 'Content-Type': 'application/octet-stream', 'Overwrite': 'T' }, body: videoResp.body });
  var uploadOk = uploadResp.status >= 200 && uploadResp.status < 300;
  if (!uploadOk && (uploadResp.status === 405 || uploadResp.status === 409)) {
    uploadOk = await webdavFileExists(base, folder, filename, auth);
  }
  if (!uploadOk) return { ok: false, title: title, bvid: bvid, folder: folderRaw, error: 'WebDAV上传失败 HTTP ' + uploadResp.status };
  await addLog(env, 'info', '解析下载成功：' + title + ' -> ' + folderRaw);
  return { ok: true, title: title, bvid: bvid, folder: folderRaw };
}

async function parseBatchDownload(env, links) {
  var settings = await getSettings(env);
  var results = [];
  for (var i = 0; i < links.length; i++) results.push(await parseAndUploadVideo(settings, links[i], env));
  return results;
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = (url.pathname || '/').replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return json({ ok: true });

  if (path === '/api/settings' && method === 'GET') {
    const settings = await getSettings(env);
    return json({ ok: true, settings: settings });
  }

  if (path === '/api/settings' && method === 'POST') {
    const body = await readJson(request);
    if (!body) return json({ ok: false, error: '无效JSON' }, 400);
    const input = body.settings || body;
    const settings = await saveSettings(env, input);
    return json({ ok: true, settings: settings });
  }

  if (path === '/api/ups' && method === 'POST') {
    const body = await readJson(request);
    if (!body) return json({ ok: false, error: '无效JSON' }, 400);
    const mid = parseMid(body.mid || body.uid || body.url || '');
    if (!mid) return json({ ok: false, error: '无法识别UP主ID/空间链接' }, 400);
    const settings = await getSettings(env);
    if (settings.ups.some(function (u) { return u.mid === mid; })) {
      return json({ ok: false, error: '该UP主已存在' }, 400);
    }
    const id = (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
    const up = {
      id: id,
      mid: mid,
      name: String(body.name || '').trim(),
      monitorVideo: true,
      monitorDynamic: true,
      notify: true,
      download: true
    };
    settings.ups.push(up);
    await saveSettings(env, settings);
    return json({ ok: true, up: up });
  }

  if (path === '/api/ups/update' && method === 'POST') {
    const body = await readJson(request);
    if (!body || !body.id) return json({ ok: false, error: '缺少id' }, 400);
    const settings = await getSettings(env);
    const idx = settings.ups.findIndex(function (u) { return u.id === body.id; });
    if (idx < 0) return json({ ok: false, error: '未找到UP主' }, 404);
    const patch = body.patch || {};
    ['name', 'monitorVideo', 'monitorDynamic', 'notify', 'download'].forEach(function (k) {
      if (patch[k] !== undefined) settings.ups[idx][k] = patch[k];
    });
    await saveSettings(env, settings);
    return json({ ok: true, up: settings.ups[idx] });
  }

  if (path === '/api/ups/delete' && method === 'POST') {
    const body = await readJson(request);
    if (!body || (!body.id && !body.mid)) return json({ ok: false, error: '缺少id或mid' }, 400);
    const settings = await getSettings(env);
    settings.ups = settings.ups.filter(function (u) {
      if (body.id) return u.id !== body.id;
      return u.mid !== String(body.mid);
    });
    await saveSettings(env, settings);
    return json({ ok: true });
  }

  if (path === '/api/logs/clear' && method === 'POST') {
    const settings = await getSettings(env);
    if (env.BILI_MONITOR_D1) {
      try {
        await clearLogsFromD1(env);
        return json({ ok: true });
      } catch (e) {
        return json({ ok: false, error: String(e && e.message || e) }, 500);
      }
    }
  if (settings.logWebdavUrl) {
      try {
        await saveLogsToWebdav(settings, []);
        return json({ ok: true });
      } catch (e) {
        return json({ ok: false, error: String(e && e.message || e) }, 500);
      }
    }
    await env.BILI_MONITOR_KV.delete('logs');
    return json({ ok: true });
  }

  if (path === '/api/download-success' && method === 'GET') {
    if (env.BILI_MONITOR_D1) {
      try {
        var successRecords = await getDownloadSuccessD1(env);
        return json({ ok: true, records: successRecords });
      } catch (e) {
        return json({ ok: false, error: String(e && e.message || e) }, 500);
      }
    }
    return json({ ok: true, records: [] });
  }
  if (path === '/api/debug' && method === 'GET') {
    try {
      var debugData = await debugInfo(env);
      return json({ ok: true, debug: debugData });
    } catch (e) {
      return json({ ok: false, error: String(e && e.message || e) }, 500);
    }
  }

if (path === '/api/overview' && method === 'GET') {
    var overviewData = await overview(env);
    return json({ ok: true, latest: overviewData.latest });
  }

if (path === '/api/ups/clear-video' && method === 'POST') {
    const body = await readJson(request);
    if (!body || (!body.id && !body.mid)) return json({ ok: false, error: '缺少id或mid' }, 400);
    const settings = await getSettings(env);
    let mid = body.mid;
    if (!mid) {
      const up = settings.ups.find(function(u){ return u.id === body.id; });
      if (!up) return json({ ok: false, error: '未找到UP主' }, 404);
      mid = up.mid;
    }
    const last = await kvGet(env, 'lastSeen', {});
    const cur = last[mid] || {};
    cur.video = '';
    cur.videoTitle = '';
    last[mid] = cur;
    await kvPut(env, 'lastSeen', last);
    await addLog(env, 'info', '[' + String(mid) + '] 已清除视频与最新视频信息');
    return json({ ok: true });
  }

  if (path === '/api/ups/manual-download' && method === 'POST') {
    const body = await readJson(request);
    if (!body || (!body.id && !body.mid)) return json({ ok: false, error: '缺少id或mid' }, 400);
    const settings = await getSettings(env);
    let up = null;
    if (body.mid) up = settings.ups.find(function(u){ return u.mid === String(body.mid); });
    if (!up && body.id) up = settings.ups.find(function(u){ return u.id === body.id; });
    if (!up) return json({ ok: false, error: '未找到UP主' }, 404);
    const last = await kvGet(env, 'lastSeen', {});
    const seen = last[up.mid] || {};
    let bvid = seen.video || '';
    let title = seen.videoTitle || '';
    if (!bvid) {
      try {
        const data = await fetchVideos(up.mid, settings.cookie, settings.rsshubBase, env);
        const list = (data && data.data && data.data.list && data.data.list.vlist) || [];
        if (list.length) { bvid = list[0].bvid; title = list[0].title || bvid; }
      } catch (e) {
        return json({ ok: false, error: '获取最新视频失败：' + String(e.message || e) }, 500);
      }
    }
    if (!bvid) return json({ ok: false, error: '未获取到最新视频' }, 400);
    try {
      await downloadAndUploadVideo(settings, up, bvid, title || bvid, env, true);
      return json({ ok: true, bvid: bvid, title: title || bvid });
    } catch (e) {
      const msg = '手动下载失败：' + String(e.message || e);
      await addLog(env, 'error', msg);
      return json({ ok: false, error: msg }, 500);
    }
  }

if (path === '/api/download-progress' && method === 'GET') {
    var p = await readDlProgress(env);
    return json({ ok: true, progress: p });
  }

if (path === '/api/logs' && method === 'GET') {
    const settings = await getSettings(env);
    if (env.BILI_MONITOR_D1) {
      try {
        const logs = await getLogsFromD1(env);
        return json({ ok: true, logs: logs, source: 'd1' });
      } catch (e) {}
    }
  if (settings.logWebdavUrl) {
      try {
        const logs = await getLogsFromWebdav(settings);
        return json({ ok: true, logs: logs, source: 'webdav' });
      } catch (e) {
        return json({ ok: false, error: String(e && e.message || e), source: 'webdav' }, 500);
      }
    }
    var kvLogs = await kvGet(env, 'logs', []);
    return json({ ok: true, logs: kvLogs, source: 'kv' });
  }

  if (path === '/api/check' && method === 'POST') {
    try {
      const result = await checkAll(env);
      return json({ ok: true, result: result });
    } catch (e) {
      const msg = '手动检查失败：' + String(e && e.message || e);
      try { await addLog(env, 'error', msg); } catch (_) {}
      return json({ ok: false, error: msg }, 500);
    }
  }

  if (path === '/api/test-wecom' && method === 'POST') {
    const settings = await getSettings(env);
    if (!settings.wecomWebhook) return json({ ok: false, error: '未配置企业微信Webhook' }, 400);
    try {
      const detail = await sendWeCom(settings.wecomWebhook, '测试消息', 'B站监控', '这是一条测试通知', 'https://www.bilibili.com/', env);
      await addLog(env, 'info', '企微测试成功：' + JSON.stringify(detail || ''));
      return json({ ok: true, detail: detail || null });
    } catch (e) {
      const msg = String(e.message || e);
      await addLog(env, 'error', '企微测试失败：' + msg);
      return json({ ok: false, error: msg }, 500);
    }
  }

  if (path === '/api/test-webdav' && method === 'POST') {
    const settings = await getSettings(env);
    if (!settings.webdavUrl) return json({ ok: false, error: '未配置WebDAV地址' }, 400);
    try {
      const base = String(settings.webdavUrl).replace(/\/+$/, '');
      const auth = base64Encode((settings.webdavUser || '') + ':' + (settings.webdavPass || ''));
      const resp = await fetch(base, { method: 'PROPFIND', headers: { 'Authorization': 'Basic ' + auth, 'Depth': '0' } });
      if (resp.status < 200 || resp.status >= 300) throw new Error('HTTP ' + resp.status);
      return json({ ok: true });
    } catch (e) {
      return json({ ok: false, error: String(e.message || e) }, 500);
    }
  }

  if (path === '/api/parse-batch' && method === 'POST') {
    const body = await readJson(request);
    if (!body || !Array.isArray(body.links)) return json({ ok: false, error: '无效JSON或缺少links' }, 400);
    var links = body.links.map(function (x) { return String(x || '').trim(); }).filter(Boolean);
    if (!links.length) return json({ ok: false, error: '请输入至少一个视频链接' }, 400);
    try {
      var results = await parseBatchDownload(env, links);
      var okCount = results.filter(function (r) { return r.ok; }).length;
      return json({ ok: true, results: results, okCount: okCount });
    } catch (e) {
      return json({ ok: false, error: String(e && e.message || e) }, 500);
    }
  }

  return json({ ok: false, error: 'Not found' }, 404);
}

const UI_HTML = "<!doctype html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>B站UP主监控</title>\n<style>*{box-sizing:border-box}\nbody{margin:0;font-family:'Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,Roboto,'Microsoft YaHei',sans-serif;background:linear-gradient(135deg,#f2f6ff 0%,#f8fafd 42%,#eef3fb 100%);color:#1b2432;min-height:100vh}\nheader{background:linear-gradient(135deg,#141b2b 0%,#1f2a44 52%,#2f6fed 100%);color:#fff;padding:20px 28px;box-shadow:0 10px 26px rgba(18,25,45,.22)}\n.header-inner{max-width:1180px;margin:0 auto;display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap}\n.header-inner h1{margin:0;font-size:24px;letter-spacing:.3px;display:flex;align-items:center;gap:8px}\n.header-inner .sub{margin:5px 0 0;color:#c9d4ea;font-size:13px}\n.header-inner .ver{margin-left:8px;font-size:11px;font-weight:600;background:rgba(255,255,255,.16);padding:3px 9px;border-radius:999px}\n.tabs{max-width:1180px;margin:14px auto 0;display:flex;gap:10px}\n.tab{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.20);color:#eaf0fc;padding:9px 20px;border-radius:999px;font-size:14px;cursor:pointer;transition:background .18s,color .18s,transform .18s}\n.tab:hover{background:rgba(255,255,255,.20);transform:translateY(-1px)}\n.tab.active{background:#fff;color:#1e2a46;font-weight:700;box-shadow:0 8px 18px rgba(17,25,45,.16)}\n.wrap{max-width:1180px;margin:0 auto;padding:24px 22px 40px}\n.page{display:none}\n.page.active{display:block;animation:fadeIn .25s ease}\n@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\n.card{background:#fff;border:1px solid #e4eaf3;border-radius:18px;padding:22px;margin-bottom:18px;box-shadow:0 12px 32px rgba(25,38,72,.07);transition:border-color .18s,box-shadow .18s}\n.card:hover{border-color:#d5deed;box-shadow:0 16px 38px rgba(25,38,72,.10)}\n.card h2{margin:0 0 16px;font-size:18px;color:#172033;display:flex;align-items:center;gap:9px}\n.card h2::before{content:'';width:4px;height:18px;border-radius:999px;background:linear-gradient(180deg,#2f6fed,#58a0ff)}\nlabel{display:block;font-size:12px;color:#66728c;font-weight:600;margin:0 0 6px;letter-spacing:.2px}\ninput,textarea{width:100%;background:#fbfcff;border:1px solid #dce3ef;border-radius:11px;padding:10px 12px;font-size:14px;font-family:inherit;color:#20293a;transition:border-color .15s,box-shadow .15s,background .15s}\ntextarea{resize:vertical;min-height:76px;line-height:1.5}\ninput:focus,textarea:focus{outline:none;border-color:#2f6fed;background:#fff;box-shadow:0 0 0 3px rgba(47,111,237,.13)}\n.row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px}\n.check{display:flex;align-items:center;gap:8px;font-size:14px;color:#33415c;margin:10px 0}\n.check input{width:auto}\nbutton{background:linear-gradient(135deg,#2f6fed,#3478f5);color:#fff;border:0;border-radius:11px;padding:10px 17px;font-size:13px;font-weight:600;cursor:pointer;margin-top:10px;margin-right:6px;box-shadow:0 6px 15px rgba(47,111,237,.20);transition:transform .15s,box-shadow .15s,background .15s}\nbutton:hover{box-shadow:0 8px 18px rgba(47,111,237,.28);transform:translateY(-1px)}\nbutton.gray{background:#eef2f8;color:#3b475e;box-shadow:none}\nbutton.gray:hover{background:#e2e8f2}\nbutton:disabled{opacity:.55;cursor:not-allowed;transform:none}\ntable{width:100%;border-collapse:collapse;font-size:13px;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(22,31,56,.05)}\nth,td{padding:10px 9px;border-bottom:1px solid #edf1f7;text-align:left;vertical-align:middle}\nth{background:#f6f8fc;color:#53617b;font-weight:700;letter-spacing:.2px}\ntr:hover td{background:#fafcff}\n.log{max-height:380px;overflow:auto;background:#121720;color:#d9dfea;border:1px solid #2b3446;border-radius:12px;padding:13px;font:12px/1.6 Consolas,Menlo,monospace}\n.log div{padding:4px 0;border-bottom:1px solid #272f3e}\n.log .info{color:#8db7ff}\n.log .error{color:#ff8a8a}\n.toast{position:fixed;right:20px;bottom:20px;background:#1d2637;color:#fff;padding:11px 16px;border-radius:12px;box-shadow:0 12px 28px rgba(14,20,35,.22);opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;pointer-events:none;z-index:999}\n.toast.show{opacity:1;transform:translateY(0)}\n.parse-result{min-height:64px;max-height:340px;overflow:auto;background:#f8fafd;border:1px solid #e2e8f2;border-radius:12px;padding:12px;font:12px/1.6 Consolas,Menlo,monospace;white-space:pre-wrap;margin-top:14px}\n.muted{color:#8792a8;font-size:12px;margin:8px 0 0}\n@media (max-width:720px){.row{grid-template-columns:1fr}.header-inner{align-items:flex-start}.tabs{flex-wrap:wrap}}</style>\n</head>\n<body>\n<header><div class=\"header-inner\"><h1>📡 B站UP主监控 <span class=\"ver\">v1.2</span></h1><p class=\"sub\">UP主更新监控 · 视频解析下载</p></div><nav class=\"tabs\"><button class=\"tab active\" id=\"tab-monitor\" onclick=\"switchPage('monitor')\">监控</button><button class=\"tab\" id=\"tab-parser\" onclick=\"switchPage('parser')\">视频解析下载</button></nav></header>\n<div class=\"wrap page active\" id=\"page-monitor\">\n<div class=\"card\"><h2>全局设置</h2>\n<label>B站 Cookie（建议粘贴含 SESSDATA 的完整Cookie）</label>\n<textarea id=\"cookie\"></textarea>\n<div class=\"row\"><div><label>企业微信 Webhook</label><input id=\"wecomWebhook\" placeholder=\"https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...\"></div><div><label>下载接口前缀</label><input id=\"downloadApi\"></div></div>\n<div class=\"row\"><div><label>RSSHub 实例地址</label><textarea id=\"rsshubBase\" placeholder=\"每行一个地址，例如 https://rsshub.liumingye.cn\"></textarea></div><div></div></div>\n<div class=\"row\"><div><label>WebDAV 地址</label><input id=\"webdavUrl\" placeholder=\"https://dav.example.com/dav/\"></div><div><label>检查间隔（分钟）</label><input id=\"intervalMinutes\" type=\"number\" min=\"1\"></div></div>\n<div class=\"row\"><div><label>WebDAV 用户名</label><input id=\"webdavUser\"></div><div><label>WebDAV 密码</label><input id=\"webdavPass\" type=\"password\"></div></div>\n<div class=\"row\"><div><label>日志 WebDAV 文件完整地址</label><input id=\"logWebdavUrl\" placeholder=\"https://your-webdav/logs.json\"></div><div></div></div>\n<div class=\"row\"><div><label>下载成功日志 WebDAV 文件完整地址</label><input id=\"successLogWebdavUrl\" placeholder=\"https://your-webdav/download-success.json\"></div><div></div></div>\n<label class=\"check\"><input id=\"notifyOnFirstRun\" type=\"checkbox\"> 首次运行时也推送已存在的视频/动态</label>\n<button id=\"saveBtn\">保存设置</button> <button id=\"testWecomBtn\" class=\"gray\">测试企微</button> <button id=\"testWebdavBtn\" class=\"gray\">测试WebDAV</button>\n</div>\n<div class=\"card\"><h2>UP主管理</h2>\n<div class=\"row\"><div><label>UID 或空间链接</label><input id=\"newMid\" placeholder=\"例如 946974 或 https://space.bilibili.com/946974\"></div><div><label>名称（可选）</label><input id=\"newName\"></div></div>\n<button id=\"addBtn\">添加UP主</button>\n<table style=\"margin-top:14px\"><thead><tr><th>UP主</th><th>UID</th><th>最新视频</th><th>最新动态视频</th><th>视频</th><th>动态</th><th>通知</th><th>下载</th><th></th></tr></thead><tbody id=\"upList\"></tbody></table>\n</div>\n<div class=\"card\"><div style=\"display:flex;justify-content:space-between;align-items:center\"><h2>运行日志</h2><div><button id=\"runBtn\">立即检查</button> <button id=\"refreshLogsBtn\" class=\"gray\">刷新日志</button> <button id=\"clearLogsBtn\" class=\"gray\">清除日志</button> <button id=\"downloadSuccessBtn\" class=\"gray\">下载成功记录</button> <button id=\"debugBtn\" class=\"gray\">调试</button></div></div>\n<div id=\"logs\" class=\"log\">加载中...</div>\n<div id=\"debugBox\" style=\"display:none;white-space:pre-wrap;background:#0d1117;color:#d4d8e0;border-radius:8px;padding:12px;max-height:500px;overflow:auto;font:12px Consolas,Menlo,monospace;margin-top:10px\"></div>\n<div id=\"dlProgress\" style=\"display:none;white-space:pre-wrap;background:#0d1117;color:#8fb8ff;border-radius:8px;padding:10px 12px;font:13px Consolas,Menlo,monospace;margin-top:10px\"></div>\n</div>\n</div>\n<div class=\"wrap page\" id=\"page-parser\">\n<div class=\"card\"><h2>视频解析下载</h2>\n<label>B站视频链接（每行一个）</label>\n<textarea id=\"parseLinks\" placeholder=\"https://www.bilibili.com/video/BV...\"></textarea>\n<label>上传路径（每行一个，可选；留空则自动）</label>\n<textarea id=\"parseTargetPaths\" placeholder=\"例如 天翼/我的视频/视频/哔哩哔哩/UP主名称\"></textarea>\n<div class=\"row\"><div><label>解析接口前缀</label><input id=\"parseApiBase\"></div><div><label>默认文件夹</label><input id=\"parseDefaultFolder\" placeholder=\"默认\"></div></div>\n<div class=\"row\"><div><label>WebDAV 地址</label><input id=\"parseWebdavUrl\"></div><div></div></div>\n<div class=\"row\"><div><label>WebDAV 用户名</label><input id=\"parseWebdavUser\"></div><div><label>WebDAV 密码</label><input id=\"parseWebdavPass\" type=\"password\"></div></div>\n<p class=\"muted\">下载后优先存入对应UP主名称文件夹；不存在则存入默认文件夹。</p>\n<button id=\"saveParseSettingsBtn\" class=\"gray\">保存解析设置</button> <button id=\"parseBtn\">开始解析并下载</button>\n<div id=\"parseResult\" class=\"parse-result\"></div>\n</div>\n</div>\n<div id=\"toast\" class=\"toast\"></div>\n<script>\nvar state={settings:null,latest:{}};\nfunction $(id){return document.getElementById(id);}\nfunction on(id,evt,fn){var el=$(id);if(el){el.addEventListener(evt,fn);}}\nfunction toast(msg){var el=$(\"toast\");el.textContent=msg;el.className=\"toast show\";setTimeout(function(){el.className=\"toast\";},2200);}\nfunction api(path,opts){opts=opts||{};opts.headers=Object.assign({\"Content-Type\":\"application/json\"},opts.headers||{});return fetch(path,opts).then(function(r){return r.json();});}\nfunction collectSettings(){\n  function val(id, def){var el=document.getElementById(id); return el ? el.value : (def==null?'':def);}\n  function checked(id){var el=document.getElementById(id); return el ? !!el.checked : false;}\n  return {\n    cookie: val('cookie'),\n    wecomWebhook: val('wecomWebhook'),\n    downloadApi: val('downloadApi','https://bili.kedaya.gq/api/download?url='),\n    rsshubBase: val('rsshubBase','https://rsshub.liumingye.cn'),\n    webdavUrl: val('webdavUrl'),\n    webdavUser: val('webdavUser'),\n    webdavPass: val('webdavPass'),\n    logWebdavUrl: val('logWebdavUrl'),\n    successLogWebdavUrl: val('successLogWebdavUrl'),\n    mysqlHost: val('mysqlHost'),\n    mysqlPort: Number(val('mysqlPort','3306'))||3306,\n    mysqlUser: val('mysqlUser'),\n    mysqlPass: val('mysqlPass'),\n    mysqlDatabase: val('mysqlDatabase'),\n    mysqlTable: val('mysqlTable','bili_monitor_logs'),\n    intervalMinutes: Number(val('intervalMinutes','5'))||5,\n    notifyOnFirstRun: checked('notifyOnFirstRun'),\n    parseApiBase: val('parseApiBase','https://bili.kedaya.gq/api?url='),\n    parseWebdavUrl: val('parseWebdavUrl'),\n    parseWebdavUser: val('parseWebdavUser'),\n    parseWebdavPass: val('parseWebdavPass'),\n    parseDefaultFolder: val('parseDefaultFolder','默认'),\n    ups: state.settings ? state.settings.ups : []\n  };\n}\nfunction fillSettings(s){state.settings=s||{};function setVal(id,val){var el=document.getElementById(id);if(!el){return;}if(el.type==='checkbox'){el.checked=!!val;}else{el.value=(val===null||val===undefined)?'':val;}}setVal('cookie',s.cookie);setVal('wecomWebhook',s.wecomWebhook);setVal('downloadApi',s.downloadApi||'https://bili.kedaya.gq/api/download?url=');setVal('rsshubBase',s.rsshubBase||'https://rsshub.liumingye.cn');setVal('webdavUrl',s.webdavUrl);setVal('webdavUser',s.webdavUser);setVal('webdavPass',s.webdavPass);setVal('logWebdavUrl',s.logWebdavUrl);setVal('successLogWebdavUrl',s.successLogWebdavUrl||'');\nsetVal('mysqlHost',s.mysqlHost||'');\nsetVal('mysqlPort',s.mysqlPort||3306);\nsetVal('mysqlUser',s.mysqlUser||'');\nsetVal('mysqlPass',s.mysqlPass||'');\nsetVal('mysqlDatabase',s.mysqlDatabase||'');\nsetVal('mysqlTable',s.mysqlTable||'bili_monitor_logs');setVal('intervalMinutes',s.intervalMinutes||5);setVal('notifyOnFirstRun',s.notifyOnFirstRun);setVal('parseApiBase',s.parseApiBase||'https://bili.kedaya.gq/api?url=');setVal('parseWebdavUrl',s.parseWebdavUrl);setVal('parseWebdavUser',s.parseWebdavUser);setVal('parseWebdavPass',s.parseWebdavPass);setVal('parseDefaultFolder',s.parseDefaultFolder||'默认');try{renderUps();}catch(e){} }\nfunction makeTd(text){var td=document.createElement(\"td\");td.textContent=text;return td;}\nfunction makeCheck(checked,onChange){var td=document.createElement(\"td\");var input=document.createElement(\"input\");input.type=\"checkbox\";input.checked=!!checked;input.addEventListener(\"change\",function(e){onChange(e.target.checked);});td.appendChild(input);return td;}\nfunction updateUpFlag(id,field,val){var patch={};patch[field]=val;api(\"/api/ups/update\",{method:\"POST\",body:JSON.stringify({id:id,patch:patch})}).then(function(j){if(!j||!j.ok){toast(j&&j.error||\"更新失败\");return;}var u=(state.settings.ups||[]).find(function(x){return x.id===id;});if(u){u[field]=val;}renderUps();}).catch(function(){toast(\"更新失败\");});}\nfunction clearUpVideo(id,mid){if(!confirm(\"确认清除该UP主的视频与最新视频信息？\"))return;api(\"/api/ups/clear-video\",{method:\"POST\",body:JSON.stringify({id:id,mid:mid})}).then(function(j){if(j&&j.ok){toast(\"已清除\");loadOverview();}else{toast(j&&j.error||\"清除失败\");}}).catch(function(){toast(\"清除失败\");});}\nfunction manualDownload(id,mid){if(!confirm(\"手动下载当前UP主的最新视频？\"))return;var box=$(\"dlProgress\");box.style.display=\"block\";box.textContent=\"准备下载...\";var timer=setInterval(function(){api(\"/api/download-progress\").then(function(j){if(j&&j.ok&&j.progress){box.textContent=(j.progress.message||\"\")+(j.progress.percent?\" (\"+j.progress.percent+\"%)\":\"\");}}).catch(function(){});},1000);api(\"/api/ups/manual-download\",{method:\"POST\",body:JSON.stringify({id:id,mid:mid})}).then(function(j){clearInterval(timer);if(j&&j.ok){box.textContent=\"手动下载成功\";toast(\"手动下载成功\");}else{box.textContent=j&&j.error||\"下载失败\";toast(j&&j.error||\"下载失败\");}loadLogs();loadOverview();}).catch(function(){clearInterval(timer);box.textContent=\"下载请求失败\";toast(\"下载请求失败\");loadLogs();});}\nfunction renderUps(){var tb=$(\"upList\");tb.innerHTML=\"\";(state.settings.ups||[]).forEach(function(u){var tr=document.createElement(\"tr\");tr.appendChild(makeTd(u.name||\"未命名\"));tr.appendChild(makeTd(u.mid));var info=(state.latest&&state.latest[u.mid])||{};var latestTd=document.createElement('td');if(info.video){var a=document.createElement('a');a.textContent=info.videoTitle||info.video;a.href='https://www.bilibili.com/video/'+encodeURIComponent(info.video);a.target='_blank';a.rel='noopener';latestTd.appendChild(a);}else{latestTd.textContent='暂无';}var dynTd=document.createElement('td');if(info.dynVideo){var da=document.createElement('a');da.textContent=info.dynVideoTitle||info.dynVideo;da.href='https://www.bilibili.com/video/'+encodeURIComponent(info.dynVideo);da.target='_blank';da.rel='noopener';dynTd.appendChild(da);}else{dynTd.textContent='暂无';}tr.appendChild(latestTd);tr.appendChild(dynTd);tr.appendChild(makeCheck(u.monitorVideo!==false,function(v){u.monitorVideo=v;updateUpFlag(u.id,\"monitorVideo\",v);}));tr.appendChild(makeCheck(u.monitorDynamic!==false,function(v){u.monitorDynamic=v;updateUpFlag(u.id,\"monitorDynamic\",v);}));tr.appendChild(makeCheck(u.notify!==false,function(v){u.notify=v;updateUpFlag(u.id,\"notify\",v);}));tr.appendChild(makeCheck(u.download!==false,function(v){u.download=v;updateUpFlag(u.id,\"download\",v);}));var actTd=document.createElement(\"td\");var manualBtn=document.createElement(\"button\");manualBtn.textContent=\"手动下载\";manualBtn.className=\"gray\";manualBtn.style.marginTop=\"0\";manualBtn.style.marginRight=\"6px\";manualBtn.addEventListener(\"click\",function(){manualDownload(u.id,u.mid);});actTd.appendChild(manualBtn);var clearBtn=document.createElement(\"button\");clearBtn.textContent=\"清除视频信息\";clearBtn.className=\"gray\";clearBtn.style.marginTop=\"0\";clearBtn.style.marginRight=\"6px\";clearBtn.addEventListener(\"click\",function(){clearUpVideo(u.id,u.mid);});actTd.appendChild(clearBtn);var del=document.createElement(\"button\");del.textContent=\"删除\";del.className=\"gray\";del.style.marginTop=\"0\";del.addEventListener(\"click\",function(){deleteUp(u.id);});actTd.appendChild(del);tr.appendChild(actTd);tb.appendChild(tr);});}\nfunction debugNow(){var btn=$(\"debugBtn\");btn.disabled=true;var box=$(\"debugBox\");api(\"/api/debug\").then(function(j){if(!j||!j.ok){box.textContent=\"调试失败：\"+(j&&j.error||\"\");}else{box.textContent=JSON.stringify(j.debug||j,null,2);}box.style.display=\"block\";toast(j&&j.ok?\"调试完成\":\"调试失败\");}).catch(function(){box.textContent=\"调试请求失败\";box.style.display=\"block\";toast(\"调试请求失败\");}).finally(function(){btn.disabled=false;});}\nfunction loadOverview(){api(\"/api/overview\").then(function(j){if(j&&j.ok){state.latest=j.latest||{};renderUps();}}).catch(function(){});}\nfunction loadSettings(){api('/api/settings').then(function(j){if(j&&j.ok){fillSettings(j.settings||{});}else{toast((j&&j.error)||'加载失败');}}).catch(function(e){toast('加载失败：'+(e&&e.message||e));var db=document.getElementById('debugBox');if(db){db.style.display='block';db.textContent='全局设置加载失败：'+(e&&e.message||e);}});}\nfunction saveSettings(){var data=collectSettings();api(\"/api/settings\",{method:\"POST\",body:JSON.stringify(data)}).then(function(j){if(j.ok){toast(\"已保存\");state.settings=j.settings||data;renderUps();}else{toast(j.error||\"保存失败\");}}).catch(function(){toast(\"保存失败\");});}\nfunction addUp(){var mid=$(\"newMid\").value.trim();var name=$(\"newName\").value.trim();if(!mid){toast(\"请输入UID或链接\");return;}api(\"/api/ups\",{method:\"POST\",body:JSON.stringify({mid:mid,name:name})}).then(function(j){if(j.ok){toast(\"已添加\");$(\"newMid\").value=\"\";$(\"newName\").value=\"\";loadSettings();}else{toast(j.error||\"添加失败\");}}).catch(function(){toast(\"添加失败\");});}\nfunction deleteUp(id){if(!confirm(\"确认删除该UP主？\"))return;api(\"/api/ups/delete\",{method:\"POST\",body:JSON.stringify({id:id})}).then(function(j){if(j.ok){toast(\"已删除\");loadSettings();}else{toast(j.error||\"删除失败\");}}).catch(function(){toast(\"删除失败\");});}\nfunction runNow(){api(\"/api/check\",{method:\"POST\"}).then(function(j){toast(j.ok?\"检查完成\":(j.error||\"检查失败\"));loadLogs();loadOverview();}).catch(function(){toast(\"检查失败\");loadLogs();loadOverview();});}\nfunction testWecom(){var data=collectSettings();api(\"/api/test-wecom\",{method:\"POST\",body:JSON.stringify(data)}).then(function(j){toast(j.ok?\"企微测试成功\":(j.error||\"测试失败\"));loadLogs();}).catch(function(){toast(\"测试失败\");loadLogs();});}\nfunction testWebdav(){var data=collectSettings();api(\"/api/test-webdav\",{method:\"POST\",body:JSON.stringify(data)}).then(function(j){toast(j.ok?\"WebDAV连接成功\":(j.error||\"测试失败\"));}).catch(function(){toast(\"测试失败\");});}\nfunction clearLogs(){if(!confirm(\"确认清除所有运行日志？\"))return;api(\"/api/logs/clear\",{method:\"POST\"}).then(function(j){if(j.ok){toast(\"日志已清除\");loadLogs();}else{toast(j.error||\"清除失败\");}}).catch(function(){toast(\"清除失败\");});}\nfunction loadLogs(){api(\"/api/logs\").then(function(j){var box=$(\"logs\");box.innerHTML=\"\";if(!j||!j.ok){box.textContent=\"加载失败\";return;}var logs=j.logs||[];if(!logs.length){box.textContent=\"暂无日志\";return;}logs.forEach(function(l){var div=document.createElement(\"div\");div.className=l.level||\"info\";var t=new Date(l.t).toLocaleString(\"zh-CN\",{hour12:false});div.textContent=\"[\"+t+\"] \"+l.msg;box.appendChild(div);});}).catch(function(){var box=$(\"logs\");box.textContent=\"加载失败\";});}\n$(\"saveBtn\").addEventListener(\"click\",saveSettings);\n$(\"addBtn\").addEventListener(\"click\",addUp);\n$(\"runBtn\").addEventListener(\"click\",runNow);\n$(\"refreshLogsBtn\").addEventListener(\"click\",loadLogs);\n$(\"clearLogsBtn\").addEventListener(\"click\",clearLogs);\n$(\"debugBtn\").addEventListener(\"click\",debugNow);\n$(\"testWecomBtn\").addEventListener(\"click\",testWecom);\n$(\"testWebdavBtn\").addEventListener(\"click\",testWebdav);\nfunction switchPage(name){var tabs=document.querySelectorAll(\".tab\");tabs.forEach(function(t){t.classList.toggle(\"active\",t.id===\"tab-\"+name);});var pages=document.querySelectorAll(\".page\");pages.forEach(function(p){p.classList.toggle(\"active\",p.id===\"page-\"+name);});}\nfunction parseBatch(){var box=$('parseResult');var linksEl=$('parseLinks');var pathsEl=$('parseTargetPaths');var btn=$('parseBtn');if(!box||!linksEl||!pathsEl||!btn){toast('页面未就绪，请刷新后再试');return;}box.textContent='开始解析...';var links=linksEl.value.split(String.fromCharCode(10)).map(function(x){return x.trim();}).filter(Boolean);var paths=pathsEl.value.split(String.fromCharCode(10)).map(function(x){return x.trim();});if(!links.length){box.textContent='请至少输入一个视频链接';return;}var payload=links.map(function(url,i){return {url:url,targetPath:paths[i]||''};});btn.disabled=true;api('/api/parse-batch',{method:'POST',body:JSON.stringify({links:payload})}).then(function(j){if(!j||!j.ok){box.textContent=j&&j.error||'请求失败';return;}var lines=j.results.map(function(r){return (r.ok?'✅ ':'❌ ')+r.title+' | '+r.bvid+' | '+(r.folder||'')+(r.ok?'':(' | '+r.error));});box.textContent=lines.join(String.fromCharCode(10));toast(j.okCount+'/'+j.results.length+' 成功');}).catch(function(){box.textContent='请求失败';toast('请求失败');}).finally(function(){btn.disabled=false;});}\non(\"saveParseSettingsBtn\",\"click\",saveSettings);\non(\"parseBtn\",\"click\",parseBatch);\nfunction buildMysqlFields(){\nfunction fld(lbl,id,typ,ph){\nvar d=document.createElement('div');\nvar l=document.createElement('label');\nl.textContent=lbl;\nvar i=document.createElement('input');\ni.id=id;\nif(typ)i.type=typ;\nif(ph)i.placeholder=ph;\nd.appendChild(l);\nd.appendChild(i);\nreturn d;\n}\nvar btn=document.getElementById('saveBtn');\nif(!btn)return;\nvar box=btn.parentNode;\nvar r1=document.createElement('div');\nr1.className='row';\nr1.appendChild(fld('MySQL 地址','mysqlHost','','127.0.0.1'));\nr1.appendChild(fld('端口','mysqlPort','number','3306'));\nbox.insertBefore(r1,btn);\nvar r2=document.createElement('div');\nr2.className='row';\nr2.appendChild(fld('用户名','mysqlUser','',''));\nr2.appendChild(fld('密码','mysqlPass','password',''));\nbox.insertBefore(r2,btn);\nvar r3=document.createElement('div');\nr3.className='row';\nr3.appendChild(fld('数据库','mysqlDatabase','',''));\nr3.appendChild(fld('表名','mysqlTable','','bili_monitor_logs'));\nbox.insertBefore(r3,btn);\n}\nfunction loadDownloadSuccess(){api('/api/download-success').then(function(j){var m=document.createElement('div');m.id='downloadSuccessModal';m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:999';var b=document.createElement('div');b.style.cssText='background:#fff;border-radius:12px;width:min(980px,92vw);max-height:82vh;overflow:auto;padding:18px';var h=document.createElement('div');h.style.cssText='display:flex;justify-content:space-between;align-items:center;margin-bottom:12px';var t=document.createElement('h3');t.textContent='下载成功记录';var c=document.createElement('button');c.className='gray';c.textContent='关闭';c.onclick=function(){m.remove();};h.appendChild(t);h.appendChild(c);b.appendChild(h);var tb=document.createElement('table');tb.style.width='100%';var tr=document.createElement('tr');['时间','UP主','BV号','标题','视频链接','WebDAV路径'].forEach(function(x){var th=document.createElement('th');th.textContent=x;tr.appendChild(th);});tb.appendChild(tr);var body=document.createElement('tbody');tb.appendChild(body);if(!j||!j.ok){var row=document.createElement('tr');var td=document.createElement('td');td.colSpan=6;td.textContent=(j&&j.error)||'加载失败';row.appendChild(td);body.appendChild(row);}else{var rs=j.records||[];if(!rs.length){var row=document.createElement('tr');var td=document.createElement('td');td.colSpan=6;td.textContent='暂无记录';row.appendChild(td);body.appendChild(row);}else{rs.forEach(function(r){var row=document.createElement('tr');[new Date(r.t).toLocaleString('zh-CN',{hour12:false}),r.upName,r.bvid,r.title,r.videoUrl,r.webdavPath].forEach(function(v){var td=document.createElement('td');td.textContent=v||'';td.style.cssText='vertical-align:top;word-break:break-all';row.appendChild(td);});body.appendChild(row);});}}b.appendChild(tb);m.appendChild(b);document.body.appendChild(m);}).catch(function(){toast('加载下载成功记录失败');});}\non('downloadSuccessBtn','click',loadDownloadSuccess);\nloadSettings();loadLogs();loadOverview();setInterval(function(){loadLogs();loadOverview();},15000);\n</script>\n</body>\n</html>";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = (url.pathname || '/').replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/index.html' || path === '/ui') {
      return html(UI_HTML);
    }
    if (path.startsWith('/api/')) {
      return handleApi(request, env);
    }
    return json({ ok: false, error: 'Not found' }, 404);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(scheduledCheck(env));
  }
};
