"""Publish the new site: GitHub Pages serves the branch gh-pages, which holds only what is in docs/.

Build and commit first (python -I src/build.py, then git commit), then:
    python -I tools/publish.py
It splits docs/ out of main's history into gh-pages and pushes it, so each publish adds to the last one.
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
PREFIX = f"{ROOT.name}/docs"


def git(*args):
    return subprocess.run(["git", *args], cwd=REPO, check=True, capture_output=True, text=True, encoding="utf-8").stdout.strip()


if git("status", "--porcelain", "--", PREFIX):
    raise SystemExit("docs/ has changes that are not committed; commit them first")
sha = git("subtree", "split", f"--prefix={PREFIX}", "HEAD")
git("push", "origin", f"{sha}:refs/heads/gh-pages")
print("published", sha[:8], "to gh-pages")
