from pathlib import Path
from html import unescape
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
issues = []
patterns = {
    "debugger statement": r"\bdebugger\s*;",
    "console logging": r"\bconsole\.(?:log|debug)\s*\(",
    "inline event handler": r"\bon(?:click|load|error|change|submit)\s*=",
    "merge conflict": r"^(?:<{7}|={7}|>{7})(?: |$)",
    "private key": r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    "GitHub token": r"\bgh[pousr]_[A-Za-z0-9]{30,}\b",
    "unfinished marker": r"\b(?:TODO|FIXME|HACK|XXX)\b",
}

def public_content_issues(html, scripts):
    found = set()

    def inspect_schema(obj):
        if isinstance(obj, dict):
            if any(str(k).lower() in {"offers", "price", "pricespecification", "lowprice", "highprice"} for k in obj):
                found.add("commercial offer in structured data")
            for value in obj.values():
                inspect_schema(value)
        elif isinstance(obj, list):
            for value in obj:
                inspect_schema(value)

    for block in re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.I | re.S):
        try:
            inspect_schema(json.loads(block))
        except ValueError:
            found.add("invalid structured data")
    visible = unescape(re.sub(r"<[^>]+>", " ", html))

    amount = r"(?:£|GBP\s*)\s*[0-9][0-9,.]*(?:k|m)?"
    terms = r"(?:contract (?:total|value)|total contract|subscription|budget cap|sub[- ]threshold|commercial (?:structure|terms)|three.year (?:total|cost)|3.year (?:total|cost))"
    if re.search(terms + r".{0,160}?" + amount + "|" + amount + r".{0,100}?" + terms, visible, re.I | re.S):
        found.add("contract price in public page")
    if re.search(r"(?:LJMU[- /]REC|REC[- /]20\d{2}[- /]LJMU|LJMU[- /]ETHICS)[- /]?[0-9]|REC[- /]20\d{2}[- /]LJMU", html + scripts, re.I):
        found.add("institutional ethics approval identifier")
    return found


if public_content_issues('<script type="application/ld+json">{"@graph":[{"offers":{"price":1}}]}</script>', "") != {"commercial offer in structured data"}:
    issues.append("structured data control failed")
if public_content_issues("<p>Contract total: GBP 1</p>", "") != {"contract price in public page"}:
    issues.append("contract text control failed")
if public_content_issues("", "LJMU-REC-2099-0001") != {"institutional ethics approval identifier"}:
    issues.append("ethics identifier control failed")
if public_content_issues("<p>Example training invoice: GBP 1</p>", ""):
    issues.append("sample transaction control failed")

pages = sorted(ROOT.glob("*.html"))
for path in [*pages, *sorted((ROOT / "js").glob("*.js")), *sorted((ROOT / "css").glob("*.css"))]:
    text = path.read_text(encoding="utf-8")
    for label, pattern in patterns.items():
        if re.search(pattern, text, re.MULTILINE | re.IGNORECASE):
            issues.append(f"{path.relative_to(ROOT)}: {label}")

html = "\n".join(page.read_text(encoding="utf-8") for page in pages)
for rel_path in re.findall(r'(?:src|href)="(assets/[^"?#]+|css/[^"?#]+|js/[^"?#]+)', html):
    if not (ROOT / rel_path).is_file():
        issues.append(f"Missing local asset: {rel_path}")

if re.search(r'<script[^>]+src="https?://', html):
    issues.append("External runtime script detected")

public_scripts = "\n".join(p.read_text(encoding="utf-8") for p in sorted((ROOT / "js").glob("*.js")))
issues.extend(sorted(public_content_issues(html, public_scripts)))

if issues:
    print("\n".join(issues))
    sys.exit(1)

print("PASS: source markers, local asset references, runtime script boundaries and secret patterns verified; public content checks and controls passed")
