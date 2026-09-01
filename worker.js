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
  return new Response(str, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
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
    out.push({ title: readTag('title'), link: readTag('link'), guid: readTag('guid'), description: readTag('description'), pubDate: readTag('pubDate') });
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
        var idMatch = String(link).match(/([0-9]{6,})/);
        var id = idMatch ? idMatch[1] : '';
        var bvid = extractBvid(link);
        var text = decodeXmlEntities(stripRssHtml(rssItems[k].title || rssItems[k].description || ''));
        var archive = null;
        if (bvid) archive = { bvid: bvid, title: decodeXmlEntities(stripRssHtml(rssItems[k].title || '')) };
        items.push({ id_str: id, id: id, type: '动态', modules: { module_author: { name: '' }, module_dynamic: { desc: { text: text }, major: { archive: archive } } } });
      }
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
  const cookie2 = await getFingerCookie(cookie);
  try {
    const url = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=' + encodeURIComponent(String(mid)) + '&timezone_offset=-480&features=itemOpusStyle';
    const resp = await fetch(url, { headers: biliHeaders(cookie2, 'https://space.bilibili.com/' + String(mid) + '/dynamic') });
    const data = await resp.json();
    if (data && data.code === 0 && data.data && data.data.items) return data;
  } catch (e) {}
  var rssRes = await fetchRssDynamics(mid, rsshubBase, env);
  return rssRes.data;
}

async function kvGet(env, key, def) {
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

async function addLog(env, level, msg) {
  const logs = await kvGet(env, 'logs', []);
  logs.unshift({ t: Date.now(), level: level, msg: String(msg) });
  if (logs.length > 200) logs.length = 200;
  await kvPut(env, 'logs', logs);
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

async function downloadAndUploadVideo(settings, up, bvid, title, env) {
  if (!settings.webdavUrl) throw new Error('未配置 WebDAV 地址');
  const videoUrl = 'https://www.bilibili.com/video/' + bvid;
  const apiUrl = settings.downloadApi + encodeURIComponent(videoUrl);
  const download = await fetch(apiUrl, { method: 'GET', redirect: 'follow', headers: { 'User-Agent': UA } });
  if (!download.ok) throw new Error('下载接口 HTTP ' + download.status);
  if (!download.body) throw new Error('下载接口未返回内容');
  const folder = encodeURIComponent(String(up.mid) + '_' + (up.name || up.mid));
  const filename = encodeURIComponent(bvid + '_' + sanitize(title) + '.mp4');
  const base = String(settings.webdavUrl).replace(/\/+$/, '');
  const dest = base + '/' + folder + '/' + filename;
  const auth = base64Encode((settings.webdavUser || '') + ':' + (settings.webdavPass || ''));
  const upload = await fetch(dest, {
    method: 'PUT',
    headers: { 'Authorization': 'Basic ' + auth, 'User-Agent': UA },
    body: download.body
  });
  if (upload.status < 200 || upload.status >= 300) throw new Error('WebDAV 上传失败 HTTP ' + upload.status);
  await addLog(env, 'info', '[' + (up.name || up.mid) + '] 已上传：' + bvid + '_' + sanitize(title) + '.mp4');
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
  const url = info.id ? 'https://t.bilibili.com/' + info.id : 'https://space.bilibili.com/' + String(up.mid) + '/dynamic';
  const text = info.text || info.type || '（无文字）';
  if (up.notify !== false && settings.wecomWebhook) {
    await sendWeCom(settings.wecomWebhook, '新动态', info.author || up.name || up.mid, text, url, env);
  }
  if (info.bvid && up.download !== false) {
    await downloadAndUploadVideo(settings, up, info.bvid, info.title || info.text || info.id, env);
  }
}

async function checkVideos(up, settings, old, next, result, env) {
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
  const fresh = [];
  for (const item of list) {
    if (item.bvid === old.video) break;
    fresh.push(item);
  }
  if (!fresh.length) return;
  for (let i = fresh.length - 1; i >= 0; i--) {
    const item = fresh[i];
    try {
      await handleVideo(item, up, settings, env);
      result.videos.push({ up: up.name || up.mid, bvid: item.bvid, title: item.title || '' });
    } catch (e) {
      const msg = '[' + (up.name || up.mid) + '] 视频处理失败：' + String(e.message || e);
      result.errors.push(msg);
      await addLog(env, 'error', msg);
    }
  }
  next.video = first.bvid;
  next.videoTitle = first.title || '';
}

async function checkDynamics(up, settings, old, next, result, env) {
  const data = await fetchDynamics(up.mid, settings.cookie, settings.rsshubBase, env);
  if (!data || data.code !== 0 || !data.data) throw new Error('动态接口风控：code ' + (data && data.code) + ' ' + (data && data.message || '返回异常') + '（请使用含 buvid3/buvid4/SESSDATA 的完整Cookie，并降低检查频率）');
  const items = data.data.items || [];
  const first = items[0];
  if (!first) return;
  const firstId = String(first.id_str || first.id || '');
  if (!old.dyn) {
    next.dyn = firstId;
    await addLog(env, 'info', '[' + (up.name || up.mid) + '] 首次成功解析，已记录动态基线');
    return;
  }
  const fresh = [];
  for (const item of items) {
    if (String(item.id_str || item.id || '') === old.dyn) break;
    fresh.push(item);
  }
  if (!fresh.length) return;
  for (let i = fresh.length - 1; i >= 0; i--) {
    const item = fresh[i];
    try {
      await handleDynamic(item, up, settings, env);
      result.dynamics.push({ up: up.name || up.mid, id: String(item.id_str || item.id || ''), type: item.type || '动态' });
    } catch (e) {
      const msg = '[' + (up.name || up.mid) + '] 动态处理失败：' + String(e.message || e);
      result.errors.push(msg);
      await addLog(env, 'error', msg);
    }
  }
  next.dyn = firstId;
}


async function rawFetch(url, opts) {
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
    latest[u.mid] = { video: s.video || '', videoTitle: s.videoTitle || '' };
  }
  return { latest: latest };
}
async function checkAll(env) {
  const settings = await getSettings(env);
  const oldMap = await kvGet(env, 'lastSeen', {});
  await addLog(env, 'info', '开始检查：' + settings.ups.length + ' 个UP主');
  const nextMap = {};
  const result = { videos: [], dynamics: [], errors: [] };
  for (const up of settings.ups) {
    const old = oldMap[up.mid] || {};
    nextMap[up.mid] = { video: old.video || '', videoTitle: old.videoTitle || '', dyn: old.dyn || '' };
    if (up.monitorVideo !== false) {
      try {
        await checkVideos(up, settings, old, nextMap[up.mid], result, env);
      } catch (e) {
        const msg = '[' + (up.name || up.mid) + '] 视频检查失败：' + String(e.message || e);
        result.errors.push(msg);
        await addLog(env, 'error', msg);
      }
    }
    if (up.monitorDynamic !== false) {
      try {
        await checkDynamics(up, settings, old, nextMap[up.mid], result, env);
      } catch (e) {
        const msg = '[' + (up.name || up.mid) + '] 动态检查失败：' + String(e.message || e);
        result.errors.push(msg);
        await addLog(env, 'error', msg);
      }
    }
  }
  await kvPut(env, 'lastSeen', nextMap);
  await addLog(env, 'info', '检查完成：视频 ' + result.videos.length + '，动态 ' + result.dynamics.length + '，错误 ' + result.errors.length);
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
    await env.BILI_MONITOR_KV.delete('logs');
    return json({ ok: true });
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

if (path === '/api/logs' && method === 'GET') {
    const logs = await kvGet(env, 'logs', []);
    return json({ ok: true, logs: logs });
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

  return json({ ok: false, error: 'Not found' }, 404);
}

const UI_HTML = [
"<!doctype html>",
"<html lang=\"zh-CN\">",
"<head>",
"<meta charset=\"utf-8\">",
"<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
"<title>B站UP主监控</title>",
"<style>",
"*{box-sizing:border-box}",
"body{margin:0;font-family:system-ui,Segoe UI,Microsoft YaHei,Arial,sans-serif;background:#f5f6f8;color:#202124}",
"header{background:#262a33;color:#fff;padding:18px 26px}",
"h1{margin:0;font-size:22px}",
".wrap{max-width:1000px;margin:22px auto;padding:0 16px}",
".card{background:#fff;border:1px solid #e2e5eb;border-radius:10px;padding:18px;margin-bottom:16px;box-shadow:0 1px 2px rgba(30,34,40,.04)}",
".card h2{margin:0 0 12px;font-size:17px}",
"label{display:block;font-size:13px;color:#555;margin-bottom:5px}",
"input,textarea{width:100%;padding:9px 10px;border:1px solid #ccd0d8;border-radius:6px;font-size:14px;font-family:inherit}",
"textarea{resize:vertical;min-height:70px}",
".row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px}",
".check{display:flex;align-items:center;gap:6px;font-size:14px;margin:8px 0}",
".check input{width:auto}",
"button{background:#2f6fed;color:#fff;border:0;border-radius:6px;padding:9px 14px;font-size:14px;cursor:pointer;margin-top:10px;margin-right:6px}",
"button:hover{background:#1f5ed8}",
"button.gray{background:#5f6672}",
"button.gray:hover{background:#4c525e}",
"button:disabled{opacity:.55;cursor:not-allowed}",
"table{width:100%;border-collapse:collapse;font-size:13px}",
"th,td{padding:8px;border-bottom:1px solid #e9ecf0;text-align:left;vertical-align:middle}",
"th{color:#555;font-weight:600;background:#fafbfc}",
".log{max-height:380px;overflow:auto;background:#171a21;color:#d4d8e0;border-radius:8px;padding:12px;font-size:12px;font-family:Consolas,Menlo,monospace}",
".log div{padding:3px 0;border-bottom:1px solid #272b35}",
".log .error{color:#ff8080}.log .info{color:#8fb8ff}",
".toast{position:fixed;right:18px;bottom:18px;background:#20242c;color:#fff;padding:10px 14px;border-radius:8px;opacity:0;transition:opacity .2s;pointer-events:none}",
".toast.show{opacity:1}",
"</style>",
"</head>",
"<body>",
"<header><h1>📡 B站UP主监控</h1></header>",
"<div class=\"wrap\">",
"<div class=\"card\"><h2>全局设置</h2>",
"<label>B站 Cookie（建议粘贴含 SESSDATA 的完整Cookie）</label>",
"<textarea id=\"cookie\"></textarea>",
"<div class=\"row\"><div><label>企业微信 Webhook</label><input id=\"wecomWebhook\" placeholder=\"https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...\"></div><div><label>下载接口前缀</label><input id=\"downloadApi\"></div></div>",
"<div class=\"row\"><div><label>RSSHub 实例地址</label><textarea id=\"rsshubBase\" placeholder=\"每行一个地址，例如 https://rsshub.liumingye.cn\"></textarea></div><div></div></div>",
"<div class=\"row\"><div><label>WebDAV 地址</label><input id=\"webdavUrl\" placeholder=\"https://dav.example.com/dav/\"></div><div><label>检查间隔（分钟）</label><input id=\"intervalMinutes\" type=\"number\" min=\"1\"></div></div>",
"<div class=\"row\"><div><label>WebDAV 用户名</label><input id=\"webdavUser\"></div><div><label>WebDAV 密码</label><input id=\"webdavPass\" type=\"password\"></div></div>",
"<label class=\"check\"><input id=\"notifyOnFirstRun\" type=\"checkbox\"> 首次运行时也推送已存在的视频/动态</label>",
"<button id=\"saveBtn\">保存设置</button> <button id=\"testWecomBtn\" class=\"gray\">测试企微</button> <button id=\"testWebdavBtn\" class=\"gray\">测试WebDAV</button>",
"</div>",
"<div class=\"card\"><h2>UP主管理</h2>",
"<div class=\"row\"><div><label>UID 或空间链接</label><input id=\"newMid\" placeholder=\"例如 946974 或 https://space.bilibili.com/946974\"></div><div><label>名称（可选）</label><input id=\"newName\"></div></div>",
"<button id=\"addBtn\">添加UP主</button>",
"<table style=\"margin-top:14px\"><thead><tr><th>UP主</th><th>UID</th><th>最新视频</th><th>视频</th><th>动态</th><th>通知</th><th>下载</th><th></th></tr></thead><tbody id=\"upList\"></tbody></table>",
"</div>",
"<div class=\"card\"><div style=\"display:flex;justify-content:space-between;align-items:center\"><h2>运行日志</h2><div><button id=\"runBtn\">立即检查</button> <button id=\"refreshLogsBtn\" class=\"gray\">刷新日志</button> <button id=\"clearLogsBtn\" class=\"gray\">清除日志</button> <button id=\"debugBtn\" class=\"gray\">调试</button></div></div>",
"<div id=\"logs\" class=\"log\">加载中...</div>",
"<div id=\"debugBox\" style=\"display:none;white-space:pre-wrap;background:#0d1117;color:#d4d8e0;border-radius:8px;padding:12px;max-height:500px;overflow:auto;font:12px Consolas,Menlo,monospace;margin-top:10px\"></div>",
"</div>",
"</div>",
"<div id=\"toast\" class=\"toast\"></div>",
"<script>",
"var state={settings:null,latest:{}};",
"function $(id){return document.getElementById(id);}",
"function toast(msg){var el=$(\"toast\");el.textContent=msg;el.className=\"toast show\";setTimeout(function(){el.className=\"toast\";},2200);}",
"function api(path,opts){opts=opts||{};opts.headers=Object.assign({\"Content-Type\":\"application/json\"},opts.headers||{});return fetch(path,opts).then(function(r){return r.json();});}",
"function collectSettings(){return {cookie:$(\"cookie\").value,wecomWebhook:$(\"wecomWebhook\").value,downloadApi:$(\"downloadApi\").value,rsshubBase:$(\"rsshubBase\").value,webdavUrl:$(\"webdavUrl\").value,webdavUser:$(\"webdavUser\").value,webdavPass:$(\"webdavPass\").value,intervalMinutes:Number($(\"intervalMinutes\").value)||5,notifyOnFirstRun:!!$(\"notifyOnFirstRun\").checked,ups:state.settings?state.settings.ups:[]};}",
"function fillSettings(s){state.settings=s;$(\"cookie\").value=s.cookie||\"\";$(\"wecomWebhook\").value=s.wecomWebhook||\"\";$(\"downloadApi\").value=s.downloadApi||\"https://bili.kedaya.gq/api/download?url=\";$(\"rsshubBase\").value=s.rsshubBase||\"https://rsshub.liumingye.cn\";$(\"webdavUrl\").value=s.webdavUrl||\"\";$(\"webdavUser\").value=s.webdavUser||\"\";$(\"webdavPass\").value=s.webdavPass||\"\";$(\"intervalMinutes\").value=s.intervalMinutes||5;$(\"notifyOnFirstRun\").checked=!!s.notifyOnFirstRun;renderUps();}",
"function makeTd(text){var td=document.createElement(\"td\");td.textContent=text;return td;}",
"function makeCheck(checked,onChange){var td=document.createElement(\"td\");var input=document.createElement(\"input\");input.type=\"checkbox\";input.checked=!!checked;input.addEventListener(\"change\",function(e){onChange(e.target.checked);});td.appendChild(input);return td;}",
"function updateUpFlag(id,field,val){var patch={};patch[field]=val;api(\"/api/ups/update\",{method:\"POST\",body:JSON.stringify({id:id,patch:patch})}).then(function(j){if(!j||!j.ok){toast(j&&j.error||\"更新失败\");return;}var u=(state.settings.ups||[]).find(function(x){return x.id===id;});if(u){u[field]=val;}renderUps();}).catch(function(){toast(\"更新失败\");});}",
"function clearUpVideo(id,mid){if(!confirm(\"确认清除该UP主的视频与最新视频信息？\"))return;api(\"/api/ups/clear-video\",{method:\"POST\",body:JSON.stringify({id:id,mid:mid})}).then(function(j){if(j&&j.ok){toast(\"已清除\");loadOverview();}else{toast(j&&j.error||\"清除失败\");}}).catch(function(){toast(\"清除失败\");});}",
"function renderUps(){var tb=$(\"upList\");tb.innerHTML=\"\";(state.settings.ups||[]).forEach(function(u){var tr=document.createElement(\"tr\");tr.appendChild(makeTd(u.name||\"未命名\"));tr.appendChild(makeTd(u.mid));var info=(state.latest&&state.latest[u.mid])||{};var latestTd=document.createElement(\"td\");if(info.video){var a=document.createElement(\"a\");a.textContent=info.videoTitle||info.video;a.href=\"https://www.bilibili.com/video/\"+encodeURIComponent(info.video);a.target=\"_blank\";a.rel=\"noopener\";latestTd.appendChild(a);}else{latestTd.textContent=\"暂无\";}tr.appendChild(latestTd);tr.appendChild(makeCheck(u.monitorVideo!==false,function(v){u.monitorVideo=v;updateUpFlag(u.id,\"monitorVideo\",v);}));tr.appendChild(makeCheck(u.monitorDynamic!==false,function(v){u.monitorDynamic=v;updateUpFlag(u.id,\"monitorDynamic\",v);}));tr.appendChild(makeCheck(u.notify!==false,function(v){u.notify=v;updateUpFlag(u.id,\"notify\",v);}));tr.appendChild(makeCheck(u.download!==false,function(v){u.download=v;updateUpFlag(u.id,\"download\",v);}));var actTd=document.createElement(\"td\");var clearBtn=document.createElement(\"button\");clearBtn.textContent=\"清除视频信息\";clearBtn.className=\"gray\";clearBtn.style.marginTop=\"0\";clearBtn.style.marginRight=\"6px\";clearBtn.addEventListener(\"click\",function(){clearUpVideo(u.id,u.mid);});actTd.appendChild(clearBtn);var del=document.createElement(\"button\");del.textContent=\"删除\";del.className=\"gray\";del.style.marginTop=\"0\";del.addEventListener(\"click\",function(){deleteUp(u.id);});actTd.appendChild(del);tr.appendChild(actTd);tb.appendChild(tr);});}",
"function debugNow(){var btn=$(\"debugBtn\");btn.disabled=true;var box=$(\"debugBox\");api(\"/api/debug\").then(function(j){if(!j||!j.ok){box.textContent=\"调试失败：\"+(j&&j.error||\"\");}else{box.textContent=JSON.stringify(j.debug||j,null,2);}box.style.display=\"block\";toast(j&&j.ok?\"调试完成\":\"调试失败\");}).catch(function(){box.textContent=\"调试请求失败\";box.style.display=\"block\";toast(\"调试请求失败\");}).finally(function(){btn.disabled=false;});}",
"function loadOverview(){api(\"/api/overview\").then(function(j){if(j&&j.ok){state.latest=j.latest||{};renderUps();}}).catch(function(){});}",
"function loadSettings(){api(\"/api/settings\").then(function(j){if(j&&j.ok){fillSettings(j.settings||{});}else{toast((j&&j.error)||\"加载失败\");}}).catch(function(){toast(\"加载失败\");});}",
"function saveSettings(){var data=collectSettings();api(\"/api/settings\",{method:\"POST\",body:JSON.stringify(data)}).then(function(j){if(j.ok){toast(\"已保存\");state.settings=j.settings||data;renderUps();}else{toast(j.error||\"保存失败\");}}).catch(function(){toast(\"保存失败\");});}",
"function addUp(){var mid=$(\"newMid\").value.trim();var name=$(\"newName\").value.trim();if(!mid){toast(\"请输入UID或链接\");return;}api(\"/api/ups\",{method:\"POST\",body:JSON.stringify({mid:mid,name:name})}).then(function(j){if(j.ok){toast(\"已添加\");$(\"newMid\").value=\"\";$(\"newName\").value=\"\";loadSettings();}else{toast(j.error||\"添加失败\");}}).catch(function(){toast(\"添加失败\");});}",
"function deleteUp(id){if(!confirm(\"确认删除该UP主？\"))return;api(\"/api/ups/delete\",{method:\"POST\",body:JSON.stringify({id:id})}).then(function(j){if(j.ok){toast(\"已删除\");loadSettings();}else{toast(j.error||\"删除失败\");}}).catch(function(){toast(\"删除失败\");});}",
"function runNow(){api(\"/api/check\",{method:\"POST\"}).then(function(j){toast(j.ok?\"检查完成\":(j.error||\"检查失败\"));loadLogs();loadOverview();}).catch(function(){toast(\"检查失败\");loadLogs();loadOverview();});}",
"function testWecom(){var data=collectSettings();api(\"/api/test-wecom\",{method:\"POST\",body:JSON.stringify(data)}).then(function(j){toast(j.ok?\"企微测试成功\":(j.error||\"测试失败\"));loadLogs();}).catch(function(){toast(\"测试失败\");loadLogs();});}",
"function testWebdav(){var data=collectSettings();api(\"/api/test-webdav\",{method:\"POST\",body:JSON.stringify(data)}).then(function(j){toast(j.ok?\"WebDAV连接成功\":(j.error||\"测试失败\"));}).catch(function(){toast(\"测试失败\");});}",
"function clearLogs(){if(!confirm(\"确认清除所有运行日志？\"))return;api(\"/api/logs/clear\",{method:\"POST\"}).then(function(j){if(j.ok){toast(\"日志已清除\");loadLogs();}else{toast(j.error||\"清除失败\");}}).catch(function(){toast(\"清除失败\");});}",
"function loadLogs(){api(\"/api/logs\").then(function(j){var box=$(\"logs\");box.innerHTML=\"\";if(!j||!j.ok){box.textContent=\"加载失败\";return;}var logs=j.logs||[];if(!logs.length){box.textContent=\"暂无日志\";return;}logs.forEach(function(l){var div=document.createElement(\"div\");div.className=l.level||\"info\";var t=new Date(l.t).toLocaleString(\"zh-CN\",{hour12:false});div.textContent=\"[\"+t+\"] \"+l.msg;box.appendChild(div);});}).catch(function(){var box=$(\"logs\");box.textContent=\"加载失败\";});}",
"$(\"saveBtn\").addEventListener(\"click\",saveSettings);",
"$(\"addBtn\").addEventListener(\"click\",addUp);",
"$(\"runBtn\").addEventListener(\"click\",runNow);",
"$(\"refreshLogsBtn\").addEventListener(\"click\",loadLogs);",
"$(\"clearLogsBtn\").addEventListener(\"click\",clearLogs);",
"$(\"debugBtn\").addEventListener(\"click\",debugNow);",
"$(\"testWecomBtn\").addEventListener(\"click\",testWecom);",
"$(\"testWebdavBtn\").addEventListener(\"click\",testWebdav);",
"loadSettings();loadLogs();loadOverview();setInterval(function(){loadLogs();loadOverview();},15000);",
"</script>",
"</body>",
"</html>"
].join(String.fromCharCode(10));

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
