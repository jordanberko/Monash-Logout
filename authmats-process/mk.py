"""site-e.html -> variant-e.html (head/body wrapper + reset block)."""
import sys

SRC = "site-e.html"
OUT = "variant-e.html"

HEAD = """<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
"""

RESET = """
html{-webkit-text-size-adjust:100%}
body{margin:0}
img{max-width:100%;height:auto;display:block}
[hidden]{display:none !important}
"""

def main():
    s = open(SRC, encoding="utf-8").read()
    i = s.index("</style>")
    css, rest = s[:i], s[i:]
    rest = rest.replace("</style>", "</style></head>\n<body>\n", 1)
    out = HEAD + css + RESET + rest + "\n</body>\n</html>\n"
    open(OUT, "w", encoding="utf-8").write(out)
    print("wrote", OUT, len(out), "bytes")

main()
