<script>
/* =====================================================================
   Live content edits: apply.
   Runs straight after the page markup and before every other script, so
   search, the stacked-table labels and anything else that reads the text
   reads the edited version. doGet replaces the marker below with the edits
   currently live; served without it (a preview, a test) there are none.
   ===================================================================== */
(function(){
  "use strict";
  var LIVE = /*@@LIVE_EDITS@@*/null;
  if(!LIVE || typeof LIVE !== "object") LIVE = {};

  /* What can be edited: text blocks inside the twelve sections. The
     self-test, the completion page and anything the page builds or scores
     are locked, so an edit can change wording but not what is required to
     finish the training or which answer is right. */
  var ROOT_SEL   = "main > section[id]";
  var BLOCK_SEL  = "h2,h3,h4,p,li,td,th,dt,dd,figcaption,.chk .txt";
  var LOCKED_SEL = "#done,#exlist,.qa,.pagenav,nav,.secack,.chkbar,.pathbar," +
                   ".modebar,.filters,.glosfilter,.scorebox,.studynote,.stage," +
                   ".sechead .secnum,.ackbox,.s7jump,.s7fields,button,input";

  /* A blank guide (main[data-edit-template]) is written from the page, so
     everything with a placeholder in it opens up: the page heading, the
     worked examples and their questions, the option buttons and the
     completion page's own wording. Which answer is right stays fixed in the
     markup; only its wording changes. What the page counts or stamps, the
     completion requirements and the training record, stays locked. */
  var TEMPLATE = !!document.querySelector("main[data-edit-template]");
  if(TEMPLATE){
    ROOT_SEL  += ",main > header.mast[id]";
    BLOCK_SEL += ",.ttlname,.ttlqual,.mastmeta .pill,.src .who,.src .applies," +
                 ".ex summary .verdict,.ex summary .example-title,.ansbtn > span,.pathbtn > b,.pathbtn > span";
    LOCKED_SEL = "#gates,.certtitle,.certmsg,.certstamp,.certform,.certacts,.roll,.buildstamp," +
                 ".pagenav,nav,.chkbar,.modebar,.filters,.scorebox,.sechead .secnum,input," +
                 "button:not(.ansbtn):not(.pathbtn)";
  }

  function norm(t){ return (t || "").replace(/\s+/g, " ").trim(); }
  /* FNV-1a, 32 bit. The key only has to be stable for the same wording in
     the same section; it is not a security measure. */
  function hash(s){
    var h = 0x811c9dc5;
    for(var i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ("0000000" + h.toString(16)).slice(-8);
  }

  /* ---- what an edit may contain --------------------------------------
     Every viewer cleans an edit before it reaches the page, whatever the
     server stored. Formatting the guide already uses survives; anything
     else is reduced to its text. */
  var KEEP = {B:1, STRONG:1, I:1, EM:1, CODE:1, KBD:1, Q:1, BR:1, SPAN:1, A:1};
  var SPAN_CLASSES = {col:1, owner:1, you:1, snr:1, auto:1, pathA:1, pathB:1, hidden:1};
  function cleanInto(src, dst){
    for(var n = src.firstChild; n; n = n.nextSibling){
      if(n.nodeType === 3){ dst.appendChild(document.createTextNode(n.nodeValue)); continue; }
      if(n.nodeType !== 1) continue;
      var tag = n.tagName;
      if(!KEEP[tag]){ cleanInto(n, dst); continue; }       /* unwrap */
      var out = document.createElement(tag.toLowerCase());
      if(tag === "SPAN"){
        var cls = (n.getAttribute("class") || "").split(/\s+/).filter(function(c){ return SPAN_CLASSES[c]; });
        if(cls.length) out.setAttribute("class", cls.join(" "));
      }
      if(tag === "A"){
        var href = (n.getAttribute("href") || "").trim();
        if(/^#[A-Za-z0-9_-]+$/.test(href)){
          out.setAttribute("href", href);
          if((n.getAttribute("class") || "").split(/\s+/).indexOf("ref") > -1) out.setAttribute("class", "ref");
        } else if(/^https:\/\/[^\s"'<>`]+$/.test(href)){
          out.setAttribute("href", href);
          out.setAttribute("target", "_blank");
          out.setAttribute("rel", "noopener noreferrer");
        } else { cleanInto(n, dst); continue; }               /* no usable link: keep its text */
        var title = n.getAttribute("title");
        if(title) out.setAttribute("title", title.slice(0, 200));
      }
      if(tag !== "BR") cleanInto(n, out);
      dst.appendChild(out);
    }
  }
  function sanitize(html){
    var doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    var box = document.createElement("div");
    cleanInto(doc.body, box);
    return box.innerHTML;
  }

  /* ---- finding the blocks ------------------------------------------- */
  function isBlock(el){
    if(el.closest(LOCKED_SEL)) return false;
    if(el.querySelector(BLOCK_SEL)) return false;              /* only the innermost */
    return norm(el.textContent).length > 0;
  }
  var original = {};      /* key -> markup as built, so an edit can be undone */
  var byKey = {};
  [].forEach.call(document.querySelectorAll(ROOT_SEL), function(sec){
    var seen = {};
    [].forEach.call(sec.querySelectorAll(BLOCK_SEL), function(el){
      if(!isBlock(el)) return;
      var base = sec.id + ":" + hash(norm(el.textContent));
      seen[base] = (seen[base] || 0) + 1;
      var key = seen[base] > 1 ? base + ":" + seen[base] : base;
      el.setAttribute("data-ek", key);
      original[key] = el.innerHTML;
      byKey[key] = el;
    });
  });

  /* A blank guide repeats some of its wording outside the editable area:
     the title in the top bar and on the sign-in screen, each section's
     heading in the contents bar, each example group on its filter button.
     Those copies follow the edited original rather than being edited twice. */
  function txt(sel, root){ var e = (root || document).querySelector(sel); return e ? norm(e.textContent) : ""; }
  function put(sel, text){
    if(!text) return;
    [].forEach.call(document.querySelectorAll(sel), function(e){ e.textContent = text; });
  }
  function syncCopies(){
    if(!TEMPLATE) return;
    var title = txt("header.mast .ttlname");
    put(".rail .brand .name", title);
    put("#step-home h1", title);
    if(title){
      var gate = document.getElementById("gate");
      if(gate) gate.setAttribute("aria-label", "Sign in to " + title);
    }
    put(".gateeyebrow", txt("header.mast .mastkicker"));
    put("#step-home .gatelede", txt("header.mast .lede"));
    var pills = document.querySelector("#step-home .gatepills");
    if(pills){
      pills.innerHTML = "";
      [].forEach.call(document.querySelectorAll("header.mast .mastmeta .pill"), function(p){
        var g = document.createElement("span");
        g.className = "gatepill";
        g.textContent = norm(p.textContent);
        pills.appendChild(g);
      });
    }
    [].forEach.call(document.querySelectorAll("#toc a[href^='#']"), function(a){
      var sec = document.getElementById(a.getAttribute("href").slice(1));
      var label = a.querySelector("span:last-child");
      var h = sec && sec.querySelector(".sechead h2");
      if(h && label) label.textContent = norm(h.textContent);
    });
    [].forEach.call(document.querySelectorAll("#exfilters .fbtn[data-v]"), function(b){
      var v = b.getAttribute("data-v");
      if(v === "all") return;
      var t = txt('#exlist .ex[data-v="' + v + '"] summary .verdict');
      if(t) b.textContent = t;
    });
  }

  function apply(key, entry){
    var el = byKey[key];
    if(!el) return false;
    if(entry && typeof entry.h === "string"){
      el.innerHTML = sanitize(entry.h);
      el.setAttribute("data-edited", "1");
    } else {
      el.innerHTML = original[key];
      el.removeAttribute("data-edited");
    }
    syncCopies();
    return true;
  }
  Object.keys(LIVE).forEach(function(k){ apply(k, LIVE[k]); });
  syncCopies();

  window.AMQC_EDITS = {
    live: LIVE,
    original: original,
    byKey: byKey,
    sanitize: sanitize,
    apply: apply,
    norm: norm,
    /* edits whose block is no longer on the page: its wording changed in
       a rebuild, or the block was removed */
    orphans: function(){
      return Object.keys(window.AMQC_EDITS.live).filter(function(k){ return !byKey[k]; });
    }
  };
})();
</script>
