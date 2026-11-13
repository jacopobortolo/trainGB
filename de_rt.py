"""Germania: ritardi dei treni dal GTFS-Realtime gratuito di gtfs.de (https://realtime.gtfs.de/realtime-free.pb, CC BY-SA 4.0, senza chiave, protobuf ~26 MB con tutti i mezzi).
Troppo grande per un Worker gratuito: lo legge questo job (repository pubblico trainGB, minuti gratuiti), avviato dal cronometro di RailPulse ogni ~5 minuti solo mentre qualcuno guarda
la mappa tedesca (D1 live «de:active»).
1. scarica l'orario di oggi e di ieri da railpulse.ch (/api/live/tt/de-<giorno>) per sapere quali trip_id sono treni (il feed ha anche autobus e tram);
2. legge il feed e, per ogni treno, prende il ritardo alla prima fermata con ora prevista (la prossima o quella in corso) e le soppressioni;
3. carica {ts, d: {trip_id: [ritardo in minuti | null, null, null, 'R' | 'C']}} con PUT /api/live/tt/de-rt (SOCIAL_CRON_KEY), ~8000 treni, ~100 kB.
Variabili: SOCIAL_CRON_KEY (obbligatoria per caricare), SITE (predefinito https://railpulse.ch). Serve: pip install requests gtfs-realtime-bindings"""
import gzip, json, os, sys, time, datetime as dt
from zoneinfo import ZoneInfo
import requests
from google.transit import gtfs_realtime_pb2 as g

SITE = os.environ.get('SITE', 'https://railpulse.ch')
UA = {'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)', 'Accept-Encoding': 'gzip'}
TZ = ZoneInfo('Europe/Berlin')


def ids_of(day):
    r = requests.get('%s/api/live/tt/de-%s?v=1' % (SITE, day), timeout=120, headers=UA)
    if r.status_code != 200:
        return set()
    return {row[0] for row in r.json().get('t', [])}


def main():
    now = dt.datetime.now(TZ)
    days = [(now - dt.timedelta(days=o)).strftime('%Y%m%d') for o in (0, 1)]
    ids = set()
    for d in days:
        ids |= ids_of(d)
    if not ids:
        sys.exit('orario non trovato su ' + SITE)
    r = requests.get('https://realtime.gtfs.de/realtime-free.pb', timeout=120, headers=UA)
    r.raise_for_status()
    f = g.FeedMessage()
    f.ParseFromString(r.content)
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
        if delay is not None and -3600 <= delay <= 3 * 3600:
            d[tid] = [round(delay / 60), None, None, 'R']
        else:
            d[tid] = [None, None, None, 'R']
    body = gzip.compress(json.dumps({'ts': int(time.time() * 1000), 'feed': f.header.timestamp * 1000, 'd': d}, separators=(',', ':')).encode(), 9)
    print(len(f.entity), 'entita;', len(d), 'treni;', len(body) // 1000, 'kB', end='')
    key = os.environ.get('SOCIAL_CRON_KEY')
    if key:
        p = requests.put(SITE + '/api/live/tt/de-rt', data=body, headers={'Authorization': 'Bearer ' + key}, timeout=120)
        print(' ->', p.status_code)
    else:
        print(' (non caricato: manca SOCIAL_CRON_KEY)')


main()
