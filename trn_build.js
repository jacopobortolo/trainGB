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
const TRN_N = { de: 128, uk: 64, fr: 48, it: 32, cz: 32, ch: 32, es: 24, pl: 24, nl: 24, be: 16, dk: 16, hu: 16, sk: 16, se: 16, no: 16, fi: 8, ro: 8, pt: 8, ie: 8, bg: 8, si: 8, lu: 8, lv: 8, gr: 8, ee: 8, at: 16, hr: 8 };   // NON cambiare i numeri esistenti: le fette gia scritte finirebbero nel posto sbagliato
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
// Germania: l'orario di gtfs.de ha solo la linea («RE17»); il numero del treno arriva da DB OpenBoards (tools/de_rt.py) come terzo campo del valore nel registro
function numOf(cc, r, reg) {
  if (cc === 'no') { const m = /^no:(VYG|GOA|SJN):ServiceJourney:(\d+)[-_]/.exec(String(r[0])); return m ? +m[2] : null; }   // Norvegia: il nome è la linea («F4»), il numero sta nel codice → «F4 601» (dal 25.11.2026)
  if (cc !== 'de') return null;
  for (const k of D.keysOf(cc, r)) for (const [, v] of reg.get(k) || []) if (v && typeof v[2] === 'number' && v[2] > 0) return v[2];
  return null;
}
// tutti i treni di un giorno, formato comune: [{ k, sh, n, ids, tm, f, c, dl }]
function trainsDay(cc, rows, reg, pos) {
  const out = [];
  if (cc === 'uk') D.joinUk(rows, reg);   // bacheche + istantanea oraria, in ordine di tempo (tools/dl_day.js)
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 10) continue;
    const fin = D.finalOf(cc, r, reg, pos); if (fin.d == null && !fin.c) continue;   // nessun dato: non entra
    const ids = [], tm = [];
    for (let i = 4; i + 2 < r.length; i += 3) { ids.push(trnSid(r[i])); tm.push(trnHm(cc, (r[3] + (i === 4 ? r[i + 2] : r[i + 1])) * 1000)); }
    const o = ids[0], d = ids[ids.length - 1];
    let n = String(r[2] || ''); const jn = numOf(cc, r, reg); if (jn && trnNum(n) !== jn) n += ' ' + jn;   // «RE17 10429»: si cerca per numero
    // all'ultima fermata vale il ritardo all'arrivo (anche i dati comunicati subito dopo l'arrivo, come in dl_day.js): prima l'ultima fermata mostrava
    // l'ultima previsione prima del passaggio (REG 12590 del 23.11: +15 a Roma Termini, arrivo +13)
    const dl = fin.c ? null : perStop(cc, r, reg, pos); if (dl && fin.d != null) dl[dl.length - 1] = fin.d;
    out.push({ k: trnKey(o, tm[0], d), sh: trnShard(cc, o, d), n, ids, tm, f: fin.c ? -999 : fin.d, c: fin.c, dl });
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
// toglie da una fetta il contributo di un giorno (ritardo all'arrivo, medie per fermata del mese, corsa recente): serve a rifare un giorno provvisorio.
// Il ritardo massimo per fermata del mese (m[3]) non si può togliere e resta.
function unmerge(shard, dn, mon) {
  for (const t of Object.values(shard.t)) {
    if (dn >= t.d0 && dn < t.d0 + t.f.length) t.f[dn - t.d0] = null;
    const q = (t.r || []).find((x) => x[0] === dn); if (!q) continue;
    (q[2] || t.ids).forEach((id, j) => {
      const v = q[1][j], m = v == null ? null : (t.a[id] || []).find((z) => z[0] === mon); if (!m) return;
      m[1] -= v; m[2]--; if (v > 5) m[4]--;
    });
    t.r = t.r.filter((x) => x[0] !== dn);
  }
}
// unisce i treni del giorno a una fetta dell'archivio (funzione pura: provata in tests/run.js)
// final = passaggio di mezzogiorno (dal 25.11.2026): un giorno entrato di notte come provvisorio (shard.prov) viene tolto e rimesso con i dati completi
function merge(shard, list, day, final = true, redo = false) {   // redo: rifà anche un giorno definitivo (correzioni a mano dei dati, --redo)
  const dn = dayNum(day), mon = +day.slice(0, 6);
  shard.prov = shard.prov || [];
  if (shard.days.includes(dn)) {   // giorno già elaborato: le medie per fermata non vanno contate due volte
    if (!final || !(redo || shard.prov.includes(dn))) return false;
    unmerge(shard, dn, mon);
  }
  shard.days = shard.days.concat(dn).filter((x, i, a) => x > dn - KEEP && a.indexOf(x) === i).sort((a, b) => a - b);
  shard.prov = shard.prov.filter((x) => x !== dn && shard.days.includes(x)); if (!final) shard.prov.push(dn);
  const seen = new Set();
  for (const x of list) {
    if (seen.has(x.k)) continue; seen.add(x.k);   // due righe d'orario con la stessa chiave (partenza|ora|arrivo): una sola, o le medie per fermata contano doppio
    let t = shard.t[x.k];
    if (!t) t = shard.t[x.k] = { n: x.n, ids: x.ids, nm: [], tm: x.tm, d0: dn, f: [], a: {}, r: [] };
    if (dn >= t.d0 + t.f.length - 1 || !t.f.length) {   // orario più recente
      if (t.ids.join() !== x.ids.join()) for (const q of t.r || []) if (!q[2]) q[2] = t.ids;   // le corse recenti scritte senza fermate valevano per le fermate di prima
      t.n = x.n; t.ids = x.ids; t.tm = x.tm;
    }
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
// ---- curiosità e record per /stats (dal 24.11.2026): numeri di un giorno per paese, poi riassunti su 7 e 28 giorni (tt:factsraw → tt:facts) ----
const catOf = (n) => { const s = String(n || ''), i = s.indexOf('|'); if (i > 0) return s.slice(0, i); const m = s.match(/^[A-Za-zÀ-ž]+/); return m ? m[0] : ''; };   // gestore se c'è, altrimenti la categoria (TGV, RE, AVE…)
const mOf = (hm) => +String(hm).slice(0, 2) * 60 + +String(hm).slice(2);
// zone dei paesi (js/eu-regions.js, tools/build_eu_regions.py): ogni fermata alla sua zona, per la mappa della puntualità
let REG = null;
async function regions() {
  if (REG) return REG;
  const f = path.join(__dirname, '..', 'js', 'eu-regions.js');
  const js = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : await (await get(SITE + '/js/eu-regions.js')).text();
  REG = JSON.parse(js.slice(js.indexOf('{', js.indexOf('TB_EUREG')), js.lastIndexOf('};') + 1));
  return REG;
}
function pip(x, y, r) { let c = false; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) { const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
// funzione id fermata → id zona (o null) per un paese; pos = id → [lat, lon]
function zoneFinder(zones, pos) {
  const Z = (zones || []).map((z) => { const rings = z.slice(2); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const r of rings) for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } return { id: z[0], rings, bb: [x0, y0, x1, y1] }; });
  const memo = new Map();
  return (id) => {
    if (memo.has(id)) return memo.get(id);
    const p = pos && pos.get(id); let hit = null;
    if (p) for (const z of Z) { if (p[1] < z.bb[0] || p[1] > z.bb[2] || p[0] < z.bb[1] || p[0] > z.bb[3]) continue; if (z.rings.some((r) => pip(p[1], p[0], r))) { hit = z.id; break; } }
    memo.set(id, hit); return hit;
  };
}
// un giorno di un paese: h = 24 ore di arrivo [corse, minuti, oltre 5]; op = per gestore o tipo [corse, minuti, oltre 5, soppresse];
// st = fermate dove il ritardo cresce [id, nome, minuti guadagnati, passaggi, passaggi con +3 o più]; rg = per zona [passaggi, entro 5 min, minuti]
function dayFacts(list, names, zoneOf) {
  const h = Array.from({ length: 24 }, () => [0, 0, 0]), op = {}, st = new Map(), rg = {};
  for (const x of list) {
    const c = catOf(x.n), o = c ? (op[c] || (op[c] = [0, 0, 0, 0])) : null;
    if (x.f === -999) { if (o) o[3]++; continue; }
    const d = Math.max(0, x.f), hr = Math.floor(mOf(x.tm[x.tm.length - 1]) / 60) % 24;
    h[hr][0]++; h[hr][1] += d; if (d > 5) h[hr][2]++;
    if (o) { o[0]++; o[1] += d; if (d > 5) o[2]++; }
    if (x.dl && zoneOf) x.dl.forEach((v, j) => { if (v == null) return; const z = zoneOf(x.ids[j]); if (z == null) return; const q = rg[z] || (rg[z] = [0, 0, 0]); q[0]++; if (v <= 5) q[1]++; q[2] += Math.max(0, v); });
    if (x.dl) for (let j = 1; j < x.dl.length; j++) {
      const a = x.dl[j - 1], b = x.dl[j]; if (a == null || b == null) continue;
      const g = b - a, id = x.ids[j], q = st.get(id) || st.set(id, [id, names.get(id) || id, 0, 0, 0]).get(id);
      q[3]++; if (g > 0) q[2] += g; if (g >= 3) q[4]++;
    }
  }
  const stl = [...st.values()].filter((q) => q[3] >= 8).sort((a, b) => b[2] / b[3] - a[2] / a[3]).slice(0, 40);
  return { h, op, st: stl, rg };
}
// treni della settimana: corse degli ultimi 7 giorni nella storia di un treno
function weekRuns(t, dn) { const out = []; for (let i = Math.max(0, dn - 6 - t.d0); i < t.f.length && t.d0 + i <= dn; i++) { const v = t.f[i]; if (v != null) out.push(v); } return out; }
// riassunto per la pagina (funzione pura: provata in tests/run.js)
function summarizeFacts(raw, day, wk, pct) {
  const dn = dayNum(day), days = Object.keys(raw.days).filter((d) => dayNum(d) > dn - 28 && dayNum(d) <= dn).sort(), last7 = days.filter((d) => dayNum(d) > dn - 7);
  const hours = {}, ops = {}, stAll = new Map(), rgs = {};
  for (const d of days) for (const [cc, f] of Object.entries(raw.days[d])) {
    const H = hours[cc] || (hours[cc] = Array.from({ length: 24 }, () => [0, 0, 0]));
    f.h.forEach((v, i) => { H[i][0] += v[0]; H[i][1] += v[1]; H[i][2] += v[2]; });
    if (!last7.includes(d)) continue;
    const R = rgs[cc] || (rgs[cc] = {}); for (const [z, v] of Object.entries(f.rg || {})) { const q = R[z] || (R[z] = [0, 0, 0]); q[0] += v[0]; q[1] += v[1]; q[2] += v[2]; }
    const O = ops[cc] || (ops[cc] = {}); for (const [k, v] of Object.entries(f.op)) { const q = O[k] || (O[k] = [0, 0, 0, 0]); for (let i = 0; i < 4; i++) q[i] += v[i]; }
    for (const q of f.st) { const key = cc + '|' + q[0], z = stAll.get(key) || stAll.set(key, [cc, q[0], q[1], 0, 0, 0]).get(key); z[3] += q[2]; z[4] += q[3]; z[5] += q[4]; }
  }
  const out = { v: 1, day, days: days.length, hours: {}, ops: {}, st: [], rg: {}, best: wk.best, worst: wk.worst, pct };
  for (const [cc, H] of Object.entries(hours)) if (H.reduce((a, v) => a + v[0], 0) >= 300) out.hours[cc] = H.map((v) => [v[0], v[0] ? Math.round((10 * v[1]) / v[0]) / 10 : null, v[0] ? Math.round((100 * v[2]) / v[0]) : null]);
  for (const [cc, O] of Object.entries(ops)) {
    const rows = Object.entries(O).filter(([, v]) => v[0] >= 50).map(([k, v]) => [k, v[0], Math.round((10 * v[1]) / v[0]) / 10, Math.round((100 * (v[0] - v[2])) / v[0]), v[3]]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (rows.length >= 2) out.ops[cc] = rows;
  }
  for (const [cc, R] of Object.entries(rgs)) { const o = {}; for (const [z, v] of Object.entries(R)) if (v[0] >= 30) o[z] = [v[0], Math.round((100 * v[1]) / v[0]), Math.round((10 * v[2]) / v[0]) / 10]; if (Object.keys(o).length) out.rg[cc] = o; }   // per zona: passaggi, % entro 5 min, ritardo medio (7 giorni)
  out.st = [...stAll.values()].filter((z) => z[4] >= 30).map((z) => [z[0], z[1], z[2], Math.round((10 * z[3]) / z[4]) / 10, z[4], Math.round((100 * z[5]) / z[4])]).sort((a, b) => b[3] - a[3]).slice(0, 15);
  return out;
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
  const up = args.includes('--upload'), final = args.includes('--final') || args.includes('--redo'), redo = args.includes('--redo'); if (up && !KEY) throw new Error('manca SOCIAL_CRON_KEY');
  const only = onlyI >= 0 ? args[onlyI + 1].split(',') : Object.keys(TRN_N);
  let chPos = null;
  const index = {}, factsDay = {}, best = [], worst = [], pct = {}, dn = dayNum(day); let wrote = 0, bytes = 0, shardErr = 0;
  for (const cc of only) {
    let list = null, names = new Map(), rows = 0;
    try {
      const tt = dir ? JSON.parse(fs.readFileSync(path.join(dir, 'tt-' + cc + '.json'), 'utf8')) : await (await get(SITE + '/api/live/tt/' + (cc === 'ch' ? day + '?c=2' : cc + '-' + day + '?v=1'))).json();
      const text = dir ? fs.readFileSync(path.join(dir, 'reg-' + cc + '.txt'), 'utf8') : await (await get(SITE + '/api/social/dl/' + cc + '/day/' + day + '?to=' + D.toHour(day), true)).text();
      list = cc === 'ch' ? trainsCh(tt, text, day) : trainsDay(cc, tt.t || [], D.parseReg(text), cc === 'gr' || cc === 'ee' ? await D.stationsOf(cc) : null);
      rows = cc === 'ch' ? (tt.trips || []).filter((t) => t[1] !== 'BAT').length : (tt.t || []).length;
      // meno del 15 % dei treni con un dato = orario o feed rotti quel giorno (come in dl_day.js): quel giorno non entra
      if (!D.usable([rows, list.length, 0])) { console.log(cc, 'escluso: solo', list.length, 'treni con un dato su', rows); list = null; }
      names = cc === 'ch' ? new Map((tt.stops || []).map((s) => [String(s[0]), s[1]])) : await namesOf(cc).catch(() => new Map());
      if (cc === 'ch') chPos = new Map((tt.stops || []).map((s) => [String(s[0]), [s[2], s[3]]]));
    } catch (e) { console.log(cc, 'saltato:', e.message); }
    // anche un paese saltato oggi resta nell'indice di ricerca: le sue fette si leggono comunque
    const by = new Map(); for (const x of list || []) (by.get(x.sh) || by.set(x.sh, []).get(x.sh)).push(x);
    if (list) {
      let zoneOf = null;
      try {
        const R = await regions(), pos = cc === 'ch' ? chPos : await D.stationsOf(cc);
        zoneOf = zoneFinder(R[cc], pos);
      } catch (e) { console.log(cc, 'zone:', e.message); }
      factsDay[cc] = dayFacts(list, names, zoneOf);
    }
    let ntr = 0; const means = [];
    {
      for (let sh = 0; sh < TRN_N[cc]; sh++) try {
        const name = cc + '/' + sh;
        const shard = up ? (await readShard(name)) || { v: 1, cc, days: [], t: {} } : { v: 1, cc, days: [], t: {} };
        const changed = list ? merge(shard, by.get(sh) || [], day, final, redo) : false;
        for (const [k, t] of Object.entries(shard.t)) {
          if (changed) t.nm = t.ids.map((id, j) => names.get(id) || t.nm[j] || id);
          { // treni della settimana (almeno 5 corse negli ultimi 7 giorni) e ritardo medio di ogni treno negli ultimi 28 giorni (almeno 3 corse) per «batte il …%»
            const w = weekRuns(t, dn), ok = w.filter((v) => v !== -999), dur = (mOf(t.tm[t.tm.length - 1]) - mOf(t.tm[0]) + 1440) % 1440;
            if (ok.length >= 5) {
              const mean = ok.reduce((a, v) => a + Math.max(0, v), 0) / ok.length, item = [cc, k, t.n, t.nm[0], t.nm[t.nm.length - 1], ok.length, Math.round(mean * 10) / 10, dur, w.length - ok.length];
              if (ok.every((v) => v <= 2) && dur >= 120) best.push(item);
              worst.push(item);
            }
            const m28 = []; for (let i = Math.max(0, dn - 27 - t.d0); i < t.f.length; i++) { const v = t.f[i]; if (v != null && v !== -999) m28.push(Math.max(0, v)); }
            if (m28.length >= 3) means.push(m28.reduce((a, v) => a + v, 0) / m28.length);
          }
          const num = trnNum(t.n); if (num == null) continue; ntr++;
          (index[trnBucket(num)] || (index[trnBucket(num)] = [])).push([cc, k, t.n, t.nm[0], t.nm[t.nm.length - 1], t.tm[0], num]);
        }
        if (up && changed) { bytes += await putShard(name, shard); wrote++; }
      } catch (e) { shardErr++; console.log(cc + '/' + sh, 'archivio:', e.message); }   // una fetta fallita non ferma le altre del paese
    }
    if (means.length >= 50) { means.sort((a, b) => a - b); pct[cc] = Array.from({ length: 21 }, (_, i) => Math.round(10 * means[Math.min(means.length - 1, Math.floor((i / 20) * (means.length - 1)))]) / 10); }
    console.log(cc, 'treni del giorno', list ? list.length : '-', 'su', rows, '· in archivio con numero', ntr);
  }
  if (shardErr) console.log('ATTENZIONE:', shardErr, 'fette non lette o non scritte: indice di ricerca non riscritto');
  if (up && !shardErr && only.length === Object.keys(TRN_N).length) for (let b = 0; b < 100; b++) { const bb = String(b).padStart(2, '0'); bytes += await putShard('i/' + bb, { v: 1, day, e: index[bb] || [] }); wrote++; }
  console.log('fette scritte', wrote, 'byte', bytes);
  // curiosità e record: giorni grezzi (tt:factsraw, solo per questo lavoro) e riassunto per /stats (tt:facts)
  if (only.length === Object.keys(TRN_N).length) {
    let raw = { v: 1, days: {} };
    if (up) try { const j = await (await get(SITE + '/api/live/tt/factsraw?x=' + Date.now())).json(); if (j && j.days) raw = j; }
      catch (e) { if (e.status !== 404) throw new Error('factsraw non leggibile (' + e.message + '): non carico'); }   // solo «non trovato» = primo giorno
    raw.days[day] = Object.assign({}, raw.days[day] || {}, factsDay); for (const d of Object.keys(raw.days)) if (dayNum(d) <= dn - 28) delete raw.days[d];
    best.sort((a, b) => b[7] - a[7] || a[6] - b[6]); worst.sort((a, b) => b[6] - a[6] || b[5] - a[5]);
    const facts = summarizeFacts(raw, day, { best: best.slice(0, 10), worst: worst.slice(0, 10) }, pct);
    console.log('curiosità: ore per', Object.keys(facts.hours).length, 'paesi, gestori per', Object.keys(facts.ops).length, ', fermate', facts.st.length, ', treni migliori', facts.best.length, ', peggiori', facts.worst.length);
    if (up) for (const [nm, obj] of [['factsraw', raw], ['facts', facts]]) {
      const r = await fetch(SITE + '/api/live/tt/' + nm, { method: 'PUT', body: zlib.gzipSync(JSON.stringify(obj)), headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/octet-stream', 'User-Agent': 'railpulse-tools' } });
      console.log(nm, '→', r.status, (await r.text()).slice(0, 120));
      if (!r.ok) process.exitCode = 1;
    }
  }
}
module.exports = { zoneFinder, pip, dayFacts, summarizeFacts, weekRuns, catOf, perStop, numOf, trainsDay, trainsCh, merge, unmerge, dayNum };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
