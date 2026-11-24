// Storico per treno (dal 24.11.2026): per ogni treno di un giorno il ritardo a OGNI fermata e all'arrivo, dal registro dei ritardi
// (log/index.js, D1 «dl:<paese>:<ora>»; Svizzera: registro degli arrivi «rta:») unito all'orario del giorno, come tools/dl_day.js.
// Ritardo a una fermata = l'ultimo ritardo comunicato prima del passaggio (orario + ritardo noto); il registro legge ogni paese ogni ~7 minuti,
// quindi la precisione è di qualche minuto. Svizzera: il ritardo di ogni fermata dall'ultimo stato del feed ufficiale.
//   node tools/trn_build.js [AAAAMMGG] [--upload] [--only de,fr] [--dir cartella]   (giorno predefinito: ieri a Zurigo; serve SOCIAL_CRON_KEY)
// Archivio in D1 (tabella trn, PUT/GET /api/live/trn/<paese>/<fetta>), una fetta = JSON gzip:
//   { v: 1, cc, days: [giorni già elaborati (numero di giorno dal 1970)], t: { chiave: treno } }
//   treno = { n: nome, ids: [fermate], nm: [nomi], tm: [HHMM programmati], d0: primo giorno di f, f: [ritardo all'arrivo per giorno | null | -999 = soppresso],
//             a: { fermata: [[AAAAMM, somma, osservazioni, massimo, oltre 5 min], …] } (6 mesi), r: [[giorno, [ritardo per fermata], ids se diverse], …] (14 giorni) }
// Chiave del treno = js/trn.js (fermata di partenza | HHMM locale | fermata d'arrivo). Indice di ricerca i:<00..99> = [[paese, chiave, nome, da, a, HHMM, numero], …].
// Una copia identica sta nel repository pubblico trainGB (workflow dl-day.yml, dopo dl_day.js): se cambia, ricopiarla insieme a dl_day.js.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const D = require('./dl_day.js');
const SITE = process.env.SITE || 'https://railpulse.ch', KEY = process.env.SOCIAL_CRON_KEY || '';
const KEEP = 180, RECENT = 14, MONTHS = 6;
/*TRN*/
const TRN_N = { de: 128, uk: 64, fr: 48, it: 32, cz: 32, ch: 32, es: 24, pl: 24, nl: 24, be: 16, dk: 16, hu: 16, sk: 16, se: 16, no: 16, fi: 8, ro: 8, pt: 8, ie: 8, bg: 8, si: 8, lu: 8, lv: 8, gr: 8, ee: 8 };
const TRN_TZ = { uk: 'Europe/London', ie: 'Europe/Dublin', pt: 'Europe/Lisbon', fi: 'Europe/Helsinki', ee: 'Europe/Tallinn', lv: 'Europe/Riga', lt: 'Europe/Vilnius', ro: 'Europe/Bucharest', bg: 'Europe/Sofia', gr: 'Europe/Athens', ua: 'Europe/Kyiv', md: 'Europe/Chisinau', tr: 'Europe/Istanbul' };
const trnFmt = {};
function trnHm(cc, ms) {   // ora locale HHMM di un istante (ms)
  const tz = TRN_TZ[cc] || 'Europe/Zurich';
  const f = trnFmt[tz] || (trnFmt[tz] = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }));
  return f.format(new Date(ms)).replace(':', '');
}
function trnSid(s) { s = String(s); const h = s.indexOf('#'); return h < 0 ? s : s.slice(0, h); }
function trnKey(o, hm, d) { return trnSid(o) + '|' + hm + '|' + trnSid(d); }
function trnShard(cc, o, d) {
  const s = trnSid(o) + '|' + trnSid(d); let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % (TRN_N[cc] || 8);
}
function trnNum(name) { const m = String(name || '').replace(/^[^|]*\|/, '').match(/(\d+)\D*$/); return m ? +m[1] : null; }   // numero del treno: le ultime cifre del nome
function trnBucket(n) { return n == null ? '' : String(n % 100).padStart(2, '0'); }   // indice di ricerca: per le ultime due cifre
/*/TRN*/
const dayNum = (d) => Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8)) / 86400000;

// ritardo (minuti) a ogni fermata di una corsa del formato comune; null dove non c'è ancora nessun dato
function perStop(cc, r, reg, pos) {
  const n = Math.floor((r.length - 4) / 3), dep0 = (r[3] + r[6]) * 1000;
  for (const k of D.keysOf(cc, r)) {
    const ev = reg.get(k); if (!ev) continue;
    const dl = new Array(n).fill(null); let cur = null, e = 0, seen = false;
    for (let j = 0; j < n; j++) {
      const i = 4 + 3 * j, sched = (r[3] + (j === 0 ? r[i + 2] : r[i + 1])) * 1000;
      const lim = sched + Math.max(0, cur || 0) * 60000 + 120000;   // passaggio previsto (con il ritardo noto) + 2 minuti
      while (e < ev.length && ev[e][0] <= lim) {
        const [t, v] = ev[e++];
        if (t < dep0 - 3600000 || !v) continue;
        seen = true; if (v[1] === 'C') continue;
        const m = D.delayOf(cc, r, v, t, pos); if (m != null) cur = m;
      }
      dl[j] = cur;
    }
    if (seen) return dl;
  }
  return null;
}
// tutti i treni di un giorno, formato comune: [{ k, sh, n, ids, tm, f, c, dl }]
function trainsDay(cc, rows, reg, pos) {
  const out = [];
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 10) continue;
    const fin = D.finalOf(cc, r, reg, pos); if (fin.d == null && !fin.c) continue;   // nessun dato: non entra
    const ids = [], tm = [];
    for (let i = 4; i + 2 < r.length; i += 3) { ids.push(trnSid(r[i])); tm.push(trnHm(cc, (r[3] + (i === 4 ? r[i + 2] : r[i + 1])) * 1000)); }
    const o = ids[0], d = ids[ids.length - 1];
    out.push({ k: trnKey(o, tm[0], d), sh: trnShard(cc, o, d), n: String(r[2] || ''), ids, tm, f: fin.c ? -999 : fin.d, c: fin.c, dl: fin.c ? null : perStop(cc, r, reg, pos) });
  }
  return out;
}
// Svizzera: orario ?c=2 (stops [uic, nome, lat, lon]; trips [linea, categoria, destinazione, trip_id, [indice fermata, arrivo, partenza, seq …]] in secondi
// dalla mezzanotte di Zurigo) e registro degli arrivi (righe ["trip_id|AAAAMMGG", ora del feed, soppressa, [[seq, ritardo s], …]])
function trainsCh(tt, text, day) {
  const last = new Map();
  for (const l of text.split('\n')) {
    if (!l || l[0] !== '[') continue;
    let x; try { x = JSON.parse(l); } catch (e) { continue; }
    const k = String(x[0]), b = k.lastIndexOf('|'); if (b < 0 || k.slice(b + 1) !== day) continue;
    const id = k.slice(0, b), o = last.get(id); if (!o || x[1] >= o[1]) last.set(id, x);
  }
  const utc = Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8));
  const mid = utc - +new Date(utc).toLocaleString('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hour12: false }) * 3600000;
  const S = tt.stops || [], out = [];
  for (const t of tt.trips || []) {
    if (t[1] === 'BAT') continue;
    const x = last.get(String(t[3])); if (!x) continue;
    const f = t[4] || [], ids = [], tm = [], seqs = [];
    for (let i = 0; i + 3 < f.length; i += 4) { const s = S[f[i]]; ids.push(String(s ? s[0] : f[i])); tm.push(trnHm('ch', mid + (i === 0 ? f[i + 2] : f[i + 1]) * 1000)); seqs.push(f[i + 3]); }
    if (ids.length < 2) continue;
    const o = ids[0], d = ids[ids.length - 1], base = { k: trnKey(o, tm[0], d), sh: trnShard('ch', o, d), n: String(t[0] || t[1] || ''), ids, tm };
    if (x[2]) { out.push({ ...base, f: -999, c: true, dl: null }); continue; }
    const bySeq = new Map((x[3] || []).map((q) => [q[0], Math.round(q[1] / 60)])), dl = []; let cur = null;
    for (const q of seqs) { if (bySeq.has(q)) cur = bySeq.get(q); dl.push(cur); }
    const fin = dl[dl.length - 1]; if (fin == null || fin < -60 || fin > 600) continue;
    out.push({ ...base, f: fin, c: false, dl });
  }
  return out;
}
// unisce i treni del giorno a una fetta dell'archivio (funzione pura: provata in tests/run.js)
function merge(shard, list, day) {
  const dn = dayNum(day);
  if (shard.days.includes(dn)) return false;   // giorno già elaborato: le medie per fermata non vanno contate due volte
  shard.days = shard.days.concat(dn).filter((x) => x > dn - KEEP).sort((a, b) => a - b);
  const mon = +day.slice(0, 6);
  for (const x of list) {
    let t = shard.t[x.k];
    if (!t) t = shard.t[x.k] = { n: x.n, ids: x.ids, nm: [], tm: x.tm, d0: dn, f: [], a: {}, r: [] };
    if (dn >= t.d0 + t.f.length - 1 || !t.f.length) { t.n = x.n; t.ids = x.ids; t.tm = x.tm; }   // orario più recente
    if (dn < t.d0) { t.f = new Array(t.d0 - dn).fill(null).concat(t.f); t.d0 = dn; }
    while (t.f.length <= dn - t.d0) t.f.push(null);
    t.f[dn - t.d0] = x.f;
    if (x.dl) {
      x.ids.forEach((id, j) => {
        const v = x.dl[j]; if (v == null) return;
        const a = t.a[id] || (t.a[id] = []); let m = a.find((q) => q[0] === mon);
        if (!m) { m = [mon, 0, 0, -999, 0]; a.push(m); a.sort((p, q) => p[0] - q[0]); while (a.length > MONTHS) a.shift(); }
        m[1] += v; m[2]++; if (v > m[3]) m[3] = v; if (v > 5) m[4]++;
      });
      const same = x.ids.join() === t.ids.join();
      t.r = t.r.filter((q) => q[0] !== dn).concat([same ? [dn, x.dl] : [dn, x.dl, x.ids]]).sort((p, q) => p[0] - q[0]).slice(-RECENT);
    }
  }
  for (const [k, t] of Object.entries(shard.t)) {   // fuori dalla finestra di 180 giorni
    const cut = dn - KEEP + 1;
    if (t.d0 < cut) { t.f = t.f.slice(cut - t.d0); t.d0 = cut; }
    while (t.f.length && t.f[0] == null) { t.f.shift(); t.d0++; }
    if (!t.f.length) delete shard.t[k];
  }
  return true;
}
// nomi delle fermate (js/<paese>-stations.js «id|nome|lat|lon»)
async function namesOf(cc) {
  const f = path.join(__dirname, '..', 'js', cc + '-stations.js');
  const js = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : await (await get(SITE + '/js/' + cc + '-stations.js')).text();
  const m = new Map(), body = (/=\s*"([\s\S]*)"/.exec(js) || [])[1] || '';
  for (const l of body.split('\\n')) { const p = l.split('|'); if (p.length >= 4) m.set(p[0], p[1]); }
  return m;
}
async function get(url, auth) {
  const r = await fetch(url, { headers: { 'User-Agent': 'railpulse-tools', ...(auth ? { Authorization: 'Bearer ' + KEY } : {}) } });
  if (!r.ok) { const e = new Error(url + ' → HTTP ' + r.status); e.status = r.status; throw e; }
  return r;
}
async function readShard(name) {
  try { const buf = Buffer.from(await (await get(SITE + '/api/live/trn/' + name + '?x=' + Date.now())).arrayBuffer()); return JSON.parse(zlib.gunzipSync(buf).toString('utf8')); }
  catch (e) { if (e.status === 404) return null; throw e; }
}
async function putShard(name, obj) {
  const body = zlib.gzipSync(JSON.stringify(obj));
  if (body.length > 1900000) throw new Error(name + ': fetta troppo grande (' + body.length + ' byte)');
  const r = await fetch(SITE + '/api/live/trn/' + name, { method: 'PUT', body, headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/octet-stream', 'User-Agent': 'railpulse-tools' } });
  if (!r.ok) throw new Error(name + ' → PUT ' + r.status + ' ' + (await r.text()));
  return body.length;
}
async function main() {
  const args = process.argv.slice(2), dirI = args.indexOf('--dir'), dir = dirI >= 0 ? args[dirI + 1] : '', onlyI = args.indexOf('--only');
  const day = args.find((a) => /^\d{8}$/.test(a)) || new Date(Date.now() - 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' }).replace(/-/g, '');
  const up = args.includes('--upload'); if (up && !KEY) throw new Error('manca SOCIAL_CRON_KEY');
  const only = onlyI >= 0 ? args[onlyI + 1].split(',') : Object.keys(TRN_N);
  const index = {}; let wrote = 0, bytes = 0;
  for (const cc of only) {
    let list = null, names = new Map(), rows = 0;
    try {
      const tt = dir ? JSON.parse(fs.readFileSync(path.join(dir, 'tt-' + cc + '.json'), 'utf8')) : await (await get(SITE + '/api/live/tt/' + (cc === 'ch' ? day + '?c=2' : cc + '-' + day + '?v=1'))).json();
      const text = dir ? fs.readFileSync(path.join(dir, 'reg-' + cc + '.txt'), 'utf8') : await (await get(SITE + '/api/social/dl/' + cc + '/day/' + day, true)).text();
      list = cc === 'ch' ? trainsCh(tt, text, day) : trainsDay(cc, tt.t || [], D.parseReg(text), cc === 'gr' || cc === 'ee' ? await D.stationsOf(cc) : null);
      rows = cc === 'ch' ? (tt.trips || []).filter((t) => t[1] !== 'BAT').length : (tt.t || []).length;
      // meno del 15 % dei treni con un dato = orario o feed rotti quel giorno (come in dl_day.js): quel giorno non entra
      if (!D.usable([rows, list.length, 0])) { console.log(cc, 'escluso: solo', list.length, 'treni con un dato su', rows); list = null; }
      names = cc === 'ch' ? new Map((tt.stops || []).map((s) => [String(s[0]), s[1]])) : await namesOf(cc).catch(() => new Map());
    } catch (e) { console.log(cc, 'saltato:', e.message); }
    // anche un paese saltato oggi resta nell'indice di ricerca: le sue fette si leggono comunque
    const by = new Map(); for (const x of list || []) (by.get(x.sh) || by.set(x.sh, []).get(x.sh)).push(x);
    let ntr = 0;
    try {
      for (let sh = 0; sh < TRN_N[cc]; sh++) {
        const name = cc + '/' + sh;
        const shard = up ? (await readShard(name)) || { v: 1, cc, days: [], t: {} } : { v: 1, cc, days: [], t: {} };
        const changed = list ? merge(shard, by.get(sh) || [], day) : false;
        for (const [k, t] of Object.entries(shard.t)) {
          if (changed) t.nm = t.ids.map((id, j) => names.get(id) || t.nm[j] || id);
          const num = trnNum(t.n); if (num == null) continue; ntr++;
          (index[trnBucket(num)] || (index[trnBucket(num)] = [])).push([cc, k, t.n, t.nm[0], t.nm[t.nm.length - 1], t.tm[0], num]);
        }
        if (up && changed) { bytes += await putShard(name, shard); wrote++; }
      }
    } catch (e) { console.log(cc, 'archivio:', e.message); }
    console.log(cc, 'treni del giorno', list ? list.length : '-', 'su', rows, '· in archivio con numero', ntr);
  }
  if (up && only.length === Object.keys(TRN_N).length) for (let b = 0; b < 100; b++) { const bb = String(b).padStart(2, '0'); bytes += await putShard('i/' + bb, { v: 1, day, e: index[bb] || [] }); wrote++; }
  console.log('fette scritte', wrote, 'byte', bytes);
}
module.exports = { perStop, trainsDay, trainsCh, merge, dayNum };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
