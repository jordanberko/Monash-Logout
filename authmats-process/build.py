"""Build a deployable Apps Script folder from a source page.

    python3 build.py SOURCE OUT_DIR CODE_GS [--no-edit]

SOURCE   the page source, such as site-e.html
OUT_DIR  receives Index.html, Code.gs and appsscript.json
CODE_GS  the server script to ship with it. Use the deployed Code.gs: the
         template in make_appsscript.py predates the versioned training
         record and the feedback form, and the page refuses to record
         against it.

Live content editing is added unless --no-edit is given. Nothing here
deploys.
"""
import datetime, hashlib, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent

DOCTYPE = """<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
"""

# The artifact host supplied a small reset. Apps Script does not, so add it.
RESET = """
html{-webkit-text-size-adjust:100%}
body{margin:0}
img{max-width:100%;height:auto;display:block}
[hidden]{display:none !important}
"""

# The screenshot slots, as deployed in build 2026-09-23.86bc41.
SHOTS_JS = "\n" + r"""<script>
/* ---------------------------------------------------------------------------
   SCREENSHOTS
   ---------------------------------------------------------------------------
   To add a screenshot:
     1. Upload the image to a Drive folder the same people can open.
     2. Share that folder with the same audience as this web app.
     3. Copy the file ID out of the Drive link. In
        https://drive.google.com/file/d/1AbC...XyZ/view
        the ID is the part between /d/ and /view.
     4. Paste it between the quotes below, against the matching SS number.
   Leave an entry empty and its dashed placeholder stays on the page.
--------------------------------------------------------------------------- */
/* Set this to true before the page goes to new staff, so any slot that has
   no image yet is hidden instead of showing its capture brief. Leave it
   false while the screenshots are still being collected. */
var HIDE_EMPTY_SHOTS = false;

var SHOTS = {
  "SS-01": "",
  "SS-02": "",
  "SS-03": "",
  "SS-04": "",
  "SS-05": "",
  "SS-06": "",
  "SS-07": "",
  "SS-08": "",
  "SS-09": "",
  "SS-10": "",
  "SS-11": "",
  "SS-12": "",
  "SS-13": "",
  "SS-14": "",
  "SS-15": "",
  "SS-16": "",
  "SS-17": "",
  "SS-18": "",
  "SS-19": "",
  "SS-20": ""
};

(function(){
  "use strict";
  var slots = [].slice.call(document.querySelectorAll(".shot"));
  slots.forEach(function(slot){
    var refEl = slot.querySelector(".ref");
    var capEl = slot.querySelector("p");
    if(!refEl || !capEl) return;
    var ref = refEl.textContent.trim();
    var id = (SHOTS[ref] || "").trim();
    if(!id){
      if(HIDE_EMPTY_SHOTS && slot.classList.contains("brief")) slot.hidden = true;
      return;
    }

    var fig = document.createElement("figure");
    fig.className = "shot filled";
    fig.style.margin = "12px 0 0";

    var img = document.createElement("img");
    img.src = "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w1600";
    img.alt = ref + ". " + capEl.textContent.trim();
    img.loading = "lazy";
    /* If the image cannot load, fall back to the dashed placeholder rather
       than leaving a broken frame on the page. */
    img.addEventListener("error", function(){
      if(fig.parentNode) fig.parentNode.replaceChild(slot, fig);
    });

    var cap = document.createElement("figcaption");
    var r = document.createElement("span");
    r.className = "ref";
    r.textContent = ref;
    var t = document.createElement("span");
    t.textContent = capEl.textContent.trim();
    cap.appendChild(r);
    cap.appendChild(t);

    fig.appendChild(img);
    fig.appendChild(cap);
    slot.parentNode.replaceChild(fig, slot);
  });
})();
</script>
"""


def index_from(src):
    k = src.index("</style>") + len("</style>")
    head, body = src[:k], src[k:]
    head = head.replace("</style>", RESET + "</style>")
    stamp = "Build %s.%s" % (datetime.date.today().strftime("%Y-%m-%d"),
                             hashlib.sha1(src.encode()).hexdigest()[:6])
    assert body.count("@@BUILD@@") == 1, "expected one @@BUILD@@"
    body = body.replace("@@BUILD@@", stamp)
    index = DOCTYPE + head + "</head>\n<body>\n" + body.strip() + "\n" + SHOTS_JS + "\n</body>\n</html>\n"
    head_part = index[:index.index("</head>")]
    for tag in ("<header", "<div", "<main", "<section"):
        assert tag not in head_part, "markup leaked into <head>: " + tag
    return index, stamp


def main(argv):
    edit = "--no-edit" not in argv
    args = [a for a in argv if a != "--no-edit"]
    source, out, code = (pathlib.Path(a) for a in args[:3])
    index, stamp = index_from(source.read_text(encoding="utf-8"))
    plain = out if not edit else out.with_name(out.name + "-plain")
    plain.mkdir(parents=True, exist_ok=True)
    (plain / "Index.html").write_text(index, encoding="utf-8")
    (plain / "Code.gs").write_text(code.read_text(encoding="utf-8"), encoding="utf-8")
    (plain / "appsscript.json").write_text((HERE / "appsscript" / "appsscript.json").read_text(encoding="utf-8"), encoding="utf-8")
    if edit:
        subprocess.run([sys.executable, str(HERE / "editmode" / "integrate.py"), str(plain), str(out)], check=True)
    print(stamp, "->", out)


if __name__ == "__main__":
    main(sys.argv[1:])
