"""Ritardi di tutti i treni britannici dall'istantanea oraria «Darwin Real Time Train Information snapshots»
(Rail Data Marketplace). Chiave nella variabile RDM_KEY_SNAP; con SOCIAL_CRON_KEY carica il risultato su railpulse.ch
(PUT /api/live/tt/uk-rt). Richiede: pip install requests

Risultato: JSON {"ts": <istante dell'istantanea, secondi Unix>, "d": {"<rid>": <minuti di ritardo>, …}} per i treni
non ancora arrivati. Il ritardo è la prima previsione dopo l'ultimo orario reale (o l'ultimo reale, se non ci sono previsioni)."""
import gzip, json, os, re, sys, time
from datetime import datetime, timezone

API = 'https://api1.raildata.org.uk/1010-darwin-real-time-train-information-snapshots1_0/download/snapshot'
TS = re.compile(r'<TS rid="(\d+)"[^>]*>(.*?)</TS>', re.S)
LOC = re.compile(r'<(?:\w+:)?Location ([^>]*)>(.*?)</(?:\w+:)?Location>', re.S)
EV = re.compile(r'<(?:\w+:)?(arr|dep|pass) ([^>]*?)/?>')
ATTR = re.compile(r'(\w+)="([^"]*)"')


def mins(v):
    return int(v[:2]) * 60 + int(v[3:5]) + (int(v[6:8]) / 60 if len(v) >= 8 else 0)


def diff(real, plan):
    d = mins(real) - mins(plan)
    return d - 1440 if d > 720 else d + 1440 if d < -720 else d


def fetch(now):
    """scarica l'istantanea dell'ora più recente già pronta (dopo 8 minuti dall'ora piena), altrimenti quella prima"""
    import requests
    for back in (480, 4080):
        t = datetime.fromtimestamp(now - back, timezone.utc)
        for attempt in range(4):                # 429 = richieste troppo ravvicinate: si riprova dopo qualche secondo
            r = requests.post(API, json={'date': t.strftime('%Y-%m-%d'), 'hour': t.strftime('%H')},
                              headers={'x-apikey': os.environ['RDM_KEY_SNAP'], 'User-Agent': 'RailPulse'}, timeout=60)
            if r.status_code != 429:
                break
            time.sleep(5 + 5 * attempt)
        if r.status_code != 200:
            print('richiesta', t.strftime('%H'), r.status_code)
            continue
        urls = re.findall(r'https://[^"\s\\]+', r.text)
        if not urls:
            continue
        f = requests.get(urls[0], timeout=240)
        if f.status_code == 200 and len(f.content) > 100000:
            return f.content, int(t.replace(minute=0, second=0, microsecond=0).timestamp())
        print('file', t.strftime('%H'), f.status_code)
    return None, 0


def delays(raw):
    out = {}
    for rid, body in TS.findall(raw):
        last_real, forecast, done = None, None, False
        for attrs, inner in LOC.findall(body):
            a = dict(ATTR.findall(attrs))
            plan = {'arr': a.get('pta') or a.get('wta'), 'dep': a.get('ptd') or a.get('wtd'), 'pass': a.get('wtp')}
            done = False
            for kind, ev in EV.findall(inner):
                e = dict(ATTR.findall(ev))
                if not plan.get(kind):
                    continue
                if e.get('at'):
                    last_real, forecast = diff(e['at'], plan[kind]), None
                    done = kind == 'arr'
                elif e.get('et') and forecast is None:
                    forecast = diff(e['et'], plan[kind])
        # «done» resta vero solo se l'ultima fermata ha un arrivo reale: treno arrivato
        if done and forecast is None:
            continue
        d = forecast if forecast is not None else last_real
        if d is not None and -30 < d < 600:
            out[rid] = round(d)
    return out


def main():
    now = time.time()
    if len(sys.argv) > 1:                       # prova su un file già scaricato
        blob, ts = open(sys.argv[1], 'rb').read(), int(now) // 3600 * 3600
    else:
        blob, ts = fetch(now)
    if not blob:
        sys.exit('istantanea non disponibile')
    raw = gzip.decompress(blob).decode('utf-8', 'replace')
    m = re.search(r'SnapshotId>(\d{14})<', raw)
    if m:
        ts = int(datetime.strptime(m.group(1), '%Y%m%d%H%M%S').replace(tzinfo=timezone.utc).timestamp())
    d = delays(raw)
    body = gzip.compress(json.dumps({'ts': ts, 'd': d}, separators=(',', ':')).encode('utf-8'), 9)
    late = sum(1 for v in d.values() if v >= 2)
    print(len(d), 'treni non arrivati;', late, 'con almeno 2 minuti;', len(body) // 1000, 'kB; istantanea', datetime.fromtimestamp(ts, timezone.utc).strftime('%d.%m %H:%M UTC'))
    key = os.environ.get('SOCIAL_CRON_KEY')
    if key and len(sys.argv) == 1:
        import requests
        r = requests.put(os.environ.get('SITE', 'https://railpulse.ch') + '/api/live/tt/uk-rt', data=body, headers={'Authorization': 'Bearer ' + key}, timeout=60)
        r.raise_for_status()
        print('caricata')


if __name__ == '__main__':
    main()
