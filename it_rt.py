"""Italia: ritardi dei treni dal feed SIRI-ET di Trenitalia (https://proxy.busone.app/trenitalia/siri-et.xml, elencato come fonte nel registro aperto Transitous;
XML da ~800 kB con 70 treni di notte e oltre 15 MB di giorno: troppo per un Worker gratuito). Lo esegue questo job (repository pubblico trainGB, minuti gratuiti),
avviato dal cronometro di RailPulse ogni ~6 minuti solo mentre qualcuno guarda la mappa italiana o di giorno (D1 live «it:active»).
Il feed non ha il numero del treno: l'abbinamento con il nostro orario (tt:it-<giorno>, codice «it:<numero>») si fa per MINUTO DI PARTENZA del primo
capolinea e NOME DELLA DESTINAZIONE (poi, in ripiego, nome dell'origine). Ritardo = ultima fermata gia effettuata (Actual - Aimed), altrimenti prima fermata prevista (Expected - Aimed).
Esito: PUT /api/live/tt/it-rt (SOCIAL_CRON_KEY) con {ts, d: {«it:<numero>»: [ritardo in minuti | null, null, null, 'R']}}.
Variabili: SOCIAL_CRON_KEY, SITE (predefinito https://railpulse.ch), SIRI_FILE (prova in locale: file XML invece del download). Serve: pip install requests"""
import datetime as dt, gzip, json, os, re, sys, unicodedata
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo
import requests

SITE = os.environ.get('SITE', 'https://railpulse.ch')
UA = {'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)', 'Accept-Encoding': 'gzip'}
TZ = ZoneInfo('Europe/Rome')
NS = '{http://www.siri.org.uk/siri}'


def norm(s):
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in unicodedata.normalize('NFD', (s or '').lower()) if unicodedata.category(c) != 'Mn'))


def rows_of(day):
    r = requests.get('%s/api/live/tt/it-%s?v=3' % (SITE, day), timeout=120, headers=UA)
    return r.json().get('t', []) if r.status_code == 200 else []


def main():
    now = dt.datetime.now(TZ)
    by_dest, nums = {}, set()
    for o in (0, -1):
        for r in rows_of((now + dt.timedelta(days=o)).strftime('%Y%m%d')):
            by_dest.setdefault((r[3] // 60, norm(r[1])), []).append(r[0])
            nums.add(r[0])
    print('righe d orario:', len(by_dest))
    if os.environ.get('SIRI_FILE'):
        src = open(os.environ['SIRI_FILE'], 'rb')
    else:
        resp = requests.get('https://proxy.busone.app/trenitalia/siri-et.xml', timeout=120, headers=UA, stream=True)
        resp.raise_for_status()
        src = resp.raw
        src.decode_content = True
    d, n, hit = {}, 0, 0
    for _, el in ET.iterparse(src, events=('end',)):
        if el.tag != NS + 'EstimatedVehicleJourney':
            continue
        n += 1
        rf = el.find(NS + 'FramedVehicleJourneyRef/' + NS + 'DatedVehicleJourneyRef')
        el_ref = rf.text if rf is not None else ''
        calls = []
        for grp in ('RecordedCalls', 'EstimatedCalls'):
            g = el.find(NS + grp)
            if g is not None:
                calls += list(g)
        el.clear()
        if len(calls) < 2:
            continue
        tx = lambda c, t: (c.find(NS + t).text if c.find(NS + t) is not None else None)
        f, l = calls[0], calls[-1]
        t0 = tx(f, 'AimedDepartureTime') or tx(f, 'AimedArrivalTime')
        if not t0:
            continue
        minute = int(dt.datetime.fromisoformat(t0).timestamp()) // 60
        # 1) numero del treno: sta nel DatedVehicleJourneyRef («…_v_1-4399-5307-…» = treno 4399): abbina tutte le corse; 2) ripiego: minuto di partenza + destinazione
        ref = el_ref
        m = re.search(r'_v_\d+-(\d+)-', ref or '')
        code = 'it:' + m.group(1) if m and 'it:' + m.group(1) in nums else None
        for k in ((minute, minute - 1, minute + 1) if not code else ()):
            c = by_dest.get((k, norm(tx(l, 'StopPointName'))))
            if c:
                code = c[0]
                break
        if not code:
            continue
        hit += 1
        delay = None
        for c in reversed(calls):   # ultima fermata con un'ora effettiva, altrimenti la prima prevista
            a = tx(c, 'ActualDepartureTime') or tx(c, 'ActualArrivalTime')
            p = tx(c, 'AimedDepartureTime') or tx(c, 'AimedArrivalTime')
            if a and p:
                delay = round((dt.datetime.fromisoformat(a) - dt.datetime.fromisoformat(p)).total_seconds() / 60)
                break
        if delay is None:
            for c in calls:
                e = tx(c, 'ExpectedDepartureTime') or tx(c, 'ExpectedArrivalTime')
                p = tx(c, 'AimedDepartureTime') or tx(c, 'AimedArrivalTime')
                if e and p:
                    delay = round((dt.datetime.fromisoformat(e) - dt.datetime.fromisoformat(p)).total_seconds() / 60)
                    break
        if delay is not None and not -60 <= delay <= 360:
            delay = None
        d[code] = [delay, None, None, 'R']
    print('corse nel feed:', n, 'abbinate:', hit, 'con ritardo:', sum(1 for v in d.values() if v[0] is not None))
    body = gzip.compress(json.dumps({'ts': int(dt.datetime.now().timestamp() * 1000), 'd': d}, separators=(',', ':')).encode('utf-8'), 9)
    key = os.environ.get('SOCIAL_CRON_KEY')
    if os.environ.get('TT_OUT'):
        open(os.environ['TT_OUT'], 'wb').write(body)
    if key and d:
        r = requests.put(SITE + '/api/live/tt/it-rt', data=body, headers={'Authorization': 'Bearer ' + key}, timeout=120)
        print('PUT it-rt', r.status_code, len(body) // 1000, 'kB')
    elif not key:
        print('(non caricato: manca SOCIAL_CRON_KEY)')


if __name__ == '__main__':
    main()
