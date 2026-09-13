# -*- coding: utf-8 -*-
"""Wispr pass 2: a tinted page, white panels on it, and the serif masthead."""
import sys
p="site-e.html"; s=open(p,encoding="utf-8").read()
def sub(old,new,why):
    global s
    if old not in s: sys.exit("NOT FOUND (%s):\n%s"%(why,old[:220]))
    if s.count(old)!=1: sys.exit("%d matches (%s)"%(s.count(old),why))
    s=s.replace(old,new,1)

# ------------------------------------------------------------- the wrapper
sub(".main{padding:0 0 var(--band-gap)}",
"""/* One centred column of panels. 1248 outer less 24 of gutter each side is a
   1200px panel; 40px of panel padding leaves 1120, and .content-inner keeps
   its 1040 inside that. */
.main{
  width:100%;max-width:1248px;margin:0 auto;
  padding:0 24px var(--band-gap);
}""", "main wrapper")

# ------------------------------------------------------------- the panels
sub("""  padding-block:var(--band-gap) calc(var(--band-gap) + 4px);
  padding-inline:var(--gutter);
  scroll-margin-top:calc(var(--head-h) + 10px);
}
/* The band is painted on the section, so it still runs the full width of the
   window; only the content inside it is framed. */
section:nth-of-type(even){background:var(--band)}""",
"""  padding:clamp(24px,3.4vw,40px);
  margin-bottom:32px;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:var(--r-panel);
  scroll-margin-top:calc(var(--head-h) + 22px);
}
/* Alternating bands were how one section was told from the next. Each one is
   now its own panel on a tinted page, so the band has nothing left to do. */""",
"section panel")

# ------------------------------------------------------------- the ground
sub("""body{
  margin:0;
  font-family:var(--font-text);""",
"""body{
  margin:0;
  font-family:var(--font-text);""", "noop body")

# ------------------------------------------------------------ the masthead
sub("""/* ------------------------------------------------------------- masthead --- */
.mast{
  padding-block:clamp(64px,11vw,150px) clamp(52px,8vw,110px);
  padding-inline:max(var(--gutter), calc((100% - var(--page-max)) / 2));
  text-align:center;
}
.mast>*{max-width:var(--page-max);margin-left:auto;margin-right:auto}""",
"""/* ------------------------------------------------------------- masthead --- */
/* A panel like every other, with the title set large in the serif and the
   space under it closed up: the old hero left most of a screen empty between
   the title and the first thing you read. */
.mast{
  padding:clamp(34px,5.2vw,64px) clamp(24px,3.4vw,40px) clamp(30px,4vw,48px);
  margin-bottom:32px;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:var(--r-panel);
  text-align:center;
}
.mast>*{max-width:var(--content-max);margin-left:auto;margin-right:auto}""",
"mast panel")

sub("""  font-family:var(--font-text);font-weight:700;font-size:var(--text-micro);
  text-transform:uppercase;letter-spacing:.09em;
  color:var(--accent);margin:0 auto 16px;""",
"""  font-family:var(--font-text);font-weight:600;font-size:var(--text-micro);
  text-transform:uppercase;letter-spacing:.11em;
  color:var(--accent);margin:0 auto 18px;""", "kicker")

open(p,"w",encoding="utf-8").write(s); print("pass 2 applied")
