// Campione orario per lo storico delle statistiche (railpulse.ch/stats): apre la pagina in un browser senza finestra, aspetta che tutti i
// paesi abbiano i treni e manda al sito il riassunto che la pagina stessa prepara (TB.stats.sample()): PUT /api/live/sample (SOCIAL_CRON_KEY).
// Gira ogni ora nel repository PUBBLICO jacopobortolo/trainGB (workflow stats.yml, avviato dal cronometro; minuti gratuiti): questa è la copia di
// riferimento, se cambia va ricopiata là. Una sola apertura di pagina per giro (~70 richieste al sito): non metterla in un ciclo.
// Uso: SOCIAL_CRON_KEY=… node tools/stats_sample.js      (DRY=1: stampa il campione senza mandarlo)
const { chromium } = require('playwright');
const SITE = process.env.SITE || 'https://railpulse.ch';
(async () => {
  const b = await chromium.launch();
  try {
    const p = await (await b.newContext({ viewport: { width: 1100, height: 800 }, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 railpulse-stats-sample' })).newPage();
    await p.goto(SITE + '/stats?l=en', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForFunction(() => window.TB && TB.stats && TB.stats.get() && TB.stats.get().n > 300 && TB.stats.get().done >= TB.stats.get().all, null, { timeout: 180000 });
    await p.waitForTimeout(12000);   // gli ultimi paesi finiscono di togliere i doppioni ai confini
    const s = await p.evaluate(() => { TB.stats.render(); return TB.stats.sample(); });
    if (!s || !(s.n > 300)) throw new Error('campione vuoto');
    console.log('campione:', s.n, 'treni,', Object.keys(s.c).length, 'paesi,', s.done + '/' + s.all, 'caricati, ritardo sommato', s.dm, 'min, arrivi entro un’ora', s.arr.join('/'));
    if (process.env.DRY) { console.log(JSON.stringify(s).slice(0, 1500)); return; }
    const r = await fetch(SITE + '/api/live/sample', { method: 'PUT', headers: { Authorization: 'Bearer ' + (process.env.SOCIAL_CRON_KEY || ''), 'Content-Type': 'application/json', 'User-Agent': 'railpulse-stats-sample' }, body: JSON.stringify(s) });
    console.log('salvato:', r.status, (await r.text()).slice(0, 200));
    if (!r.ok) process.exitCode = 1;
  } finally { await b.close(); }
})().catch((e) => { console.error('campione saltato:', e.message); process.exit(1); });
