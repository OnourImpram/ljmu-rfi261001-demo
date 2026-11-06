import argparse
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = """
index.html guide.html 404.html robots.txt sitemap.xml llms.txt social-card.svg
.well-known/security.txt screenshots/og-preview.png
css/styles.css css/guide.css css/body-chart.css css/muscle-reference.css
js/app.js js/booking.js js/body-chart.js js/muscle-reference.js js/commercial.js js/epr.js js/governance.js js/service-desk.js js/store.js
assets/anatomy/muscle-shapes.js assets/anatomy/MuscleMap-LICENSE.txt
assets/fonts/roboto-condensed-bold.woff2 assets/fonts/roboto-condensed-bold-OFL.txt
assets/fonts/source-sans-3.woff2 assets/fonts/source-sans-3-OFL.txt
assets/fonts/source-serif-4.woff2 assets/fonts/source-serif-4-OFL.txt
assets/img/favicon.png assets/img/ljmu-logo-navy.png assets/img/ljmu-logo-white.png
assets/img/oiv-logo.png assets/img/performance-hub-icon.png
assets/img/performance-hub-logo-reversed.png assets/img/performance-hub-logo.png
assets/img/performance-lab.webp
""".split()
ABSENT = """
README.md DESIGN.md SECURITY.md docs/architecture.md .gitignore package.json
.github/workflows/quality.yml tests/check_source.py tests/pages_site.py
screenshots/mobile_390px_after.png screenshots/view1_booking_capacity_guard.png
screenshots/view2_5discipline_epr_countersign.png screenshots/view3_commercial_checkout_mixed_vat.png
screenshots/view4_oracle_ebs_audit_trail.png assets/img/og-preview.png
""".split()


def stage(destination):
    dest = Path(destination)
    dest.mkdir(parents=True, exist_ok=False)
    for name in PUBLIC:
        source = ROOT / name
        if source.resolve() != source or not source.is_file():
            raise ValueError(f"Expected a regular source file at {name}")
        target = dest / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    files = {p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file()}
    if files != set(PUBLIC) or files.intersection(ABSENT):
        raise ValueError("Pages staging contains an unexpected file")
    print(f"Staged {len(files)} public files", flush=True)


def verify(base_url):
    sha = os.environ["GITHUB_SHA"]
    checked_out = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    if checked_out != sha:
        raise ValueError("Verification checkout differs from the workflow commit")
    digests = {name: hashlib.sha256((ROOT / name).read_bytes()).digest() for name in PUBLIC}
    base = base_url.rstrip("/") + "/"

    def matches(name, attempt):
        query = urlencode({"sha": sha, "attempt": attempt})
        request = Request(base + name + "?" + query, headers={"Cache-Control": "no-cache"})
        try:
            with urlopen(request, timeout=10) as response:
                return name in digests and response.status == 200 and hashlib.sha256(response.read()).digest() == digests[name]
        except HTTPError as error:
            return name in ABSENT and error.code == 404
        except (OSError, URLError):
            return False

    paths = PUBLIC + ABSENT
    with ThreadPoolExecutor(max_workers=6) as pool:
        for attempt in range(1, 13):
            outcomes = pool.map(lambda path: matches(path, attempt), paths)
            failed = [name for name, ok in zip(paths, outcomes) if not ok]
            if not failed:
                print(f"Verified {len(PUBLIC)} published files and {len(ABSENT)} excluded paths at {sha}")
                return
            print(f"Attempt {attempt}: {', '.join(failed)}", flush=True)
            if attempt < 12:
                time.sleep(5)
    raise SystemExit("Published Pages content did not match the approved payload")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("stage").add_argument("directory")
    commands.add_parser("verify").add_argument("base_url")
    args = parser.parse_args()
    if args.command == "stage":
        stage(args.directory)
    else:
        verify(args.base_url)
