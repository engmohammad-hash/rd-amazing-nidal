"""Publish both sites: GitHub Pages serves the branch gh-pages, which holds the new site's docs/ at the root
and the first site's docs/ under v1/.

  https://engmohammad-hash.github.io/rd-amazing-nidal/      the new site
  https://engmohammad-hash.github.io/rd-amazing-nidal/v1/   the first site (the scroll film)

Build and commit first (python -I src/build.py, then git commit), then:
    python -I tools/publish.py
It puts the two committed docs/ folders side by side in one new gh-pages commit on top of the last one and pushes
it. Nothing is copied: the commit points at the same files main already has, so only a few small records travel.
"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.parent
NEW, OLD = f"{ROOT.name}/docs", "الموقع الأول/docs"


def git(*args, stdin=None):
    # quotepath off, so the folders' Arabic names come back as they are; the input goes as bytes, because text mode
    # on Windows would turn each newline into \r\n and git would take the \r as part of a name
    out = subprocess.run(["git", "-c", "core.quotepath=false", *args], cwd=REPO, check=True, capture_output=True,
                         input=stdin.encode() if stdin is not None else None)
    return out.stdout.decode("utf-8").strip()


for prefix in (NEW, OLD):
    if git("status", "--porcelain", "--", prefix):
        raise SystemExit(f"{prefix} has changes that are not committed; commit them first")

head = git("rev-parse", "--short", "HEAD")
entries = git("ls-tree", f"HEAD:{NEW}").splitlines()
if any(line.split("\t", 1)[1] == "v1" for line in entries):
    raise SystemExit("the new site has its own v1/, which would hide the first site")
entries.append(f"040000 tree {git('rev-parse', f'HEAD:{OLD}')}\tv1")
tree = git("mktree", stdin="\n".join(entries) + "\n")

git("fetch", "-q", "origin", "main")
if git("rev-parse", "FETCH_HEAD") != git("rev-parse", "HEAD"):
    raise SystemExit("push main first: GitHub must already have what is being published")
# main is a parent too, and the push walks whole trees rather than path by path: that is how git sees that GitHub
# already has every file (they sit under other folder names in main) and sends a few hundred bytes, not 100 MB
parents = ["-p", "HEAD"]
if git("ls-remote", "--heads", "origin", "gh-pages"):
    git("fetch", "-q", "origin", "gh-pages")
    parents = ["-p", git("rev-parse", "FETCH_HEAD")] + parents
commit = git("commit-tree", tree, *parents, "-m", f"Publish both sites from main {head}")
git("-c", "pack.useSparse=false", "push", "origin", f"{commit}:refs/heads/gh-pages")
print("published", commit[:8], "to gh-pages (new site at the root, first site under v1/)")
