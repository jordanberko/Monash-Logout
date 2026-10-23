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
  /* screenshots uploaded to a blank guide: {Drive file id: data URL} */
  var IMAGES = /*@@LIVE_IMAGES@@*/null;
  if(!IMAGES || typeof IMAGES !== "object") IMAGES = {};

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

  /* ---- blank guides: whole sections ---------------------------------
     A blank guide is written from the page, so blocks can be added, moved
     and deleted, not only reworded. Each section (and the page heading) is
     saved whole, as "<id>:all", and "page:layout" holds the order of the
     sections. Every viewer cleans a saved section before it reaches the
     page: the guide's own structure survives, anything that could run code
     does not. */
  var UNIT_RE = /^(s\d{1,3}|mast)$/;
  var LAYOUT_KEY = "page:layout";
  var main = document.querySelector("main");
  var doneSec = document.getElementById("done");
  var U_DROP = {SCRIPT:1, STYLE:1, IFRAME:1, FRAME:1, FRAMESET:1, OBJECT:1, EMBED:1, APPLET:1, SVG:1, MATH:1,
                TEMPLATE:1, NOSCRIPT:1, TEXTAREA:1, SELECT:1, LINK:1, META:1, BASE:1, FORM:1, TITLE:1,
                AUDIO:1, VIDEO:1, SOURCE:1, CANVAS:1};
  var U_KEEP = {DIV:1, P:1, H2:1, H3:1, H4:1, UL:1, OL:1, LI:1, TABLE:1, THEAD:1, TBODY:1, TR:1, TH:1, TD:1,
                FIGURE:1, FIGCAPTION:1, IMG:1, DETAILS:1, SUMMARY:1, DL:1, DT:1, DD:1, LABEL:1, BUTTON:1, INPUT:1,
                SPAN:1, B:1, STRONG:1, I:1, EM:1, CODE:1, KBD:1, Q:1, BR:1, A:1};
  var U_IDS = /^(pA|pB|expandall|scorebox|tally|tallytxt|resetquiz|studynote|exfilters|exlist|chkbar|pct|barfill|resetchk|chk|chkrow-[A-Za-z0-9_-]{1,30})$/;
  var U_STYLE = {"width":1, "margin-top":1, "font-weight":1, "font-size":1, "color":1, "display":1, "aspect-ratio":1};
  var IMG_SRC = /^(data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+|data:image\/svg\+xml;charset=utf-8,[A-Za-z0-9%._~!*'()-]*)$/;

  function cleanStyle(v){
    var out = [];
    String(v).split(";").forEach(function(decl){
      var i = decl.indexOf(":");
      if(i < 0) return;
      var k = decl.slice(0, i).trim().toLowerCase(), val = decl.slice(i + 1).trim();
      if(U_STYLE[k] && /^([a-z0-9.%#\s\/-]+|var\(--[a-z0-9-]+\))$/i.test(val)) out.push(k + ":" + val);
    });
    return out.join(";");
  }
  function cleanHref(a){
    var href = (a.getAttribute("href") || "").trim();
    if(/^#[A-Za-z0-9_-]+$/.test(href) || /^https:\/\/[^\s"'<>`]+$/.test(href)) return href;
    return null;
  }
  function cleanUnitInto(src, dst){
    for(var n = src.firstChild; n; n = n.nextSibling){
      if(n.nodeType === 3){ dst.appendChild(document.createTextNode(n.nodeValue)); continue; }
      if(n.nodeType !== 1) continue;
      var tag = n.tagName.toUpperCase();
      if(U_DROP[tag]) continue;
      if(!U_KEEP[tag]){ cleanUnitInto(n, dst); continue; }
      if(tag === "INPUT" && (n.getAttribute("type") || "").toLowerCase() !== "checkbox") continue;
      var href = tag === "A" ? cleanHref(n) : null;
      if(tag === "A" && !href){ cleanUnitInto(n, dst); continue; }
      var out = document.createElement(tag.toLowerCase());
      [].forEach.call(n.attributes, function(a){
        var k = a.name.toLowerCase(), v = a.value;
        if(k === "class"){
          var cls = v.split(/\s+/).filter(function(c){ return /^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(c) && !/^ed/.test(c); });
          if(cls.length) out.setAttribute("class", cls.join(" "));
        }
        else if(k === "id"){ if(U_IDS.test(v)) out.setAttribute("id", v); }
        else if(/^data-(v|scored|o|correct|k|path|mode|img)$/.test(k)){ if(/^[A-Za-z0-9_-]{0,100}$/.test(v)) out.setAttribute(k, v); }
        else if(k === "aria-pressed" || k === "aria-hidden"){ if(v === "true" || v === "false") out.setAttribute(k, v); }
        else if(k === "aria-label" || k === "title"){ out.setAttribute(k, v.slice(0, 200)); }
        else if(k === "role"){ if(v === "group") out.setAttribute(k, v); }
        else if(k === "style"){ var st = cleanStyle(v); if(st) out.setAttribute("style", st); }
        else if(tag === "IMG" && k === "src"){ if(IMG_SRC.test(v)) out.setAttribute("src", v); }
        else if(tag === "IMG" && (k === "width" || k === "height")){ if(/^\d{1,5}$/.test(v)) out.setAttribute(k, v); }
        else if(tag === "IMG" && k === "alt"){ out.setAttribute(k, v.slice(0, 300)); }
      });
      if(tag === "BUTTON") out.setAttribute("type", "button");
      if(tag === "INPUT") out.setAttribute("type", "checkbox");
      if(tag === "IMG") out.setAttribute("loading", "lazy");
      if(tag === "A"){
        out.setAttribute("href", href);
        if(href.charAt(0) !== "#"){ out.setAttribute("target", "_blank"); out.setAttribute("rel", "noopener noreferrer"); }
      }
      if(tag !== "BR" && tag !== "IMG" && tag !== "INPUT") cleanUnitInto(n, out);
      dst.appendChild(out);
    }
  }
  function sanitizeUnit(html){
    var doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    var box = document.createElement("div");
    cleanUnitInto(doc.body, box);
    return box.innerHTML;
  }
  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function sectionIds(){
    return [].filter.call(document.querySelectorAll("main > section[id]"), function(s){ return /^s\d+$/.test(s.id); })
             .map(function(s){ return s.id; });
  }
  function boxOf(unit){
    var el = document.getElementById(unit);
    if(!el || !UNIT_RE.test(unit)) return null;
    return el.tagName === "HEADER" ? el : el.querySelector(":scope > .content-inner");
  }
  var SKELETON = '<div class="sechead"><span class="secnum">00</span><h2>New section</h2></div>' +
                 '<p class="secsub">One line on what this section covers.</p><p>Write this section here.</p>';
  var detached = {};      /* sections taken out of the order, kept in case it is undone */
  var created = [];       /* sections made by the last setOrder, still to be drawn */
  function ensureSection(id){
    var s = document.getElementById(id) || detached[id];
    if(!s){
      s = document.createElement("section");
      s.id = id;
      var ci = document.createElement("div");
      ci.className = "content-inner";
      ci.innerHTML = SKELETON;
      s.appendChild(ci);
      created.push(id);
    }
    delete detached[id];
    return s;
  }
  function layoutOf(entry){
    if(!entry || typeof entry.h !== "string") return null;
    var a;
    try{ a = JSON.parse(entry.h); }catch(e){ return null; }
    if(!Array.isArray(a)) return null;
    var seen = {};
    a = a.filter(function(id){
      if(typeof id !== "string" || !/^s\d{1,3}$/.test(id) || seen[id]) return false;
      return (seen[id] = true);
    });
    return a.length ? a : null;
  }
  var doneLabel = (function(){
    var a = document.querySelector('#toc a[href="#done"] span:last-child');
    return a ? norm(a.textContent) : "Complete";
  })();
  /* section numbers and the contents bar, from the order on the page */
  function renumber(){
    var ids = sectionIds();
    ids.forEach(function(id, i){
      var n = document.querySelector("#" + id + " > .content-inner > .sechead .secnum");
      if(n) n.textContent = pad(i + 1);
    });
    var toc = document.getElementById("toc");
    if(!toc) return;
    var want = ids.concat(doneSec ? ["done"] : []).join(",");
    var have = [].map.call(toc.querySelectorAll("a[href^='#']"), function(a){ return a.getAttribute("href").slice(1); }).join(",");
    if(want === have) return;
    toc.innerHTML = "";
    ids.concat(doneSec ? ["done"] : []).forEach(function(id, i){
      var li = document.createElement("li"), a = document.createElement("a");
      a.setAttribute("href", "#" + id);
      var n = document.createElement("span"); n.className = "n"; n.textContent = pad(i + 1);
      var t = document.createElement("span");
      var h = id === "done" ? null : document.querySelector("#" + id + " .sechead h2");
      t.textContent = id === "done" ? doneLabel : (h ? norm(h.textContent) : "Section");
      a.appendChild(n); a.appendChild(t); li.appendChild(a); toc.appendChild(li);
    });
  }
  function setOrder(order){
    created = [];
    order.forEach(function(id){ main.insertBefore(ensureSection(id), doneSec || null); });
    sectionIds().forEach(function(id){
      if(order.indexOf(id) > -1) return;
      var s = document.getElementById(id);
      detached[id] = s;
      s.parentNode.removeChild(s);
    });
    renumber();
  }
  function fillImages(root){
    [].forEach.call(root.querySelectorAll("img[data-img]"), function(img){
      var src = IMAGES[img.getAttribute("data-img")];
      if(src) img.setAttribute("src", src);
    });
  }

  var ORIGINAL_UNIT = {}, ORIGINAL_ORDER = [];
  if(TEMPLATE){
    ORIGINAL_ORDER = sectionIds();
    ["mast"].concat(ORIGINAL_ORDER).forEach(function(u){ var b = boxOf(u); if(b) ORIGINAL_UNIT[u] = b.innerHTML; });
    var order = layoutOf(LIVE[LAYOUT_KEY]);
    if(order) setOrder(order);
    ["mast"].concat(sectionIds()).forEach(function(u){
      var rec = LIVE[u + ":all"], b = boxOf(u);
      if(b && rec && typeof rec.h === "string") b.innerHTML = sanitizeUnit(rec.h);
    });
    renumber();
  }

  /* ---- finding the blocks ------------------------------------------- */
  function isBlock(el){
    if(el.closest(LOCKED_SEL)) return false;
    if(el.querySelector(BLOCK_SEL)) return false;              /* only the innermost */
    return norm(el.textContent).length > 0;
  }
  var original = {};      /* key -> markup as built, so an edit can be undone */
  var byKey = {};
  function markUnit(sec){
    var prefix = sec.id + ":";
    Object.keys(byKey).forEach(function(k){
      if(k.indexOf(prefix) === 0 && !byKey[k].isConnected){ delete byKey[k]; delete original[k]; }
    });
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
  }
  [].forEach.call(document.querySelectorAll(ROOT_SEL), markUnit);

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
    if(TEMPLATE && key === LAYOUT_KEY) return applyLayout(entry);
    if(TEMPLATE && /^(s\d{1,3}|mast):all$/.test(key)) return applyUnit(key, entry);
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
  /* A section saved whole already carries any wording edits made to it
     before, so those are not applied on top of it a second time. */
  function superseded(k){
    if(!TEMPLATE) return false;
    var u = k.split(":")[0], L = window.AMQC_EDITS ? window.AMQC_EDITS.live : LIVE;
    return UNIT_RE.test(u) && k !== u + ":all" && !!L[u + ":all"];
  }
  /* whole sections and the order were put in place above, before marking */
  Object.keys(LIVE).forEach(function(k){
    if(superseded(k) || (TEMPLATE && (k === LAYOUT_KEY || /^(s\d{1,3}|mast):all$/.test(k)))) return;
    apply(k, LIVE[k]);
  });
  syncCopies();

  /* ---- the working copy of each section (blank guides) --------------
     The page's own scripts change the sections once they run: the
     self-test is rebuilt, examples are numbered, classes come and go. So
     each section keeps a clean copy, taken now, before any of that. Every
     change is made to the copy, the section is redrawn from it, and the
     copy is what gets saved. Elements carry a data-eid so the copy and the
     page can be matched up. */
  var PRISTINE = {}, EID = 0;
  var INLINE = {B:1, STRONG:1, I:1, EM:1, CODE:1, KBD:1, Q:1, BR:1, A:1, SPAN:1};
  function assignEids(root, self){
    var list = [].slice.call(root.querySelectorAll("*"));
    if(self) list.unshift(root);
    list.forEach(function(e){
      if(INLINE[e.tagName] && !e.matches(BLOCK_SEL)){ e.removeAttribute("data-eid"); return; }
      e.setAttribute("data-eid", "e" + (++EID));
    });
  }
  function snapshot(unit){
    var b = boxOf(unit);
    if(!b) return;
    assignEids(b, false);
    PRISTINE[unit] = b.cloneNode(true);
  }
  /* numbering that follows position, kept right in the copy itself */
  function normalise(root){
    [].forEach.call(root.querySelectorAll(".rules"), function(r){
      [].forEach.call(r.querySelectorAll(":scope > .rule > .rn"), function(n, i){ n.textContent = String(i + 1); });
    });
    [].forEach.call(root.querySelectorAll(".chk"), function(c){
      [].forEach.call(c.querySelectorAll(":scope > label > .n"), function(n, i){ n.textContent = pad(i + 1); });
    });
  }
  function serialize(unit){
    var c = PRISTINE[unit].cloneNode(true);
    normalise(c);
    [].forEach.call(c.querySelectorAll("*"), function(e){
      ["data-eid", "data-ek", "data-edited", "contenteditable", "spellcheck"].forEach(function(a){ e.removeAttribute(a); });
      [].slice.call(e.classList).forEach(function(k){ if(/^ed/.test(k)) e.classList.remove(k); });
      if(e.hasAttribute("class") && !e.getAttribute("class")) e.removeAttribute("class");
    });
    return c.innerHTML;
  }
  /* redraw one section from its copy */
  function render(unit){
    var b = boxOf(unit), p = PRISTINE[unit];
    if(!b || !p) return;
    normalise(p);
    /* cards that were open stay open */
    var open = [].map.call(b.querySelectorAll("details[open][data-eid]"), function(d){ return d.getAttribute("data-eid"); });
    b.innerHTML = p.innerHTML;
    open.forEach(function(e){ var d = b.querySelector('details[data-eid="' + e + '"]'); if(d) d.open = true; });
    [].forEach.call(b.querySelectorAll("[data-ek]"), function(e){ e.removeAttribute("data-ek"); });
    [].forEach.call(b.querySelectorAll("#exlist > .ex > summary"), function(sum, i){ sum.setAttribute("data-n", pad(i + 1)); });
    fillImages(b);
    renumber();
    markUnit(b.tagName === "HEADER" ? b : b.parentNode);
    syncCopies();
    document.dispatchEvent(new CustomEvent("amqc:rendered", {detail:{unit:unit}}));
  }
  /* replace a section's copy with saved markup (or its original) and redraw */
  function resetUnit(unit, html){
    var b = boxOf(unit) || (detached[unit] && detached[unit].querySelector(":scope > .content-inner"));
    var p;
    if(b) p = b.cloneNode(false);
    else { p = document.createElement("div"); p.className = "content-inner"; }
    p.innerHTML = html;
    assignEids(p, false);
    PRISTINE[unit] = p;
    if(boxOf(unit)) render(unit);
  }
  function unitEntryHtml(unit, entry){
    if(entry && typeof entry.h === "string") return sanitizeUnit(entry.h);
    return ORIGINAL_UNIT[unit] != null ? ORIGINAL_UNIT[unit] : SKELETON;
  }
  function applyUnit(key, entry){
    var unit = key.split(":")[0];
    if(PRISTINE[unit] && entry && serialize(unit) === entry.h) return true;   /* already showing it */
    resetUnit(unit, unitEntryHtml(unit, entry));
    return true;
  }
  /* put sections in order; any section new to the page is drawn from its
     copy, or gets one if it has none yet */
  function placeSections(order){
    setOrder(order);
    created.forEach(function(id){
      if(PRISTINE[id]) render(id);
      else { snapshot(id); markUnit(document.getElementById(id)); }
    });
    created = [];
    syncCopies();
  }
  function applyLayout(entry){
    var order = layoutOf(entry) || ORIGINAL_ORDER;
    if(order.join(",") !== sectionIds().join(",")) placeSections(order);
    return true;
  }

  var TPL = null;
  if(TEMPLATE){
    ["mast"].concat(sectionIds()).forEach(snapshot);
    fillImages(main);
    TPL = {
      units: function(){ return ["mast"].concat(sectionIds()); },
      order: sectionIds,
      box: boxOf,
      pristine: function(unit){ return PRISTINE[unit]; },
      /* the copy of an element on the page: {unit, node} */
      findP: function(eid){
        for(var u in PRISTINE){
          var n = PRISTINE[u].querySelector('[data-eid="' + eid + '"]');
          if(n) return {unit:u, node:n};
        }
        return null;
      },
      unitOf: function(el){
        var r = el && el.closest && el.closest("main > section[id], main > header.mast[id]");
        return r && UNIT_RE.test(r.id) ? r.id : null;
      },
      assignEids: assignEids,
      serialize: serialize,
      render: render,
      resetUnit: resetUnit,
      images: IMAGES,
      skeleton: SKELETON,
      /* a new section: its copy now, on the page once it is in the order */
      newSection: function(){
        var max = 0;
        sectionIds().concat(Object.keys(PRISTINE), Object.keys(detached), Object.keys(window.AMQC_EDITS.live).map(function(k){ return k.split(":")[0]; }))
          .forEach(function(id){ var m = /^s(\d+)$/.exec(id); if(m) max = Math.max(max, Number(m[1])); });
        var id = "s" + (max + 1);
        var p = document.createElement("div");
        p.className = "content-inner";
        p.innerHTML = SKELETON;
        assignEids(p, false);
        PRISTINE[id] = p;
        return id;
      },
      setOrder: placeSections,
      layoutKey: LAYOUT_KEY,
      unitKey: function(k){ return /^(s\d{1,3}|mast):all$/.test(k); },
      sync: syncCopies,
      superseded: superseded
    };
  }

  window.AMQC_EDITS = {
    live: LIVE,
    original: original,
    byKey: byKey,
    sanitize: sanitize,
    apply: apply,
    norm: norm,
    template: TEMPLATE,
    tpl: TPL,
    /* edits whose block is no longer on the page: its wording changed in
       a rebuild, or the block was removed */
    orphans: function(){
      return Object.keys(window.AMQC_EDITS.live).filter(function(k){
        if(TEMPLATE && (k === LAYOUT_KEY || /^(s\d{1,3}|mast):all$/.test(k) || superseded(k))) return false;
        return !byKey[k];
      });
    }
  };
})();
</script>
