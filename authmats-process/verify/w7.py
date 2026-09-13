# Wispr pass 7: the worked-example rows. Colour only -- the row already had
# the rounded bordered shape, the aligned number/title/verdict/control summary
# and the two-column expanded body stacking at 900px. What it did not have was
# separation: a white row inside a white panel reads as one surface with lines
# drawn on it. The row takes the recessed ground so each case is a thing you
# can see the edges of.
import sys
p='site-e.html'; s=open(p,encoding='utf-8').read()
def one(old,new):
    global s
    n=s.count(old)
    if n!=1: sys.exit('expected 1, found %d: %r'%(n,old[:70]))
    s=s.replace(old,new)

one(".ex{background:var(--paper);border:1px solid var(--hairline);\n"
    "  border-radius:var(--r-card);overflow:hidden}",
    ".ex{background:var(--canvas);border:1px solid var(--hairline);\n"
    "  border-radius:var(--r-card);overflow:hidden}")
# the hover ground has to be something other than the row's own ground now
one(".ex>summary:hover{background:var(--canvas)}",
    ".ex>summary:hover{background:var(--cool-wash)}")
open(p,'w',encoding='utf-8').write(s); print('w7 applied')
