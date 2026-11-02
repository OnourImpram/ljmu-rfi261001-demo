"""Dependency-free repository hygiene checks; this is not a full secret scanner."""
from pathlib import Path
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
for path in [ROOT / 'index.html', *sorted((ROOT / 'js').glob('*.js')), ROOT / 'css/styles.css']:
    text = path.read_text(encoding='utf-8')
    for label, pattern in patterns.items():
        if re.search(pattern, text, re.MULTILINE | re.IGNORECASE):
            issues.append(f"{path.relative_to(ROOT)}: {label}")
html = (ROOT / 'index.html').read_text()
for path in re.findall(r'(?:src|href)="(\./[^"?#]+)', html):
    if not (ROOT / path).is_file():
        issues.append(f"Missing local asset: {path}")
if 'http-equiv="Content-Security-Policy"' not in html:
    issues.append('Missing source CSP')
if re.search(r'<script[^>]+src="https?://', html) or re.search(r'<link[^>]+rel="stylesheet"[^>]+href="https?://', html):
    issues.append('External runtime script or stylesheet')
if issues:
    print('\n'.join(issues))
    sys.exit(1)
print('PASS: source markers, asset references, runtime dependency boundaries and selected secret patterns')
