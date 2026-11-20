# Метаданные роликов курса: длительность, главы, наличие субтитров.  python -I tools/yt-meta.py ids.txt out.json
import sys, json, re, urllib.request, time
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36", "Accept-Language": "ru-RU,ru;q=0.9"}
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read().decode("utf-8", "replace")
def meta(vid):
    html = get("https://www.youtube.com/watch?v=" + vid)
    pr = re.search(r"var ytInitialPlayerResponse = (\{.*?\});(?:var|</script>)", html)
    di = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    out = {"id": vid}
    if pr:
        p = json.loads(pr.group(1))
        vd = p.get("videoDetails", {})
        out["len"] = int(vd.get("lengthSeconds", 0) or 0)
        out["title"] = vd.get("title", "")
        out["desc"] = vd.get("shortDescription", "")
        tracks = p.get("captions", {}).get("playerCaptionsTracklistRenderer", {}).get("captionTracks", [])
        out["caps"] = [{"lang": t.get("languageCode"), "kind": t.get("kind", ""), "url": t.get("baseUrl")} for t in tracks]
    chapters = []
    if di:
        d = json.loads(di.group(1))
        def walk(o):
            if isinstance(o, dict):
                if "macroMarkersListItemRenderer" in o:
                    m = o["macroMarkersListItemRenderer"]
                    t = m.get("title", {}).get("simpleText", "")
                    ts = m.get("timeDescription", {}).get("simpleText", "")
                    chapters.append((ts, t))
                if "chapterRenderer" in o:
                    c = o["chapterRenderer"]
                    chapters.append((c.get("timeRangeStartMillis", 0) // 1000, c.get("title", {}).get("simpleText", "")))
                for v in o.values(): walk(v)
            elif isinstance(o, list):
                for v in o: walk(v)
        walk(d)
    # главы из описания (строки «0:00 Тема»)
    desc_ch = re.findall(r"^\s*((?:\d+:)?\d{1,2}:\d{2})\s*[-–—]?\s*(.+)$", out.get("desc", ""), re.M)
    seen, uniq = set(), []
    for c in chapters + desc_ch:
        k = str(c[0]) + c[1]
        if k not in seen: seen.add(k); uniq.append([c[0], c[1]])
    out["chapters"] = uniq
    return out
ids = [l.strip() for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
res = {}
for i, v in enumerate(ids):
    try: res[v] = meta(v)
    except Exception as e: res[v] = {"id": v, "err": str(e)}
    time.sleep(0.3)
json.dump(res, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("done", len(res))
