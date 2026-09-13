# Wispr pass 6: the chrome surfaces -- header, search modal, onboarding gate,
# lightbox and print -- brought into the same panel language as the document.
# Colour, typography, radius and border only. No transform, opacity, filter,
# clip-path, animation or transition declaration is added, changed or removed.
import re, sys
p = 'site-e.html'
s = open(p, encoding='utf-8').read()

def one(old, new):
    global s
    n = s.count(old)
    if n != 1:
        sys.exit('expected 1 occurrence, found %d: %r' % (n, old[:80]))
    s = s.replace(old, new)

# ---------------------------------------------------------------- header ---
# The rail becomes a panel like every other surface: it sits in the 1248px
# frame, carries the defined blue edge, and rounds its lower corners so it
# reads as a panel hanging from the top of the frame rather than a full-bleed
# strip. It stays flush to the top and keeps sticky/top:0, so nothing about
# how it scrolls, sticks or measures changes -- --head-h is untouched and
# every scroll-margin landing still resolves the same way.
one("""ail{
  position:sticky;top:0;z-index:40;
  background:var(--nav-elevated);
  backdrop-filter:saturate(180%) blur(20px);
  -webkit-backdrop-filter:saturate(180%) blur(20px);
  border-bottom:1px solid var(--hairline);
}""",
    """ail{
  position:sticky;top:0;z-index:40;
  width:100%;max-width:1248px;margin:0 auto;
  background:var(--nav-elevated);
  backdrop-filter:saturate(180%) blur(20px);
  -webkit-backdrop-filter:saturate(180%) blur(20px);
  border:1px solid var(--edge-strong);border-top:0;
  border-radius:0 0 var(--r-panel) var(--r-panel);
  overflow:hidden;
}""")

# The rail is now the width constraint, so the inner rows stop imposing a
# second, narrower one of their own.
one(""".railinner{
  max-width:1200px;margin:0 auto;
  padding:0 clamp(16px,2.2vw,28px);""",
    """.railinner{
  max-width:none;margin:0 auto;
  padding:0 clamp(20px,2.6vw,34px);""")

one(".raillocal{\n  border-top:1px solid var(--hairline);",
    ".raillocal{\n  border-top:1px solid var(--hairline);\n  background:var(--cool-wash);")

# The fades that mark the section strip's overflow have to match the strip's
# own ground, which is now the cool wash rather than the elevated nav plate.
one("nav::before{left:0;background:linear-gradient(to right,var(--nav-elevated),transparent)}\n"
    "nav::after{right:0;background:linear-gradient(to left,var(--nav-elevated),transparent)}",
    "nav::before{left:0;background:linear-gradient(to right,var(--cool-wash),transparent)}\n"
    "nav::after{right:0;background:linear-gradient(to left,var(--cool-wash),transparent)}")

# ---------------------------------------------------------- search modal ---
# The dialog is a large surface, so it takes the panel radius and the same
# hairline the panels carry; the scrim is the palette's deep navy rather than
# a neutral grey.
one("  background:rgba(12,22,29,.34);\n"
    "  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);",
    "  background:rgba(0,34,56,.42);\n"
    "  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);")
one(".smodal{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(12,22,29,.55)}",
    ".smodal{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(0,34,56,.62)}")
one("  background:var(--paper);border-radius:var(--r-card);\n"
    "  box-shadow:0 1px 2px rgba(8,24,44,.06),0 40px 90px -40px rgba(8,24,44,.45);\n"
    "  padding:20px;",
    "  background:var(--paper);border:1px solid var(--hairline);\n"
    "  border-radius:var(--r-panel);\n"
    "  box-shadow:0 1px 2px rgba(8,24,44,.06),0 40px 90px -40px rgba(0,34,56,.45);\n"
    "  padding:clamp(20px,2.2vw,28px);")
# The pill is the dialog's own title, so it is set in the display face at the
# same weight the section numbers use.
one("  font-family:var(--font-text);font-weight:500;font-size:var(--text-micro);\n"
    "  color:var(--on-accent);background:var(--ink);\n"
    "  padding:7px 16px;border-radius:var(--r-pill);",
    "  font-family:var(--font-display);font-weight:600;font-size:var(--text-micro);\n"
    "  letter-spacing:.02em;\n"
    "  color:var(--on-accent);background:var(--accent);\n"
    "  padding:7px 16px;border-radius:var(--r-pill);")
# The field carries the defined blue edge rather than a full-strength ink one.
one("  border:1px solid var(--ink);border-radius:var(--r-link);\n"
    "  background:var(--canvas);color:var(--ink);",
    "  border:1px solid var(--edge-strong);border-radius:var(--r-card);\n"
    "  background:var(--canvas);color:var(--ink);")
one(".sfield:focus{outline:none;border-color:var(--accent)}",
    ".sfield:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-wash)}")
one(".sitem:hover,.sitem.on{background:var(--cool-wash)}",
    ".sitem:hover,.sitem.on{background:var(--cool-wash)}\n"
    ".sitem.on{box-shadow:inset 0 0 0 1px var(--hairline)}")

# ------------------------------------------------------------------ gate ---
# The entry card is the first panel a reader sees, so it is the panel shape
# and the masthead's serif, not a second visual language of its own.
one("""  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:var(--r-card);
  padding:clamp(30px,5vw,46px);
  text-align:center;color:var(--ink);
  box-shadow:0 1px 2px rgba(8,24,44,.05),0 22px 50px -34px rgba(8,24,44,.35);""",
    """  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:var(--r-panel);
  padding:clamp(34px,5.4vw,52px);
  text-align:center;color:var(--ink);
  box-shadow:0 1px 2px rgba(8,24,44,.05),0 22px 50px -34px rgba(0,34,56,.35);""")
one(""".gatecard h1{
  font-family:var(--font-display);font-weight:600;
  font-size:clamp(25px,3.2vw,var(--text-subheading));
  line-height:1.13;letter-spacing:.128px;margin:0 0 10px;color:var(--ink);
}""",
    """.gatecard h1{
  font-family:var(--font-serif);font-weight:400;
  font-size:clamp(30px,4vw,42px);
  line-height:1.06;letter-spacing:-.008em;margin:0 0 10px;color:var(--ink);
}""")
one(""".gatename{
  font-family:var(--font-display);font-weight:600;
  font-size:clamp(23px,3vw,29px);line-height:1.2;margin:0 0 4px;color:var(--ink);
}""",
    """.gatename{
  font-family:var(--font-serif);font-weight:400;
  font-size:clamp(28px,3.6vw,38px);line-height:1.1;letter-spacing:-.008em;
  margin:0 0 4px;color:var(--ink);
}""")

# -------------------------------------------------------------- lightbox ---
one(".lbox{\n  position:fixed;inset:0;z-index:200;background:rgba(8,16,24,.86);",
    ".lbox{\n  position:fixed;inset:0;z-index:200;background:rgba(0,26,43,.88);")
one(".lbox img{max-width:100%;max-height:100%;width:auto;border-radius:var(--r-link);\n"
    "  box-shadow:0 30px 80px -30px rgba(0,0,0,.7)}",
    ".lbox img{max-width:100%;max-height:100%;width:auto;border-radius:var(--r-card);\n"
    "  box-shadow:0 30px 80px -30px rgba(0,0,0,.7)}")

# ----------------------------------------------------------------- print ---
# Panels are a screen device. On paper the borders and the 40px radius are
# noise, so every surface flattens back to plain stacked prose.
one("  .rail{position:static;background:none;border:0;backdrop-filter:none}",
    "  .rail{position:static;background:none;border:0;border-radius:0;\n"
    "        max-width:none;overflow:visible;backdrop-filter:none}")
one("  section{padding:26px 0;background:none !important}",
    "  section{padding:26px 0;background:none !important;border:0 !important;border-radius:0 !important}\n"
    "  .mast{padding:0 0 22px;background:none !important;border:0 !important;border-radius:0 !important}\n"
    "  .main{max-width:none;padding:0}\n"
    "  .sdialog,.gatecard{box-shadow:none;border:0}")

open(p, 'w', encoding='utf-8').write(s)
print('w6 applied')
