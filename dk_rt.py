"""Danimarca: ritardi dei treni dal feed SIRI-ET che il progetto Transitous ricava dalle code di Rejseplanen (http://gtfs.spline.de/siri/danmark/estimated-timetable.xml,
«Provided by Rejsekort & Rejseplan A/S, converted from event queue subscription», ~40 MB con tutti i mezzi: troppo per un Worker gratuito).
Lo esegue questo job (repository pubblico trainGB), avviato dal cronometro di RailPulse mentre qualcuno guarda la mappa danese o di giorno (D1 live «dk:active»).
Abbinamento con il nostro orario (tt:dk-<giorno>, etichetta «Operatore|linea numero»): NUMERO del treno (TrainNumberRef = trip_short_name) + minuto di partenza dal capolinea;
se il minuto non coincide (treni che partono dall'estero) e il numero e unico tra i treni attorno ad adesso, vale il numero.
Ritardo = prima fermata con un'ora prevista (Expected - Aimed). Esito: PUT /api/live/tt/dk-rt con {ts, d: {«dk:<trip_id>»: [ritardo in minuti | null, null, null, 'R' | 'C']}}.
Variabili: SOCIAL_CRON_KEY, SITE, SIRI_FILE e ROWS_DIR (prove in locale). Serve: pip install requests"""
import datetime as dt, glob, gzip, json, os, re
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo
import requests

SITE = os.environ.get('SITE', 'https://railpulse.ch')
UA = {'User-Agent': 'RailPulse/1.0 (+https://railpulse.ch; railpulse.ch@gmail.com)', 'Accept-Encoding': 'gzip'}
TZ = ZoneInfo('Europe/Copenhagen')
NS = '{http://www.siri.org.uk/siri}'


def rows_of(day):
    if os.environ.get('ROWS_DIR'):
        f = glob.glob(os.path.join(os.environ['ROWS_DIR'], 'dk-%s.json.gz' % day))
        return json.loads(gzip.open(f[0]).read())['t'] if f else []
    r = requests.get('%s/api/live/tt/dk-%s?v=1' % (SITE, day), timeout=120, headers=UA)
    return r.json().get('t', []) if r.status_code == 200 else []


def main():
    now = dt.datetime.now(TZ)
    exact, by_num = {}, {}
    for o in (0, -1):
        for r in rows_of((now + dt.timedelta(days=o)).strftime('%Y%m%d')):
            m = re.search(r'(\d+)\s*$', r[2])
            if not m:
                continue
            exact[(m.group(1), r[3] // 60)] = r[0]
            if abs(r[3] - now.timestamp()) < 8 * 3600:
                by_num.setdefault(m.group(1), set()).add(r[0])
    print('righe d orario:', len(exact))
    if os.environ.get('SIRI_FILE'):
        src = open(os.environ['SIRI_FILE'], 'rb')
    else:
        resp = requests.get('http://gtfs.spline.de/siri/danmark/estimated-timetable.xml', timeout=180, headers=UA, stream=True)
        resp.raise_for_status()
        src = resp.raw
        src.decode_content = True
    d, n, hit = {}, 0, 0
    for _, el in ET.iterparse(src, events=('end',)):
        if el.tag != NS + 'EstimatedVehicleJourney':
            continue
        n += 1
        num = el.find(NS + 'TrainNumbers/' + NS + 'TrainNumberRef')
        t0 = el.find(NS + 'OriginAimedDepartureTime')
        code = None
        if num is not None and num.text:
            if t0 is not None and t0.text:
                code = exact.get((num.text, int(dt.datetime.fromisoformat(t0.text).timestamp()) // 60))
            if not code and len(by_num.get(num.text, ())) == 1:
                code = next(iter(by_num[num.text]))
        if code:
            hit += 1
            canc = (el.findtext(NS + 'Cancellation') or '').lower() == 'true'
            delay = None
            calls = el.find(NS + 'EstimatedCalls')
            for c in (calls if calls is not None else []):
                for a, e in (('AimedDepartureTime', 'ExpectedDepartureTime'), ('AimedArrivalTime', 'ExpectedArrivalTime')):
                    p, x = c.findtext(NS + a), c.findtext(NS + e)
                    if p and x:
                        delay = round((dt.datetime.fromisoformat(x) - dt.datetime.fromisoformat(p)).total_seconds() / 60)
                        break
                if delay is not None:
                    break
            if delay is not None and not -60 <= delay <= 360:
                delay = None
            if canc or delay is not None:
                d[code] = [None if canc else delay, None, None, 'C' if canc else 'R']
        el.clear()
    print('corse nel feed:', n, 'treni abbinati:', hit, 'con ritardo o soppressi:', len(d))
    body = gzip.compress(json.dumps({'ts': int(dt.datetime.now().timestamp() * 1000), 'd': d}, separators=(',', ':')).encode('utf-8'), 9)
    key = os.environ.get('SOCIAL_CRON_KEY')
    if key and d:
        r = requests.put(SITE + '/api/live/tt/dk-rt', data=body, headers={'Authorization': 'Bearer ' + key}, timeout=120)
        print('PUT dk-rt', r.status_code, len(body) // 1000, 'kB')
    elif not key:
        print('(non caricato: manca SOCIAL_CRON_KEY)')


if __name__ == '__main__':
    main()
