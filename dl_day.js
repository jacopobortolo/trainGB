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
const inLt = (p) => !!p && p[0] > 54.3 && p[1] > 23.2;
// Fermate dell'orario polacco fuori dalla Polonia (js/pl-foreign.js, generato da tools/pl_foreign.js): lì il feed polacco non ha dati veri (dal 26.11.2026).
// Il valore resta quello dell'ultima fermata polacca (perStopReg e finalReg tengono l'ultimo ritardo valido), oppure arriva dal paese vicino.
let PLX = new Set();
const plx = () => PLX, setPlx = (ids) => { PLX = new Set(ids); };
async function plxLoad() {
  const f = path.join(__dirname, '..', 'js', 'pl-foreign.js');
  const js = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : await (await get(SITE + '/js/pl-foreign.js')).text();
  const m = /TB_PLX\s*=\s*"([^"]*)"/.exec(js); if (!m || m[1].length < 100) throw new Error('js/pl-foreign.js non leggibile');
  setPlx(m[1].split(','));
}
function delayOf(cc, r, v, t, pos) {
  if (!v || v[1] === 'C') return null;
  if (GPS[cc]) return pos && typeof v[2] === 'number' && typeof v[3] === 'number' ? gpsDelay(r, v[2], v[3], t, pos) : null;
  if ((cc === 'pl' || cc === 'cz') && v[0] == null && v[2] != null && v[3]) {
    let i = -1;
    if (cc === 'pl') i = 4 + 3 * v[2];
    else for (let j = 4; j + 2 < r.length; j += 3) { const s = String(r[j]), h = s.indexOf('#'); if (h >= 0 && +s.slice(h + 1) === v[2]) { i = j; break; } }
    if (i < 4 || i + 2 >= r.length) return null;
    // fermata estera: vale solo la PRIMA dopo il confine (previsione nata in Polonia); mai le lituane (ora sfasata di un'ora)
    if (cc === 'pl' && (inLt(pos && pos.get && pos.get(String(r[i]))) || (PLX.has(String(r[i])) && (i === 4 || PLX.has(String(r[i - 3])))))) return null;   // fermata in Lituania: il feed polacco ne dà l'ora sfasata di un'ora esatta (falso +60), come in js/pl-data.js
    const m = Math.round((v[3] - (r[3] + (i === 4 ? r[i + 2] : r[i + 1]))) / 60);
    return m >= -60 && m <= 600 ? m : null;
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
// ritardo (minuti) a ogni fermata di una corsa del formato comune; null dove non c'è ancora nessun dato
function perStop(cc, r, reg, pos) {
  const dl = perStopReg(cc, r, reg, pos);
  if (cc === 'uk' && reg.ukat) {   // Gran Bretagna: orario reale dell'istantanea Darwin, altrimenti il registro, altrimenti la previsione dell'istantanea (tools/uk_at.py)
    const u = ukStops(r, reg); if (!u) return dl;
    return u.map((x, j) => (x && x[1] ? x[0] : dl && dl[j] != null ? dl[j] : x ? x[0] : null));
  }
  if (cc !== 'no' || !reg.noq) return dl;
  // Norvegia: dove il registro ha l'orario reale di una fermata (tools/no_rt.py) vale quello, altrove l'ultimo ritardo visto prima del passaggio
  const m = noStops(r, reg); if (!m) return dl;
  const out = dl || new Array(Math.floor((r.length - 4) / 3)).fill(null);
  for (let j = 0; j < out.length; j++) { const v = m.get(r[4 + 3 * j]); if (v != null) out[j] = v; }
  return out;
}
function perStopReg(cc, r, reg, pos) {
  if (reg.exact) { const x = exactOf(r, reg.exact); if (x && x.dl) return x.dl; }   // Finlandia, Svezia: orario reale di ogni stazione dalla fonte (tools/dl_day.js)
  const n = Math.floor((r.length - 4) / 3), dep0 = (r[3] + r[6]) * 1000;
  for (const k of keysOf(cc, r)) {
    const ev = reg.get(k); if (!ev) continue;
    const dl = new Array(n).fill(null); let cur = null, e = 0, seen = false;
    for (let j = 0; j < n; j++) {
      const i = 4 + 3 * j, sched = (r[3] + (j === 0 ? r[i + 2] : r[i + 1])) * 1000;
      const lim = sched + Math.max(0, cur || 0) * 60000 + 120000;   // passaggio previsto (con il ritardo noto) + 2 minuti
      while (e < ev.length && ev[e][0] <= lim) {
        const [t, v] = ev[e++];
        if (t < dep0 - 3600000 || !v) continue;
        seen = true; if (v[1] === 'C') continue;
        const m = delayOf(cc, r, v, t, pos); if (m != null) cur = m;
      }
      dl[j] = cur;
    }
    if (seen) return dl;
  }
  return null;
}
// ---- Treni di confine (dal 25.11.2026): lo stesso treno nell'orario di due paesi. Un treno senza dato prende il ritardo dalla copia nel paese vicino. ----
// Stesso treno = fermate in comune (stessa cella di ~5 km, stesso minuto ±1) LONTANE tra loro (celle non vicine, o almeno 4 fermate) e almeno metà di quelle
// del treno più corto: due fermate vicine non bastano (un railjet Salisburgo–Monaco e la S8 di Monaco passano negli stessi minuti da due stazioni della stessa cella).
const xbSid = (s) => { s = String(s); const h = s.indexOf('#'); return h < 0 ? s : s.slice(0, h); };
const xbCell = (p) => Math.round(p[0] / 0.05) + '|' + Math.round(p[1] / 0.05);
function far(cs) {
  if (cs.length < 2) return false;
  if (cs.length >= 4) return true;
  const p = cs.map((c) => c.split('|').map(Number));
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (Math.abs(p[i][0] - p[j][0]) >= 2 || Math.abs(p[i][1] - p[j][1]) >= 2) return true;
  return false;
}
// rows: { cc: [righe] }, pos: { cc: Map stazione → [lat, lon] } → Map riga → [{ cc, r }] (le copie negli altri paesi)
function matchPairs(rows, pos) {
  const all = [], cells = new Map(), out = new Map();
  for (const cc in rows) for (const r of rows[cc] || []) {
    if (!Array.isArray(r) || r.length < 10) continue;
    const ev = [];
    for (let i = 4; i + 2 < r.length; i += 3) { const p = pos[cc] && pos[cc].get(xbSid(r[i])); if (p) ev.push([xbCell(p), Math.floor((r[3] + r[i + 1]) / 60), Math.floor((r[3] + r[i + 2]) / 60)]); }
    if (ev.length < 2) continue;
    all.push({ cc, r, ev });
    for (const e of ev) (cells.get(e[0]) || cells.set(e[0], new Set()).get(e[0])).add(cc);
  }
  const idx = new Map();   // solo le celle servite dagli orari di almeno due paesi
  all.forEach((x, n) => { x.n = n; for (const e of x.ev) if (cells.get(e[0]).size > 1) for (const m of e[1] === e[2] ? [e[1]] : [e[1], e[2]]) { const k = e[0] + '|' + m; (idx.get(k) || idx.set(k, []).get(k)).push(n); } });
  const put = (a, b) => { (out.get(a.r) || out.set(a.r, []).get(a.r)).push({ cc: b.cc, r: b.r }); };
  for (const x of all) {
    const hit = new Map();   // altro treno → celle delle fermate in comune
    for (const e of x.ev) {
      if (cells.get(e[0]).size < 2) continue;
      const seen = new Set();
      for (const m of e[1] === e[2] ? [e[1]] : [e[1], e[2]]) for (let d = -1; d <= 1; d++) for (const n of idx.get(e[0] + '|' + (m + d)) || []) if (n > x.n && all[n].cc !== x.cc && !seen.has(n)) { seen.add(n); (hit.get(n) || hit.set(n, []).get(n)).push(e[0]); }
    }
    for (const [n, cs] of hit) if (far(cs) && cs.length >= 0.5 * Math.min(x.ev.length, all[n].ev.length)) { put(x, all[n]); put(all[n], x); }
  }
  return out;
}
// tutto il giorno in memoria: per ogni paese orario, registro e posizioni delle stazioni; poi le coppie di confine.
// → { S: { cc: { tt, text, rows, reg, pos, err } }, bor(cc, riga) → { d: ritardo all'ultima fermata, dl: per fermata, from: paese vicino } | null }
// Svizzera come FONTE del prestito (dal 25.11.2026 sera): i treni svizzeri verso Italia, Germania, Austria e Francia danno il loro ritardo alla copia nell'orario
// del paese vicino (gli EC Milano–Zurigo, che il feed italiano non ha). Il contrario non serve: il feed svizzero copre già i suoi treni.
// Orario ?c=2 → righe del formato comune: codice «ch:<trip_id>», stazione = numero UIC, e r.seq = stop_sequence di ogni fermata (i ritardi svizzeri sono per sequenza).
function chMid(day) { const utc = Date.UTC(+day.slice(0, 4), +day.slice(4, 6) - 1, +day.slice(6, 8)); return (utc - +new Date(utc).toLocaleString('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hour12: false }) * 3600000) / 1000; }
function chRows(tt, day) {
  const S = tt.stops || [], mid = chMid(day), rows = [], pos = new Map();
  for (const s of S) if (s && s[2] != null) pos.set(String(s[0]), [+s[2], +s[3]]);
  for (const t of tt.trips || []) {
    if (t[1] === 'BAT') continue;
    const f = t[4] || []; if (f.length < 8) continue;
    const t0 = mid + f[2], r = ['ch:' + t[3], String(t[2] || ''), String(t[0] || t[1] || ''), t0], seq = [];
    for (let i = 0; i + 3 < f.length; i += 4) { const s = S[f[i]]; r.push(String(s ? s[0] : f[i]), mid + f[i + 1] - t0, mid + f[i + 2] - t0); seq.push(f[i + 3]); }
    r[5] = 0; Object.defineProperty(r, 'seq', { value: seq });
    rows.push(r);
  }
  return { rows, pos };
}
// registro degli arrivi (rta:) → ultimo stato di ogni corsa del giorno: Map trip_id → [chiave, ora, soppressa, [[sequenza, ritardo s]]]
function chLast(text, day) {
  const last = new Map();
  for (const l of String(text || '').split('\n')) {
    if (!l || l[0] !== '[') continue;
    let x; try { x = JSON.parse(l); } catch (e) { continue; }
    const k = String(x[0]), b = k.lastIndexOf('|'); if (b < 0 || k.slice(b + 1) !== day) continue;
    const id = k.slice(0, b), o = last.get(id); if (!o || x[1] >= o[1]) last.set(id, x);
  }
  return last;
}
function chStops(r, last) {
  const x = last && last.get(String(r[0]).slice(3)); if (!x || x[2] || !r.seq) return null;
  const bySeq = new Map((x[3] || []).map((q) => [q[0], Math.round(q[1] / 60)])), dl = []; let cur = null;
  for (const q of r.seq) { if (bySeq.has(q)) cur = bySeq.get(q); dl.push(cur != null && cur >= -60 && cur <= 600 ? cur : null); }
  return dl;
}
const XB_NO = { uk: 1, ie: 1 };   // fuori dal prestito: nessun confine con una copia. La Svizzera entra solo come fonte (chi la riceve è il paese vicino)
async function dayData(ccs, day, dir, noreg) {
  const S = {};
  if (ccs.includes('pl') && !PLX.size) try { await plxLoad(); } catch (e) { console.log('ATTENZIONE: elenco delle fermate estere polacche non letto (' + e.message + '): vale solo la regola della Lituania'); }
  for (const cc of ccs) {
    const s = S[cc] = {};
    try {
      s.tt = dir ? JSON.parse(fs.readFileSync(path.join(dir, 'tt-' + cc + '.json'), 'utf8')) : await (await get(SITE + '/api/live/tt/' + (cc === 'ch' ? day + '?c=2' : cc + '-' + day + '?v=1'))).json();
      s.text = noreg ? '' : dir ? fs.readFileSync(path.join(dir, 'reg-' + cc + '.txt'), 'utf8') : await (await get(SITE + '/api/social/dl/' + cc + '/day/' + day + '?to=' + toHour(day), true)).text();
      if (cc !== 'ch') { s.rows = realRows(cc, s.tt.t); s.reg = await regOf(cc, s.text, day, dir); try { s.pos = await stationsOf(cc); } catch (e) { s.pos = null; } }
      else { const c = chRows(s.tt, day); s.rows = c.rows; s.pos = c.pos; s.last = chLast(s.text, day); }
    } catch (e) { s.err = e; }
  }
  const rows = {}, pos = {};
  for (const cc of ccs) if (!XB_NO[cc] && S[cc].rows && S[cc].pos) { rows[cc] = S[cc].rows; pos[cc] = S[cc].pos; }
  const pairs = Object.keys(rows).length > 1 ? matchPairs(rows, pos) : new Map();
  const bor = (cc, r) => {
    const list = pairs.get(r), pa = S[cc] && S[cc].pos; if (!list || !pa || cc === 'ch') return null;
    for (const o of list) {
      const s2 = S[o.cc]; if (!s2 || !s2.pos || (o.cc === 'ch' ? !s2.last : !s2.reg)) continue;
      const dlB = o.cc === 'ch' ? chStops(o.r, s2.last) : perStop(o.cc, o.r, s2.reg, GPS[o.cc] ? s2.pos : null); if (!dlB || dlB.every((v) => v == null)) continue;
      const m = new Map();   // «cella|minuto» della copia → ritardo lì
      for (let i = 4, j = 0; i + 2 < o.r.length; i += 3, j++) { const p = s2.pos.get(xbSid(o.r[i])); if (!p || dlB[j] == null) continue; const c = xbCell(p); m.set(c + '|' + Math.floor((o.r[3] + o.r[i + 1]) / 60), dlB[j]); m.set(c + '|' + Math.floor((o.r[3] + o.r[i + 2]) / 60), dlB[j]); }
      const n = Math.floor((r.length - 4) / 3), dl = new Array(n).fill(null); let cur = null;
      for (let i = 4, j = 0; j < n; i += 3, j++) {
        const p = pa.get(xbSid(r[i]));
        if (p) { const c = xbCell(p); for (const t of [r[3] + r[i + 1], r[3] + r[i + 2]]) for (let d = -1; d <= 1; d++) { const v = m.get(c + '|' + (Math.floor(t / 60) + d)); if (v != null) cur = v; } }
        dl[j] = cur;   // dopo l'ultima fermata in comune vale l'ultimo ritardo noto (stima)
      }
      if (cur != null) return { d: cur, dl, from: o.cc };
    }
    return null;
  };
  return { S, bor, pairs };
}
// Lo stesso treno negli orari di due paesi (Leo Express 414: Polonia e Cechia) sta una volta sola tra i ritardi più grandi: resta la voce col ritardo maggiore.
// ROWOF: voce dell'elenco → riga dell'orario (non si salva); pairs: le copie di confine di matchPairs. top deve essere già in ordine di ritardo.
const ROWOF = new WeakMap();
function dedupeTop(top, pairs) {
  const taken = new Set();
  return top.filter((t) => {
    const r = ROWOF.get(t); if (!r) return true;
    if ((pairs.get(r) || []).some((o) => taken.has(o.r))) return false;
    taken.add(r); return true;
  });
}
function add(s, top, d, item, key) {   // top = [paese, treno, destinazione, minuti, chiave per /train]
  s[1]++; s[d < 2 ? 3 : d <= 5 ? 4 : 5]++;
  if (d <= 1) s[6]++; if (d <= 3) s[7]++; if (d <= 5) s[8]++; if (d <= 15) s[9]++;
  s[10] += Math.max(0, d);
  if (d >= 30) top.push(key ? [...item, d, key] : [...item, d]);
}
// Gran Bretagna (dal 25.11.2026): gli eventi delle bacheche («b:<operatore>|<capolinea>|<arrivo>», log/index.js) si uniscono a quelli
// dell'istantanea oraria (rid) della stessa corsa, in ordine di tempo: per ogni fermata vale l'ultimo ritardo visto, da qualunque fonte.
function boardKey(r) { return 'b:' + String(r[2]).split('|')[0] + '|' + r[r.length - 3] + '|' + (r[3] + r[r.length - 2]); }   // r[2] = «GR» o, dal 25.11.2026, «GR|1S12» (impresa e headcode)
function joinUk(rows, reg) {
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 10) continue;
    const b = reg.get(boardKey(r)); if (!b) continue;
    const rid = String(r[0]).replace(/^uk:/, ''), a = reg.get(rid);
    reg.set(rid, a ? a.concat(b).sort((x, y) => x[0] - y[0]) : b.slice());
  }
  return reg;
}
function summarize(cc, rows, reg, pos, bor) {
  const s = [rows.length, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], top = []; let nx = 0, nb = 0;
  if (cc === 'uk') joinUk(rows, reg);
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 10) continue;
    let f = finalOf(cc, r, reg, pos); if (f.x === 1) nx++;
    if (f.d == null && !f.c && bor) { const b = bor(cc, r); if (b) { f = { d: b.d, c: false, seen: true, x: 3 }; nb++; } }   // treno di confine senza dato: dal paese vicino
    if (f.c) { s[2]++; continue; }
    if (f.d == null) continue;
    const n0 = top.length;
    add(s, top, f.d, [cc, String(r[2] || '').replace(/^[^|]*\|/, ''), String(r[1] || '')], keyOf(cc, r));
    if (top.length > n0) ROWOF.set(top[n0], r);
  }
  return { s, top, nx, nb };
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
  const ccs = onlyI >= 0 ? args[onlyI + 1].split(',') : CC, DAY = await dayData(ccs, day, dir, noreg);   // prima tutto in memoria: servono le copie dei treni di confine negli altri paesi
  let nbor = 0;
  for (const cc of ccs) {
    try {
      const q = DAY.S[cc]; if (q.err) throw q.err;
      const x = cc === 'ch' ? summarizeCh(q.tt, q.text, day) : summarize(cc, q.rows, q.reg, GPS[cc] ? q.pos : null, DAY.bor);
      nbor += x.nb || 0;
      // meno del 15 % dei treni dell'orario con un dato = orario o feed rotti quel giorno (23.11: Spagna 6 su 3267, Irlanda e Grecia 0): il paese non entra, numeri sbagliati no
      if (!usable(x.s)) { console.log(cc, 'escluso: solo', x.s[1] + x.s[2], 'treni con un dato su', x.s[0]); continue; }
      res[cc] = x.s; top.push(...x.top);
      const pc = (n) => (x.s[1] ? Math.round((100 * n) / x.s[1]) : 0) + '%';
      console.log(cc, 'corse', x.s[0], 'con ritardo', x.s[1], 'soppresse', x.s[2], 'in orario', pc(x.s[3]), '2-5', pc(x.s[4]), '>5', pc(x.s[5]), 'minuti', x.s[10], SRC[cc] ? '| orario reale dalla fonte ' + (x.nx || 0) + ', altri ' + (x.s[1] + x.s[2] - (x.nx || 0)) : '', x.nb ? '| dal paese vicino ' + x.nb : '');
    } catch (e) { console.log(cc, 'saltato:', e.message); }
  }
  top.sort((a, b) => b[3] - a[3]);
  const top1 = dedupeTop(top, DAY.pairs); if (top1.length < top.length) console.log('ritardi più grandi: tolti', top.length - top1.length, 'doppioni di confine'); top.length = 0; top.push(...top1);
  const tot = Object.values(res).reduce((a, s) => [a[0] + s[0], a[1] + s[1], a[2] + s[10]], [0, 0, 0]);
  console.log('totale: corse', tot[0], 'con ritardo', tot[1], 'minuti', tot[2], '| treni di confine col ritardo dal paese vicino', nbor);
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
module.exports = { parseReg, keysOf, delayOf, finalOf, joinUk, summarize, summarizeCh, gpsDelay, stationsOf, usable, toHour, exactFi, exactSe, exactOf, exactDay, regOf, noStops, exactUk, ukStops, realRows, perStop, perStopReg, far, matchPairs, plx, setPlx, plxLoad, dedupeTop, ROWOF, dayData, chRows, chLast, chStops, SRC };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
