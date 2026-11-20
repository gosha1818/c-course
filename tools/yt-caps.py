# Субтитры и главы ролика: python -I tools/yt-caps.py VIDEO_ID [ключевое слово ...]
# Печатает главы и строки субтитров (с минутой), где встречаются ключевые слова.
import sys, json, re, urllib.request, html as H

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36", "Accept-Language": "ru-RU,ru;q=0.9"}

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read().decode("utf-8", "replace")

def mmss(t):
    t = int(t); return "%d:%02d" % (t // 60, t % 60) if t < 3600 else "%d:%02d:%02d" % (t // 3600, t % 3600 // 60, t % 60)

vid = sys.argv[1]
words = [w.lower() for w in sys.argv[2:]]
page = get("https://www.youtube.com/watch?v=" + vid)
m = re.search(r"var ytInitialPlayerResponse = (\{.*?\});(?:var|</script>)", page)
p = json.loads(m.group(1)) if m else {}
vd = p.get("videoDetails", {})
print("##", vid, mmss(vd.get("lengthSeconds", 0) or 0), vd.get("title", ""))
desc = vd.get("shortDescription", "")
for line in desc.splitlines():
    if re.match(r"^\s*(\d+:)?\d{1,2}:\d{2}", line):
        print("  ch", line.strip()[:90])
tracks = p.get("captions", {}).get("playerCaptionsTracklistRenderer", {}).get("captionTracks", [])
tr = next((t for t in tracks if t.get("languageCode", "").startswith("ru")), tracks[0] if tracks else None)
if not tr:
    print("  (нет субтитров)"); sys.exit()
xml = get(tr["baseUrl"])
items = re.findall(r'<text start="([\d.]+)"[^>]*>(.*?)</text>', xml, re.S)
if not items:
    j = None
    try: j = json.loads(get(tr["baseUrl"] + "&fmt=json3"))
    except Exception: pass
    if j:
        items = [(e.get("tStartMs", 0) / 1000, "".join(s.get("utf8", "") for s in e.get("segs", []))) for e in j.get("events", []) if e.get("segs")]
print("  captions:", len(items), "lang", tr.get("languageCode"))
last = -999
for st, txt in items:
    t = H.unescape(re.sub(r"<[^>]+>", "", str(txt))).replace("\n", " ")
    if not words:
        if float(st) - last >= 60:
            print("  ", mmss(float(st)), t[:100]); last = float(st)
    elif any(w in t.lower() for w in words):
        print("  ", mmss(float(st)), t[:110])
