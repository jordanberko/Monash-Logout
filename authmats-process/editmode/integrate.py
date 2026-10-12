"""Add live content editing to a built Apps Script page.

    python3 editmode/integrate.py IN_DIR OUT_DIR

IN_DIR holds a built Index.html, Code.gs and appsscript.json (the output of
make_appsscript.py). OUT_DIR gets the same three files with editing added.
The input is never changed.
"""
import pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent

def main(src, dst):
    src, dst = pathlib.Path(src), pathlib.Path(dst)
    index = (src / "Index.html").read_text(encoding="utf-8")
    code = (src / "Code.gs").read_text(encoding="utf-8")
    css = (HERE / "edit.css").read_text(encoding="utf-8")
    apply_js = (HERE / "edit-apply.js").read_text(encoding="utf-8")
    ui_js = (HERE / "edit-ui.js").read_text(encoding="utf-8")
    server = (HERE / "Code-edits.gs").read_text(encoding="utf-8")

    assert "@@LIVE_EDITS@@" not in index, "editing is already in this build"
    # styles: the end of the first stylesheet
    i = index.index("</style>")
    index = index[:i] + css + index[i:]
    # the apply step: straight after the guide's markup, before any script reads it
    assert index.count("</main>") == 1, "expected one </main>"
    i = index.index("</main>") + len("</main>")
    index = index[:i] + "\n" + apply_js + index[i:]
    # the interface: last, once everything else on the page exists
    i = index.rindex("</body>")
    index = index[:i] + ui_js + index[i:]

    # serve the page with the live edits written in
    old = "HtmlService.createHtmlOutputFromFile('Index')"
    assert code.count(old) == 1, "expected doGet to serve Index once"
    code = code.replace(old, "HtmlService.createHtmlOutput(indexWithEdits_())")
    code = code.rstrip() + "\n" + server

    dst.mkdir(parents=True, exist_ok=True)
    (dst / "Index.html").write_text(index, encoding="utf-8")
    (dst / "Code.gs").write_text(code, encoding="utf-8")
    manifest = src / "appsscript.json"
    if manifest.exists():
        (dst / "appsscript.json").write_text(manifest.read_text(encoding="utf-8"), encoding="utf-8")
    print("wrote", dst / "Index.html", len(index), "and", dst / "Code.gs", len(code))

if __name__ == "__main__":
    main(*sys.argv[1:3])
