# -*- coding: utf-8 -*-
"""Wispr pass 4: header, introduction panels, tables, steps, fields, cards."""
import sys
p="site-e.html"; s=open(p,encoding="utf-8").read()
def sub(old,new,why):
    global s
    if old not in s: sys.exit("NOT FOUND (%s):\n%s"%(why,old[:220]))
    if s.count(old)!=1: sys.exit("%d matches (%s)"%(s.count(old),why))
    s=s.replace(old,new,1)

# ------------------------------------------------------------------ header
sub(""".rail{
  position:sticky;top:0;z-index:40;
  background:var(--nav-elevated);""",
""".rail{
  position:sticky;top:0;z-index:40;
  background:var(--nav-elevated);""", "noop rail")

sub(".railinner{\n  max-width:var(--page-max);margin:0 auto;\n  padding:0 var(--gutter);",
    ".railinner{\n  max-width:1200px;margin:0 auto;\n  padding:0 clamp(16px,2.2vw,28px);", "railinner")

# ------------------------------------------------- the two failure panels
sub(""".intro-failures{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
  background:var(--paper);border-radius:var(--r-card);overflow:hidden;
}
.intro-failures>p{margin:0;padding:24px 28px;line-height:1.6;min-width:0}
.intro-failures>p+p{border-left:1px solid var(--hairline)}""",
"""/* Two balanced pale blue panels: the pair is a comparison, so they carry the
   same surface and sit side by side rather than sharing one box. */
.intro-failures{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;
  background:none;
}
.intro-failures>p{
  margin:0;padding:24px 26px;line-height:1.6;min-width:0;
  background:var(--cool-wash);border:1px solid var(--hairline);
  border-radius:var(--r-card);
}
.intro-failures>p+p{border-left:1px solid var(--hairline)}""", "intro failures")

sub(""".intro-role{
  display:grid;grid-template-columns:210px minmax(0,1fr);gap:28px;
  padding:24px 28px;background:var(--accent-wash);border-radius:var(--r-card);
  margin:0 0 6px;align-items:start;
}""",
""".intro-role{
  display:grid;grid-template-columns:210px minmax(0,1fr);gap:28px;
  padding:26px 28px;background:var(--accent-wash);
  border:1px solid var(--hairline);border-radius:var(--r-card);
  margin:0 0 6px;align-items:start;
}""", "intro role")

sub(""".intro-context-row{
  display:grid;grid-template-columns:210px minmax(0,1fr);gap:28px;
  padding:26px 28px;border-bottom:1px solid var(--hairline);align-items:start;
}""",
"""/* Aligned supporting rows: the label on the left, its text on the right, one
   rule between them. */
.intro-context-row{
  display:grid;grid-template-columns:210px minmax(0,1fr);gap:28px;
  padding:24px 2px;border-bottom:1px solid var(--hairline);align-items:start;
}
.intro-context-row:last-child{border-bottom:0}""", "intro context")

sub("""#s1 .rules{
  gap:0;margin:0;background:var(--paper);border-radius:var(--r-card);
  padding:4px 28px;
}""",
"""#s1 .rules{
  gap:0;margin:0;background:var(--canvas);
  border:1px solid var(--hairline);border-radius:var(--r-card);
  padding:4px 28px;
}""", "s1 rules")

sub("#s1 .rule .rn{font-size:28px;line-height:1.1}",
    """/* A numbered marker rather than a numeral floating beside the text. */
#s1 .rule .rn{
  display:grid;place-items:center;
  width:30px;height:30px;border-radius:50%;
  background:var(--accent);color:var(--on-accent);
  font-size:14px;font-weight:600;line-height:1;
}""", "s1 rule number")

# ----------------------------------------------------------------- tables
sub("""  width:100%;max-width:none;overflow-x:auto;margin:0 0 24px;
  background:var(--paper);border-radius:var(--r-card);padding:8px 0;
}""",
"""  /* The card now carries a border, so the header band can run to its edge
     and the radius frames the first and last row instead of clipping them. */
  width:100%;max-width:none;overflow-x:auto;margin:0 0 24px;
  background:var(--paper);border:1px solid var(--hairline);
  border-radius:var(--r-card);padding:0;
}""", "tw")

sub("""th{
  text-align:left;font-family:var(--font-text);font-weight:500;
  font-size:var(--text-micro);letter-spacing:-.12px;color:var(--ink-3);
  padding:16px 20px;border-bottom:1px solid var(--hairline);white-space:nowrap;
}""",
"""/* A pale blue header band, and the same inset on every cell under it. */
th{
  text-align:left;font-family:var(--font-text);font-weight:600;
  font-size:var(--text-micro);letter-spacing:.02em;color:var(--ink-2);
  text-transform:uppercase;background:var(--cool-wash);
  padding:14px 20px;border-bottom:1px solid var(--hairline);white-space:nowrap;
}
thead tr:first-child th:first-child{border-top-left-radius:calc(var(--r-card) - 1px)}
thead tr:first-child th:last-child{border-top-right-radius:calc(var(--r-card) - 1px)}""",
"th")

# ------------------------------------------------------------------ steps
sub(""".steps>li::before{
  content:counter(s);grid-column:1;
  width:32px;height:32px;border-radius:50%;
  background:var(--accent-wash);color:var(--accent);""",
""".steps>li::before{
  content:counter(s);grid-column:1;
  width:32px;height:32px;border-radius:50%;
  background:var(--accent);color:var(--on-accent);
  border:1px solid var(--accent);""", "step marker")

sub(".steps>li:hover::before{background:var(--accent);color:var(--on-accent)}",
    ".steps>li:hover::before{background:var(--accent-deep);border-color:var(--accent-deep)}", "step hover")

# ------------------------------------------------------- comparison fields
sub(".fields{background:var(--paper);border-radius:var(--r-card);overflow:hidden;margin:24px 0}",
    ".fields{background:var(--paper);border:1px solid var(--hairline);\n"
    "  border-radius:var(--r-card);overflow:hidden;margin:24px 0}", "fields")

sub(".field:hover{background:var(--canvas)}", ".field:hover{background:var(--canvas)}", "noop field hover")

# ------------------------------------------------------------ source cards
sub(""".src{
  background:var(--paper);border-radius:var(--r-card);padding:24px;min-width:0;""",
""".src{
  background:var(--paper);border:1px solid var(--hairline);
  border-radius:var(--r-card);padding:24px;min-width:0;""", "src")

# --------------------------------------------------------------- examples
sub(".ex{background:var(--paper);border-radius:var(--r-card);overflow:hidden}",
    ".ex{background:var(--paper);border:1px solid var(--hairline);\n"
    "  border-radius:var(--r-card);overflow:hidden}", "ex")

# --------------------------------------------------------------- checklist
sub(""".chk{display:flex;flex-direction:column;gap:0;background:var(--paper);
  border-radius:var(--r-card);padding:5px}""",
""".chk{display:flex;flex-direction:column;gap:0;background:var(--paper);
  border:1px solid var(--hairline);border-radius:var(--r-card);padding:5px}""", "chk")

# ----------------------------------------------------------------- figures
sub(".shot.filled{display:block;padding:12px;background:var(--paper);max-width:100%;margin:20px 0 0}",
    ".shot.filled{display:block;padding:12px;background:var(--paper);\n"
    "  border:1px solid var(--hairline);border-radius:var(--r-card);\n"
    "  max-width:100%;margin:20px 0 0}", "shot")

# ------------------------------------------------------------- completion
sub("""  padding:clamp(24px,4vw,36px);max-width:none;margin:0;
}""",
"""  padding:clamp(24px,4vw,36px);max-width:none;margin:0;
  border:1px solid var(--hairline);
}""", "cert")

sub(""".gates li{
  background:var(--paper);border-radius:var(--r-card);padding:20px 24px;""",
""".gates li{
  background:var(--paper);border:1px solid var(--hairline);
  border-radius:var(--r-card);padding:20px 24px;""", "gates")

open(p,"w",encoding="utf-8").write(s); print("pass 4 applied")
