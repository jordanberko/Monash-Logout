# -*- coding: utf-8 -*-
"""Wispr pass 5: the two deep blue sections, and the dark theme."""
import sys
p="site-e.html"; s=open(p,encoding="utf-8").read()
def sub(old,new,why):
    global s
    if old not in s: sys.exit("NOT FOUND (%s):\n%s"%(why,old[:220]))
    if s.count(old)!=1: sys.exit("%d matches (%s)"%(s.count(old),why))
    s=s.replace(old,new,1)

DEEP = """
/* ------------------------------------------------- the two dark panels --- */
/* Sources and Escalation invert. Everything inside them already asks for the
   tokens, so the panel redefines the tokens rather than restating every
   component: one scope, and every card, table, rule and label inside follows.
   The semantic colours are re-tuned for the dark ground rather than dropped,
   because a discrepancy has to stay a discrepancy. */
#s3,#s10{
  background:var(--deep);
  border-color:var(--edge-strong);
  --ink:#FFFFFF;
  --ink-2:#D8E9F5;
  --ink-3:#AFCEE3;
  --paper:rgba(255,255,255,.06);
  --canvas:rgba(255,255,255,.035);
  --hairline:rgba(255,255,255,.24);
  --cool-wash:rgba(255,255,255,.10);
  --accent:#8FCDF7;
  --accent-deep:#BFE2FC;
  --accent-wash:rgba(143,205,247,.16);
  --on-accent:#00334F;
  --ok:#7FD9BC;      --ok-wash:rgba(127,217,188,.16);
  --warn:#F0C878;    --warn-wash:rgba(240,200,120,.16);
  --stop:#F3A98C;    --stop-wash:rgba(243,169,140,.18);
}
#s3 h2,#s10 h2{color:#FFFFFF}
#s3 .secnum,#s10 .secnum{color:var(--accent)}
#s3 a,#s10 a{color:var(--accent)}
#s3 a:hover,#s10 a:hover{color:var(--accent-deep)}
#s3 code,#s10 code{background:rgba(255,255,255,.10);color:#EAF4FB}
#s3 .col,#s10 .col{background:var(--accent-wash);color:var(--accent)}
#s3 .owner.auto,#s10 .owner.auto{background:rgba(255,255,255,.12);color:var(--ink-2)}
/* the figures keep a light mount so a screenshot is not floated on navy */
#s3 .shot.filled,#s10 .shot.filled{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.3)}
#s3 .shot.filled figcaption,#s10 .shot.filled figcaption{color:#2A4557}
#s3 .shot.filled figcaption .ref,#s10 .shot.filled figcaption .ref{color:#00537F}
#s3 .shot.filled figcaption .ref::after,#s10 .shot.filled figcaption .ref::after{color:#526572}
#s3 :focus-visible,#s10 :focus-visible{outline-color:var(--accent)}
"""
sub("/* ------------------------------------------------------------- masthead --- */",
    DEEP.strip() + "\n\n/* ------------------------------------------------------------- masthead --- */",
    "deep sections")

# ------------------------------------------------------------- dark theme
DARKVARS = """    --wash-a:#091E2E; --wash-b:#091E2E; --wash-c:#0C2537;
    --ink:#EEF5FA; --ink-2:#D2E2EC; --ink-3:#B4C9D7;
    --hairline:#38566A;
    --edge-strong:#5B8099;
    --paper:#112D41; --canvas:#0D2436; --band:transparent;
    --cool-wash:#1C4059;
    --deep:#004875;
    --nav-elevated:#112D41;
    --accent:#89CAFA; --accent-deep:#B6DFFD; --accent-wash:#173E58; --on-accent:#04202F;
    --ok:#6FD3B4;  --ok-wash:#123A32;
    --warn:#EFC178; --warn-wash:#3A2F18;
    --stop:#F5A98B; --stop-wash:#3E2418;
    --m-opacity:.14;
    color-scheme:dark;"""

OLDDARK = """  --wash-a:#12293A; --wash-b:#08131A; --wash-c:#0E2433;
    --ink:#f5f5f7; --ink-2:#c9cdd2; --ink-3:#98a0a8;
    --hairline:#2c3339;
    --paper:#0F1A22; --canvas:#0C161D; --band:rgba(255,255,255,.045);
    --cool-wash:#18242D;
    --nav-elevated:#0B1822;
    --accent:#4FA8E8; --accent-deep:#7CC1F0; --accent-wash:#0F2A3C; --on-accent:#04121B;
    --ok:#5FC9A8;  --ok-wash:#0F2A25;
    --warn:#E3B463; --warn-wash:#2C2416;
    --stop:#EE9C7E; --stop-wash:#2F1E17;
    --m-opacity:.14;
    color-scheme:dark;"""
assert s.count(OLDDARK)==1, "media-query dark block"
s=s.replace(OLDDARK, DARKVARS.lstrip(), 1)

OLDDARK2 = """  --wash-a:#12293A; --wash-b:#08131A; --wash-c:#0E2433;
  --ink:#f5f5f7; --ink-2:#c9cdd2; --ink-3:#98a0a8;
  --hairline:#2c3339;
  --paper:#0F1A22; --canvas:#0C161D; --band:rgba(255,255,255,.045);
  --cool-wash:#18242D;
  --nav-elevated:#0B1822;
  --accent:#4FA8E8; --accent-deep:#7CC1F0; --accent-wash:#0F2A3C; --on-accent:#04121B;
  --ok:#5FC9A8;  --ok-wash:#0F2A25;
  --warn:#E3B463; --warn-wash:#2C2416;
  --stop:#EE9C7E; --stop-wash:#2F1E17;
  --m-opacity:.14;
  color-scheme:dark;"""
assert s.count(OLDDARK2)==1, "attribute dark block"
s=s.replace(OLDDARK2, "\n".join(l[2:] if l.startswith("    ") else l for l in DARKVARS.split("\n")).lstrip(), 1)

open(p,"w",encoding="utf-8").write(s); print("pass 5 applied")
