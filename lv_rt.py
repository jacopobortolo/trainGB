#!/usr/bin/env python3
"""Ritardi e posizioni dei treni lettoni (Vivi) -> railpulse.ch/api/live/tt/lv-rt (D1), letto dalla pagina /lv con /api/lv/rt.

Fonte: feed GTFS-Realtime dell'aggregatore baltico pieturas.lv (https://gsvalbe.id.lv/pieturas/dati/gtfs-rt.pb -> rt.pieturas.lv, CC0 secondo
il registro Transitous; ~5 MB con tutti i mezzi di Lettonia, Lituania ed Estonia). Si tengono solo le corse «pv-<numero del treno>»: il numero
e lo stesso del nostro orario (codice «lv:<numero>»). Per ogni treno GIA PARTITO: ritardo all'arrivo alla prossima fermata (minuti) e, se c'e,
la posizione GPS. I treni non ancora partiti nel feed hanno solo l'orario: si saltano.

E il server di un volontario: una richiesta per giro, solo quando qualcuno guarda la mappa lettone o la mappa d'Europa (lo avvia il cronometro: cron/index.js).
Gira nel repository pubblico trainGB (workflow lv-rt.yml): se questo file cambia, copiarlo la.
Uso: SOCIAL_CRON_KEY=... python lv_rt.py      (senza chiave stampa soltanto)
"""
import gzip, json, os, struct, time
import requests

URL = 'https://gsvalbe.id.lv/pieturas/dati/gtfs-rt.pb'
SITE = os.environ.get('SITE', 'https://railpulse.ch')
UA = {'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)', 'Accept-Encoding': 'gzip'}
PREFIX = b'pv-'


def fields(b):
    """Campi di un messaggio protobuf: (numero, tipo, valore); valore = intero (tipo 0) oppure bytes."""
    p, n = 0, len(b)
    while p < n:
        k = 0; s = 0
        while True:
            c = b[p]; p += 1; k |= (c & 127) << s
            if not c & 128:
                break
            s += 7
        f, w = k >> 3, k & 7
        if w == 0:
            v = 0; s = 0
            while True:
                c = b[p]; p += 1; v |= (c & 127) << s
                if not c & 128:
                    break
                s += 7
        elif w == 2:
            ln = 0; s = 0
            while True:
                c = b[p]; p += 1; ln |= (c & 127) << s
                if not c & 128:
                    break
                s += 7
            v = b[p:p + ln]; p += ln
        elif w == 5:
            v = b[p:p + 4]; p += 4
        elif w == 1:
            v = b[p:p + 8]; p += 8
        else:
            return
        yield f, w, v


def s32(v):
    v &= 0xFFFFFFFF
    return v - (1 << 32) if v & (1 << 31) else v


def trip_of(b):
    tid, rel = '', 0
    for f, w, v in fields(b):
        if f == 1 and w == 2:
            tid = bytes(v).decode('utf-8', 'replace')
        elif f == 4 and w == 0:
            rel = v
    return tid, rel


def event(b):
    d = t = None
    for f, w, v in fields(b):
        if f == 1 and w == 0:
            d = s32(v)
        elif f == 2 and w == 0:
            t = v
    return d, t


def read(buf, now):
    """-> ({numero: [ritardo minuti | None, lat | None, lon | None, 'R' | 'C']}, ora del feed)"""
    out, pos, feed_ts = {}, {}, 0
    for f, w, ent in fields(buf):
        if f == 1 and w == 2:
            for g, wg, v in fields(ent):
                if g == 3 and wg == 0:
                    feed_ts = v
            continue
        if f != 2 or w != 2 or PREFIX not in ent:
            continue
        for g, wg, v in fields(ent):
            if g == 3 and wg == 2:      # TripUpdate
                tid, rel, stops = '', 0, []
                for h, wh, x in fields(v):
                    if h == 1 and wh == 2:
                        tid, rel = trip_of(x)
                    elif h == 2 and wh == 2:
                        arr = dep = (None, None)
                        for q, wq, y in fields(x):
                            if q == 2 and wq == 2:
                                arr = event(y)
                            elif q == 3 and wq == 2:
                                dep = event(y)
                        stops.append((arr, dep))
                if not tid.startswith('pv-'):
                    continue
                num = tid[3:]
                if rel == 3:
                    out[num] = [None, None, None, 'C']
                    continue
                if not stops:
                    continue
                start = stops[0][1][1] or stops[0][0][1]
                end = stops[-1][0][1] or stops[-1][1][1]
                if not start or not end or start > now or end < now - 120:
                    continue                      # non ancora partito (solo orario) o gia arrivato
                delay = None
                for arr, dep in stops[1:]:
                    if arr[1] and arr[1] >= now and arr[0] is not None:
                        delay = arr[0]
                        break
                if delay is None and stops[-1][0][0] is not None:
                    delay = stops[-1][0][0]
                if delay is not None and -3600 <= delay <= 6 * 3600:
                    out[num] = [round(delay / 60), None, None, 'R']
            elif g == 4 and wg == 2:    # VehiclePosition
                tid, lat, lon = '', None, None
                for h, wh, x in fields(v):
                    if h == 1 and wh == 2:
                        tid, _ = trip_of(x)
                    elif h == 2 and wh == 2:
                        for q, wq, y in fields(x):
                            if wq == 5 and q in (1, 2):
                                val = struct.unpack('<f', bytes(y))[0]
                                if q == 1:
                                    lat = val
                                else:
                                    lon = val
                if tid.startswith('pv-') and lat and lon and 55.5 < lat < 58.2 and 20.8 < lon < 28.4:
                    pos[tid[3:]] = (round(lat, 5), round(lon, 5))
    for num, (lat, lon) in pos.items():
        if num in out and out[num][3] == 'R':     # la posizione solo dei treni in viaggio
            out[num][1], out[num][2] = lat, lon
    return out, feed_ts


def main():
    r = requests.get(URL, headers=UA, timeout=90)
    r.raise_for_status()
    now = int(time.time())
    d, feed_ts = read(r.content, now)
    late = sum(1 for v in d.values() if v[0] is not None and v[0] >= 2)
    print('feed', len(r.content) // 1000, 'kB, eta', now - feed_ts if feed_ts else '?', 's; treni in viaggio:', len(d), 'con GPS:', sum(1 for v in d.values() if v[1] is not None), 'in ritardo (>= 2 min):', late)
    if feed_ts and now - feed_ts > 900:
        print('feed fermo da piu di 15 minuti: non si carica')
        return
    body = gzip.compress(json.dumps({'ts': now * 1000, 'feed': feed_ts * 1000, 'd': {'lv:' + k: v for k, v in d.items()}}, separators=(',', ':')).encode('utf-8'), 9)
    key = os.environ.get('SOCIAL_CRON_KEY')
    if key:
        p = requests.put(SITE + '/api/live/tt/lv-rt', data=body, headers={'Authorization': 'Bearer ' + key}, timeout=60)
        print('PUT lv-rt', p.status_code, len(body), 'byte')
    else:
        print('(non caricato: manca SOCIAL_CRON_KEY)', json.dumps(d)[:600])


if __name__ == '__main__':
    main()
