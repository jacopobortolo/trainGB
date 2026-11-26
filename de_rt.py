"""Germania: ritardi dei treni da due fonti, uniti in un solo file caricato su railpulse.ch.
1. GTFS-Realtime gratuito di gtfs.de (https://realtime.gtfs.de/realtime-free.pb, CC BY-SA 4.0, senza chiave, protobuf ~26 MB con tutti i mezzi): da solo copre circa l'86 % dei treni in viaggio (misura del 19.11.2026).
2. API OpenBoards di DB (DB API Marketplace, chiavi DB_CLIENT_ID e DB_API_KEY, piano Free: 10 richieste al secondo; dal 19.11.2026 al posto dell'API Timetables, che DB spegne
   a meta 2027): partenze (e per le piu grandi anche arrivi) delle stazioni piu trafficate (tools/de_db_stations.json, generato da tools/de_db_stations.py con StaDa), una richiesta
   per stazione, ora programmata e prevista. Un ritardo letto a una stazione vale per tutta la corsa; l'abbinamento alla corsa dell'orario si fa per stazione (le nostre stazioni
   entro 500 m), minuto di partenza (o di arrivo), ora di partenza dal capolinea e destinazione, perche l'orario di gtfs.de non ha il numero del treno.
Troppo per un Worker gratuito: lo esegue questo job (repository pubblico trainGB, minuti gratuiti), avviato dal cronometro di RailPulse ogni ~5 minuti solo mentre qualcuno
guarda la mappa tedesca (D1 live «de:active»).
Esito: PUT /api/live/tt/de-rt (SOCIAL_CRON_KEY) con {ts, d: {trip_id: [ritardo in minuti | null, null, null, 'R' | 'C']}}.
Variabili: SOCIAL_CRON_KEY (per caricare), DB_CLIENT_ID e DB_API_KEY (senza, si usa solo gtfs.de), SITE (predefinito https://railpulse.ch).
Serve: pip install requests gtfs-realtime-bindings"""
import datetime as dt, gzip, json, os, random, re, sys, threading, time
from concurrent.futures import ThreadPoolExecutor
from zoneinfo import ZoneInfo
import requests
from google.transit import gtfs_realtime_pb2 as g

SITE = os.environ.get('SITE', 'https://railpulse.ch')
UA = {'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)', 'Accept-Encoding': 'gzip'}
TZ = ZoneInfo('Europe/Berlin')
HERE = os.path.dirname(os.path.abspath(__file__))
OB = 'https://apis.deutschebahn.com/db-api-marketplace/apis/open-boards/v1'
N_DEP = int(os.environ.get('DB_STATIONS', 1500))    # stazioni di cui leggere le partenze (le piu trafficate dell'elenco)
N_ARR = int(os.environ.get('DB_ARRIVALS', 500))     # di queste, quelle di cui leggere anche gli arrivi (treni sull'ultimo tratto)
WIN = int(os.environ.get('DB_WINDOW', 60))          # finestra in minuti da adesso (piu 10 minuti indietro)
RATE = float(os.environ.get('DB_RATE', 8))          # richieste al secondo (il piano Free ne ammette 10)


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
    d, now = {}, time.time()
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
        delay = None   # ritardo alla PROSSIMA fermata (prima voce con l'ora prevista non ancora passata), altrimenti l'ultimo noto: la prima voce e spesso il capolinea di partenza
        for s in t.stop_time_update:
            ev = s.departure if s.HasField('departure') and s.departure.HasField('delay') else s.arrival if s.HasField('arrival') and s.arrival.HasField('delay') else None
            if ev is not None:
                delay = ev.delay
                if not ev.time or ev.time >= now - 60:
                    break
        if delay is None and t.HasField('delay'):
            delay = t.delay
        d[tid] = [round(delay / 60), None, None, 'R'] if delay is not None and -3600 <= delay <= 3 * 3600 else [None, None, None, 'R']
    return d, f.header.timestamp * 1000, len(f.entity)


def from_db(rows, stations=None, sess=None, now=None, nums=None, canc=None):   # stations, sess e now servono solo alle prove (tests/de_rt_test.py)
    """{trip_id: ritardo in minuti} dalle partenze e dagli arrivi delle stazioni (API OpenBoards di DB).
    nums (dizionario, facoltativo) = {trip_id: numero del treno} (journeyNumber: l'orario di gtfs.de ha solo la linea, «RE17»; serve allo storico per treno, railpulse.ch/train)."""
    cid, key = os.environ.get('DB_CLIENT_ID'), os.environ.get('DB_API_KEY')
    path = next((p for p in (os.path.join(HERE, 'de_db_stations.json'), os.path.join(HERE, 'tools', 'de_db_stations.json')) if os.path.exists(p)), None)
    if stations is None:
        if not (cid and key and path):
            print('DB: saltato (mancano chiavi o elenco stazioni)')
            return {}
        stations = json.load(open(path, encoding='utf-8'))[:N_DEP]
    where = {}   # id stazione nostra -> indice della stazione DB
    for i, s in enumerate(stations):
        for oid in s['near']:
            where.setdefault(oid, i)
    idx = {}     # (indice stazione, minuto, 'd'|'a') -> [(codice, destinazione normalizzata, minuto di partenza dal capolinea)]
    for row in rows:
        base, to = row[3], norm(row[1])
        start = (base + row[6]) // 60 if len(row) > 6 else None
        for k in range(4, len(row), 3):
            i = where.get(row[k])
            if i is None:
                continue
            last = k + 3 >= len(row)
            if not last:
                idx.setdefault((i, (base + row[k + 2]) // 60, 'd'), []).append((row[0], to, start))
            if k > 4:
                idx.setdefault((i, (base + row[k + 1]) // 60, 'a'), []).append((row[0], to, start))
    h = {'DB-Client-Id': cid, 'DB-Api-Key': key, 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': UA['User-Agent']}
    now = now or time.time()
    iso = lambda t: dt.datetime.fromtimestamp(t, TZ).replace(microsecond=0).isoformat()
    ts = lambda v: dt.datetime.fromisoformat(v).timestamp()
    win = {'timeStart': iso(now - 10 * 60), 'timeEnd': iso(now + WIN * 60)}
    lock, state = threading.Lock(), {'next': 0.0, 'calls': 0, 'ok': 0, 'full': 0}
    sess = sess or requests.Session()

    def get(ep, eva, win):
        for attempt in range(2):
            with lock:   # passo fisso tra le richieste: il piano Free ammette 10 al secondo
                wait = state['next'] - time.time()
                state['next'] = max(time.time(), state['next']) + 1.0 / RATE
                state['calls'] += 1
            if wait > 0:
                time.sleep(wait)
            try:
                r = sess.post('%s/%s' % (OB, ep), headers=h, timeout=30, json={'stopPlaceOrStation': {'evaNumbers': [str(eva)]}, 'timeWindow': win, 'maxViaStops': 0, 'maxEntriesPerTransportType': 50, 'languages': ['deu']})
            except requests.RequestException:
                continue
            if r.status_code == 429:
                time.sleep(2)
                continue
            if r.status_code != 200:
                return None
            try:
                j = r.json()
            except ValueError:
                return None
            with lock:
                state['ok'] += 1
            return j
        return None

    def read(job):
        i, ep = job
        kind, res, w = 'd' if ep == 'departures' else 'a', [], win
        for page in range(3):   # al massimo 50 voci per tipo di treno: una tabella piena si continua dall'ultima ora ricevuta
            j = get(ep, stations[i]['eva'][0], w)
            if not j:
                break
            more = part(j, i, ep, kind, res)
            if not more:
                break
            with lock:
                state['full'] += 1
            w = {'timeStart': more, 'timeEnd': win['timeEnd']}
        return list(set(res))

    def part(j, i, ep, kind, res):
        names = {p.get('evaNumber'): (p.get('localizedNames') or [{}])[0].get('name', '') for p in j.get('stopPlaces', [])}
        per, lastt = {}, {}
        for e in j.get(ep, []):
            try:
                tp = (e.get('transport') or {}).get('type')
                per[tp] = per.get(tp, 0) + 1
                if e.get('time'):
                    lastt[tp] = max(lastt.get(tp, ''), e['time'])
                info = e.get('journeyInfo') or {}
                if info.get('journeyCancelled') and e.get('timeSchedule'):   # TUTTA la corsa soppressa (dal 26.11.2026); una fermata soppressa da sola (corsa accorciata) non basta
                    st = info.get('scheduledStartTime')
                    res.append((i, kind, ts(e['timeSchedule']), 'C', int(ts(st)) // 60 if st else None, norm(names.get((info.get('destination') or {}).get('evaNumber'), '')), None))
                    continue
                if e.get('cancelled') or e.get('timeType') not in ('PREVIEW', 'REAL') or not e.get('timeSchedule') or not e.get('time'):
                    continue   # senza previsione (solo orario) o fermata soppressa: nessun dato
                pt = ts(e['timeSchedule'])
                dl = round((ts(e['time']) - pt) / 60)
                if not -60 <= dl <= 180:
                    continue
                info = e.get('journeyInfo') or {}
                st = info.get('scheduledStartTime')
                jn = info.get('headerJourneyNumber') or ((info.get('transportAtStart') or {}).get('journeyNumber'))
                res.append((i, kind, pt, dl, int(ts(st)) // 60 if st else None, norm(names.get((info.get('destination') or {}).get('evaNumber'), '')), jn if isinstance(jn, int) else None))
            except (ValueError, TypeError, AttributeError):
                continue
        full = [lastt[tp] for tp, n in per.items() if n >= 50 and tp in lastt]
        return min(full) if full else None

    def match(i, kind, pt, start, dest):
        cand = idx.get((i, int(pt) // 60, kind), [])
        if len(cand) > 1 and start is not None:   # stesso minuto alla stessa stazione: prima la partenza dal capolinea, poi il nome della destinazione
            cand = [c for c in cand if c[2] == start] or cand
        if len(cand) > 1 and dest:
            cand = [c for c in cand if c[1].startswith(dest[:6]) or dest.startswith(c[1][:6])] or cand
        return cand[0][0] if len(cand) == 1 else None

    jobs = [(i, 'departures') for i in range(len(stations))] + [(i, 'arrivals') for i in range(min(N_ARR, len(stations)))]
    obs, seen, hit, gone = {}, 0, 0, set()   # codice -> [(ora prevista, ritardo)]; gone = corse che DB dà per soppresse per intero
    with ThreadPoolExecutor(max_workers=8) as ex:
        for res in ex.map(read, jobs):
            for i, kind, pt, dl, start, dest, jn in res:
                seen += 1
                code = match(i, kind, pt, start, dest)
                if code and dl == 'C':
                    gone.add(code)
                    continue
                if code:
                    obs.setdefault(code, []).append((pt, dl))
                    if jn and nums is not None:
                        nums[code] = jn
                    hit += 1
    out = {}
    for code, lst in obs.items():
        up = [x for x in lst if x[0] + x[1] * 60 >= now - 120]   # la prossima fermata (ora prevista col ritardo), altrimenti l'ultima
        pt, delay = min(up, key=lambda x: x[0]) if up else max(lst, key=lambda x: x[0])
        out[code] = delay
    if canc is not None:
        canc.update(c for c in gone if c not in out)   # una previsione vera per la stessa corsa vince sulla soppressione
    print('DB OpenBoards:', len(gone), 'corse soppresse per intero;')
    print('DB OpenBoards:', len(stations), 'stazioni,', state['calls'], 'richieste,', state['ok'], 'riuscite,', state['full'], 'tabelle piene,', seen, 'voci con previsione,', hit, 'abbinate,', len(out), 'treni,', round(time.time() - now), 's')
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

    # Dopo una pausa (nessuno guardava la mappa) i ritardi online sono vecchi: gtfs.de da solo ne ha gia ~90 %, quindi si caricano SUBITO, senza aspettare la lettura di DB OpenBoards
    # (alcuni minuti). Se i ritardi online sono freschi si carica una volta sola, alla fine (le scritture di KV gratuito sono 1000 al giorno).
    try:
        old = requests.get('%s/api/live/tt/de-rt?v=%d' % (SITE, random.randint(100, 999)), timeout=60, headers=UA).json().get('ts', 0)
    except Exception:
        old = 0
    early = time.time() * 1000 - old > 12 * 60000
    if early:
        upload(dict(d), 'subito:')
    try:
        nums, canc = {}, set()
        for code, delay in from_db(rows, nums=nums, canc=canc).items():
            if code not in d or (d[code][0] is None and d[code][3] != 'C'):
                d[code] = [delay, None, None, 'R']
        for code in canc:   # soppressa per intero secondo DB: vale anche se gtfs.de (che non ha le soppressioni) la dà in orario
            d[code] = [None, None, None, 'C']
        for code, jn in nums.items():   # numero del treno come quinto campo: il registro dei ritardi (log/index.js) lo conserva, tools/trn_build.js lo usa
            if code in d:
                d[code] = list(d[code][:4]) + [jn]
    except Exception as e:   # un guasto di DB non blocca gtfs.de
        print('DB: errore', e)
    upload(d, 'completo:')


if __name__ == '__main__':
    main()
