// Campione orario per lo storico delle statistiche (railpulse.ch/stats): apre la pagina in un browser senza finestra, aspetta che tutti i
// paesi abbiano i treni e manda al sito il riassunto che la pagina stessa prepara (TB.stats.sample()): PUT /api/live/sample (SOCIAL_CRON_KEY).
// Gira ogni ora nel repository PUBBLICO jacopobortolo/trainGB (workflow stats.yml, avviato dal cronometro; minuti gratuiti): questa è la copia di
// riferimento, se cambia va ricopiata là. Una sola apertura di pagina per giro (~70 richieste al sito): non metterla in un ciclo.
// Dal 23.11.2026 parte ogni MEZZ'ORA e manda anche lo storico treno per treno (TB.stats.trains(), PUT /api/live/trains, compresso con gzip, in parti
// sotto ~5 MB di JSON): il campione delle statistiche resta orario (il sito scarta quelli a meno di 40 minuti, risposta «skipped»).
// Uso: SOCIAL_CRON_KEY=… node tools/stats_sample.js      (DRY=1: stampa il campione senza mandarlo)
const { chromium } = require('playwright');
const zlib = require('zlib');
const SITE = process.env.SITE || 'https://railpulse.ch';
(async () => {
  const b = await chromium.launch();
  try {
    const p = await (await b.newContext({ viewport: { width: 1100, height: 800 }, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 railpulse-stats-sample' })).newPage();
    await p.goto(SITE + '/stats?l=en', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForFunction(() => window.TB && TB.stats && TB.stats.get() && TB.stats.get().n > 300 && TB.stats.get().done >= TB.stats.get().all, null, { timeout: 180000 });
    await p.waitForTimeout(12000);   // gli ultimi paesi finiscono di togliere i doppioni ai confini
    const { s, tr } = await p.evaluate(() => { TB.stats.render(); return { s: TB.stats.sample(), tr: TB.stats.trains() }; });
    if (!s || !(s.n > 300)) throw new Error('campione vuoto');
    console.log('campione:', s.n, 'treni,', Object.keys(s.c).length, 'paesi,', s.done + '/' + s.all, 'caricati, ritardo sommato', s.dm, 'min, arrivi entro un’ora', s.arr.join('/'));
    if (process.env.DRY) { console.log(JSON.stringify(s).slice(0, 1500)); if (tr) console.log('treni:', tr.n, JSON.stringify(tr).length, 'byte di JSON,', zlib.gzipSync(JSON.stringify(tr), { level: 9 }).length, 'compressi; esempio', JSON.stringify(Object.values(tr.c)[0][0])); return; }
    const r = await fetch(SITE + '/api/live/sample', { method: 'PUT', headers: { Authorization: 'Bearer ' + (process.env.SOCIAL_CRON_KEY || ''), 'Content-Type': 'application/json', 'User-Agent': 'railpulse-stats-sample' }, body: JSON.stringify(s) });
    console.log('salvato:', r.status, (await r.text()).slice(0, 200));
    if (!r.ok) process.exitCode = 1;
    // storico treno per treno: i paesi divisi in parti sotto ~5 MB di JSON, ognuna compressa
    if (tr && tr.n > 100) {
      const parts = []; let cur = {}, size = 0;
      for (const cc of Object.keys(tr.c)) { const z = JSON.stringify(tr.c[cc]).length; if (size && size + z > 5e6) { parts.push(cur); cur = {}; size = 0; } cur[cc] = tr.c[cc]; size += z; }
      parts.push(cur);
      for (let i = 0; i < parts.length; i++) {
        const n = Object.values(parts[i]).reduce((a, b) => a + b.length, 0), gz = zlib.gzipSync(JSON.stringify({ v: tr.v, ts: tr.ts, part: i, c: parts[i] }), { level: 9 });
        const q = await fetch(SITE + '/api/live/trains', { method: 'PUT', headers: { Authorization: 'Bearer ' + (process.env.SOCIAL_CRON_KEY || ''), 'Content-Type': 'application/gzip', 'X-Ts': String(tr.ts), 'X-Part': String(i), 'X-N': String(n), 'User-Agent': 'railpulse-stats-sample' }, body: gz });
        console.log('treni, parte', i, ':', n, 'treni,', gz.length, 'byte →', q.status, (await q.text()).slice(0, 160));
        if (!q.ok) process.exitCode = 1;
      }
    } else console.log('storico dei treni saltato: elenco vuoto');
  } finally { await b.close(); }
})().catch((e) => { console.error('campione saltato:', e.message); process.exit(1); });
