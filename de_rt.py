"""Germania: ritardi dei treni da due fonti, uniti in un solo file caricato su railpulse.ch.
1. GTFS-Realtime gratuito di gtfs.de (https://realtime.gtfs.de/realtime-free.pb, CC BY-SA 4.0, senza chiave, protobuf ~26 MB con tutti i mezzi): copre circa un treno su cinque.
2. API Timetables di DB (DB API Marketplace, chiavi DB_CLIENT_ID e DB_API_KEY, 60 richieste al minuto): le variazioni (`fchg`) delle ~100 stazioni piu trafficate
   (tools/de_db_stations.json, generato da tools/de_db_stations.py con StaDa). Un ritardo letto a una stazione vale per tutta la corsa; l'abbinamento alla corsa dell'orario
   si fa per stazione (le nostre stazioni entro 500 m), minuto di partenza (o di arrivo se e l'ultima fermata) e destinazione, perche l'orario di gtfs.de non ha il numero del treno.
Troppo per un Worker gratuito: lo esegue questo job (repository pubblico trainGB, minuti gratuiti), avviato dal cronometro di RailPulse ogni ~5 minuti solo mentre qualcuno
guarda la mappa tedesca (D1 live «de:active»).
Esito: PUT /api/live/tt/de-rt (SOCIAL_CRON_KEY) con {ts, d: {trip_id: [ritardo in minuti | null, null, null, 'R' | 'C']}}.
Variabili: SOCIAL_CRON_KEY (per caricare), DB_CLIENT_ID e DB_API_KEY (senza, si usa solo gtfs.de), SITE (predefinito https://railpulse.ch).
Serve: pip install requests gtfs-realtime-bindings"""
import datetime as dt, gzip, json, os, random, re, sys, time
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo
import requests
from google.transit import gtfs_realtime_pb2 as g

SITE = os.environ.get('SITE', 'https://railpulse.ch')
UA = {'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)', 'Accept-Encoding': 'gzip'}
TZ = ZoneInfo('Europe/Berlin')
HERE = os.path.dirname(os.path.abspath(__file__))
DB = 'https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1'


def rows_of(day):
    r = requests.get('%s/api/live/tt/de-%s?v=2' % (SITE, day), timeout=120, headers=UA)
    return r.json().get('t', []) if r.status_code == 200 else []


def norm(s):
    return re.sub(r'[^a-z]', '', (s or '').lower().replace('ä', 'a').replace('ö', 'o').replace('ü', 'u').replace('ß', 'ss'))


def from_gtfs_de(ids, days):
    content = None
    for attempt in range(3):   # il download di 26 MB a volte si interrompe a meta: 3 tentativi
        try:
            r = requests.get('https://realtime.gtfs.de/realtime-free.pb', timeout=120, headers=UA)
            r.raise_for_status()
            content = r.content
            break
        except requests.RequestException as e:
            print('gtfs.de: tentativo', attempt + 1, 'fallito:', e)
            time.sleep(5)
    if content is None:
        return {}, 0, 0
    f = g.FeedMessage()
    f.ParseFromString(content)
    d = {}
    for e in f.entity:
        if not e.HasField('trip_update'):
            continue
        t = e.trip_update
        tid = t.trip.trip_id
        if tid not in ids or (t.trip.start_date and t.trip.start_date not in days):
            continue
        if t.trip.schedule_relationship == 3:   # CANCELED
            d[tid] = [None, None, None, 'C']
            continue
        delay = None
        for s in t.stop_time_update:
            ev = s.departure if s.HasField('departure') and s.departure.HasField('delay') else s.arrival if s.HasField('arrival') and s.arrival.HasField('delay') else None
            if ev is not None:
                delay = ev.delay
                break
        if delay is None and t.HasField('delay'):
            delay = t.delay
        d[tid] = [round(delay / 60), None, None, 'R'] if delay is not None and -3600 <= delay <= 3 * 3600 else [None, None, None, 'R']
    return d, f.header.timestamp * 1000, len(f.entity)


def epoch(s):   # «2611132109» (aammggHHMM, ora di Berlino) -> secondi UTC
    return int(dt.datetime(2000 + int(s[0:2]), int(s[2:4]), int(s[4:6]), int(s[6:8]), int(s[8:10]), tzinfo=TZ).timestamp())


def from_db(rows):
    """{trip_id: ritardo in minuti} dalle variazioni delle stazioni principali (API Timetables di DB)."""
    cid, key = os.environ.get('DB_CLIENT_ID'), os.environ.get('DB_API_KEY')
    path = next((p for p in (os.path.join(HERE, 'de_db_stations.json'), os.path.join(HERE, 'tools', 'de_db_stations.json')) if os.path.exists(p)), None)
    if not (cid and key and path):
        print('DB: saltato (mancano chiavi o elenco stazioni)')
        return {}
    stations = json.load(open(path, encoding='utf-8'))
    where = {}   # id stazione nostra -> indice della stazione DB
    for i, s in enumerate(stations):
        for oid in s['near']:
            where.setdefault(oid, i)
    idx = {}     # (indice stazione, minuto, 'd'|'a') -> [(codice, destinazione normalizzata)]
    for row in rows:
        base, to = row[3], norm(row[1])
        for k in range(4, len(row), 3):
            i = where.get(row[k])
            if i is None:
                continue
            last = k + 3 >= len(row)
            if not last:
                idx.setdefault((i, (base + row[k + 2]) // 60, 'd'), []).append((row[0], to))
            if k > 4:
                idx.setdefault((i, (base + row[k + 1]) // 60, 'a'), []).append((row[0], to))
    h = {'DB-Client-Id': cid, 'DB-Api-Key': key, 'Accept': 'application/xml'}
    now = time.time()
    ph = dt.datetime.fromtimestamp(now + 20 * 60, TZ)   # ora del piano da leggere: copre da ~10 minuti fa a ~50 minuti avanti
    plan_path = '%s/%s' % (ph.strftime('%y%m%d'), ph.strftime('%H'))
    obs = {}     # codice -> [(ora prevista, ritardo)]
    calls = ok = hit = 0

    def get(url):
        nonlocal calls, ok
        calls += 1
        try:
            r = requests.get(url, headers=h, timeout=30)
        except requests.RequestException:
            return None
        if r.status_code == 429:
            time.sleep(20)
            return None
        if r.status_code != 200:
            return None
        try:
            root = ET.fromstring(r.content)
        except ET.ParseError:
            return None
        ok += 1
        return root

    def match(i, kind, pt, ppth):
        cand = idx.get((i, pt // 60, kind), [])
        if len(cand) > 1:
            dest = norm((ppth or '').split('|')[-1]) if kind == 'd' else ''
            narrowed = [c for c in cand if dest and (c[1].startswith(dest[:6]) or dest.startswith(c[1][:6]))]
            cand = narrowed or cand
        return cand[0][0] if len(cand) == 1 else None

    for i, s in enumerate(stations):
        for eva in s['eva']:
            chg = get('%s/fchg/%s' % (DB, eva))
            time.sleep(1.05)   # limite di 60 richieste al minuto
            plan = get('%s/plan/%s/%s' % (DB, eva, plan_path))
            time.sleep(1.05)
            changes = {}   # id della corsa-fermata -> {'d'|'a': ritardo | None (soppresso)}
            if chg is not None:
                for el in chg.findall('s'):
                    for tag, kind in (('dp', 'd'), ('ar', 'a')):
                        ev = el.find(tag)
                        if ev is None or not ev.get('pt'):
                            continue
                        pt = epoch(ev.get('pt'))
                        if ev.get('cs') == 'c':
                            changes.setdefault(el.get('id'), {})[kind] = None
                            continue
                        if ev.get('ct'):
                            dl = round((epoch(ev.get('ct')) - pt) / 60)
                            if -60 <= dl <= 180:
                                changes.setdefault(el.get('id'), {})[kind] = dl
                                code = match(i, kind, pt, ev.get('ppth'))
                                if code:
                                    obs.setdefault(code, []).append((pt, dl))
                                    hit += 1
            if plan is not None:   # treni previsti nella finestra senza variazione: in orario
                for el in plan.findall('s'):
                    for tag, kind in (('dp', 'd'), ('ar', 'a')):
                        ev = el.find(tag)
                        if ev is None or not ev.get('pt'):
                            continue
                        pt = epoch(ev.get('pt'))
                        if not now - 600 <= pt <= now + 3000 or kind in changes.get(el.get('id'), {}):
                            continue
                        code = match(i, kind, pt, ev.get('ppth'))
                        if code:
                            obs.setdefault(code, []).append((pt, 0))
                            hit += 1
    out = {}
    for code, lst in obs.items():
        up = [x for x in lst if x[0] >= now - 600]
        pt, delay = min(up, key=lambda x: x[0]) if up else max(lst, key=lambda x: x[0])   # la prossima fermata, altrimenti l'ultima
        out[code] = delay
    print('DB:', calls, 'richieste,', ok, 'riuscite,', hit, 'ritardi abbinati,', len(out), 'treni')
    return out


def main():
    now = dt.datetime.now(TZ)
    days = [(now - dt.timedelta(days=o)).strftime('%Y%m%d') for o in (0, 1)]
    rows = []
    for d in days:
        rows += rows_of(d)
    if not rows:
        sys.exit('orario non trovato su ' + SITE)
    ids = {r[0] for r in rows}
    d, feed_ts, n = from_gtfs_de(ids, days)
    known = sum(1 for v in d.values() if v[0] is not None)
    key = os.environ.get('SOCIAL_CRON_KEY')

    def upload(d, label):
        body = gzip.compress(json.dumps({'ts': int(time.time() * 1000), 'feed': feed_ts, 'd': d}, separators=(',', ':')).encode(), 9)
        print(label, n, 'entita gtfs.de;', known, 'con ritardo da gtfs.de;', sum(1 for v in d.values() if v[0] is not None), 'in tutto;', len(body) // 1000, 'kB', end='')
        if key:
            p = requests.put(SITE + '/api/live/tt/de-rt', data=body, headers={'Authorization': 'Bearer ' + key}, timeout=120)
            print(' ->', p.status_code)
        else:
            print(' (non caricato: manca SOCIAL_CRON_KEY)')

    # Dopo una pausa (nessuno guardava la mappa) i ritardi online sono vecchi: gtfs.de da solo ne ha gia ~90 %, quindi si caricano SUBITO, senza aspettare i ~4 minuti di DB Timetables
    # (60 richieste al minuto). Se i ritardi online sono freschi si carica una volta sola, alla fine (le scritture di KV gratuito sono 1000 al giorno).
    try:
        old = requests.get('%s/api/live/tt/de-rt?v=%d' % (SITE, random.randint(100, 999)), timeout=60, headers=UA).json().get('ts', 0)
    except Exception:
        old = 0
    early = time.time() * 1000 - old > 12 * 60000
    if early:
        upload(dict(d), 'subito:')
    try:
        for code, delay in from_db(rows).items():
            if code not in d or (d[code][0] is None and d[code][3] != 'C'):
                d[code] = [delay, None, None, 'R']
    except Exception as e:   # un guasto di DB non blocca gtfs.de
        print('DB: errore', e)
    upload(d, 'completo:')


main()
