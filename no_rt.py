"""Ritardi dei treni norvegesi per il registro dei ritardi d'Europa (log/index.js), dal 23.11.2026.

Legge i feed SIRI-ET di Entur (NLOD) per i gestori VYG, GOA, FLT, BNR attraverso il proxy del sito (/api/no/et?d=…, cache di 150 s e copia
vecchia se Entur risponde 429: Entur ammette poche richieste al minuto e risponde 429 anche dai server di GitHub), come la pagina /no (js/no-data.js), tiene i soli mezzi su rotaia e per ogni corsa
(DatedVehicleJourneyRef, la stessa chiave del browser) calcola: ritardo all'ultima fermata con orario effettivo (Actual - Aimed), o la previsione
della prima fermata successiva; 'C' se soppressa; le corse già arrivate al capolinea non entrano. Esito: PUT /api/live/tt/no-rt con
{ts, d: {chiave: [ritardo in minuti | null, null, null, 'R' | 'C', marciapiede dell'ultima fermata con orario effettivo, ultime 10 fermate già fatte [marciapiede, minuti]]}}
(dal 25.11.2026 le fermate già fatte, con l'orario reale: lo storico per treno le usa al posto dell'ultimo ritardo visto; le corse arrivate restano finché sono nel feed).
Gira nel repository PUBBLICO jacopobortolo/trainGB (workflow no-rt.yml, avviato dal cronometro): questa è la copia di riferimento.
Variabili: SOCIAL_CRON_KEY, SITE. Serve: pip install requests"""
import gzip, json, os, re, sys, time
from datetime import datetime
import requests

SITE = os.environ.get('SITE', 'https://railpulse.ch')
HDR = {'ET-Client-Name': 'railpulse-railpulse', 'Accept-Encoding': 'gzip', 'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch)'}
OPS = ['VYG', 'GOA', 'FLT', 'BNR', 'SJN']   # SJ Nord: dal 25.11.2026 il feed BNR è vuoto e i treni del nord stanno in SJN (prima il contrario)


def tag(x, t):
    m = re.search(r'<(?:\w+:)?' + t + r'>([^<]*)</', x)
    return m.group(1) if m else ''


def blocks(x, t):
    return re.findall(r'<(?:\w+:)?' + t + r'>(.*?)</(?:\w+:)?' + t + r'>', x, re.S)


def ts(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp() if s else None


def calls(rec, n=10):
    """ultime n fermate già fatte con l'orario reale: [marciapiede, minuti di ritardo all'arrivo (alla partenza per la prima fermata)]"""
    out = []
    for c in rec:
        q = tag(c, 'StopPointRef').replace('NSR:Quay:', '')
        for a, b in (('ActualArrivalTime', 'AimedArrivalTime'), ('ActualDepartureTime', 'AimedDepartureTime')):
            if q.isdigit() and tag(c, a) and tag(c, b):
                out.append([int(q), round((ts(tag(c, a)) - ts(tag(c, b))) / 60)])
                break
    return out[-n:]


def journey(x):
    if tag(x, 'VehicleMode') != 'rail':
        return None, None
    k = tag(x, 'DatedVehicleJourneyRef')
    if not k:
        return None, None
    if tag(x, 'Cancellation') == 'true':
        return k, [None, None, None, 'C']
    rec, est = blocks(x, 'RecordedCall'), blocks(x, 'EstimatedCall')
    rc = calls(rec)
    if not est and rec and tag(rec[-1], 'ActualArrivalTime'):
        # arrivata al capolinea: resta finché Entur la tiene nel feed (5-10 minuti), così il registro vede l'arrivo reale (prima usciva subito)
        return (k, [rc[-1][1], None, None, 'R', str(rc[-1][0]), rc]) if rc else (None, None)
    last = None
    for c in rec:
        for a, b in (('ActualDepartureTime', 'AimedDepartureTime'), ('ActualArrivalTime', 'AimedArrivalTime')):
            if tag(c, a) and tag(c, b):
                last = (round((ts(tag(c, a)) - ts(tag(c, b))) / 60), tag(c, 'StopPointRef').replace('NSR:Quay:', ''))
                break
    if last:
        return k, [last[0], None, None, 'R', last[1], rc] if rc else [last[0], None, None, 'R', last[1]]
    for c in est:
        for a, b in (('ExpectedArrivalTime', 'AimedArrivalTime'), ('ExpectedDepartureTime', 'AimedDepartureTime')):
            if tag(c, a) and tag(c, b):
                return k, [round((ts(tag(c, a)) - ts(tag(c, b))) / 60), None, None, 'R', '']
    return k, [None, None, None, 'R', '']


def main():
    d, ok = {}, 0
    for i, op in enumerate(OPS):
        try:
            r = requests.get(SITE + '/api/no/et?d=' + op, headers=HDR, timeout=90)
            r.raise_for_status()
        except Exception as e:
            print(op, 'errore', e)
            continue
        ok += 1
        n = 0
        for x in blocks(r.text, 'EstimatedVehicleJourney'):
            k, v = journey(x)
            if k and v is not None:
                d[k] = v
                n += 1
        print(op, len(r.content) // 1000, 'kB,', n, 'treni')
    if not ok:
        sys.exit('nessun feed di Entur')
    body = json.dumps({'ts': int(time.time() * 1000), 'd': d}, separators=(',', ':'))
    key = os.environ.get('SOCIAL_CRON_KEY', '')
    if not key:
        print('senza SOCIAL_CRON_KEY: non carico', len(d), 'treni')
        return
    r = requests.put(SITE + '/api/live/tt/no-rt', data=gzip.compress(body.encode()), headers={'Authorization': 'Bearer ' + key}, timeout=120)   # il sito vuole il corpo compresso
    print('PUT no-rt', r.status_code, len(body) // 1000, 'kB,', len(d), 'treni')
    if r.status_code != 200:
        sys.exit(1)


if __name__ == '__main__':
    main()
