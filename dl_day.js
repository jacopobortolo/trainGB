// Ritardi di TUTTI i treni di un giorno, dal registro dei ritardi d'Europa (log/index.js, D1 «dl:<paese>:<ora>») unito all'orario del giorno.
// Per ogni corsa dell'orario: il ritardo all'arrivo = l'ultimo ritardo comunicato prima dell'arrivo (il registro legge ogni paese ogni ~7 minuti,
// quindi la precisione è di qualche minuto). Sostituisce la stima dalle istantanee orarie nella pagina /stats («Da quando contiamo»).
//   node tools/dl_day.js [AAAAMMGG] [--upload] [--dir cartella]   (giorno predefinito: ieri a Zurigo; serve SOCIAL_CRON_KEY per leggere il registro e caricare)
//   --dir = file già scaricati (reg-<cc>.txt nel formato di /api/social/dl/<cc>/day/<giorno>, tt-<cc>.json): per provare senza rete.
// Risultato in D1 «tt:dlday» (PUT /api/live/tt/dlday, letto da js/stats.js con GET /api/live/tt/dlday):
//   { v: 1, upd, days: { AAAAMMGG: { cc: [corse, con ritardo, soppresse, <2, 2–5, >5, ≤1, ≤3, ≤5, ≤15, minuti di ritardo sommati] } }, top: { AAAAMMGG: [[cc, treno, destinazione, minuti]] } }
// Paesi esclusi: Grecia ed Estonia (solo posizione GPS), Norvegia (codici diversi tra registro e orario), Svizzera (registro proprio degli arrivi, rta:).
// Una copia identica sta nel repository pubblico trainGB (workflow dl-day.yml): se cambia, ricopiarla.
const fs = require('fs'), path = require('path');
const SITE = process.env.SITE || 'https://railpulse.ch', KEY = process.env.SOCIAL_CRON_KEY || '';
const CC = ['de', 'fr', 'it', 'es', 'nl', 'be', 'lu', 'pl', 'cz', 'sk', 'hu', 'si', 'ro', 'bg', 'pt', 'dk', 'se', 'fi', 'uk', 'ie', 'lv'];
const KEEP_DAYS = 120;
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
  return m;
}
const dateIn = (ms, tz) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: tz });
// codici con cui il registro conosce la corsa (le stesse regole dei moduli dati delle pagine: js/<paese>-data.js)
function keysOf(cc, r) {
  const code = String(r[0]), dep0 = r[3] + r[6], k = [];
  if (cc === 'be') k.push('be:o:' + r[4] + '|' + r[r.length - 3] + '|' + dep0);
  if (cc === 'fi' || cc === 'se') { k.push(code.slice(3) + '|' + dateIn(dep0 * 1000, TZ[cc])); return k; }
  if (cc === 'uk') { k.push(code.replace(/^uk:/, '')); return k; }
  k.push(code);
  if (cc === 'ro') { const n = (String(r[2]).match(/(\d+)\s*$/) || [])[1]; if (n) k.push('n:' + n.replace(/^0+/, '')); }
  if (cc === 'fr') { const n = code.startsWith('idf:') ? code.slice(4) : (/^OCESN(\d+)/.exec(code) || [])[1]; if (n) k.push('s:' + n + '@' + Math.floor(dep0 / 60)); }
  return k;
}
// ritardo (minuti) di un valore del registro per questa corsa; Polonia e Cechia: dall'ora prevista della prossima fermata
function delayOf(cc, r, v) {
  if (!v || v[1] === 'C') return null;
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
// una corsa: { d: ritardo all'arrivo | null, c: soppressa }
function finalOf(cc, r, reg) {
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
      const m = delayOf(cc, r, v); if (m != null) { d = m; canc = false; }
    }
    if (d != null || canc) break;   // trovato con questo codice: gli altri non servono
  }
  return { d, c: canc && d == null, seen };
}
function summarize(cc, rows, reg) {
  const s = [rows.length, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], top = [];
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 10) continue;
    const f = finalOf(cc, r, reg);
    if (f.c) { s[2]++; continue; }
    if (f.d == null) continue;
    const d = f.d; s[1]++;
    s[d < 2 ? 3 : d <= 5 ? 4 : 5]++;
    if (d <= 1) s[6]++; if (d <= 3) s[7]++; if (d <= 5) s[8]++; if (d <= 15) s[9]++;
    s[10] += Math.max(0, d);
    if (d >= 30) top.push([cc, String(r[2] || '').replace(/^[^|]*\|/, ''), String(r[1] || ''), d]);
  }
  return { s, top };
}
async function get(url, auth) {
  const r = await fetch(url, { headers: { 'User-Agent': 'railpulse-tools', ...(auth ? { Authorization: 'Bearer ' + KEY } : {}) } });
  if (!r.ok) throw new Error(url + ' → HTTP ' + r.status);
  return r;
}
async function main() {
  const args = process.argv.slice(2), dirI = args.indexOf('--dir'), dir = dirI >= 0 ? args[dirI + 1] : '';
  const day = args.find((a) => /^\d{8}$/.test(a)) || dateIn(Date.now() - 86400000, 'Europe/Zurich').replace(/-/g, '');
  const res = {}, top = [];
  for (const cc of CC) {
    try {
      const rows = dir ? JSON.parse(fs.readFileSync(path.join(dir, 'tt-' + cc + '.json'), 'utf8')).t : (await (await get(SITE + '/api/live/tt/' + cc + '-' + day + '?v=1')).json()).t;
      const text = dir ? fs.readFileSync(path.join(dir, 'reg-' + cc + '.txt'), 'utf8') : await (await get(SITE + '/api/social/dl/' + cc + '/day/' + day, true)).text();
      const x = summarize(cc, rows || [], parseReg(text));
      res[cc] = x.s; top.push(...x.top);
      const pc = (n) => (x.s[1] ? Math.round((100 * n) / x.s[1]) : 0) + '%';
      console.log(cc, 'corse', x.s[0], 'con ritardo', x.s[1], 'soppresse', x.s[2], 'in orario', pc(x.s[3]), '2-5', pc(x.s[4]), '>5', pc(x.s[5]), 'minuti', x.s[10]);
    } catch (e) { console.log(cc, 'saltato:', e.message); }
  }
  top.sort((a, b) => b[3] - a[3]);
  const tot = Object.values(res).reduce((a, s) => [a[0] + s[0], a[1] + s[1], a[2] + s[10]], [0, 0, 0]);
  console.log('totale: corse', tot[0], 'con ritardo', tot[1], 'minuti', tot[2]);
  if (!args.includes('--upload')) return;
  if (!KEY) throw new Error('manca SOCIAL_CRON_KEY');
  if (Object.keys(res).length < 10 || tot[1] < 5000) throw new Error('troppo pochi dati, non carico');
  let all = { v: 1, days: {}, top: {} };
  try { const j = await (await get(SITE + '/api/live/tt/dlday?x=' + Date.now())).json(); if (j && j.days) all = j; } catch (e) { /* primo giorno */ }
  all.days[day] = res; all.top[day] = top.slice(0, 30); all.upd = Date.now();
  const ks = Object.keys(all.days).sort(); for (const k of ks.slice(0, Math.max(0, ks.length - KEEP_DAYS))) { delete all.days[k]; delete all.top[k]; }
  const body = require('zlib').gzipSync(JSON.stringify(all));
  const r = await fetch(SITE + '/api/live/tt/dlday', { method: 'PUT', body, headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/octet-stream', 'User-Agent': 'railpulse-tools' } });
  console.log('caricato:', r.status, await r.text());
}
module.exports = { parseReg, keysOf, delayOf, finalOf, summarize };
if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
