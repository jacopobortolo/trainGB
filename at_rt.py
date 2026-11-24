#!/usr/bin/env python3
"""Ritardi dei treni della Stiria (GKB e Steiermarkbahn: S-Bahn Steiermark e regionali) -> railpulse.ch/api/live/tt/at-rt (D1), letto dalla pagina /at con /api/at/rt.

Fonte: GTFS-Realtime del Verkehrsverbund Steiermark (https://efa.verbundlinie.at:<porta>/trips, senza chiave; porte 7796 e 7798 = treni,
7792 e 7794 = autobus e tram di Graz, 7790 = altre linee). I Worker di Cloudflare non raggiungono quelle porte: per questo lo legge un job
(repository pubblico trainGB, workflow at-rt.yml, avviato dal cronometro solo se qualcuno guarda la pagina austriaca: cron/index.js, k 'at:active').
I trip_id sono quelli del dataset 79 della piattaforma dei Mobilitaetsverbuende, che tools/at_stv.py mette nell'orario austriaco con il codice
«at<agenzia>:stv:<trip_id>». Il feed dà il ritardo per fermata ma non l'ora: la prossima fermata si trova con l'orario del giorno
(/api/live/tt/at-<AAAAMMGG>), confrontando l'id della fermata (fermata madre «46:3040»).
Uscita: { ts, d: { <codice>: [ritardo minuti, null, null, 'R' | 'C'] } }.
Gira anche in trainGB: se questo file cambia, copiarlo là.
Uso: SOCIAL_CRON_KEY=... python at_rt.py      (senza chiave stampa soltanto)
"""
import gzip, json, os, time, datetime as dt
from zoneinfo import ZoneInfo
import requests

PORTS = (7796, 7798)
SITE = os.environ.get('SITE', 'https://railpulse.ch')
UA = {'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)', 'Accept-Encoding': 'gzip'}


def fields(b):
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


def s64(v):
    return v - (1 << 64) if v & (1 << 63) else v


def station(stop_id):   # «at:46:3040:0:1» -> «46:3040», come in tools/at_stv.py
    p = stop_id.split(':')
    return ':'.join(p[1:3]) if stop_id.startswith('at:') and len(p) >= 3 else stop_id


def read(buf):
    """-> (ora del feed, {trip_id: (soppressa, [(stazione, ritardo arrivo s | None, ritardo partenza s | None)])})"""
    out, ts = {}, 0
    for f, w, ent in fields(buf):
        if f == 1 and w == 2:
            for g, wg, v in fields(ent):
                if g == 3 and wg == 0:
                    ts = v
            continue
        if f != 2 or w != 2:
            continue
        for g, wg, v in fields(ent):
            if g != 3 or wg != 2:
                continue
            tid, rel, stops = '', 0, []
            for h, wh, x in fields(v):
                if h == 1 and wh == 2:
                    for q, wq, y in fields(x):
                        if q == 1 and wq == 2:
                            tid = bytes(y).decode('utf-8', 'replace')
                        elif q == 4 and wq == 0:
                            rel = y
                elif h == 2 and wh == 2:
                    sid, arr, dep = '', None, None
                    for q, wq, y in fields(x):
                        if q == 4 and wq == 2:
                            sid = bytes(y).decode('utf-8', 'replace')
                        elif q in (2, 3) and wq == 2:
                            d = None
                            for r, wr, z in fields(y):
                                if r == 1 and wr == 0:
                                    d = s64(z)
                            if q == 2:
                                arr = d
                            else:
                                dep = d
                    stops.append((station(sid), arr, dep))
            if tid:
                out[tid] = (rel == 3, stops)
    return ts, out


def delays(feed, rows, now):
    """feed: {trip_id: (soppressa, fermate)}; rows: righe dell'orario [codice, dest, nome, base, stazione, arrivo, partenza, ...] -> {codice: valore}"""
    by = {}
    for r in rows:
        c = str(r[0])
        i = c.find(':stv:')
        if i >= 0:
            by[c[i + 5:]] = r
    out = {}
    for tid, (canc, stops) in feed.items():
        r = by.get(tid)
        if not r:
            continue
        code = r[0]
        if canc:
            out[code] = [None, None, None, 'C']
            continue
        sched = {}
        for k in range(4, len(r) - 2, 3):
            sched.setdefault(str(r[k]), (r[3] + r[k + 1], r[3] + r[k + 2]))
        first, last = r[3] + r[6], r[3] + r[-2]
        if first > now + 60 or last < now - 1800:
            continue   # non ancora partito o arrivato da tempo
        delay = None
        for st, a, d in stops:
            t = sched.get(st)
            v = a if a is not None else d
            if t is None or v is None:
                continue
            delay = v
            if t[0] + v >= now:   # prima fermata non ancora raggiunta: è il ritardo che conta adesso
                break
        if delay is not None and -3600 <= delay <= 6 * 3600:
            out[code] = [round(delay / 60), None, None, 'R']
    return out


def main():
    now = time.time()
    tz = ZoneInfo('Europe/Vienna')
    days = sorted({dt.datetime.fromtimestamp(now, tz).strftime('%Y%m%d'), dt.datetime.fromtimestamp(now - 6 * 3600, tz).strftime('%Y%m%d')})
    rows = []
    for d in days:
        try:
            rows += requests.get('%s/api/live/tt/at-%s?v=1' % (SITE, d), timeout=60, headers=UA).json().get('t', [])
        except Exception as e:
            print('orario', d, 'errore', e)
    feed, ts = {}, 0
    for p in PORTS:
        try:
            r = requests.get('https://efa.verbundlinie.at:%d/trips' % p, timeout=30, headers=UA)
            t, f = read(r.content)
            ts = max(ts, t)
            feed.update(f)
            print('porta', p, 'corse', len(f))
        except Exception as e:
            print('porta', p, 'errore', e)
    d = delays(feed, rows, now)
    print('orario', len(rows), 'righe; treni con ritardo', len(d), 'su', len(feed), 'nel feed')
    key = os.environ.get('SOCIAL_CRON_KEY')
    if not key or not d:
        return
    body = gzip.compress(json.dumps({'ts': int(now * 1000), 'feed': ts, 'd': d}, separators=(',', ':')).encode(), 9)
    r = requests.put(SITE + '/api/live/tt/at-rt', data=body, headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/octet-stream', **UA}, timeout=60)
    print('caricato', r.status_code)


if __name__ == '__main__':
    main()
