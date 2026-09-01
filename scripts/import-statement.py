import re, sys, json, urllib.request, collections
import os, datetime
URL = os.environ.get("CONVEX_URL", "https://calculating-warthog-691.convex.cloud")
WINDOW = 3
# statement lines already entered by hand with a typo / combined amount; skip to avoid double count
EXCLUDE = {("2026-04-07",1118),("2026-04-13",411),("2026-04-13",1808),("2026-04-21",55400),("2026-04-27",4995),("2026-04-29",666),("2026-05-05",643),("2026-05-12",1348)}
CATS = {"Credit Cards":"jd78ae2ryezx64qc4vhxyk9e6s82n34c","Eating Out":"jd707qrsbjrc5er51412bgpmp182mpg8","Entertainment":"jd756pq508nhmnc4tpf90dyw6x82mpqy","Gas":"jd723s4175r0mxqbqff4t82mns82nzfc","Groceries":"jd7drmgtdqyet4kwpvfbgr8xzs82mkt5","Insurance":"jd72nxx84wq3z5wgpqy0feqwch82nces","Loan":"jd770q87hec5qhhxefmna8bxg982n09g","Miscellaneous":"jd73y2qcmxdx5fx906rwvc8v4h85csre","Subscription":"jd749s0tgc8nvyjp29xsm5pm7182m9w1","Utilities":"jd7a7dy17pr8hteqcy25egyrbh82ms20"}
RULES = [  # ponytail: first keyword hit wins; refine in-app
 ("Loan", ["ford f-250 loan"]),
 ("Credit Cards", ["capital one","credit one","cash app"]),
 ("Insurance", ["chesapeake","bear river"]),
 ("Utilities", ["rockymtn","rise internet","phone"]),
 ("Subscription", ["netflix","spotify","disney","crunchyroll","oura","ring solo","xbox","claude","anthropic","heroku","name-cheap","amazon prime","prime video","openai","paramount accept","180 fitness","vasa","solle"]),
 ("Gas", ["maverik #279","maverik #254","maverik #670","chevron 0358708","fast gas"]),
 ("Groceries", ["costco","wal-mart","walmart","target","macey","trader joe","good earth","rancho","amazon","smiths","stokes","sprouts","harmons","foodland","staterbros","stone drug","home depot","nature's sunshine"]),
 ("Eating Out", ["mcdonald","joe coffee","sip-n","sonic","wingstop","betos","in-n-out","wendys","zao","bagel","juice n java","java junkie","ramen","handels","cafe rio","costavida","sq *","tst*","chix","sumo","glades","el sarten","barrys","maverik","chevron","7-eleven","love's","kona","dairy","pizza","taco","burger","grill","chick-fil-a","starbucks","fiiz","mo bettahs","panda express","chipotle","dave's hot","daves hot","spicy thai","bonchon","vivachicken","seasurf","splash summit"]),
 ("Entertainment", ["kidstopia","provo recreation","tututix","cinemark","movie","gofantix","nebo gymnastics","roku","nayax parking","skyridge"]),
]
def categorize(desc):
    d = desc.lower()
    for name, kws in RULES:
        if any(k in d for k in kws): return CATS[name]
    return None  # ponytail: manual entry dates drift from posting dates
DRY = "--apply" not in sys.argv
LINE = re.compile(r"^\s*(\d{1,2})/(\d{2})/(\d{2})\s+(.+?)\s{2,}([\d,]*\.\d{2})\s*(.*)$")
SUMMARY = re.compile(r"\|\s*(DEPOSITS|WITHDRAWALS)\s+(\d+)\s+([\d,]*\.\d{2})")

def cents(s): return round(float(s.replace(",", "")) * 100)

def clean_loc(loc, desc):
    loc = re.sub(r"\s+\d{1,2}/\d{2}/\d{2}.*$", "", loc)          # trailing post date/time
    loc = re.sub(r"\s+\d{1,2}:\d{2}$", "", loc)
    loc = re.sub(r"\s+", " ", loc).strip()
    if not loc: return desc
    w = loc.split(" ")
    for n in range(len(w)//2, 0, -1):                             # collapse "X Y X Y ..." merchant echo
        if w[:n] == w[n:2*n]: w = w[:n] + w[2*n:]; break
    return " ".join(w)[:60]

def parse(path):
    txt = open(path).read()
    # checking summary column: the 009 column is the one with WITHDRAWALS count > 1
    sums = [(k, int(n), cents(a)) for k, n, a in SUMMARY.findall(txt)]
    chk = txt.split("SUFFIX      009 CHECKING", 1)[1]
    chk = re.split(r"^RETURNED|^SUFFIX      030", chk, flags=re.M)[0]
    rows, mode = [], None
    for ln in chk.splitlines():
        if ln.startswith("DEPOSITS"): mode = "income"
        elif ln.startswith("OTHER") or "DEDUCTIONS" in ln: mode = "expense"
        m = LINE.match(ln)
        if not m or not mode: continue
        mo, d, y, desc, amt, loc = m.groups()
        desc = desc.strip()
        rows.append(dict(type=mode, entryDate=f"20{y}-{int(mo):02d}-{d}", amountCents=cents(amt),
                         description=clean_loc(loc, desc) if mode == "expense" else (desc if desc != "Purchase Return" else clean_loc(loc, desc) + " (refund)")))
    for r in rows:
        if r["description"].startswith("Active Medical"): r["description"] = "Active Medical payroll"
        if r["description"].startswith("RA-Bear Rive"): r["description"] = "Returned item fee (Bear River)"
        if r["description"] == "FT Transfer W/D":
            r["description"] = "Ford F-250 loan payment" if r["amountCents"] == 31609 else "Transfer to savings"
    return rows, sums

def q(path, args, kind="query"):
    req = urllib.request.Request(f"{URL}/api/{kind}", data=json.dumps({"path": path, "args": args, "format": "json"}).encode(),
                                 headers={"content-type": "application/json"})
    for attempt in range(4):
        try:
            r = json.load(urllib.request.urlopen(req))
        except Exception as ex:
            r = {"status": "error", "errorMessage": str(ex)}
        if r.get("status") == "success": return r["value"]
        print("retry", attempt, r.get("errorMessage")); import time; time.sleep(2 ** attempt)
    raise SystemExit(r)

existing = [(t["type"], t["entryDate"], t["amountCents"], t["description"]) for t in q("transactions:listTransactions", {"pageSize": 5000})["transactions"]]
def day(s): return datetime.date.fromisoformat(s).toordinal()
def claim(r):
    for i, e in enumerate(existing):
        if e[0] == r["type"] and e[2] == r["amountCents"] and abs(day(e[1]) - day(r["entryDate"])) <= WINDOW:
            existing.pop(i); return e
    return None
todo = []
for f in sys.argv[1:]:
    if f.startswith("--"): continue
    rows, sums = parse(f)
    got = {k: (sum(1 for r in rows if r["type"] == t), sum(r["amountCents"] for r in rows if r["type"] == t)) for k, t in [("DEPOSITS", "income"), ("WITHDRAWALS", "expense")]}
    for k, n, c in sums:
        if (n, c) == got[k]: print(f"{f.split('/')[-1]}: {k} OK {n} items ${c/100:,.2f}")
    for k in got:
        if not any(s[0] == k and (s[1], s[2]) == got[k] for s in sums):
            raise SystemExit(f"MISMATCH {f} {k}: parsed {got[k]}, summary {[s for s in sums if s[0]==k]}")
    for r in sorted(rows, key=lambda r: r["entryDate"]):
        if (r["entryDate"], r["amountCents"]) in EXCLUDE: print("EXCLUDE", r); continue
        e = claim(r)
        if e: print(f'SKIP {r["type"]:7} {r["entryDate"]} {r["amountCents"]/100:>9.2f} {r["description"][:30]:30} == {e[1]} {e[3]!r}'); continue
        todo.append(r)

print(f"{len(todo)} to insert")
for r in todo:
    args = dict(amountCents=r["amountCents"], entryDate=r["entryDate"], enteredBy="landon", description=r["description"])
    if r["type"] == "expense": args["spentBy"] = "landon"; args["categoryId"] = categorize(r["description"])
    if DRY: print(r["type"], r["entryDate"], f'{r["amountCents"]/100:>9.2f}', r["description"])
    else: q("transactions:createIncome" if r["type"] == "income" else "transactions:createExpense", args, "mutation")
if not DRY: print("done; balance", q("transactions:getBalance", {}))
