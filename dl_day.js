// Ritardi di TUTTI i treni di un giorno, dal registro dei ritardi d'Europa (log/index.js, D1 «dl:<paese>:<ora>») unito all'orario del giorno.
// Per ogni corsa dell'orario: il ritardo all'arrivo = l'ultimo ritardo comunicato prima dell'arrivo (il registro legge ogni paese ogni ~7 minuti,
// quindi la precisione è di qualche minuto). Sostituisce la stima dalle istantanee orarie nella pagina /stats («Da quando contiamo»).
//   node tools/dl_day.js [AAAAMMGG] [--upload] [--dir cartella]   (giorno predefinito: ieri a Zurigo; serve SOCIAL_CRON_KEY per leggere il registro e caricare)
//   --dir = file già scaricati (reg-<cc>.txt nel formato di /api/social/dl/<cc>/day/<giorno>, tt-<cc>.json): per provare senza rete.
// Risultato in D1 «tt:dlday» (PUT /api/live/tt/dlday, letto da js/stats.js con GET /api/live/tt/dlday):
//   { v: 1, upd, days: { AAAAMMGG: { cc: [corse, con ritardo, soppresse, <2, 2–5, >5, ≤1, ≤3, ≤5, ≤15, minuti di ritardo sommati] } }, top: { AAAAMMGG: [[cc, treno, destinazione, minuti]] } }
// Svizzera: dal registro degli arrivi del cronometro (rta:, ogni 2 minuti: ultimo stato di ogni corsa quando esce dal feed), battelli esclusi.
// Grecia ed Estonia: solo la posizione GPS → ritardo stimato dalla posizione sulla linea retta tra le fermate (come js/<paese>-data.js, gpsDelay).
// Norvegia: Vy e Go-Ahead per numero del treno e giorno (registro «DatedServiceJourney:<numero>_…_AA-MM-GG», orario «ServiceJourney:<numero>_…»), Flytoget per codice.
// Una copia identica sta nel repository pubblico trainGB (workflow dl-day.yml): se cambia, ricopiarla.
const fs = require('fs'), path = require('path');
const SITE = process.env.SITE || 'https://railpulse.ch', KEY = process.env.SOCIAL_CRON_KEY || '';
const CC = ['ch', 'de', 'fr', 'it', 'es', 'nl', 'be', 'lu', 'pl', 'cz', 'sk', 'hu', 'si', 'ro', 'bg', 'pt', 'dk', 'se', 'fi', 'no', 'uk', 'ie', 'lv', 'gr', 'ee', 'at', 'hr'];   // Austria dal 24.11.2026 (partenze di Scotty di ÖBB per tutti i treni, worker/at.js), Croazia dal 24.11.2026 (feed HŽPP)
const GPS = { gr: 1, ee: 1 };
const KEEP_DAYS = 120;
// chiave del treno per la pagina /train (partenza | HHMM locale | arrivo): js/trn.js nel sito, trn.js accanto a questo file in trainGB
let TRN = null; try { TRN = require('../js/trn.js'); } catch (e) { try { TRN = require('./trn.js'); } catch (e2) { /* senza: i ritardi più grandi restano senza link */ } }
const keyOf = (cc, r) => { if (!TRN) return ''; const ids = []; for (let i = 4; i + 2 < r.length; i += 3) ids.push(r[i]); return ids.length < 2 ? '' : TRN.key(ids[0], TRN.hm(cc, (r[3] + r[6]) * 1000), ids[ids.length - 1]); };
const TZ = { fi: 'Europe/Helsinki', se: 'Europe/Stockholm' };

// registro: «@AAAAMMGGHH» poi righe «secondi<TAB>codice<TAB>valore» → Map codice → [[ms, valore | null (= sparito)], …] in ordine di tempo
function parseReg(text) {
  const m = new Map(); let h0 = 0;
  for (const l of text.split('\n')) {
    if (!l) continue;
    if (l[0] === '@') { const s = l.slice(1); h0 = Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10)); continue; }
    const a = l.indexOf('\t'), b = l.indexOf('\t', a + 1); if (a < 0 || b < 0) continue;
    const k = l.slice(a + 1, b), raw = l.slice(b + 1); let v = null;
    if (raw !== '-') { try { v = JSON.parse(raw); } catch (e) { continue; } }
    (m.get(k) || m.set(k, []).get(k)).push([h0 + +l.slice(0, a) * 1000, v]);
  }
  for (const ev of m.values()) ev.sort((x, y) => x[0] - y[0]);
  // Norvegia: anche per numero del treno e giorno d'esercizio (vedi keysOf)
  for (const [k, ev] of [...m]) { const n = /^(\w+):DatedServiceJourney:(\d+)_.*_(\d\d)-(\d\d)-(\d\d)$/.exec(k); if (n) m.set('n:' + n[1] + '|' + n[2] + '|20' + n[3] + n[4] + n[5], ev); }
  return m;
}
const dateIn = (ms, tz) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: tz });
// codici con cui il registro conosce la corsa (le stesse regole dei moduli dati delle pagine: js/<paese>-data.js)
function keysOf(cc, r) {
  const code = String(r[0]), dep0 = r[3] + r[6], k = [];
  if (cc === 'be') k.push('be:o:' + r[4] + '|' + r[r.length - 3] + '|' + dep0);
  if (cc === 'fi' || cc === 'se') { k.push(code.slice(3) + '|' + dateIn(dep0 * 1000, TZ[cc])); return k; }
  if (cc === 'uk') { k.push(code.replace(/^uk:/, '')); return k; }
  if (cc === 'no') {
    k.push(code.replace(/^no:/, ''));
    // «601_…» e anche «601-LOD_…» (dal 25.11.2026: prima ~360 treni al giorno, tra cui gli F4 Bergen–Oslo, restavano senza ritardo)
    const n = /^no:(\w+):ServiceJourney:(\d+)[-_]/.exec(code); if (n) k.push('n:' + n[1] + '|' + n[2] + '|' + dateIn(dep0 * 1000, 'Europe/Oslo').replace(/-/g, ''));
    return k;
  }
  k.push(code);
  if (cc === 'at') k.push('#' + code.split(':').pop());   // Scotty: sigla e numero del treno («#REX2679», worker/at.js)
  if (cc === 'ro') { const n = (String(r[2]).match(/(\d+)\s*$/) || [])[1]; if (n) k.push('n:' + n.replace(/^0+/, '')); }
  if (cc === 'fr') { const n = code.startsWith('idf:') ? code.slice(4) : (/^OCE[A-Z]*?(\d+)/.exec(code) || [])[1]; /* anche OCESA/OCEEA/OCELO (TER, dal 25.11.2026) */ if (n) k.push('s:' + n + '@' + Math.floor(dep0 / 60)); }
  return k;
}
// Grecia, Estonia: ritardo stimato dalla posizione (la stessa regola di gpsDelay in tools/country_data_template.js); pos = id fermata → [lat, lon]
function gpsDelay(r, lat, lon, ms, pos) {
  const p = [];
  for (let i = 4; i + 2 < r.length; i += 3) { const s = String(r[i]), h = s.indexOf('#'); p.push({ s: pos.get(h < 0 ? s : s.slice(0, h)), arr: r[3] + r[i + 1], dep: r[3] + r[i + 2] }); }
  const kx = Math.cos(lat * Math.PI / 180) * 111.32, ky = 110.57, px = lon * kx, py = lat * ky;
  let best = null;
  for (let i = 0; i + 1 < p.length; i++) {
    const a = p[i].s, b = p[i + 1].s; if (!a || !b) continue;
    const ax = a[1] * kx, ay = a[0] * ky, dx = b[1] * kx - ax, dy = b[0] * ky - ay, L = dx * dx + dy * dy;
    const u = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
    const d = Math.hypot(px - (ax + u * dx), py - (ay + u * dy));
    if (!best || d < best.d) best = { d, t: p[i].dep + u * (p[i + 1].arr - p[i].dep), end: i + 2 === p.length && u > 0.96 };
  }
  if (!best || best.d > 4 || best.end) return null;   // al capolinea il ritardo non si legge (fermo con il GPS acceso)
  const m = Math.round((ms / 1000 - best.t) / 60);
  return m < -30 || m > 90 ? null : m < 3 ? 0 : m;
}
// ritardo (minuti) di un valore del registro per questa corsa; Polonia e Cechia: dall'ora prevista della prossima fermata
function delayOf(cc, r, v, t, pos) {
  if (!v || v[1] === 'C') return null;
  if (GPS[cc]) return pos && typeof v[2] === 'number' && typeof v[3] === 'number' ? gpsDelay(r, v[2], v[3], t, pos) : null;
  if ((cc === 'pl' || cc === 'cz') && v[0] == null && v[2] != null && v[3]) {
    let i = -1;
    if (cc === 'pl') i = 4 + 3 * v[2];
    else for (let j = 4; j + 2 < r.length; j += 3) { const s = String(r[j]), h = s.indexOf('#'); if (h >= 0 && +s.slice(h + 1) === v[2]) { i = j; break; } }
    if (i < 4 || i + 2 >= r.length) return null;
    const m = Math.round((v[3] - (r[3] + (i === 4 ? r[i + 2] : r[i + 1]))) / 60);
    return m >= -60 && m <= 360 ? m : null;
  }
  return typeof v[0] === 'number' && v[0] >= -60 && v[0] <= 600 ? v[0] : null;
}
// Finlandia e Svezia (dal 25.11.2026): le fonti conservano l'orario REALE di ogni stazione anche a giornata finita (Digitraffic «trains/<data>»,
// annunci del giorno di Trafikverket via /api/se/day?rt=1), quindi il ritardo a ogni fermata si legge da lì, esatto, e non dal registro (un valore
// ogni ~7 minuti). Il registro resta la riserva per i treni senza orario reale all'ultima fermata (ancora in viaggio nel passaggio di notte) o se la fonte non risponde.
// → Map numero del treno → { c: soppresso, a / d: Map «stazione|secondi programmati» → minuti di ritardo all'arrivo / alla partenza }
const SRC = { fi: 1, se: 1, no: 1, uk: 1 };
const minOf = (act, sch) => { const m = Math.round((Date.parse(act) - Date.parse(sch)) / 60000); return m >= -60 && m <= 600 ? m : null; };
function exactPut(m, k, canc, arr, st, sch, act) {
  const e = m.get(k) || m.set(k, { c: true, n: 0, a: new Map(), d: new Map() }).get(k);
  e.n++; if (!canc) e.c = false;
  if (canc || !act || !sch) return;
  const v = minOf(act, sch); if (v != null) (arr ? e.a : e.d).set(st + '|' + Math.round(Date.parse(sch) / 1000), v);
}
function exactFi(js) {
  const m = new Map();
  for (const t of js || []) {
    if (t.trainCategory !== 'Commuter' && t.trainCategory !== 'Long-distance') continue;
    for (const r of t.timeTableRows || []) exactPut(m, String(t.trainNumber), !!(t.cancelled || r.cancelled), r.type === 'ARRIVAL', r.stationShortCode, r.scheduledTime, r.actualTime);
    if (t.cancelled && m.has(String(t.trainNumber))) m.get(String(t.trainNumber)).c = true;
  }
  return m;
}
function exactSe(js, day) {
  const m = new Map(), iso = day.slice(0, 4) + '-' + day.slice(4, 6) + '-' + day.slice(6);
  for (const x of ((((js || {}).RESPONSE || {}).RESULT || [{}])[0] || {}).TrainAnnouncement || []) {
    if (!String(x.ScheduledDepartureDateTime || '').startsWith(iso) || !x.LocationSignature) continue;
    exactPut(m, String(x.AdvertisedTrainIdent), !!x.Canceled, x.ActivityType === 'Ankomst', x.LocationSignature, x.AdvertisedTimeAtLocation, x.TimeAtLocation);
  }
  return m;
}
// una corsa dell'orario → { c, d: ritardo all'arrivo, dl: ritardo a ogni fermata } dalla fonte; null = la fonte non ha (ancora) l'arrivo: vale il registro
function exactOf(r, ex) {
  const e = ex.get(String(r[0]).slice(3)); if (!e) return null;
  if (e.c) return { c: true, d: null, dl: null };
  const n = Math.floor((r.length - 4) / 3), dl = new Array(n).fill(null);
  for (let j = 0; j < n; j++) {
    const i = 4 + 3 * j, a = e.a.get(r[i] + '|' + (r[3] + r[i + 1])), d = e.d.get(r[i] + '|' + (r[3] + r[i + 2]));
    const v = j === 0 ? (d != null ? d : a) : (a != null ? a : d);
    dl[j] = v == null ? null : v;
  }
  return dl[n - 1] == null ? null : { c: false, d: dl[n - 1], dl };
}
async function exactDay(cc, day, dir) {
  if (dir) { const f = path.join(dir, 'exact-' + cc + '.json'); if (!fs.existsSync(f)) return null; const j = JSON.parse(fs.readFileSync(f, 'utf8')); return cc === 'fi' ? exactFi(j) : exactSe(j, day); }
  if (cc === 'fi') {
    const r = await fetch('https://rata.digitraffic.fi/api/v1/trains/' + day.slice(0, 4) + '-' + day.slice(4, 6) + '-' + day.slice(6), { headers: { 'Digitraffic-User': 'railpulse', 'Accept-Encoding': 'gzip' } });
    if (!r.ok) throw new Error('Digitraffic ' + r.status);
    return exactFi(await r.json());
  }
  return exactSe(await (await get(SITE + '/api/se/day?d=' + day + '&rt=1', true)).json(), day);
}
// Norvegia: Entur non conserva le corse concluse, quindi il registro resta; ma dal 25.11.2026 ogni valore porta anche le ultime fermate già fatte con
// l'orario REALE ([marciapiede, minuti], quarto campo: tools/no_rt.py). Unendo tutti i valori di una corsa → Map stazione → minuti; null se non ce ne sono.
async function noqOf() {
  const f = path.join(__dirname, '..', 'js', 'no-stations.js');
  const js = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : await (await get(SITE + '/js/no-stations.js')).text();
  return new Map(Object.entries(JSON.parse((/TB_NOQ\s*=\s*(\{[^}]*\})/.exec(js) || [])[1] || '{}')));
}
function noStops(r, reg) {
  const m = new Map();
  for (const k of keysOf('no', r)) for (const [, v] of reg.get(k) || []) if (v && Array.isArray(v[3])) for (const c of v[3]) { const st = reg.noq.get(String(c[0])); if (st && typeof c[1] === 'number' && c[1] >= -60 && c[1] <= 600) m.set(st, c[1]); }
  return m.size ? m : null;
}
// Gran Bretagna (dal 25.11.2026): orari reali a ogni fermata dalle istantanee orarie Darwin di tutto il giorno, uniti da tools/uk_at.py nel file
// exact-uk.json ({ day, t: { rid: [[minuti del giorno dell'orario pubblico (Londra), ritardo, 1 arrivo | 0 partenza, 1 reale | 0 previsto]] } }).
// Un treno arrivato esce dall'istantanea entro mezz'ora: le fermate fatte dopo l'ultima istantanea che l'ha visto hanno solo la previsione. Quindi per
// ogni fermata: orario reale se c'è, altrimenti il registro (bacheche delle 60 stazioni, più fresche), altrimenti la previsione dell'istantanea.
const lonFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const lonMin = (sec) => { const p = lonFmt.format(sec * 1000).split(':'); return +p[0] * 60 + +p[1]; };
function exactUk(j) {
  const m = new Map();
  for (const rid in (j && j.t) || {}) {
    // ad: minuto di PARTENZA → ritardo all'ARRIVO nella stessa fermata (l'orario del giorno ha la sola partenza per le fermate intermedie)
    const e = { a: new Map(), d: new Map(), ad: new Map() }; let p = null;
    for (const x of j.t[rid]) { (x[2] ? e.a : e.d).set(x[0], [x[1], x[3]]); if (!x[2] && p && p[2] && x[0] - p[0] >= 0 && x[0] - p[0] <= 30) e.ad.set(x[0], [p[1], p[3]]); p = x; }
    m.set(rid, e);
  }
  return m;
}
// una corsa → per ogni fermata [minuti di ritardo, 1 reale | 0 previsto] o null; null se il treno non è nel file
function ukStops(r, reg) {
  const e = reg.ukat && reg.ukat.get(String(r[0]).replace(/^uk:/, '')); if (!e) return null;
  const n = Math.floor((r.length - 4) / 3), out = new Array(n).fill(null);
  for (let j = 0; j < n; j++) {
    const i = 4 + 3 * j, t = lonMin(r[3] + r[i + 1]), a = e.a.get(t) || e.ad.get(t), d = e.d.get(lonMin(r[3] + r[i + 2]));
    out[j] = (j === 0 ? d || a : a || d) || null;
  }
  return out;
}
// registro + fonte diretta dove c'è: reg.exact (se la fonte non risponde resta il solo registro, e lo si scrive nel log)
async function regOf(cc, text, day, dir) {
  const reg = parseReg(text);
  if (cc === 'no') { try { reg.noq = await noqOf(); } catch (e) { console.log('no: tabella dei marciapiedi non letta (' + e.message + ')'); } return reg; }
  if (cc === 'uk') {
    try {
      const f = dir ? path.join(dir, 'exact-uk.json') : process.env.UK_AT || 'exact-uk.json';
      if (!fs.existsSync(f)) { console.log('uk: manca', f + ': solo registro'); return reg; }
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (j.day !== day) console.log('uk: il file degli orari reali è del', j.day + ': solo registro'); else { reg.ukat = exactUk(j); console.log('uk: orari reali di', reg.ukat.size, 'treni da', (j.hours || []).length, 'istantanee'); }
    } catch (e) { console.log('uk: orari reali non letti (' + e.message + '): solo registro'); }
    return reg;
  }
  if (SRC[cc]) try { const ex = await exactDay(cc, day, dir); if (ex && ex.size) reg.exact = ex; else console.log(cc, 'fonte diretta vuota: solo registro'); } catch (e) { console.log(cc, 'fonte diretta non letta (' + e.message + '): solo registro'); }
  return reg;
}
// una corsa: { d: ritardo all'arrivo | null, c: soppressa } (x: 1 = orario reale dalla fonte, 2 = previsione dell'istantanea britannica)
function finalOf(cc, r, reg, pos) {
  if (cc === 'uk' && reg.ukat) {
    const u = ukStops(r, reg), last = u && u[u.length - 1];
    if (last && last[1]) return { d: last[0], c: false, seen: true, x: 1 };
    const f = finalReg(cc, r, reg, pos);
    return f.d == null && !f.c && last ? { d: last[0], c: false, seen: true, x: 2 } : f;
  }
  return finalReg(cc, r, reg, pos);
}
function finalReg(cc, r, reg, pos) {
  if (reg.exact) { const x = exactOf(r, reg.exact); if (x) return { d: x.d, c: x.c, seen: true, x: 1 }; }
  if (cc === 'no' && reg.noq) { const m = noStops(r, reg), last = r[r.length - 3]; if (m && m.has(last)) return { d: m.get(last), c: false, seen: true, x: 1 }; }   // arrivo reale al capolinea
  const dep0 = (r[3] + r[6]) * 1000, arr = (r[3] + r[r.length - 2]) * 1000;
  let d = null, canc = false, seen = false;
  for (const k of keysOf(cc, r)) {
    const ev = reg.get(k); if (!ev) continue;
    for (const [t, v] of ev) {
      if (t < dep0 - 3600000) continue;
      if (t > arr + Math.max(0, d || 0) * 60000 + 900000) break;   // dopo l'arrivo (previsto con l'ultimo ritardo noto) non conta più
      if (!v) continue;
      seen = true;
      if (v[1] === 'C') { canc = true; continue; }
      const m = delayOf(cc, r, v, t, pos); if (m != null) { d = m; canc = false; }
    }
    if (d != null || canc) break;   // trovato con questo codice: gli altri non servono
  }
  return { d, c: canc && d == null, seen };
}
function add(s, top, d, item, key) {   // top = [paese, treno, destinazione, minuti, chiave per /train]
  s[1]++; s[d < 2 ? 3 : d <= 5 ? 4 : 5]++;
  if (d <= 1) s[6]++; if (d <= 3) s[7]++; if (d <= 5) s[8]++; if (d <= 15) s[9]++;
  s[10] += Math.max(0, d);
  if (d >= 30) top.push(key ? [...item, d, key] : [...item, d]);
}
// Gran Bretagna (dal 25.11.2026): gli eventi delle bacheche («b:<operatore>|<capolinea>|<arrivo>», log/index.js) si uniscono a quelli
// dell'istantanea oraria (rid) della stessa corsa, in ordine di tempo: per ogni fermata vale l'ultimo ritardo visto, da qualunque fonte.
function boardKey(r) { return 'b:' + r[2] + '|' + r[r.length - 3] + '|' + (r[3] + r[r.length - 2]); }
function joinUk(rows, reg) {
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 10) continue;
    const b = reg.get(boardKey(r)); if (!b) continue;
    const rid = String(r[0]).replace(/^uk:/, ''), a = reg.get(rid);
    reg.set(rid, a ? a.concat(b).sort((x, y) => x[0] - y[0]) : b.slice());
  }
  return reg;
}
function summarize(cc, rows, reg, pos) {
  const s = [rows.length, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], top = []; let nx = 0;
  if (cc === 'uk') joinUk(rows, reg);
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 10) continue;
    const f = finalOf(cc, r, reg, pos); if (f.x === 1) nx++;
    if (f.c) { s[2]++; continue; }
    if (f.d == null) continue;
    add(s, top, f.d, [cc, String(r[2] || '').replace(/^[^|]*\|/, ''), String(r[1] || '')], keyOf(cc, r));
  }
  return { s, top, nx };
}
// Svizzera: orario del giorno (/api/live/tt/<giorno>?c=2: trips [linea, categoria, destinazione, trip_id, fermate]) e registro degli arrivi
//  (righe JSON ["trip_id|AAAAMMGG", ora del feed, soppressa, [[stop_sequence, ritardo di arrivo in s], …]]): ritardo = quello dell'ultima fermata nell'ultimo stato
function summarizeCh(tt, text, day) {
  const last = new Map();
  for (const l of text.split('\n')) {
    if (!l || l[0] !== '[') continue;
    let x; try { x = JSON.parse(l); } catch (e) { continue; }
    const k = String(x[0]), b = k.lastIndexOf('|'); if (b < 0 || k.slice(b + 1) !== day) continue;
    const id = k.slice(0, b), o = last.get(id); if (!o || x[1] >= o[1]) last.set(id, x);
  }
  const trips = (tt.trips || []).filter((t) => t[1] !== 'BAT');   // battelli fuori: sono statistiche dei treni
  const s = [trips.length, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], top = [];
  for (const t of trips) {
    const x = last.get(String(t[3])); if (!x) continue;
    if (x[2]) { s[2]++; continue; }
    const st = x[3] || []; if (!st.length) continue;
    const d = Math.round(st[st.length - 1][1] / 60); if (d < -60 || d > 600) continue;
    const f = t[4] || [], S = tt.stops || [], sid = (q) => String(S[q] ? S[q][0] : q);
    let key = '';
    if (TRN && f.length >= 8) { const utc = Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8)), mid = utc - +new Date(utc).toLocaleString('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hour12: false }) * 3600000; key = TRN.key(sid(f[0]), TRN.hm('ch', mid + f[2] * 1000), sid(f[f.length - 4])); }
    add(s, top, d, ['ch', String(t[0] || t[1] || ''), String(t[2] || '')], key);
  }
  return { s, top };
}
// fermate di un paese (js/<paese>-stations.js: «id|nome|lat|lon»): dalla cartella del sito se c'è, altrimenti da railpulse.ch
async function stationsOf(cc) {
  const f = path.join(__dirname, '..', 'js', cc + '-stations.js');
  const js = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : await (await get(SITE + '/js/' + cc + '-stations.js')).text();
  const m = new Map(), body = (/=\s*"([\s\S]*)"/.exec(js) || [])[1] || '';
  for (const l of body.split('\\n')) { const p = l.split('|'); if (p.length >= 4) m.set(p[0], [+p[2], +p[3]]); }
  return m;
}
// ultima ora del registro da leggere: adesso (ora UTC), al massimo le 23 UTC del giorno dopo. Dal 25.11.2026 il lavoro gira due volte: di notte (provvisorio, dati
// fino a quell'ora) e a mezzogiorno con --final (anche i treni notturni arrivati in mattinata). Così ogni treno ha il suo arrivo vero, non l'ultima previsione.
function toHour(day, now = Date.now()) {
  const nx = new Date(Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8)) + 86400000).toISOString().slice(0, 10).replace(/-/g, '') + '23';
  const h = new Date(now).toISOString().slice(0, 13).replace(/[-T]/g, '');
  return h < nx ? h : nx;
}
// Norvegia: fino al 25.11.2026 l'orario del giorno conteneva anche gli autobus sostitutivi («no:VYG:ServiceJourney:BUS-1923_…», 500 su 2029): non sono treni
const realRows = (cc, t) => (cc === 'no' ? (t || []).filter((r) => !String(r[0]).includes(':BUS-')) : t || []);
const usable = (s) => !(s[0] >= 50 && s[1] + s[2] < 0.15 * s[0]);   // [corse, con ritardo, soppresse, …]
async function get(url, auth) {
  const r = await fetch(url, { headers: { 'User-Agent': 'railpulse-tools', ...(auth ? { Authorization: 'Bearer ' + KEY } : {}) } });
  if (!r.ok) { const e = new Error(url + ' → HTTP ' + r.status); e.status = r.status; throw e; }
  return r;
}
async function main() {
  const args = process.argv.slice(2), dirI = args.indexOf('--dir'), dir = dirI >= 0 ? args[dirI + 1] : '';
  const day = args.find((a) => /^\d{8}$/.test(a)) || dateIn(Date.now() - 86400000, 'Europe/Zurich').replace(/-/g, '');
  const res = {}, top = [], onlyI = args.indexOf('--only'), noreg = args.includes('--noreg');   // --only uk --noreg: prova di un paese senza il registro (non carica)
  for (const cc of onlyI >= 0 ? args[onlyI + 1].split(',') : CC) {
    try {
      const tt = dir ? JSON.parse(fs.readFileSync(path.join(dir, 'tt-' + cc + '.json'), 'utf8')) : await (await get(SITE + '/api/live/tt/' + (cc === 'ch' ? day + '?c=2' : cc + '-' + day + '?v=1'))).json();
      const text = noreg ? '' : dir ? fs.readFileSync(path.join(dir, 'reg-' + cc + '.txt'), 'utf8') : await (await get(SITE + '/api/social/dl/' + cc + '/day/' + day + '?to=' + toHour(day), true)).text();
      const x = cc === 'ch' ? summarizeCh(tt, text, day) : summarize(cc, realRows(cc, tt.t), await regOf(cc, text, day, dir), GPS[cc] ? await stationsOf(cc) : null);
      // meno del 15 % dei treni dell'orario con un dato = orario o feed rotti quel giorno (23.11: Spagna 6 su 3267, Irlanda e Grecia 0): il paese non entra, numeri sbagliati no
      if (!usable(x.s)) { console.log(cc, 'escluso: solo', x.s[1] + x.s[2], 'treni con un dato su', x.s[0]); continue; }
      res[cc] = x.s; top.push(...x.top);
      const pc = (n) => (x.s[1] ? Math.round((100 * n) / x.s[1]) : 0) + '%';
      console.log(cc, 'corse', x.s[0], 'con ritardo', x.s[1], 'soppresse', x.s[2], 'in orario', pc(x.s[3]), '2-5', pc(x.s[4]), '>5', pc(x.s[5]), 'minuti', x.s[10], SRC[cc] ? '| orario reale dalla fonte ' + (x.nx || 0) + ', altri ' + (x.s[1] + x.s[2] - (x.nx || 0)) : '');
    } catch (e) { console.log(cc, 'saltato:', e.message); }
  }
  top.sort((a, b) => b[3] - a[3]);
  const tot = Object.values(res).reduce((a, s) => [a[0] + s[0], a[1] + s[1], a[2] + s[10]], [0, 0, 0]);
  console.log('totale: corse', tot[0], 'con ritardo', tot[1], 'minuti', tot[2]);
  if (!args.includes('--upload') || onlyI >= 0 || noreg) return;
  if (!KEY) throw new Error('manca SOCIAL_CRON_KEY');
  if (Object.keys(res).length < 10 || tot[1] < 5000) throw new Error('troppo pochi dati, non carico');
  let all = { v: 1, days: {}, top: {} };
  // solo «non trovato» vuol dire primo giorno: con qualunque altro errore ci si ferma, altrimenti un errore di rete cancellerebbe i 120 giorni salvati
  try { const j = await (await get(SITE + '/api/live/tt/dlday?x=' + Date.now())).json(); if (j && j.days) all = j; else throw new Error('dlday senza giorni'); }
  catch (e) { if (e.status !== 404) throw new Error('riepilogo salvato non leggibile (' + e.message + '): non carico'); }
  // un paese saltato in questo passaggio (errore passeggero) tiene i numeri del passaggio prima
  const was = all.days[day] || {}, keep = (all.top[day] || []).filter((t) => !(t[0] in res) && was[t[0]]);
  all.days[day] = Object.assign({}, was, res); all.top[day] = top.concat(keep).sort((a, b) => b[3] - a[3]).slice(0, 30); all.upd = Date.now();
  all.prov = (all.prov || []).filter((d) => d !== day && all.days[d]); if (!args.includes('--final')) all.prov.push(day);   // giorni ancora provvisori (manca il passaggio di mezzogiorno)
  const ks = Object.keys(all.days).sort(); for (const k of ks.slice(0, Math.max(0, ks.length - KEEP_DAYS))) { delete all.days[k]; delete all.top[k]; }
  const body = require('zlib').gzipSync(JSON.stringify(all));
  const r = await fetch(SITE + '/api/live/tt/dlday', { method: 'PUT', body, headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/octet-stream', 'User-Agent': 'railpulse-tools' } });
  console.log('caricato:', r.status, await r.text());
  if (!r.ok) throw new Error('caricamento fallito');
}
module.exports = { parseReg, keysOf, delayOf, finalOf, joinUk, summarize, summarizeCh, gpsDelay, stationsOf, usable, toHour, exactFi, exactSe, exactOf, exactDay, regOf, noStops, exactUk, ukStops, realRows, SRC };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
