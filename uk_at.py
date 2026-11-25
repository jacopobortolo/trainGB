"""Gran Bretagna: orari REALI a ogni fermata di tutti i treni di un giorno, dalle istantanee orarie «Darwin Real Time Train Information
snapshots» (Rail Data Marketplace, chiave RDM_KEY_SNAP), per il riepilogo del giorno (dl_day.js) e lo storico per treno (trn_build.js).
Dal 25.11.2026: prima si usava un solo ritardo per treno a ogni istantanea (uk_snap.py) più le bacheche di 60 stazioni.

Ogni istantanea è lo stato di Darwin in quel momento: per ogni treno (rid) le fermate con l'orario pubblico (pta/ptd) e, per quelle già
fatte, l'orario reale (at). Le istantanee si possono chiedere anche dopo (data + ora UTC): a fine giornata se ne scaricano alcune e si
uniscono (vale l'ultima che ha visto la fermata).

  python uk_at.py AAAAMMGG [--out exact-uk.json] [--hours AAAAMMGGHH,AAAAMMGGHH…] [--diag]

Risultato (--out): {"day", "hours": [ore lette], "t": {rid: [[minuti del giorno dell'orario pubblico, minuti di ritardo, 1 = arrivo | 0 = partenza], …]}}
solo per i rid del giorno (cominciano con AAAAMMGG). --diag stampa per ogni istantanea quanti treni contiene e da quante ore sono arrivati
quelli già arrivati (per sapere ogni quante ore serve un'istantanea). Gira nel repository PUBBLICO jacopobortolo/trainGB (workflow dl-day.yml):
questa è la copia di riferimento. Serve: pip install requests"""
import gzip, json, os, re, sys, time
from datetime import datetime, timedelta, timezone

API = 'https://api1.raildata.org.uk/1010-darwin-real-time-train-information-snapshots1_0/download/snapshot'
TS = re.compile(r'<TS rid="(\d+)"[^>]*>(.*?)</TS>', re.S)
LOC = re.compile(r'<(?:\w+:)?Location ([^>]*)>(.*?)</(?:\w+:)?Location>', re.S)
EV = re.compile(r'<(?:\w+:)?(arr|dep) ([^>]*?)/?>')
ATTR = re.compile(r'(\w+)="([^"]*)"')


def mins(v):
    return int(v[:2]) * 60 + int(v[3:5])


def diff(real, plan):
    d = mins(real) - mins(plan)
    return d - 1440 if d > 720 else d + 1440 if d < -720 else d


def fetch(hour):
    """istantanea di un'ora UTC (AAAAMMGGHH) → byte gzip, o None"""
    import requests
    body = {'date': hour[:4] + '-' + hour[4:6] + '-' + hour[6:8], 'hour': hour[8:10]}
    for attempt in range(5):                    # 429 = richieste troppo ravvicinate
        r = requests.post(API, json=body, headers={'x-apikey': os.environ['RDM_KEY_SNAP'], 'User-Agent': 'RailPulse'}, timeout=60)
        if r.status_code != 429:
            break
        time.sleep(5 + 5 * attempt)
    if r.status_code != 200:
        print(hour, 'richiesta', r.status_code)
        return None
    urls = re.findall(r'https://[^"\s\\]+', r.text)
    if not urls:
        print(hour, 'nessun indirizzo')
        return None
    f = requests.get(urls[0], timeout=240)
    if f.status_code != 200 or len(f.content) < 100000:
        print(hour, 'file', f.status_code, len(f.content))
        return None
    return f.content


def extract(raw, day=''):
    """XML di un'istantanea → {rid: [[minuti dell'orario pubblico, ritardo, 1 arrivo | 0 partenza], …]}, e i rid arrivati al capolinea"""
    out, done = {}, set()
    for rid, body in TS.findall(raw):
        if day and not rid.startswith(day):
            continue
        st, last = [], False
        for attrs, inner in LOC.findall(body):
            a = dict(ATTR.findall(attrs))
            plan = {'arr': a.get('pta'), 'dep': a.get('ptd')}
            if not (plan['arr'] or plan['dep']):
                continue                        # punto di passaggio, senza orario pubblico
            last = False
            for kind, ev in EV.findall(inner):
                e = dict(ATTR.findall(ev))
                if not plan.get(kind) or not e.get('at'):
                    continue
                d = diff(e['at'], plan[kind])
                if -60 <= d <= 600:
                    st.append([mins(plan[kind]), d, 1 if kind == 'arr' else 0])
                    last = kind == 'arr'
        if st:
            out[rid] = st
            if last:
                done.add(rid)
    return out, done


def hours_for(day):
    """istantanee da leggere per un giorno d'esercizio: ogni 3 ore dalle 03 UTC del giorno alle 06 del giorno dopo, fino all'ultima già pronta"""
    d0 = datetime.strptime(day, '%Y%m%d').replace(tzinfo=timezone.utc)
    lim = datetime.now(timezone.utc) - timedelta(minutes=70)
    hs = [d0 + timedelta(hours=h) for h in range(3, 31, 3)]
    hs = [h for h in hs if h <= lim]
    if lim < d0 + timedelta(hours=30) and (not hs or lim - hs[-1] > timedelta(hours=1)):
        hs.append(lim)                          # passaggio di notte: anche l'ultima istantanea pronta
    return [h.strftime('%Y%m%d%H') for h in hs]


def main():
    args = sys.argv[1:]
    day = next((a for a in args if re.fullmatch(r'\d{8}', a)), None) or (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y%m%d')
    opt = lambda n: args[args.index(n) + 1] if n in args and args.index(n) + 1 < len(args) else ''
    hours = [h for h in opt('--hours').split(',') if h] or hours_for(day)
    diag, allt, read = '--diag' in args, {}, []
    for h in hours:
        blob = fetch(h)
        if not blob:
            continue
        raw = gzip.decompress(blob).decode('utf-8', 'replace')
        got, done = extract(raw, '' if diag else day)
        read.append(h)
        if diag:
            m = re.search(r'SnapshotId>(\d{14})<', raw)
            snap = m.group(1) if m else h + '3000'
            now = int(snap[8:10]) * 60 + int(snap[10:12])       # minuti del giorno UTC (d'inverno = ora di Londra)
            ssd, age = {}, {}
            for rid in TS.findall(raw):
                ssd[rid[0][:8]] = ssd.get(rid[0][:8], 0) + 1
            for rid in done:
                p, d, _ = got[rid][-1]
                days = (datetime.strptime(snap[:8], '%Y%m%d') - datetime.strptime(rid[:8], '%Y%m%d')).days
                a = (now + days * 1440 - (p + d)) // 60
                if a < -2:
                    a += 24                                     # arrivo dopo mezzanotte di un treno del giorno prima
                age[a] = age.get(a, 0) + 1
            print(h, 'istantanea', snap, len(blob) // 1000, 'kB; treni per giorno', sorted(ssd.items()), '; con orari reali', len(got), '; arrivati', len(done))
            print('   ore dall\'arrivo → treni:', sorted(age.items()))
            ex = next((r for r in done if len(got[r]) > 10), None)
            if ex:
                print('   esempio', ex, got[ex][:14])
            got = {r: v for r, v in got.items() if r.startswith(day)}
        for rid, st in got.items():
            if len(st) >= len(allt.get(rid, [])):
                allt[rid] = st                  # l'istantanea più recente ha visto più fermate
        print(h, len(got), 'treni del giorno con orari reali; in tutto', len(allt))
    if not read:
        sys.exit('nessuna istantanea letta')
    out = opt('--out')
    if out:
        with open(out, 'w', encoding='utf-8') as f:
            json.dump({'day': day, 'hours': read, 't': allt}, f, separators=(',', ':'))
        print('scritto', out, os.path.getsize(out) // 1000, 'kB,', len(allt), 'treni,', sum(len(v) for v in allt.values()), 'orari reali')


if __name__ == '__main__':
    main()
