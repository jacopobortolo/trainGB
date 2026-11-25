"""Italia: ritardi dei treni dal feed SIRI-ET di Trenitalia (https://proxy.busone.app/trenitalia/siri-et.xml, elencato come fonte nel registro aperto Transitous;
XML da ~800 kB con 70 treni di notte e oltre 15 MB di giorno: troppo per un Worker gratuito). Lo esegue questo job (repository pubblico trainGB, minuti gratuiti),
avviato dal cronometro di RailPulse ogni ~6 minuti solo mentre qualcuno guarda la mappa italiana o di giorno (D1 live «it:active»).
Il feed non ha il numero del treno: l'abbinamento con il nostro orario (tt:it-<giorno>, codice «it:<numero>») si fa per MINUTO DI PARTENZA del primo
capolinea e NOME DELLA DESTINAZIONE (poi, in ripiego, nome dell'origine). Ritardo = ultima fermata gia effettuata (Actual - Aimed), altrimenti prima fermata prevista (Expected - Aimed).
Italo (dal 23.11.2026): GTFS-Realtime di BusOne https://proxy.busone.app/italo/gtfs-rt/trip-updates.json (feed «con badge»: gratis anche per uso commerciale,
attribuzione obbligatoria «BusOne (https://busone.app) e fonte originale»; ritardi «operator-reported», origine non dichiarata), abbinato per numero del treno
(«Italo 8111» → «itx:8111», lo stesso codice di tools/it_netex.py); ritardo della prossima fermata.
Esito: PUT /api/live/tt/it-rt (SOCIAL_CRON_KEY) con {ts, d: {«it:<numero>»: [ritardo in minuti | null, null, null, 'R']}}.
Variabili: SOCIAL_CRON_KEY, SITE (predefinito https://railpulse.ch), SIRI_FILE (prova in locale: file XML invece del download). Serve: pip install requests"""
import datetime as dt, gzip, json, os, re, sys, unicodedata
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo
import requests

SITE = os.environ.get('SITE', 'https://railpulse.ch')
UA = {'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)', 'Accept-Encoding': 'gzip'}
# BusOne chiede ai client automatici di dichiararsi (readme del feed): senza queste intestazioni in futuro le richieste non saranno servite
BUSONE = dict(UA, **{'X-BusOne-Client': 'RailPulse/railpulse.ch; railpulse.ch@gmail.com', 'X-BusOne-Use': 'personal'})
TZ = ZoneInfo('Europe/Rome')
NS = '{http://www.siri.org.uk/siri}'


def norm(s):
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in unicodedata.normalize('NFD', (s or '').lower()) if unicodedata.category(c) != 'Mn'))


def rows_of(day):
    r = requests.get('%s/api/live/tt/it-%s?v=3' % (SITE, day), timeout=120, headers=UA)
    return r.json().get('t', []) if r.status_code == 200 else []


def main():
    now = dt.datetime.now(TZ)
    by_dest, nums, deps = {}, set(), {}
    for o in (0, -1):
        for r in rows_of((now + dt.timedelta(days=o)).strftime('%Y%m%d')):
            by_dest.setdefault((r[3] // 60, norm(r[1])), []).append(r[0])
            nums.add(r[0])
            deps.setdefault(r[0], []).append(r[3] + r[6])   # partenza dal capolinea (s dal 1970), per controllare le corse di Italo
    print('righe d orario:', len(by_dest))
    if os.environ.get('SIRI_FILE'):
        src = open(os.environ['SIRI_FILE'], 'rb')
    else:
        resp = requests.get('https://proxy.busone.app/trenitalia/siri-et.xml', timeout=120, headers=BUSONE, stream=True)
        resp.raise_for_status()
        src = resp.raw
        src.decode_content = True
    d, n, hit = {}, 0, 0
    for _, el in ET.iterparse(src, events=('end',)):
        if el.tag != NS + 'EstimatedVehicleJourney':
            continue
        n += 1
        rf = el.find(NS + 'FramedVehicleJourneyRef/' + NS + 'DatedVehicleJourneyRef')
        cx = el.find(NS + 'Cancellation')
        gone = cx is not None and (cx.text or '').strip().lower() == 'true'   # corsa soppressa
        el_ref = rf.text if rf is not None else ''
        if gone:   # una corsa soppressa arriva senza fermate: si riconosce dal numero del treno
            mg = re.search(r'_v_\d+-(\d+)-', el_ref or '')
            el.clear()
            if mg and 'it:' + mg.group(1) in nums:
                d['it:' + mg.group(1)] = [None, None, None, 'C']; hit += 1
            continue
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
    try:
        n_it, h_it = italo(d, nums, deps)
        print('Italo: corse nel feed', n_it, 'abbinate', h_it)
    except Exception as e:   # Italo non risponde: restano i ritardi di Trenitalia
        print('Italo: errore', e)
    print('corse nel feed (istantanea: in viaggio, appena arrivate e in partenza):', n, 'abbinate:', hit, 'con ritardo:', sum(1 for v in d.values() if v[0] is not None), 'soppresse:', sum(1 for v in d.values() if v[3] == 'C'))
    body = gzip.compress(json.dumps({'ts': int(dt.datetime.now().timestamp() * 1000), 'd': d}, separators=(',', ':')).encode('utf-8'), 9)
    key = os.environ.get('SOCIAL_CRON_KEY')
    if os.environ.get('TT_OUT'):
        open(os.environ['TT_OUT'], 'wb').write(body)
    if key and d:
        r = requests.put(SITE + '/api/live/tt/it-rt', data=body, headers={'Authorization': 'Bearer ' + key}, timeout=120)
        print('PUT it-rt', r.status_code, len(body) // 1000, 'kB')
    elif not key:
        print('(non caricato: manca SOCIAL_CRON_KEY)')


def italo(d, nums, deps=None, feed=None, now=None):
    """Ritardi di Italo dal GTFS-Realtime di BusOne → d[«itx:<numero>»]. Ritorna (corse nel feed, abbinate).
    Dal 25.11.2026 tre controlli, dopo i +325 dell'Italo 8997 e +320 del 9961 (Milano 19:35/19:40) del 23 e 24.11, mentre i ritardi veri erano
    +10/+11 e 0/+13 (TracciaTreno, dati ViaggiaTreno): (1) la corsa del feed deve partire dal capolinea entro 5 minuti da una corsa del nostro
    orario con quel numero (start_date + start_time, ora di Roma); (2) se più corse del feed portano lo stesso numero vale quella con il trip_id
    del treno solo («NTV-8997», «NTV-8997-live-…»), non gli itinerari con cambio («NTV-8997-8966»); (3) oltre 180 minuti il ritardo di Italo si
    scarta. Le corse scartate e i ritardi da 90 minuti in su sono stampati nel log del lavoro, per capire la causa.
    Causa trovata il 25.11.2026 (log e feed): per le corse senza dati veri BusOne scrive a TUTTE le fermate la stessa ora prevista (mezzanotte
    UTC del giorno dopo) e il «ritardo» e la differenza dall'orario (19:35 → +325; ultima fermata +177 o +96, che dopo l'01:00 passavano il
    controllo dei 180 minuti). (4) Una corsa con almeno due fermate e una sola ora prevista per tutte e un segnaposto: resta senza dato.
    feed e now servono solo alle prove."""
    if feed is None:
        r = requests.get('https://proxy.busone.app/italo/gtfs-rt/trip-updates.json', timeout=60, headers=BUSONE)
        r.raise_for_status()
        feed = r.json()
    now, n, hit, best = (dt.datetime.now().timestamp() if now is None else now), 0, 0, {}
    for e in feed.get('entity', []):
        tu = e.get('trip_update') or {}
        n += 1
        v, tr = tu.get('vehicle') or {}, tu.get('trip') or {}
        tid = tr.get('trip_id') or ''
        m = re.search(r'(\d{3,5})\s*$', v.get('label') or '') or re.search(r'(\d{3,5})$', v.get('id') or '') or re.search(r'NTV-(\d{3,5})-', tid)
        code = 'itx:' + m.group(1) if m else None
        if not code or code not in nums:
            continue
        single = bool(re.match(r'^NTV-\d{3,5}(-live-[0-9a-f]+)?$', tid))
        st, sd = tr.get('start_time') or '', tr.get('start_date') or ''
        if deps is not None and re.match(r'^\d{1,2}:\d{2}:\d{2}$', st) and re.match(r'^\d{8}$', sd):
            h, mi, se = (int(x) for x in st.split(':'))
            t0 = dt.datetime(int(sd[:4]), int(sd[4:6]), int(sd[6:]), tzinfo=TZ) + dt.timedelta(hours=h, minutes=mi, seconds=se)
            if not any(abs(t0.timestamp() - x) <= 300 for x in deps.get(code, [])):
                print('Italo: scartata', code, tid, sd, st, '(nessuna corsa nostra a quell ora)')
                continue
        if code in best and best[code] and not single:
            continue   # c'è già la corsa del treno solo
        hit += 1
        if tr.get('schedule_relationship') in ('CANCELED', 'CANCELLED', 3):
            d[code] = [None, None, None, 'C']; best[code] = single
            continue
        delay = None
        stu = tu.get('stop_time_update') or []
        times = {ev['time'] for s in stu for ev in (s.get('arrival') or {}, s.get('departure') or {}) if ev.get('time')}
        if len(stu) >= 2 and len(times) == 1:   # segnaposto: stessa ora a tutte le fermate
            print('Italo: segnaposto', code, tid, sd, st, 'ora', times.pop())
            if code in d and not best.get(code):
                del d[code]
            continue
        for s in stu:   # prossima fermata: la prima con l'ora prevista non ancora passata; altrimenti l'ultima
            ev = s.get('departure') or s.get('arrival') or {}
            if ev.get('delay') is None:
                continue
            delay = round(ev['delay'] / 60)
            if (ev.get('time') or 0) >= now:
                break
        if delay is not None and delay >= 90:
            print('Italo: ritardo grande', code, tid, sd, st, delay, json.dumps((tu.get('stop_time_update') or [])[:3])[:400])
        if delay is not None and -60 <= delay <= 180:
            d[code] = [delay, None, None, 'R']; best[code] = single
        elif code in d and not best.get(code):
            del d[code]
    return n, hit

if __name__ == '__main__':
    main()
