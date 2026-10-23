"""site-e.html -> blank/site-blank.html: the same design and layout, no content.

The stylesheet and the scripts are copied from site-e.html unchanged, so the
blank guide looks and behaves exactly like the real one. Only the wording is
replaced, with placeholder prompts that say what belongs in each spot.

The page is marked as a template (main[data-edit-template]), which tells live
editing to open up everything with a placeholder in it, not only the wording
inside the sections. See editmode/README.md.

    python3 make_blank.py           # writes blank/site-blank.html
    python3 make_blank.py --force   # overwrites one that already exists

Once someone starts filling the blank in, it is their source. Running this
again would wipe their work, so it refuses unless told to.
"""
import pathlib, re, sys, urllib.parse

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "site-e.html"
OUT = HERE / "blank" / "site-blank.html"

TITLE = "Guide title"

if OUT.exists() and "--force" not in sys.argv:
    sys.exit("%s already exists. Pass --force to overwrite it." % OUT.relative_to(HERE))

src = SRC.read_text(encoding="utf-8")
css_end = src.index("</style>") + len("</style>")
body_start = src.index("<script", css_end)
head, old_body, scripts = src[:css_end], src[css_end:body_start], src[body_start:]

# The Monash lockups are embedded images. Reuse them rather than copying the
# base64 into this file.
lockups = re.findall(r'<img class="lockup"[^>]*><img class="lockup rev"[^>]*>', old_body)
assert len(lockups) == 2, "expected the gate and rail lockups, found %d" % len(lockups)


def placeholder(w, h):
    """A dashed screenshot frame, sized like the real figures."""
    fs = max(18, round(w / 40))
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">'
           '<rect x="2" y="2" width="%d" height="%d" rx="12" fill="#EEF3F7" stroke="#9FB3C2" '
           'stroke-width="3" stroke-dasharray="12 9"/>'
           '<text x="50%%" y="50%%" fill="#5B7080" font-family="Helvetica, Arial, sans-serif" '
           'font-size="%d" text-anchor="middle" dominant-baseline="middle">Screenshot</text></svg>'
           ) % (w, h, w, h, w - 4, h - 4, fs)
    return "data:image/svg+xml;charset=utf-8," + urllib.parse.quote(svg, safe="")


BODY = r"""

<div class="smodal" id="smodal" hidden>
  <div class="sdialog" role="dialog" aria-modal="true" aria-labelledby="stitle">
    <div class="shead">
      <span class="spill" id="stitle">Search</span>
      <button class="sclose" id="sclose" type="button" aria-label="Close search">&#10005;</button>
    </div>
    <label class="svisually" for="sinput">Search this guide</label>
    <input class="sfield" id="sinput" type="text" autocomplete="off" spellcheck="false"
           placeholder="Search sections, headings and anything on the page..."
           role="combobox" aria-expanded="true" aria-controls="sresults" aria-autocomplete="list">
    <div class="sresults" id="sresults" role="listbox" aria-label="Search results"></div>
    <button class="smore hidden" id="smore" type="button">See more search results <span aria-hidden="true">&#8594;</span></button>
  </div>
</div>

<div class="lbox" id="lbox" role="dialog" aria-modal="true" aria-label="Screenshot, full size">
  <button class="lclose" type="button" id="lclose">Close</button>
  <img alt="">
</div>

<div class="gate" id="gate" role="dialog" aria-modal="true" aria-label="Sign in to @@TITLE@@">
  <div class="gatecard">
    @@LOCKUP_GATE@@

    <!-- 1. who are you -->
    <div class="gatestep on" id="step-who">
      <p class="gateeyebrow">Team name</p>
      <h1>Before you start</h1>
      <p class="gatelede">We record training completions against a name, so please confirm this is you.</p>
      <p class="gatename" id="whoName">Checking your account</p>
      <p class="gatemail" id="whoMail">&nbsp;</p>
      <button class="gatebtn" type="button" id="whoYes" disabled>Yes, this is my account</button>
      <button class="gatealt" type="button" id="whoNo">Not you?</button>
    </div>

    <!-- 1c. wrong account -->
    <div class="gatestep" id="step-switch">
      <p class="gateeyebrow">Team name</p>
      <h1>Switch account</h1>
      <p class="gatelede">This page identifies you from the Monash Google account you are signed in to. It cannot be changed here.</p>
      <p class="gatelede">Sign out of Google, or open this link in a private window, then sign in as yourself and return.</p>
      <button class="gatebtn" type="button" id="switchBack">Back</button>
    </div>

    <!-- 1b. type a name instead -->
    <div class="gatestep" id="step-name">
      <p class="gateeyebrow">Team name</p>
      <h1>Who are you?</h1>
      <p class="gatelede">We could not read a Monash Google account for this session. A name typed here is recorded as <strong>unverified</strong>, so sign in with your Monash account if you can.</p>
      <input class="gateinput" id="nameField" type="text" placeholder="First and last name" autocomplete="name" maxlength="60">
      <button class="gatebtn" type="button" id="nameGo">Continue</button>
      <button class="gatealt hidden" type="button" id="nameBack">Back</button>
    </div>

    <!-- 2. homepage -->
    <div class="gatestep" id="step-home">
      <p class="gateeyebrow">Team name</p>
      <h1>@@TITLE@@</h1>
      <p class="gatename" id="homeHi" style="font-size:17px;font-weight:400;color:var(--ink-2);margin-bottom:22px">&nbsp;</p>
      <div class="gatedone hidden" id="homeDone"></div>
      <p class="gatelede">One or two sentences on what this guide teaches and who it is for.</p>
      <div class="gatepills">
        <span class="gatepill">Time to complete</span>
        <span class="gatepill">12 sections</span>
        <span class="gatepill">3 question self-test</span>
      </div>
      <button class="gatebtn" type="button" id="homeGo">Start the training</button>
      <button class="gatealt" type="button" id="homeSwitch">Not you?</button>
      <p class="gatemeta" id="homeVerified"></p>
      <p class="gatemeta">Your progress is saved in this browser as you go, so you can stop and come back.</p>
    </div>
  </div>
</div>

<header class="rail">
 <div class="railinner">
  <a class="brand" id="tohome" href="#top" aria-label="Back to the top of the guide">
    @@LOCKUP_RAIL@@
    <span class="name">@@TITLE@@</span>
  </a>
  <div class="railutil">
    <button class="searchbtn" id="searchbtn" type="button" aria-label="Search this guide" aria-keyshortcuts="Meta+K Control+K">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>
      <span class="slabel">Search</span>
      <kbd id="skey">&#8984;K</kbd>
    </button>
    <button class="themebtn" id="theme" type="button" aria-label="Switch to dark mode">Light</button>
  </div>
 </div>
 <div class="raillocal"><div class="railinner">
  <nav>
    <ol id="toc">
      <li><a href="#s1"><span class="n">01</span><span>Section one</span></a></li>
      <li><a href="#s2"><span class="n">02</span><span>Section two</span></a></li>
      <li><a href="#s3"><span class="n">03</span><span>Section three</span></a></li>
      <li><a href="#s4"><span class="n">04</span><span>Section four</span></a></li>
      <li><a href="#s5"><span class="n">05</span><span>Section five</span></a></li>
      <li><a href="#s6"><span class="n">06</span><span>Section six</span></a></li>
      <li><a href="#s7"><span class="n">07</span><span>Section seven</span></a></li>
      <li><a href="#s8"><span class="n">08</span><span>Section eight</span></a></li>
      <li><a href="#s9"><span class="n">09</span><span>Section nine</span></a></li>
      <li><a href="#s10"><span class="n">10</span><span>Section ten</span></a></li>
      <li><a href="#s11"><span class="n">11</span><span>Section eleven</span></a></li>
      <li><a href="#s12"><span class="n">12</span><span>Section twelve</span></a></li>
      <li><a href="#done"><span class="n">13</span><span>Complete</span></a></li>
    </ol>
  </nav>
 </div></div>
 <div class="readbar" aria-hidden="true"><i id="readfill"></i></div>
</header>
<div class="shell">
<main class="main" data-edit-template>
<header class="mast" id="mast">
  <p class="mastkicker">Team name</p>
  <h1><span class="ttlname">@@TITLE@@</span> <span class="ttlqual">&middot; Subtitle</span></h1>
  <p class="lede">One or two sentences on what this guide helps someone do.</p>
  <div class="mastmeta">
    <span class="pill">Time to complete</span>
    <span class="pill">12 sections</span>
    <span class="pill">4 worked examples</span>
    <span class="pill">3 question self-test</span>
  </div>
</header>

<!-- 1 -->
<section id="s1">
<div class="content-inner">
  <div class="sechead"><span class="secnum">01</span><h2>Section one</h2></div>
  <p class="secsub">One line on what this section covers.</p>

  <p>Opening paragraph. Say what the process is and why it matters.</p>

  <div class="intro-overview">
    <p class="intro-lead">A short lead-in line.</p>
    <div class="intro-failures">
      <p><strong>First point in bold,</strong> then the rest of the sentence.</p>
      <p>Second point, with <strong>the key phrase in bold.</strong></p>
    </div>
    <p class="intro-bridge">A closing line that ties the two points together.</p>
  </div>

  <div class="intro-role">
    <h3>Subheading</h3>
    <p>A paragraph that sets out the main idea. <strong>Bold the phrase that matters most.</strong> <span class="intro-condition">An optional qualifying sentence.</span></p>
  </div>

  <div class="intro-context">
    <div class="intro-context-row">
      <h3>Row heading</h3>
      <div>
        <p>First paragraph for this row.</p>
        <p>Second paragraph, with a link to <a href="#s12">section 12</a>.</p>
      </div>
    </div>
    <div class="intro-context-row">
      <h3>Row heading</h3>
      <div>
        <p>First paragraph for this row. An inline tag looks like <span class="col">Tag</span>.</p>
        <p>Second paragraph for this row.</p>
      </div>
    </div>
    <div class="intro-context-row">
      <h3>Row heading</h3>
      <p>A single paragraph for this row, with a <a href="#s1">link</a>.</p>
    </div>
  </div>

  <div class="rules">
    <div class="rule"><span class="rn">1</span><p><b>First rule, in a few words.</b> <span class="intro-rule-copy">A sentence or two explaining the rule.</span></p></div>
    <div class="rule"><span class="rn">2</span><p><b>Second rule, in a few words.</b> <span class="intro-rule-copy">A sentence or two explaining the rule.</span></p></div>
  </div>
</div>
</section>

<!-- 2 -->
<section id="s2">
<div class="content-inner">
  <div class="sechead"><span class="secnum">02</span><h2>Section two</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <div class="tw"><table>
    <thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody>
    <tr><td>Term</td><td>Definition. Add a row for each term, in alphabetical order.</td></tr>
    <tr><td>Term</td><td>Definition, with a link to <a href="#s4">section 4</a> where it helps.</td></tr>
    <tr><td>Term</td><td>Definition. <code>Code style</code> suits exact values someone will type or select.</td></tr>
    <tr><td>Term</td><td>Definition.</td></tr>
  </tbody></table></div>
</div>
</section>

<!-- 3 -->
<section id="s3">
<div class="content-inner">
  <div class="sechead"><span class="secnum">03</span><h2>Section three</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <div class="sources">
    <div class="src">
      <span class="who">Short label</span>
      <h4>Card title</h4>
      <p>Two or three sentences describing this item.</p>
      <span class="applies"><b>Applies to</b> where or when it applies</span>
    </div>
    <div class="src">
      <span class="who">Short label</span>
      <h4>Card title</h4>
      <p>Two or three sentences describing this item.</p>
      <span class="applies"><b>Applies to</b> where or when it applies</span>
    </div>
    <div class="src">
      <span class="who">Short label</span>
      <h4>Card title</h4>
      <p>Two or three sentences describing this item.</p>
      <span class="applies"><b>Applies to</b> where or when it applies</span>
    </div>
  </div>
  <div class="note key"><p><b>Key point</b>A note that needs to stand out from the text around it.</p></div>

  <h3>Subheading</h3>
  <p class="col-read">A paragraph introducing the table below.</p>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label<br><span style="font-weight:400;color:var(--ink-3);font-size:13px">Optional detail line</span></td><td><strong>Lead in.</strong> Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label<br><span style="font-weight:400;color:var(--ink-3);font-size:13px">Optional detail line</span></td><td><strong>Lead in.</strong> Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
  </tbody></table></div>

  <div class="col-read">
  <h3>Subheading for a set of steps</h3>
  <ol class="steps">
    <li><div><p>First step. Keep each step to one action.</p></div></li>
    <li><div><p>Second step, with a link to <a href="#s7">section 7</a>.</p></div></li>
    <li><div><p>Third step, with a screenshot underneath.</p>
      <figure class="shot filled narrow"><img src="@@PH_NARROW@@" alt="Screenshot placeholder" loading="lazy" width="457" height="365" style="aspect-ratio:457/365"><figcaption><span class="ref">FIG 1</span><span>Caption. Say what the reader should notice, and <b>bold the detail</b> that matters.</span></figcaption></figure>
    </div></li>
  </ol>

  <h3>Subheading for a set of steps</h3>
  <ol class="steps">
    <li><div><p>First step.</p></div></li>
    <li><div><p>Second step, with a wide screenshot underneath.</p>
      <figure class="shot filled wide"><img src="@@PH_WIDE@@" alt="Screenshot placeholder" loading="lazy" width="1400" height="734" style="aspect-ratio:1400/734"><figcaption><span class="ref">FIG 2</span><span>Caption. Say what the reader should notice, and <b>bold the detail</b> that matters.</span></figcaption></figure>
    </div></li>
  </ol>

  <h3>Subheading for a set of steps</h3>
  <p>A short line before the steps.</p>
  <ol class="steps">
    <li><div><p>First step.</p></div></li>
    <li><div><p>Second step, with <em>emphasis</em> where it helps.</p></div></li>
    <li><div><p>Third step.</p></div></li>
  </ol>
  </div>
</div>
</section>

<!-- 4 -->
<section id="s4">
<div class="content-inner">
  <div class="sechead"><span class="secnum">04</span><h2>Section four</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <p class="col-read">A paragraph introducing the table below.</p>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
  </tbody></table></div>
  <div class="note"><p><b>Note title</b>A note that sits alongside the text rather than in it.</p></div>
</div>
</section>

<!-- 5 -->
<section id="s5">
<div class="content-inner">
  <div class="sechead"><span class="secnum">05</span><h2>Section five</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <h3>Subheading <span class="col">Tag</span></h3>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
  </tbody></table></div>
  <figure class="shot filled narrow"><img src="@@PH_NARROW@@" alt="Screenshot placeholder" loading="lazy" width="457" height="365" style="aspect-ratio:457/365"><figcaption><span class="ref">FIG 3</span><span>Caption. Say what the reader should notice.</span></figcaption></figure>

  <div class="note"><p><b>Note title</b>A note that sits alongside the text rather than in it.</p></div>

  <p class="col-read">A paragraph, with a link to <a href="#s9">the worked examples in section 9</a>.</p>

  <h3>Subheading</h3>
  <div class="tw"><table>
    <thead><tr><th style="width:34%">Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label.</td><td>Cell text. <b>Bold the key phrase.</b></td></tr>
    <tr><td>Row label.</td><td>Cell text.</td></tr>
    <tr><td>Row label.</td><td>Cell text.</td></tr>
  </tbody></table></div>
  <div class="note"><p><b>Note title</b>A note that sits alongside the text rather than in it.</p></div>

  <h3>Subheading</h3>
  <p class="col-read">A closing paragraph for this section.</p>
</div>
</section>

<!-- 6 -->
<section id="s6">
<div class="content-inner">
  <div class="sechead"><span class="secnum">06</span><h2>Section six</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <div class="tw"><table>
    <thead><tr><th>Ref</th><th>Description</th><th>Owner</th></tr></thead><tbody>
    <tr><td class="mono">A</td><td>Description of this item.</td><td><span class="owner auto">Label</span></td></tr>
    <tr><td class="mono">B</td><td>Description of this item.</td><td><span class="owner auto">Label</span></td></tr>
    <tr class="you"><td class="mono">C</td><td>A highlighted row, for the items the reader is responsible for.</td><td><span class="owner you">Label</span></td></tr>
    <tr class="you"><td class="mono">D</td><td>A highlighted row, for the items the reader is responsible for.</td><td><span class="owner you">Label</span></td></tr>
    <tr class="snr"><td class="mono">E</td><td>A row owned by someone else.</td><td><span class="owner snr">Label</span></td></tr>
  </tbody></table></div>
  <div class="note key"><p><b>Key point</b>A note that needs to stand out from the text around it.</p></div>
  <figure class="shot filled wide"><img src="@@PH_WIDE@@" alt="Screenshot placeholder" loading="lazy" width="1400" height="734" style="aspect-ratio:1400/734"><figcaption><span class="ref">FIG 4</span><span>Caption. Say what the reader should notice, and <b>bold the detail</b> that matters.</span></figcaption></figure>
</div>
</section>

<!-- 7 -->
<section id="s7">
<div class="content-inner">
  <div class="sechead"><span class="secnum">07</span><h2>Section seven</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <div class="pathbar">
    <button class="pathbtn" id="pA" type="button" aria-pressed="true" data-path="A"><b>Option A</b><span>Short description</span></button>
    <button class="pathbtn" id="pB" type="button" aria-pressed="false" data-path="B"><b>Option B</b><span>Short description</span></button>
  </div>

  <div class="col-read">
  <p>A paragraph introducing the steps. The buttons above switch the wording between two versions of the same process.</p>

  <ol class="steps">
    <li><div><p>A step that applies to both options.</p></div></li>
    <li><div><p>Another shared step. <span class="pathB hidden">Extra wording shown only for option B.</span></p></div></li>
    <li><div><p>A step that points to a figure.</p>
      <p class="seefig">See <b>FIG 1</b> in <a href="#s3">section 3</a>.</p></div></li>
    <li class="pathA"><div><p>A step shown only for option A.</p></div></li>
    <li><div><p>A step whose wording changes: <span class="pathA">wording for option A</span><span class="pathB hidden">wording for option B</span>.</p></div></li>
    <li><div><p>The last step.</p></div></li>
  </ol>

  <h3>Subheading</h3>
  <p class="col-read"><b class="pract">Practice scenario.</b> A line introducing the worked example below.</p>

  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
  </tbody></table></div>

  <p class="col-read">A paragraph between the two tables.</p>

  <div class="tw"><table>
    <thead><tr><th style="width:16%">Ref</th><th>Column heading</th></tr></thead><tbody>
    <tr class="you"><td class="mono">A</td><td>Cell text.</td></tr>
    <tr class="you"><td class="mono">B</td><td>Cell text.</td></tr>
    <tr class="you"><td class="mono">C</td><td>Cell text.</td></tr>
  </tbody></table></div>

  <p class="col-read">A closing paragraph for this part.</p>

  <div class="note pathB hidden"><p><b>Option B only</b>A note shown only when option B is selected.</p></div>

  <div class="pathB hidden">
  <h3>Subheading</h3>
  <ul>
    <li><strong>Point.</strong> Detail, shown only for option B.</li>
    <li><strong>Point.</strong> Detail, shown only for option B.</li>
    <li><strong>Point.</strong> Detail, shown only for option B.</li>
  </ul>
  </div>

  </div>
</div>
</section>

<!-- 8 -->
<section id="s8">
<div class="content-inner">
  <div class="sechead"><span class="secnum">08</span><h2>Section eight</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <p class="col-read">A paragraph introducing the table below.</p>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
  </tbody></table></div>
  <div class="fields">
    <div class="field"><span class="mark" aria-hidden="true"></span><div>
      <h4>Item name</h4>
      <p class="where">Where to find it.</p>
      <p class="miss"><b>Label</b>What to look for, and what counts as a problem.</p></div></div>
    <div class="field"><span class="mark" aria-hidden="true"></span><div>
      <h4>Item name</h4>
      <p class="where">Where to find it.</p>
      <p class="miss"><b>Label</b>What to look for, and what counts as a problem.</p></div></div>
    <div class="field"><span class="mark" aria-hidden="true"></span><div>
      <h4>Item name</h4>
      <p class="where">Where to find it.</p>
      <p class="miss"><b>Label</b>What to look for, and what counts as a problem.</p></div></div>
    <div class="field"><span class="mark" aria-hidden="true"></span><div>
      <h4>Item name</h4>
      <p class="where">Where to find it.</p>
      <p class="miss flag"><b>Always flag</b>A highlighted item, for something that always needs action.</p></div></div>
  </div>

  <h3>Subheading</h3>
  <p class="col-read">A paragraph introducing the table below.</p>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td></tr>
  </tbody></table></div>

  <h3>Subheading</h3>
  <p class="col-read">A paragraph introducing the table below.</p>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td>Cell text.</td></tr>
  </tbody></table></div>
</div>
</section>

<!-- 9 -->
<section id="s9">
<div class="content-inner">
  <div class="sechead"><span class="secnum">09</span><h2>Section nine</h2></div>
  <p class="secsub">One line on what this section covers. Each card below is a worked example, and a card with a question counts towards the self-test.</p>
  <div class="modebar">
    <button class="themebtn" type="button" id="expandall">Expand all</button>
    <div class="segmented" role="group" aria-label="Examples mode">
      <button class="segbtn" type="button" data-mode="ref" aria-pressed="true">Reference</button>
      <button class="segbtn" type="button" data-mode="test" aria-pressed="false">Test yourself</button>
    </div>
    <div class="scorebox hidden" id="scorebox">
      <span class="tally" id="tally">0 / 0</span>
      <span id="tallytxt">answered</span>
      <button type="button" id="resetquiz">Start again</button>
    </div>
  </div>
  <p class="studynote hidden" id="studynote">Read the case, then commit to an answer before you reveal it. Cases with a question are scored.</p>
  <div class="filters" id="exfilters">
    <button class="fbtn" type="button" aria-pressed="true" data-v="all">All</button>
    <button class="fbtn" type="button" aria-pressed="false" data-v="ok">Group one</button>
    <button class="fbtn" type="button" aria-pressed="false" data-v="disc">Group two</button>
    <button class="fbtn" type="button" aria-pressed="false" data-v="esc">Group three</button>
  </div>
  <div class="exlist" id="exlist">

    <details class="ex" data-v="ok" data-scored="1"><summary><span class="verdict ok">Group one</span><span class="example-title">Example title</span><span class="chev">&#9656;</span></summary><div class="exbody"><dl><div><dt>What you see</dt><dd><b class='pract'>Practice scenario.</b> Describe the situation the reader is looking at.</dd></div><div><dt>What to do</dt><dd>Explain the right call, and why it is right.</dd></div></dl></div><div class="qa hidden"><p class="quizq">A question about this example?</p><div class="answers"><button class="ansbtn" type="button" data-o="0" data-correct="1"><span>The correct answer</span></button><button class="ansbtn" type="button" data-o="1"><span>A wrong answer</span></button><button class="ansbtn" type="button" data-o="2"><span>A wrong answer</span></button></div></div></details>

    <details class="ex" data-v="disc" data-scored="1"><summary><span class="verdict disc">Group two</span><span class="example-title">Example title</span><span class="chev">&#9656;</span></summary><div class="exbody"><dl><div><dt>What you see</dt><dd>Describe the situation the reader is looking at.</dd></div><div><dt>What to do</dt><dd>Explain the right call, and why it is right.</dd></div></dl></div><div class="qa hidden"><p class="quizq">A question about this example?</p><div class="answers"><button class="ansbtn" type="button" data-o="1"><span>A wrong answer</span></button><button class="ansbtn" type="button" data-o="0" data-correct="1"><span>The correct answer</span></button><button class="ansbtn" type="button" data-o="2"><span>A wrong answer</span></button></div></div></details>

    <details class="ex" data-v="esc" data-scored="1"><summary><span class="verdict esc">Group three</span><span class="example-title">Example title</span><span class="chev">&#9656;</span></summary><div class="exbody"><dl><div><dt>What you see</dt><dd>Describe the situation the reader is looking at.</dd></div><div><dt>What to do</dt><dd>Explain the right call, and why it is right.</dd></div></dl></div><div class="qa hidden"><p class="quizq">A question about this example?</p><div class="answers"><button class="ansbtn" type="button" data-o="1"><span>A wrong answer</span></button><button class="ansbtn" type="button" data-o="2"><span>A wrong answer</span></button><button class="ansbtn" type="button" data-o="0" data-correct="1"><span>The correct answer</span></button></div></div></details>

    <details class="ex" data-v="ok"><summary><span class="verdict ok">Group one</span><span class="example-title">Example title, reference only</span><span class="chev">&#9656;</span></summary><div class="exbody"><dl><div><dt>What you see</dt><dd>Describe the situation the reader is looking at.</dd></div><div><dt>What to do</dt><dd>Explain the right call. This card has no question, so it is not part of the self-test.</dd></div></dl></div></details>

  </div>
</div>
</section>

<!-- 10 -->
<section id="s10">
<div class="content-inner">
  <div class="sechead"><span class="secnum">10</span><h2>Section ten</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <p class="col-read">A paragraph introducing the table below.</p>
  <div class="tw"><table>
    <thead><tr><th style="width:22%">Column heading</th><th>Column heading</th><th>Owner</th></tr></thead><tbody>
    <tr><td><b>Row label</b></td><td>Cell text.</td><td><span class="owner you">Label</span></td></tr>
    <tr><td><b>Row label</b></td><td>Cell text.</td><td><span class="owner you">Label</span></td></tr>
    <tr><td><b>Row label</b></td><td>Cell text.</td><td><span class="owner snr">Label</span></td></tr>
  </tbody></table></div>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th><th>Ref</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td><td class="mono">A</td></tr>
    <tr><td>Row label</td><td>Cell text.</td><td class="mono">B</td></tr>
  </tbody></table></div>

  <h3>Subheading</h3>
  <p class="col-read">A paragraph introducing the table below.</p>
  <div class="tw"><table>
    <thead><tr><th style="width:24%">Instead of</th><th>Write</th></tr></thead><tbody>
    <tr><td>A weak example</td><td>A strong example.</td></tr>
    <tr><td>A weak example</td><td>A strong example.</td></tr>
  </tbody></table></div>

  <h3>Subheading</h3>
  <p class="col-read">A paragraph. <code>#channel-name</code> shows how a Slack channel or exact value looks.</p>

  <h3>Subheading</h3>
  <p class="col-read">A paragraph introducing what follows.</p>
  <div class="note key"><p><b>Key point</b>A note that needs to stand out from the text around it.</p></div>
  <div class="tw"><table>
    <thead><tr><th style="width:26%">Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td></tr>
  </tbody></table></div>
  <div class="note"><p><b>Note title</b>A note that sits alongside the text rather than in it.</p></div>
</div>
</section>

<!-- 11 -->
<section id="s11">
<div class="content-inner">
  <div class="sechead"><span class="secnum">11</span><h2>Section eleven</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td></tr>
  </tbody></table></div>

  <h3>Subheading</h3>
  <p class="col-read">A paragraph introducing the numbered points below.</p>
  <div class="rules" style="margin-top:18px">
    <div class="rule"><span class="rn">1</span><p>A point, with <b style="display:inline;font-weight:600">the key phrase in bold</b>.</p></div>
    <div class="rule"><span class="rn">2</span><p>A point, with <b style="display:inline;font-weight:600">the key phrase in bold</b>.</p></div>
    <div class="rule"><span class="rn">3</span><p>A point, with <b style="display:inline;font-weight:600">the key phrase in bold</b>.</p></div>
  </div>
  <p class="col-read" style="margin-top:22px">A closing line for this part.</p>

  <h3>Subheading</h3>
  <div class="tw"><table>
    <thead><tr><th>Column heading</th><th>Column heading</th></tr></thead><tbody>
    <tr><td>Row label</td><td>Cell text.</td></tr>
    <tr><td>Row label</td><td>Cell text.</td></tr>
  </tbody></table></div>

  <h3>Subheading</h3>
  <p class="col-read">A closing paragraph for this section.</p>
</div>
</section>

<!-- 12 -->
<section id="s12">
<div class="content-inner">
  <div class="sechead"><span class="secnum">12</span><h2>Section twelve</h2></div>
  <p class="secsub">One line on what this section covers.</p>
  <p class="col-read">A paragraph introducing the checklist. The ticks are kept in this browser only.</p>
  <div class="chkbar" id="chkbar">
    <span class="pct" id="pct">0 of 5</span>
    <span class="bar"><i id="barfill"></i></span>
    <span class="donemsg">Checklist complete</span>
    <button type="button" id="resetchk">Reset</button>
  </div>
  <div class="chk" id="chk">
    <label id="chkrow-c1"><input type="checkbox" data-k="c1"><span class="n">01</span><span class="txt">First step, in one line.</span><span class="ref">&sect;3</span></label>
    <label id="chkrow-c2"><input type="checkbox" data-k="c2"><span class="n">02</span><span class="txt">Second step, in one line.</span><span class="ref">&sect;7</span></label>
    <label id="chkrow-c3"><input type="checkbox" data-k="c3"><span class="n">03</span><span class="txt">Third step, in one line.</span><span class="ref">&sect;8</span></label>
    <label id="chkrow-c4"><input type="checkbox" data-k="c4"><span class="n">04</span><span class="txt">Fourth step, in one line.</span><span class="ref">&sect;10</span></label>
    <label id="chkrow-c5"><input type="checkbox" data-k="c5"><span class="n">05</span><span class="txt">Fifth step, in one line.</span><span class="ref">&sect;11</span></label>
  </div>
</div>
</section>

<!-- completion -->
<section id="done">
<div class="content-inner">
  <p class="doneeyebrow">Training</p>
  <h2>Completion heading</h2>
  <p class="donelede">A paragraph on what completing this training means. The tick below only appears once the three steps are done.</p>

  <ol class="gates" id="gates">
    <li data-gate="read">
      <div class="growtop">
        <span class="gtick">&#10003;</span>
        <div><b>Read the full guide</b><span class="gsub">Every numbered section</span></div>
        <span class="gmeta" data-meta="read">0 of 12</span>
      </div>
      <div class="gmissing" data-missing="read"></div>
    </li>
    <li data-gate="chk">
      <div class="growtop">
        <span class="gtick">&#10003;</span>
        <div><b>Work the checklist</b><span class="gsub">Every step in the checklist</span></div>
        <span class="gmeta" data-meta="chk">0 of 5</span>
      </div>
      <div class="gmissing" data-missing="chk"></div>
    </li>
    <li data-gate="test">
      <div class="growtop">
        <span class="gtick">&#10003;</span>
        <div><b>Pass the self-test</b><span class="gsub">The worked example questions. 85% or more to pass.</span></div>
        <span class="gmeta" data-meta="test">0 of 3</span>
      </div>
      <div class="gmissing" data-missing="test"></div>
    </li>
  </ol>

  <div class="cert" id="cert">
    <svg class="bigtick" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="52"></circle>
      <path d="M38 61 L53 77 L83 44"></path>
    </svg>
    <h3 class="certtitle" id="certtitle">Not finished yet</h3>
    <p class="certmsg" id="certmsg">Work through the three steps above and this will unlock.</p>

    <div class="certform" id="certform">
      <input id="whoami" type="text" placeholder="Your name" autocomplete="name" maxlength="60">
      <button id="confirmdone" type="button" disabled>Confirm completion</button>
    </div>

    <p class="certstamp hidden" id="certstamp"></p>

    <div class="certacts hidden" id="certacts">
      <button type="button" id="printcert">Print this record</button>
      <button type="button" id="clearcert">Start again</button>
    </div>

    <p class="certnote">A note on what this record covers and what to do next. Your tick above is kept in this browser only. Adding your name to the team record below is a separate, deliberate step.</p>
  </div>

  <p class="buildstamp">@@BUILD@@</p>

  <div class="roll" id="roll">
    <div class="rollhead">
      <span class="rollcount" id="rollcount">0</span>
      <span class="rolltitle" id="rolltitle">people have completed this training</span>
    </div>
    <p class="rollsub">Visible to everyone at Monash who opens this page.</p>
    <ul class="rolllist" id="rolllist"></ul>
    <p class="rollempty hidden" id="rollempty">Nobody yet. Be the first.</p>
    <div class="rollact"><button type="button" id="addtoroll" disabled>Add my name to the record</button></div>
    <p class="rollmsg" id="rollmsg"></p>
  </div>
</div>
</section>
</main>
</div>

<div id="standins" hidden aria-hidden="true"></div>
<script>
/* A blank guide can lose any section from the page itself, the self-test
   and the checklist included. The page's scripts expect their controls to
   exist, so a hidden stand-in takes the place of any that are gone, and the
   completion page asks only for what this guide still has. */
(function(){
  var need = {pct:"span", barfill:"i", resetchk:"button", chkbar:"div", chk:"div", scorebox:"div", tally:"span",
              tallytxt:"span", resetquiz:"button", studynote:"p", expandall:"button", exfilters:"div", exlist:"div"};
  var box = document.getElementById("standins");
  Object.keys(need).forEach(function(id){
    if(document.getElementById(id)) return;
    var e = document.createElement(need[id]);
    e.id = id;
    box.appendChild(e);
  });
  var gates = {chk: "main #chk input", test: "main #exlist .ex[data-scored]"};
  Object.keys(gates).forEach(function(k){
    var li = document.querySelector('#gates [data-gate="' + k + '"]');
    if(li && !document.querySelector(gates[k])) li.hidden = true;
  });
})();
</script>


"""

body = (BODY
        .replace("@@TITLE@@", TITLE)
        .replace("@@LOCKUP_GATE@@", lockups[0])
        .replace("@@LOCKUP_RAIL@@", lockups[1])
        .replace("@@PH_NARROW@@", placeholder(457, 365))
        .replace("@@PH_WIDE@@", placeholder(1400, 734)))


def swap(text, old, new):
    """Replace exactly once, so a change to site-e.html fails loudly here
    instead of leaving the old guide's wording in the blank."""
    assert text.count(old) == 1, "expected one %r, found %d" % (old, text.count(old))
    return text.replace(old, new)


head = swap(head, "<title>Authorised Materials QC</title>", "<title>%s</title>" % TITLE)

# The scripts carry a few lines of the old guide's wording.
scripts = swap(scripts, "var PASS_MARK = 12;   /* out of 14 */",
               "var PASS_MARK = Math.ceil(document.querySelectorAll(\"main #exlist .ex[data-scored]\").length * 0.85);"
               "   /* 85%, however many questions the guide has */")
# A guide with no checklist or no self-test can still be completed.
scripts = swap(scripts, "chk :{ ok: boxes.length > 0 && chkDone === boxes.length,",
               "chk :{ ok: chkDone === boxes.length,")
scripts = swap(scripts, "test:{ ok: quizCards.length > 0 && answered === quizCards.length && correct >= PASS_MARK,",
               "test:{ ok: answered === quizCards.length && correct >= PASS_MARK,")
# The line under the completion tick reads the page heading, so it follows
# an edit to the title or team name.
scripts = swap(scripts, '"Authorised Materials QC, Exam Delivery Team."',
               '([".mast .ttlname", ".mast .mastkicker"].map(function(s){'
               ' var e = document.querySelector(s); return e ? e.textContent.trim() : ""; })'
               '.filter(Boolean).join(", ") + ".")')
scripts = swap(scripts, "Try a term like calculator, notes, hybrid, reminder or escalation.",
               "Try a different word.")
# Own storage keys, so a blank guide opened in the same browser as the real
# one does not pick up its progress, ticks or completion.
scripts = scripts.replace("amqc", "guide")

for word in ("Authorised Materials", "eVigilation", "eAssessment", "QC"):
    assert word not in BODY, "old wording left in the blank: " + word
assert "amqc" not in scripts

out = head + body + scripts

OUT.parent.mkdir(exist_ok=True)
OUT.write_text(out, encoding="utf-8")
print("wrote", OUT.relative_to(HERE), len(out), "bytes")
