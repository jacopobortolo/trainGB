// Storico per treno (dal 24.11.2026): funzioni comuni a train.html (pagina del treno), alle mappe (link dalla scheda del treno) e a tools/trn_build.js.
// Un treno si riconosce da un giorno all'altro da: fermata di partenza | ora di partenza programmata (HHMM, ora locale del paese) | fermata d'arrivo.
// Gli archivi sono divisi in «fette» per paese (trnShard: dipende solo da partenza e arrivo, così un'ora spostata di qualche minuto si ritrova nella stessa fetta).
// Il blocco tra /*TRN*/ e /*/TRN*/ è copiato IDENTICO in tools/trn_build.js (una prova controlla che siano uguali).
(function () {
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
  const T = { N: TRN_N, TZ: TRN_TZ, hm: trnHm, sid: trnSid, key: trnKey, shard: trnShard, num: trnNum, bucket: trnBucket };
  // link alla pagina del treno da una corsa della mappa: o/d = id delle fermate di partenza e arrivo, ms = partenza programmata
  T.url = (cc, o, d, ms, name, lang) => '/train?c=' + cc + '&k=' + encodeURIComponent(trnKey(o, trnHm(cc, ms), d)) + (name ? '&n=' + encodeURIComponent(name) : '') + (lang ? '&l=' + lang : '');
  if (typeof window !== 'undefined') { window.TB = window.TB || {}; window.TB.trn = T; }
  if (typeof module !== 'undefined') module.exports = T;
})();
