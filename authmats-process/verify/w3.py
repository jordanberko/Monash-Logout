# -*- coding: utf-8 -*-
"""Wispr pass 3: the serif where the spec puts it, and headings resized."""
import sys
p="site-e.html"; s=open(p,encoding="utf-8").read()
def sub(old,new,why):
    global s
    if old not in s: sys.exit("NOT FOUND (%s):\n%s"%(why,old[:200]))
    if s.count(old)!=1: sys.exit("%d matches (%s)"%(s.count(old),why))
    s=s.replace(old,new,1)

# the page title: serif, large, tight
sub("""  font-family:var(--font-display);font-weight:600;
  font-size:clamp(28px,5.6vw,var(--text-heading-lg));
  line-height:1.06;letter-spacing:-1.1px;
  color:var(--ink);margin:0 auto 22px;max-width:26ch;text-wrap:pretty;""",
"""  font-family:var(--font-serif);font-weight:400;
  font-size:var(--text-heading-lg);
  line-height:.95;letter-spacing:-.012em;
  color:var(--ink);margin:0 auto 20px;max-width:22ch;text-wrap:pretty;""", "mast h1")

# the qualifier keeps its lighter treatment, in the same face
sub('.mast h1 .ttlqual{font-weight:400;color:var(--ink-3);letter-spacing:-.6px}',
    '.mast h1 .ttlqual{font-weight:400;color:var(--accent);letter-spacing:-.012em}', "ttlqual")

# section headings: serif, 36-52
sub("""h2{
  font-family:var(--font-display);font-weight:600;
  font-size:clamp(30px,3.6vw,var(--text-heading-sm));
  line-height:1.14;letter-spacing:.007em;color:var(--ink);
  margin:0;text-wrap:balance;
}""",
"""h2{
  font-family:var(--font-serif);font-weight:400;
  font-size:var(--text-heading-sm);
  line-height:1.02;letter-spacing:-.008em;color:var(--ink);
  margin:0;text-wrap:balance;
}""", "h2")

# supporting headings stay in Figtree at 20-24
sub("""h3{
  font-family:var(--font-display);font-weight:600;font-size:var(--text-body-lg);
  line-height:1.2;letter-spacing:.196px;color:var(--ink);""",
"""h3{
  font-family:var(--font-display);font-weight:600;font-size:var(--text-body-lg);
  line-height:1.25;letter-spacing:-.004em;color:var(--ink);""", "h3")

# body copy back to a reading size and rhythm
sub("""  font-family:var(--font-text);
  font-size:var(--text-body);
  line-height:1.47;""",
"""  font-family:var(--font-text);
  font-size:var(--text-body-sm);
  line-height:1.58;""", "body size") if """  font-family:var(--font-text);
  font-size:var(--text-body);
  line-height:1.47;""" in s else None

open(p,"w",encoding="utf-8").write(s); print("pass 3 applied")
