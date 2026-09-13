# -*- coding: utf-8 -*-
"""Wispr pass 1: the two faces, and the colour and type tokens they sit on."""
import sys, base64, pathlib
p="site-e.html"; s=open(p,encoding="utf-8").read()
def sub(old,new,why):
    global s
    if old not in s: sys.exit("NOT FOUND (%s):\n%s"%(why,old[:200]))
    if s.count(old)!=1: sys.exit("%d matches (%s)"%(s.count(old),why))
    s=s.replace(old,new,1)

gar=base64.b64encode(pathlib.Path("/tmp/EBGaramondVF.woff2").read_bytes()).decode()
fig=base64.b64encode(pathlib.Path("/tmp/FigtreeVF.woff2").read_bytes()).decode()

# ------------------------------------------------------------------- faces
sub("@font-face{\n  font-family:'Caveat';",
"""/* Both faces are variable and carry their whole weight range in one latin
   subset, embedded rather than linked so the page still makes no external
   request. Apps Script serves one static file; a <link> to Google Fonts
   would be a request this page has never made. */
@font-face{
  font-family:'EB Garamond';
  font-style:normal;
  font-weight:400 600;
  font-display:swap;
  src:url(data:font/woff2;base64,%s) format('woff2');
}
@font-face{
  font-family:'Figtree';
  font-style:normal;
  font-weight:400 700;
  font-display:swap;
  src:url(data:font/woff2;base64,%s) format('woff2');
}
@font-face{
  font-family:'Caveat';""" % (gar, fig), "faces")

# ------------------------------------------------------------------ colour
sub("""  --wash-a:#EAF2F8;   /* Monash blue at ~6%, top left  */
  --wash-b:#F8FAFC;   /* the ground, near white        */
  --wash-c:#DEEBF5;   /* Monash blue at ~12%, top right */

  /* --- surfaces and ink ------------------------------------------------- */
  --ink:#1d1d1f;
  --ink-2:#474747;
  --ink-3:#707070;
  --hairline:#d6d6d6;
  --paper:#ffffff;
  --canvas:#f5f5f7;
  --band:rgba(255,255,255,.72);
  --cool-wash:#e8e8ed;
  --nav-elevated:#fafafc;
  --r-badge:36px;

  /* --- accent. One blue, used for interaction only. --------------------- */
  --accent:#006DAE;
  --accent-deep:#005286;
  --accent-wash:#EAF2F8;
  --on-accent:#ffffff;

  /* --- semantic, kept distinct from the accent -------------------------- */
  --ok:#0B6554;      --ok-wash:#E4F1EC;
  --warn:#8A5A12;    --warn-wash:#FAF0DF;
  --stop:#b64400;    --stop-wash:#FBEAE2;""",
"""  /* The page is one tint; the panels sitting on it are the white. */
  --wash-a:#F1F6FA;
  --wash-b:#F1F6FA;
  --wash-c:#E8F1F8;

  /* --- surfaces and ink ------------------------------------------------- */
  --ink:#102E42;
  --ink-2:#3A5164;
  --ink-3:#526572;
  --hairline:#C5D6E2;
  --edge-strong:#0B4B70;
  --paper:#FFFFFF;
  --canvas:#F7FAFC;
  --band:transparent;
  --cool-wash:#E0EFF8;
  --deep:#003F66;            /* the two dark sections */
  --on-deep:#FFFFFF;
  --nav-elevated:#FFFFFF;
  --r-badge:36px;

  /* --- accent. One blue, used for interaction only. --------------------- */
  --accent:#006DAE;
  --accent-deep:#00537F;
  --accent-wash:#E0EFF8;
  --on-accent:#ffffff;

  /* --- semantic, kept distinct from the accent -------------------------- */
  --ok:#0B6554;      --ok-wash:#DFEFE9;
  --warn:#8A5A12;    --warn-wash:#F8EEDC;
  --stop:#B64400;    --stop-wash:#FAE7DE;""", "light palette")

# -------------------------------------------------------------------- type
sub("""  --font-display:'SF Pro Display',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  --font-text:'SF Pro Text',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;""",
"""  /* Garamond carries the page title and the section headings only. Figtree
     is everything else, including the supporting headings, so --font-display
     stays the name every component already asks for. */
  --font-serif:'EB Garamond',Georgia,'Times New Roman',serif;
  --font-display:'Figtree',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  --font-text:'Figtree',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;""",
"font tokens")

sub("""  --text-micro:clamp(12px,0.14vw + 10px,14px);
  --text-caption:clamp(14px,0.19vw + 11.3px,17px);
  --text-body-sm:clamp(17px,0.28vw + 13px,20px);
  --text-body:clamp(21px,0.33vw + 16.2px,25px);
  --text-body-lg:clamp(28px,0.42vw + 22px,33px);
  --text-subheading:clamp(32px,0.47vw + 25.2px,38px);
  --text-heading-sm:clamp(40px,0.6vw + 31.4px,48px);
  --text-heading:56px;
  --text-heading-lg:80px;
  --text-display:96px;""",
"""  /* Editorial scale: a large serif title, section headings well clear of
     it, and body copy back at a reading size. */
  --text-micro:clamp(13px,0.08vw + 12px,14px);
  --text-caption:clamp(14px,0.1vw + 13px,15px);
  --text-body-sm:clamp(16px,0.16vw + 14.5px,18px);
  --text-body:clamp(17px,0.2vw + 15.2px,19px);
  --text-body-lg:clamp(20px,0.4vw + 16.5px,24px);
  --text-subheading:clamp(24px,0.7vw + 17.6px,30px);
  --text-heading-sm:clamp(36px,1.7vw + 20.7px,52px);
  --text-heading:56px;
  --text-heading-lg:clamp(60px,4.6vw + 15.8px,96px);
  --text-display:96px;""", "type scale")

# ------------------------------------------------------- panel geometry bits
sub("  --r-card:28px;\n  --r-link:10px;",
    "  --r-panel:40px;          /* the section panels */\n"
    "  --r-card:20px;           /* everything inside one */\n"
    "  --r-link:12px;", "radii")

open(p,"w",encoding="utf-8").write(s); print("pass 1 applied")
