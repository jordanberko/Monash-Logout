<script>
/* =====================================================================
   Live content edits: arranging a blank guide.
   On a page marked as a template, editing also lets people move, add,
   duplicate and delete blocks, rows, steps, cards, examples and sections,
   change a block's style, add table columns and upload screenshots.
   Every change is made to the section's clean copy (see edit-apply.js),
   the section is redrawn from that copy, and the section is saved whole.
   ===================================================================== */
(function(){
  "use strict";
  var E = window.AMQC_EDITS;
  if(!E || !E.tpl || !E.ui) return;
  var T = E.tpl, U = E.ui;
  var main = document.querySelector("main");

  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text != null) n.textContent = text;
    return n;
  }
  function btn(cls, text, label){
    var b = el("button", cls, text);
    b.type = "button";
    if(label){ b.title = label; b.setAttribute("aria-label", label); }
    return b;
  }
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;"}[c]; }); }
  function snippet(n){ var t = E.norm(n.textContent); return t.length > 48 ? t.slice(0, 48) + "…" : t || "this block"; }

  /* ---- what can be moved --------------------------------------------- */
  /* repeated parts inside a block: moved among their own kind */
  var ITEMS = [
    ["tbody > tr", "row"], ["ol.steps > li", "step"], [".sources > .src", "card"], [".fields > .field", "item"],
    [".rules > .rule", "point"], [".intro-failures > p", "point"], [".intro-context > .intro-context-row", "row"],
    ["#exlist > .ex", "example"], ["#chk > label", "checklist step"], [".mastmeta > .pill", "pill"],
    [".answers > .ansbtn", "answer"], ["ul > li", "point"]
  ];
  var ITEM_SEL = ITEMS.map(function(x){ return x[0]; }).join(",");
  function kindOfItem(n){ for(var i = 0; i < ITEMS.length; i++) if(n.matches(ITEMS[i][0])) return ITEMS[i]; return null; }
  function sameKind(a, b){ var k = kindOfItem(a); return !!k && b.matches(k[0]); }
  /* parts the page's scripts drive: they move, but go only with what they control */
  var FIXED = ".pathbar,.modebar,.filters,.scorebox,.chkbar,.studynote";
  var COMPANIONS = {exlist: ".modebar,.filters,.studynote,.scorebox", chk: ".chkbar"};

  function isWrap(n){
    return !!n && n.tagName === "DIV" && n.classList.contains("col-read") &&
           !!n.parentElement && n.parentElement.classList.contains("content-inner");
  }
  function sectionEl(n){
    var s = n && n.closest && n.closest("main > section[id]");
    return s && /^s\d+$/.test(s.id) ? s : null;
  }
  /* the blocks of a section, in order, looking through reading-width wrappers */
  function blocksIn(s){
    var ci = s && s.querySelector(":scope > .content-inner"), out = [];
    if(!ci) return out;
    [].forEach.call(ci.children, function(c){
      if(c.classList.contains("edarr") || c.classList.contains("sechead")) return;
      if(isWrap(c)) [].forEach.call(c.children, function(x){ if(x.hasAttribute("data-eid") && !x.classList.contains("edarr")) out.push(x); });
      else if(c.hasAttribute("data-eid")) out.push(c);
    });
    return out;
  }
  function pBlocks(unit){
    var box = T.pristine(unit), out = [];
    if(!box || unit === "mast") return out;
    [].forEach.call(box.children, function(c){
      if(c.classList.contains("sechead")) return;
      if(isWrap(c)) [].forEach.call(c.children, function(x){ out.push(x); });
      else out.push(c);
    });
    return out;
  }
  function blockOf(t){
    var s = sectionEl(t);
    if(!s) return null;
    var list = blocksIn(s);
    for(var i = 0; i < list.length; i++) if(list[i] === t || list[i].contains(t)) return list[i];
    return null;
  }
  function itemOf(t){
    var it = t.closest && t.closest(ITEM_SEL);
    return it && main.contains(it) && it.hasAttribute("data-eid") && T.unitOf(it) ? it : null;
  }
  function figOf(t){
    var f = t.closest && t.closest("figure.shot");
    return f && main.contains(f) && T.unitOf(f) && f.querySelector("img[data-eid]") ? f : null;
  }
  function headOf(t){
    var h = t.closest && t.closest(".sechead");
    return h && sectionEl(h) ? h : null;
  }
  /* the copy behind an element on the page */
  function P(n){ return n ? T.findP(n.getAttribute("data-eid")) : null; }

  function blockName(n){
    if(n.matches("p.secsub")) return "section summary";
    if(n.tagName === "P") return "paragraph";
    if(n.tagName === "H3" || n.tagName === "H4") return "subheading";
    if(n.matches(".note.key")) return "key point";
    if(n.matches(".note")) return "note";
    if(n.matches(".tw") || n.tagName === "TABLE") return "table";
    if(n.matches("ol.steps")) return "list of steps";
    if(n.tagName === "UL" || n.tagName === "OL") return "list";
    if(n.matches("figure")) return "screenshot";
    if(n.matches(".sources")) return "set of cards";
    if(n.matches(".fields")) return "item list";
    if(n.matches(".rules")) return "set of numbered points";
    if(n.matches("#exlist")) return "worked examples";
    if(n.matches("#chk")) return "checklist";
    if(n.matches(".pathbar")) return "option switch";
    if(n.matches(FIXED)) return "control";
    return "block";
  }
  function canCopy(n){ return !n.id && !n.querySelector("[id]") && !n.matches(FIXED); }

  /* ---- new blocks ------------------------------------------------------ */
  function placeholder(w, h){
    var fs = Math.max(18, Math.round(w / 40));
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<rect x="2" y="2" width="' + (w - 4) + '" height="' + (h - 4) + '" rx="12" fill="#EEF3F7" stroke="#9FB3C2" stroke-width="3" stroke-dasharray="12 9"/>' +
      '<text x="50%" y="50%" fill="#5B7080" font-family="Helvetica, Arial, sans-serif" font-size="' + fs + '" text-anchor="middle" dominant-baseline="middle">Screenshot</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function figCount(){ return document.querySelectorAll("main figure.shot").length; }
  function figureHtml(wide){
    var w = wide ? 1400 : 457, h = wide ? 734 : 365;
    return '<figure class="shot filled ' + (wide ? "wide" : "narrow") + '"><img src="' + placeholder(w, h) + '" alt="Screenshot placeholder" loading="lazy" width="' + w +
           '" height="' + h + '" style="aspect-ratio:' + w + '/' + h + '"><figcaption><span class="ref">FIG ' + (figCount() + 1) +
           '</span><span>Caption. Say what the reader should notice.</span></figcaption></figure>';
  }
  function tableHtml(cols){
    var th = "", td = "";
    for(var i = 0; i < cols; i++){ th += "<th>Column heading</th>"; td += i ? "<td>Cell text.</td>" : "<td>Row label</td>"; }
    return '<div class="tw"><table><thead><tr>' + th + '</tr></thead><tbody><tr>' + td + '</tr><tr>' + td + '</tr></tbody></table></div>';
  }
  var CARD = '<div class="src"><span class="who">Short label</span><h4>Card title</h4><p>Two or three sentences describing this item.</p>' +
             '<span class="applies"><b>Applies to</b> where or when it applies</span></div>';
  var FIELD = '<div class="field"><span class="mark" aria-hidden="true"></span><div><h4>Item name</h4><p class="where">Where to find it.</p>' +
              '<p class="miss"><b>Label</b>What to look for.</p></div></div>';
  var PALETTE = [
    ["Paragraph", function(){ return "<p>New paragraph.</p>"; }],
    ["Subheading", function(){ return "<h3>New subheading</h3>"; }],
    ["Bullet list", function(){ return "<ul><li>First point.</li><li>Second point.</li></ul>"; }],
    ["Numbered steps", function(){ return '<ol class="steps"><li><div><p>First step.</p></div></li><li><div><p>Second step.</p></div></li></ol>'; }],
    ["Note", function(){ return '<div class="note"><p><b>Note title</b>Note text.</p></div>'; }],
    ["Key point", function(){ return '<div class="note key"><p><b>Key point</b>Text that needs to stand out.</p></div>'; }],
    ["Table, two columns", function(){ return tableHtml(2); }],
    ["Table, three columns", function(){ return tableHtml(3); }],
    ["Screenshot, full width", function(){ return figureHtml(true); }],
    ["Screenshot, small", function(){ return figureHtml(false); }],
    ["Cards", function(){ return '<div class="sources">' + CARD + CARD + CARD + "</div>"; }],
    ["Numbered points", function(){ return '<div class="rules"><div class="rule"><span class="rn">1</span><p><b>First point, in a few words.</b> A sentence or two explaining it.</p></div>' +
                                           '<div class="rule"><span class="rn">2</span><p><b>Second point, in a few words.</b> A sentence or two explaining it.</p></div></div>'; }],
    ["Item list", function(){ return '<div class="fields">' + FIELD + FIELD + "</div>"; }]
  ];
  var QA = '<div class="qa hidden"><p class="quizq">A question about this example?</p><div class="answers">' +
           '<button class="ansbtn" type="button" data-o="0" data-correct="1"><span>The correct answer</span></button>' +
           '<button class="ansbtn" type="button" data-o="1"><span>A wrong answer</span></button></div></div>';
  function make(html){
    var d = document.createElement("div");
    d.innerHTML = html;
    var n = d.firstElementChild;
    T.assignEids(n, true);
    return n;
  }

  /* ---- making a change ------------------------------------------------- *
     fn changes the copies and says which sections it touched; the sections
     are redrawn and saved. If saving fails, what was not saved goes back. */
  var working = false;
  function change(label, fn){
    if(working){ U.notify("Still saving the last change.", true); return; }
    if(U.busy()){ U.notify("Save or cancel the change you are making first.", true); return; }
    U.stopEditing(); closeMenu(); hide();
    var snap = {};
    T.units().forEach(function(u){ snap[u] = T.serialize(u); });
    var orderBefore = T.order().slice();
    var res = fn();
    if(!res) return;
    var units = res.units || [];
    units.forEach(function(u){
      var box = T.pristine(u);
      if(box) [].forEach.call(box.querySelectorAll(":scope > .col-read"), function(w){ if(!w.children.length) w.remove(); });
      T.render(u);
    });
    working = true; U.saving(true);
    U.commit(units, label, !!res.order).then(function(r){
      working = false; U.saving(false);
      if(r.ok){
        U.shapeChanged();
        U.notify(res.say || "Saved. It is live for everyone.");
        flash(res);
        return;
      }
      var saved = r.saved || [];
      units.forEach(function(u){
        var k = u + ":all";
        if(saved.indexOf(k) > -1 || r.staleKey === k || snap[u] == null) return;
        T.resetUnit(u, snap[u]);
      });
      if(res.order && saved.indexOf(T.layoutKey) < 0 && r.staleKey !== T.layoutKey) T.setOrder(orderBefore);
      if(r.reason === "expired"){
        U.notify("Your editing session has ended. Enter the password again, then make the change again.", true);
        U.openDialog();
        return;
      }
      U.notify((r.partial ? "Only part of that change was saved. " : "") + U.say(r), true);
    });
  }
  function flash(res){
    var target = res.section ? document.getElementById(res.section) : res.flash ? main.querySelector('[data-eid="' + res.flash + '"]') : null;
    if(!target) return;
    var r = target.getBoundingClientRect();
    if(r.top < 90 || r.bottom > window.innerHeight - 90) target.scrollIntoView({block: res.section ? "start" : "center", behavior: "smooth"});
    target.classList.add("ed-moved");
    setTimeout(function(){ target.classList.remove("ed-moved"); }, 1700);
  }

  /* ---- the changes themselves --------------------------------------- */
  function moveBlock(n, dir){
    change("Moved a " + blockName(n), function(){
      var h = P(n);
      if(!h) return false;
      var list = pBlocks(h.unit), i = list.indexOf(h.node), units = [h.unit];
      if(dir < 0 && i > 0) list[i - 1].parentNode.insertBefore(h.node, list[i - 1]);
      else if(dir > 0 && i < list.length - 1) list[i + 1].parentNode.insertBefore(h.node, list[i + 1].nextSibling);
      else {
        var order = T.order(), k = order.indexOf(h.unit) + dir;
        if(k < 0 || k >= order.length){
          U.notify(dir < 0 ? "That is already the first block in the guide." : "That is already the last block in the guide.");
          return false;
        }
        var box = T.pristine(order[k]);
        if(dir < 0) box.appendChild(h.node);
        else atStart(box, h.node);
        units.unshift(order[k]);
      }
      return {units: units, flash: h.node.getAttribute("data-eid")};
    });
  }
  /* the top of a section: under its heading and summary */
  function atStart(box, node){
    var after = null;
    for(var c = box.firstElementChild; c && (c.classList.contains("sechead") || c.classList.contains("secsub")); c = c.nextElementSibling) after = c;
    box.insertBefore(node, after ? after.nextSibling : box.firstChild);
  }
  function moveItem(n, dir){
    change("Moved a " + kindOfItem(n)[1], function(){
      var h = P(n);
      if(!h) return false;
      var sib = dir < 0 ? h.node.previousElementSibling : h.node.nextElementSibling;
      while(sib && !sameKind(h.node, sib)) sib = dir < 0 ? sib.previousElementSibling : sib.nextElementSibling;
      if(!sib){ U.notify(dir < 0 ? "That is already the first one." : "That is already the last one."); return false; }
      if(dir < 0) sib.parentNode.insertBefore(h.node, sib);
      else sib.parentNode.insertBefore(h.node, sib.nextSibling);
      return {units: [h.unit], flash: h.node.getAttribute("data-eid")};
    });
  }
  function duplicate(n, name){
    change("Duplicated a " + name, function(){
      var h = P(n);
      if(!h) return false;
      var c = h.node.cloneNode(true);
      [].forEach.call(c.querySelectorAll("[id]"), function(e){ e.removeAttribute("id"); });
      c.removeAttribute("id");
      if(h.node.matches("#chk > label")){
        var k = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        c.id = "chkrow-" + k;
        var box = c.querySelector("input");
        if(box) box.setAttribute("data-k", k);
      }
      if(h.node.matches(".answers > .ansbtn")){
        c.removeAttribute("data-correct");
        var used = [].map.call(h.node.parentNode.children, function(b){ return Number(b.getAttribute("data-o")) || 0; });
        c.setAttribute("data-o", String(Math.max.apply(null, used.concat([0])) + 1));
      }
      T.assignEids(c, true);
      h.node.parentNode.insertBefore(c, h.node.nextSibling);
      return {units: [h.unit], flash: c.getAttribute("data-eid")};
    });
  }
  function remove(n, isItem){
    var name = isItem ? kindOfItem(n)[1] : blockName(n);
    change("Deleted a " + name, function(){
      var h = P(n);
      if(!h) return false;
      var node = h.node;
      if(isItem){
        var others = [].filter.call(node.parentNode.children, function(c){ return c !== node && sameKind(node, c); });
        if(node.matches(".answers > .ansbtn")){
          if(!others.length){ U.notify("A question needs at least one answer.", true); return false; }
          if(node.hasAttribute("data-correct")) others[0].setAttribute("data-correct", "1");
        } else if(!others.length){
          if(h.unit === "mast"){ U.notify("The page heading needs at least one pill.", true); return false; }
          /* the last one of its kind: what holds it goes too */
          node = node.parentNode;
          if(node.tagName === "TBODY") node = node.closest(".tw") || node.closest("table");
          name = blockName(node);
        }
      }
      if(node.id && COMPANIONS[node.id]){
        [].forEach.call(T.pristine(h.unit).querySelectorAll(COMPANIONS[node.id]), function(c){
          if(pBlocks(h.unit).indexOf(c) > -1) c.remove();
        });
      }
      node.remove();
      return {units: [h.unit], say: "Deleted the " + name + ". Use Undo if that was a mistake."};
    });
  }
  function insert(html, afterNode, unit){
    change("Added a block", function(){
      var n = make(html);
      if(afterNode){
        var h = P(afterNode);
        if(!h) return false;
        h.node.parentNode.insertBefore(n, h.node.nextSibling);
        unit = h.unit;
      } else {
        T.pristine(unit).appendChild(n);
      }
      return {units: [unit], flash: n.getAttribute("data-eid")};
    });
  }

  /* text styles a block can switch between */
  var STYLES = [["p", "Paragraph"], ["h3", "Subheading"], ["note", "Note"], ["key", "Key point"]];
  function styleOf(n){
    if(n.tagName === "P" && !n.classList.contains("secsub") && !n.classList.contains("studynote")) return "p";
    if(n.tagName === "H3") return "h3";
    if(n.matches("div.note.key")) return "key";
    if(n.matches("div.note")) return "note";
    return null;
  }
  function restyle(n, to){
    change("Changed a block's style", function(){
      var h = P(n);
      if(!h) return false;
      var from = styleOf(h.node), title = "", body = h.node.innerHTML;
      if(from === "note" || from === "key"){
        var p = h.node.querySelector("p");
        var c = p ? p.cloneNode(true) : document.createElement("p");
        var b = c.querySelector(":scope > b:first-child");
        if(b){ title = b.textContent; b.remove(); }
        body = c.innerHTML.trim() || esc(title);
      }
      if(to === "h3") body = esc(E.norm((function(){ var d = document.createElement("div"); d.innerHTML = body; return d.textContent; })()));
      var cls = h.node.classList.contains("col-read") ? ' class="col-read"' : "";
      var html = to === "p" ? "<p" + cls + ">" + body + "</p>"
               : to === "h3" ? "<h3>" + body + "</h3>"
               : '<div class="note' + (to === "key" ? " key" : "") + '"><p><b>' + esc(title || (to === "key" ? "Key point" : "Note")) + "</b>" + body + "</p></div>";
      var nn = make(html);
      h.node.parentNode.replaceChild(nn, h.node);
      return {units: [h.unit], flash: nn.getAttribute("data-eid")};
    });
  }
  function columns(n, add){
    change(add ? "Added a table column" : "Removed a table column", function(){
      var h = P(n);
      if(!h) return false;
      var rows = h.node.querySelectorAll("tr");
      var cols = rows.length ? rows[0].children.length : 0;
      if(!add && cols < 2){ U.notify("A table needs at least one column.", true); return false; }
      [].forEach.call(rows, function(tr){
        if(add){
          var c = el(tr.parentNode.tagName === "THEAD" ? "th" : "td", null, tr.parentNode.tagName === "THEAD" ? "Column heading" : "Cell text.");
          T.assignEids(c, true);
          tr.appendChild(c);
        } else if(tr.lastElementChild) tr.lastElementChild.remove();
      });
      return {units: [h.unit], flash: h.node.getAttribute("data-eid")};
    });
  }
  function showFor(n, which){
    change("Changed which option a block shows for", function(){
      var h = P(n);
      if(!h) return false;
      h.node.classList.remove("pathA", "pathB", "hidden");
      if(which === "A") h.node.classList.add("pathA");
      if(which === "B") h.node.classList.add("pathB", "hidden");
      return {units: [h.unit], flash: h.node.getAttribute("data-eid")};
    });
  }
  function pathOf(n){ return n.classList.contains("pathA") ? "A" : n.classList.contains("pathB") ? "B" : ""; }
  function setGroup(ex, v){
    change("Changed an example's group", function(){
      var h = P(ex);
      if(!h) return false;
      h.node.setAttribute("data-v", v);
      var badge = h.node.querySelector("summary .verdict");
      if(badge){ badge.classList.remove("ok", "disc", "esc"); badge.classList.add(v); }
      var sample = main.querySelector('#exlist .ex[data-v="' + v + '"] summary .verdict');
      if(badge && sample && sample !== ex.querySelector("summary .verdict")) badge.textContent = E.norm(sample.textContent);
      return {units: [h.unit], flash: h.node.getAttribute("data-eid")};
    });
  }
  function scored(ex, on){
    change(on ? "Added an example to the self-test" : "Took an example out of the self-test", function(){
      var h = P(ex);
      if(!h) return false;
      var qa = h.node.querySelector(".qa");
      if(on){
        h.node.setAttribute("data-scored", "1");
        if(!qa) h.node.appendChild(make(QA));
      } else {
        h.node.removeAttribute("data-scored");
        if(qa) qa.remove();
      }
      return {units: [h.unit], flash: h.node.getAttribute("data-eid"),
              say: on ? "Added to the self-test. Write the question and answers under the example." : "Taken out of the self-test."};
    });
  }
  function markRight(ans){
    change("Changed the right answer", function(){
      var h = P(ans);
      if(!h) return false;
      [].forEach.call(h.node.parentNode.children, function(b){ b.removeAttribute("data-correct"); });
      h.node.setAttribute("data-correct", "1");
      return {units: [h.unit], flash: h.node.getAttribute("data-eid"), say: "That is now the right answer."};
    });
  }
  function stepShot(li){
    change("Added a screenshot to a step", function(){
      var h = P(li);
      if(!h) return false;
      var box = h.node.querySelector(":scope > div") || h.node;
      var f = make(figureHtml(false));
      box.appendChild(f);
      return {units: [h.unit], flash: f.getAttribute("data-eid")};
    });
  }
  function figSize(fig, wide){
    change("Changed a screenshot's size", function(){
      var h = P(fig);
      if(!h) return false;
      h.node.classList.remove("wide", "narrow");
      h.node.classList.add(wide ? "wide" : "narrow");
      return {units: [h.unit], flash: h.node.getAttribute("data-eid")};
    });
  }
  function figRemove(fig){
    change("Deleted a screenshot", function(){
      var h = P(fig);
      if(!h) return false;
      h.node.remove();
      return {units: [h.unit], say: "Deleted the screenshot. Use Undo if that was a mistake."};
    });
  }

  /* sections */
  function moveSection(id, dir){
    change("Moved a section", function(){
      var o = T.order(), i = o.indexOf(id), j = i + dir;
      if(j < 0 || j >= o.length){ U.notify(dir < 0 ? "That is already the first section." : "That is already the last section."); return false; }
      o.splice(i, 1); o.splice(j, 0, id);
      T.setOrder(o);
      return {order: true, section: id};
    });
  }
  function addSection(after){
    change("Added a section", function(){
      var id = T.newSection(), o = T.order();
      o.splice(o.indexOf(after) + 1, 0, id);
      T.setOrder(o);
      return {units: [id], order: true, section: id, say: "Added a new section. Click its heading to name it."};
    });
  }
  function deleteSection(id){
    var o = T.order();
    if(o.length < 2){ U.notify("A guide needs at least one section.", true); return; }
    var h = document.querySelector("#" + id + " .sechead h2");
    if(!confirm("Delete the section “" + (h ? E.norm(h.textContent) : id) + "” for everyone? Undo brings it back.")) return;
    change("Deleted a section", function(){
      T.setOrder(o.filter(function(x){ return x !== id; }));
      return {order: true, say: "Deleted the section. Use Undo if that was a mistake."};
    });
  }

  /* ---- screenshots ----------------------------------------------------- */
  var picker = el("input", "edarr");
  picker.type = "file";
  picker.accept = "image/png,image/jpeg,image/webp,image/gif";
  picker.hidden = true;
  document.body.appendChild(picker);
  var pickFor = null;
  function chooseImage(fig){ pickFor = fig.querySelector("img").getAttribute("data-eid"); picker.value = ""; picker.click(); }
  /* a screenshot is resized here before it is sent, so it stays a sensible size */
  function shrink(file){
    return new Promise(function(ok, fail){
      if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)){ fail("type"); return; }
      var fr = new FileReader();
      fr.onerror = function(){ fail("read"); };
      fr.onload = function(){
        var im = new Image();
        im.onerror = function(){ fail("read"); };
        im.onload = function(){
          var s = Math.min(1, 1600 / im.naturalWidth, 2400 / im.naturalHeight);
          var w = Math.max(1, Math.round(im.naturalWidth * s)), h = Math.max(1, Math.round(im.naturalHeight * s));
          var cv = document.createElement("canvas");
          cv.width = w; cv.height = h;
          var cx = cv.getContext("2d");
          cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h);
          cx.drawImage(im, 0, 0, w, h);
          var type = "image/webp", q = 0.88, url = cv.toDataURL(type, q);
          if(url.indexOf("data:image/webp") !== 0){ type = "image/jpeg"; url = cv.toDataURL(type, q); }
          while(url.length > 3900000 && q > 0.4){ q -= 0.15; url = cv.toDataURL(type, q); }
          ok({type: type, data: url.slice(url.indexOf(",") + 1), w: w, h: h});
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  picker.addEventListener("change", function(){
    var f = picker.files && picker.files[0], eid = pickFor;
    if(!f || !eid) return;
    if(working){ U.notify("Still saving the last change.", true); return; }
    U.notify("Uploading the screenshot…");
    shrink(f).then(function(img){
      working = true;
      return U.call("uploadEditImage", {token: U.token(), type: img.type, data: img.data, name: f.name, editor: U.whoName()})
        .then(function(r){
          working = false;
          if(!r.ok){
            if(r.reason === "expired"){ U.expire(); U.notify("Your editing session has ended. Enter the password again, then add the screenshot again.", true); U.openDialog(); }
            else U.notify(r.reason === "too-long" ? "That image is too large. Try a smaller screenshot." : U.say(r), true);
            return;
          }
          T.images[r.id] = r.src;
          change("Added a screenshot", function(){
            var h = T.findP(eid);
            if(!h) return false;
            var im = h.node;
            im.setAttribute("data-img", r.id);
            im.setAttribute("src", placeholder(img.w, img.h));
            im.setAttribute("width", String(img.w));
            im.setAttribute("height", String(img.h));
            im.setAttribute("style", "aspect-ratio:" + img.w + "/" + img.h);
            im.setAttribute("alt", "Screenshot");
            return {units: [h.unit], flash: eid, say: "Screenshot added. It is live for everyone."};
          });
        });
    }, function(){ U.notify("That file could not be read as an image. Use a PNG, JPEG, WebP or GIF.", true); });
  });

  /* ---- the controls that follow the pointer -------------------------- */
  var gutter = el("div", "edarr edgutter"); gutter.hidden = true;
  var gGrip = btn("edico grip", "⠿", "Drag to move this block, or click for options");
  var gAdd = btn("edico", "+", "Add a block below");
  gutter.appendChild(gGrip); gutter.appendChild(gAdd);
  var itembar = el("div", "edarr editembar"); itembar.hidden = true;
  var secbar = el("div", "edarr edsecbar"); secbar.hidden = true;
  var figbar = el("div", "edarr edfigbar"); figbar.hidden = true;
  var menu = el("div", "edarr edmenu"); menu.hidden = true; menu.setAttribute("role", "menu");
  var drop = el("div", "edarr eddrop"); drop.hidden = true;
  var ghost = el("div", "edarr edghost"); ghost.hidden = true;
  [gutter, itembar, secbar, figbar, menu, drop, ghost].forEach(function(n){ document.body.appendChild(n); });

  var hov = {block:null, item:null, fig:null, head:null}, hideAt = 0;
  function railBottom(){ var r = document.querySelector(".rail"); return r ? Math.max(0, r.getBoundingClientRect().bottom) : 0; }
  function visible(r){ return r.bottom > railBottom() + 8 && r.top < window.innerHeight - 70; }
  function clampTop(r, h){ return Math.min(Math.max(r.top + 2, railBottom() + 6), Math.max(r.bottom - h, railBottom() + 6)); }

  function paintItembar(n){
    itembar.innerHTML = "";
    var k = kindOfItem(n), name = k ? k[1] : "item";
    var grip = btn("edico grip", "⠿", "Drag to move this " + name);
    grip.addEventListener("pointerdown", function(e){ startDrag(e, "item", n); });
    itembar.appendChild(grip);
    var up = btn("edico", "↑", "Move this " + name + " up"); up.addEventListener("click", function(){ moveItem(n, -1); });
    var dn = btn("edico", "↓", "Move this " + name + " down"); dn.addEventListener("click", function(){ moveItem(n, 1); });
    var cp = btn("edico", "⧉", "Duplicate this " + name); cp.addEventListener("click", function(){ duplicate(n, name); });
    var rm = btn("edico danger", "✕", "Delete this " + name); rm.addEventListener("click", function(){ remove(n, true); });
    itembar.appendChild(up); itembar.appendChild(dn); itembar.appendChild(cp); itembar.appendChild(rm);
    if(n.matches(".answers > .ansbtn") && !n.hasAttribute("data-correct")){
      var ok = btn("edico txt", "Make right answer", "Make this the right answer");
      ok.addEventListener("click", function(){ markRight(n); });
      itembar.appendChild(ok);
    }
    if(n.matches("#exlist > .ex")){
      var grp = btn("edico txt", "Group", "Choose this example's group");
      grp.addEventListener("click", function(){ openMenu(grp, groupMenu(n)); });
      itembar.appendChild(grp);
      var on = n.hasAttribute("data-scored");
      var sc = btn("edico txt", on ? "Remove question" : "Add question", on ? "Take this example out of the self-test" : "Add a self-test question to this example");
      sc.addEventListener("click", function(){ scored(n, !on); });
      itembar.appendChild(sc);
    }
    if(n.matches("ol.steps > li") && !n.querySelector("figure")){
      var sh = btn("edico txt", "+ Screenshot", "Add a screenshot to this step");
      sh.addEventListener("click", function(){ stepShot(n); });
      itembar.appendChild(sh);
    }
  }
  function paintSecbar(s){
    secbar.innerHTML = "";
    var id = s.id;
    var up = btn("edico", "↑", "Move this section up"); up.addEventListener("click", function(){ moveSection(id, -1); });
    var dn = btn("edico", "↓", "Move this section down"); dn.addEventListener("click", function(){ moveSection(id, 1); });
    var add = btn("edico txt", "+ Section", "Add a new section after this one"); add.addEventListener("click", function(){ addSection(id); });
    var rm = btn("edico txt danger", "Delete section", "Delete this section"); rm.addEventListener("click", function(){ deleteSection(id); });
    [up, dn, add, rm].forEach(function(b){ secbar.appendChild(b); });
  }
  function paintFigbar(f){
    figbar.innerHTML = "";
    var img = btn("edico txt", "Replace image", "Upload a screenshot for this frame");
    img.addEventListener("click", function(){ chooseImage(f); });
    var wide = f.classList.contains("wide");
    var sz = btn("edico txt", wide ? "Make small" : "Make full width", "Change the screenshot's size");
    sz.addEventListener("click", function(){ figSize(f, !wide); });
    figbar.appendChild(img); figbar.appendChild(sz);
    /* a screenshot inside a step is not a block of its own */
    if(!blocksIn(sectionEl(f) || document.createElement("div")).some(function(b){ return b === f; })){
      var rm = btn("edico danger", "✕", "Delete this screenshot");
      rm.addEventListener("click", function(){ figRemove(f); });
      figbar.appendChild(rm);
    }
  }

  var shown = {item:null, head:null, fig:null};
  function place(){
    if(!U.isOn() || drag){ hide(); return; }
    var b = hov.block && hov.block.isConnected ? hov.block : null;
    if(b && visible(b.getBoundingClientRect())){
      var r = b.getBoundingClientRect();
      gutter.hidden = false;
      gutter.style.left = Math.max(4, r.left - gutter.offsetWidth - 12) + "px";
      gutter.style.top = clampTop(r, gutter.offsetHeight) + "px";
    } else gutter.hidden = true;

    var it = hov.item && hov.item.isConnected ? hov.item : null;
    if(it && visible(it.getBoundingClientRect())){
      if(shown.item !== it){ paintItembar(it); shown.item = it; }
      itembar.hidden = false;
      var ri = it.getBoundingClientRect(), w = itembar.offsetWidth, ih = itembar.offsetHeight;
      /* beside it when it runs to the edge of the text, as a table row does;
         otherwise just above its corner, so it covers nothing next to it */
      var ci = it.closest(".content-inner, header.mast"), edge = ci ? ci.getBoundingClientRect().right : window.innerWidth;
      if(ri.right >= edge - 30 && ri.right + 10 + w < window.innerWidth - 4){
        itembar.style.left = (ri.right + 10) + "px";
        itembar.style.top = clampTop(ri, ih) + "px";
      } else {
        itembar.style.left = Math.min(Math.max(4, ri.right - w), window.innerWidth - w - 4) + "px";
        itembar.style.top = Math.max(railBottom() + 6, ri.top - ih - 4) + "px";
      }
    } else { itembar.hidden = true; shown.item = null; }

    var hd = hov.head && hov.head.isConnected ? hov.head : null;
    if(hd && visible(hd.getBoundingClientRect())){
      var s = sectionEl(hd);
      if(shown.head !== s){ paintSecbar(s); shown.head = s; }
      secbar.hidden = false;
      var rh = hd.getBoundingClientRect();
      secbar.style.left = Math.max(4, rh.right - secbar.offsetWidth) + "px";
      secbar.style.top = Math.max(railBottom() + 6, rh.top - secbar.offsetHeight - 6) + "px";
    } else { secbar.hidden = true; shown.head = null; }

    var f = hov.fig && hov.fig.isConnected ? hov.fig : null;
    if(f && visible(f.getBoundingClientRect())){
      if(shown.fig !== f){ paintFigbar(f); shown.fig = f; }
      figbar.hidden = false;
      var rf = (f.querySelector("img") || f).getBoundingClientRect();
      figbar.style.left = Math.max(4, rf.right - figbar.offsetWidth - 10) + "px";
      figbar.style.top = Math.max(railBottom() + 6, rf.top + 10) + "px";
    } else { figbar.hidden = true; shown.fig = null; }
  }
  function hide(){
    gutter.hidden = itembar.hidden = secbar.hidden = figbar.hidden = true;
    shown = {item:null, head:null, fig:null};
  }
  /* what the pointer is over. Between a block and its controls there is
     margin, so a pointer in the section but over no block keeps the block
     whose height it is level with. */
  function target(t, y){
    var found = {block:null, item:null, fig:null, head:null};
    if(!t || !main.contains(t)) return found;
    found.head = headOf(t);
    found.fig = figOf(t);
    found.item = itemOf(t);
    found.block = blockOf(t);
    var s = sectionEl(t);
    if(s && !found.block && !found.head){
      blocksIn(s).forEach(function(b){ var r = b.getBoundingClientRect(); if(y >= r.top - 8 && y <= r.bottom + 8) found.block = b; });
      if(found.block && !found.item){
        [].forEach.call(found.block.querySelectorAll(ITEM_SEL), function(i){
          var r = i.getBoundingClientRect();
          if(y >= r.top && y <= r.bottom && i.hasAttribute("data-eid")) found.item = i;
        });
      }
    }
    return found;
  }
  function track(e){
    if(!U.isOn() || drag) return;
    var t = e.target;
    if(t.closest && t.closest(".edarr,.edtools,.edbar,.edpanel,.edlg")){ clearTimeout(hideAt); return; }
    var f = target(t, e.clientY);
    if(!f.block && !f.item && !f.fig && !f.head){
      clearTimeout(hideAt);
      hideAt = setTimeout(function(){ hov = f; place(); }, 450);
      return;
    }
    clearTimeout(hideAt);
    hov = f;
    place();
  }
  document.addEventListener("mousemove", track, {passive:true});
  document.addEventListener("pointerdown", function(e){ if(e.pointerType !== "mouse") track(e); }, true);
  var placing = false;
  function queuePlace(){ if(!placing && U.isOn()){ placing = true; requestAnimationFrame(function(){ placing = false; place(); }); } }
  window.addEventListener("scroll", function(){ placeMenu(); queuePlace(); }, {passive:true});
  window.addEventListener("resize", queuePlace);

  /* ---- menus ----------------------------------------------------------- */
  var menuFor = null;
  function openMenu(anchor, items){
    menu.innerHTML = "";
    items.forEach(function(it){
      if(it === "-"){ menu.appendChild(el("hr")); return; }
      if(typeof it === "string"){ menu.appendChild(el("p", "edmhead", it)); return; }
      var b = btn(it.danger ? "danger" : "", (it.on ? "✓ " : "") + it.label);
      b.setAttribute("role", "menuitem");
      b.addEventListener("click", function(){ closeMenu(); it.run(); });
      menu.appendChild(b);
    });
    menu.hidden = false;
    menuFor = anchor;
    placeMenu();
    var first = menu.querySelector("button");
    if(first) first.focus({preventScroll: true});
  }
  /* the menu stays with the button it opened from, and closes once that
     button has scrolled out of sight */
  function placeMenu(){
    if(menu.hidden || !menuFor) return;
    var r = menuFor.getBoundingClientRect(), h = menu.offsetHeight, w = menu.offsetWidth;
    if(!menuFor.isConnected || r.bottom < 0 || r.top > window.innerHeight){ closeMenu(); return; }
    var top = r.bottom + 6 + h < window.innerHeight - 8 ? r.bottom + 6 : Math.max(8, r.top - h - 6);
    menu.style.top = top + "px";
    menu.style.left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8) + "px";
  }
  function closeMenu(){ if(!menu.hidden){ menu.hidden = true; menuFor = null; } }
  document.addEventListener("mousedown", function(e){ if(!menu.hidden && !menu.contains(e.target) && e.target !== menuFor) closeMenu(); }, true);
  menu.addEventListener("keydown", function(e){
    var items = [].slice.call(menu.querySelectorAll("button")), i = items.indexOf(document.activeElement);
    if(e.key === "Escape"){ e.preventDefault(); var a = menuFor; closeMenu(); if(a) a.focus(); }
    if(e.key === "ArrowDown"){ e.preventDefault(); (items[i + 1] || items[0]).focus(); }
    if(e.key === "ArrowUp"){ e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
  });

  function paletteItems(after, unit){
    return ["Add a block"].concat(PALETTE.map(function(p){
      return {label: p[0], run: function(){ insert(p[1](), after, unit); }};
    }));
  }
  function blockMenu(n){
    var name = blockName(n), items = [name.charAt(0).toUpperCase() + name.slice(1)];
    items.push({label: "Move up", run: function(){ moveBlock(n, -1); }});
    items.push({label: "Move down", run: function(){ moveBlock(n, 1); }});
    if(canCopy(n)) items.push({label: "Duplicate", run: function(){ duplicate(n, name); }});
    var st = styleOf(n);
    if(st){
      items.push("-", "Turn into");
      STYLES.forEach(function(s){ if(s[0] !== st) items.push({label: s[1], run: function(){ restyle(n, s[0]); }}); });
    }
    if(n.matches(".tw") || n.tagName === "TABLE"){
      items.push("-", "Table");
      items.push({label: "Add a column", run: function(){ columns(n, true); }});
      items.push({label: "Remove the last column", run: function(){ columns(n, false); }});
    }
    if(document.querySelector("main .pathbar") && !n.matches(FIXED)){
      var p = pathOf(n);
      items.push("-", "Show for");
      items.push({label: "Both options", on: !p, run: function(){ showFor(n, ""); }});
      items.push({label: "Option A only", on: p === "A", run: function(){ showFor(n, "A"); }});
      items.push({label: "Option B only", on: p === "B", run: function(){ showFor(n, "B"); }});
    }
    if(!n.matches(FIXED)){
      var what = n.id === "exlist" ? "Delete the worked examples and self-test" : n.id === "chk" ? "Delete the checklist" : "Delete";
      items.push("-", {label: what, danger: true, run: function(){ remove(n, false); }});
    }
    return items;
  }
  function groupMenu(ex){
    var cur = ex.getAttribute("data-v");
    return ["Group"].concat([["ok", "First group (green)"], ["disc", "Second group (red)"], ["esc", "Third group (amber)"]].map(function(g){
      var sample = main.querySelector('#exlist .ex[data-v="' + g[0] + '"] summary .verdict');
      return {label: sample ? E.norm(sample.textContent) + " (" + g[1].split(" (")[1] : g[1], on: cur === g[0], run: function(){ setGroup(ex, g[0]); }};
    }));
  }
  gAdd.addEventListener("click", function(){ var b = hov.block; if(b) openMenu(gAdd, paletteItems(b, null)); });
  gGrip.addEventListener("pointerdown", function(e){ if(hov.block) startDrag(e, "block", hov.block); });
  gGrip.addEventListener("keydown", function(e){
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); if(hov.block) openMenu(gGrip, blockMenu(hov.block)); }
  });

  /* ---- "Add a block" at the foot of every section -------------------- */
  function addEnds(){
    if(!U.isOn()) return;
    T.order().forEach(function(id){
      var ci = document.querySelector("#" + id + " > .content-inner");
      if(!ci || ci.querySelector(":scope > .edaddend")) return;
      var wrap = el("div", "edarr edaddend");
      var b = btn("", "+ Add a block");
      b.addEventListener("click", function(){ openMenu(b, paletteItems(null, id)); });
      wrap.appendChild(b);
      ci.appendChild(wrap);
    });
  }
  function dropEnds(){ [].forEach.call(document.querySelectorAll(".edaddend"), function(n){ n.remove(); }); }
  document.addEventListener("amqc:editing", function(e){
    if(e.detail && e.detail.on) addEnds();
    else { dropEnds(); hide(); closeMenu(); }
  });
  document.addEventListener("amqc:rendered", function(){ addEnds(); hov = {block:null, item:null, fig:null, head:null}; hide(); });

  /* while editing, an answer or option button changes its wording, not the page */
  document.addEventListener("click", function(e){
    if(!U.isOn()) return;
    var b = e.target.closest && e.target.closest(".ansbtn,.pathbtn");
    if(b && main.contains(b)){ e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ---- dragging ------------------------------------------------------ */
  var drag = null, scrollTimer = null;
  function startDrag(e, kind, n){
    if(e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    drag = {kind: kind, node: n, x: e.clientX, y: e.clientY, on: false, gap: null, py: e.clientY};
    document.addEventListener("pointermove", dragMove);
    document.addEventListener("pointerup", dragEnd);
    document.addEventListener("pointercancel", dragCancel);
    document.addEventListener("keydown", dragKey, true);
  }
  function dragMove(e){
    if(!drag) return;
    drag.py = e.clientY;
    if(!drag.on){
      if(Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return;
      if(working || U.busy()){ U.notify(working ? "Still saving the last change." : "Save or cancel the change you are making first.", true); dragCancel(); return; }
      drag.on = true;
      closeMenu(); hide();
      drag.node.classList.add("ed-dragging");
      ghost.textContent = "Moving: " + snippet(drag.node);
      ghost.hidden = false;
      document.body.classList.add("ed-isdragging");
      scrollTimer = setInterval(autoScroll, 16);
    }
    ghost.style.left = (e.clientX + 14) + "px";
    ghost.style.top = (e.clientY + 12) + "px";
    drag.gap = nearest(e.clientY);
    paintDrop(drag.gap);
  }
  function autoScroll(){
    if(!drag || !drag.on) return;
    var y = drag.py, edge = 90, top = railBottom();
    if(y < top + edge) window.scrollBy(0, -Math.ceil((top + edge - y) / 6));
    else if(y > window.innerHeight - edge) window.scrollBy(0, Math.ceil((y - window.innerHeight + edge) / 6));
    drag.gap = nearest(y);
    paintDrop(drag.gap);
  }
  function gaps(){
    var out = [], n = drag.node;
    if(drag.kind === "block"){
      T.order().forEach(function(id){
        var s = document.getElementById(id);
        if(!s) return;
        var list = blocksIn(s), at = list.indexOf(n);
        list.forEach(function(b, i){
          if(b === n || (at > -1 && i === at + 1)) return;
          var r = b.getBoundingClientRect();
          out.push({y: r.top - 7, left: r.left, width: r.width, before: b});
        });
        var last = list[list.length - 1];
        if(last !== n){
          var rr = (last || s.querySelector(".sechead") || s).getBoundingClientRect();
          var ci = s.querySelector(":scope > .content-inner").getBoundingClientRect();
          out.push({y: rr.bottom + 7, left: ci.left + 24, width: Math.max(80, ci.width - 48), end: id});
        }
      });
    } else {
      var sibs = [].filter.call(n.parentNode.children, function(c){ return c.hasAttribute("data-eid") && sameKind(n, c); });
      var at = sibs.indexOf(n);
      sibs.forEach(function(b, i){
        if(b === n || i === at + 1) return;
        var r = b.getBoundingClientRect();
        out.push({y: r.top - 3, left: r.left, width: r.width, before: b});
      });
      var lastS = sibs[sibs.length - 1];
      if(lastS && lastS !== n){
        var rl = lastS.getBoundingClientRect();
        out.push({y: rl.bottom + 3, left: rl.left, width: rl.width, after: lastS});
      }
    }
    return out;
  }
  function nearest(y){
    var best = null, d = Infinity;
    gaps().forEach(function(g){ var dd = Math.abs(g.y - y); if(dd < d){ d = dd; best = g; } });
    return d < 260 ? best : null;
  }
  function paintDrop(g){
    if(!g){ drop.hidden = true; return; }
    drop.hidden = false;
    drop.style.top = (g.y - 1) + "px";
    drop.style.left = g.left + "px";
    drop.style.width = g.width + "px";
  }
  function stopDrag(){
    clearInterval(scrollTimer);
    document.removeEventListener("pointermove", dragMove);
    document.removeEventListener("pointerup", dragEnd);
    document.removeEventListener("pointercancel", dragCancel);
    document.removeEventListener("keydown", dragKey, true);
    if(drag && drag.node) drag.node.classList.remove("ed-dragging");
    document.body.classList.remove("ed-isdragging");
    drop.hidden = true; ghost.hidden = true;
  }
  function dragCancel(){ stopDrag(); drag = null; }
  function dragKey(e){ if(e.key === "Escape"){ e.preventDefault(); dragCancel(); } }
  function dragEnd(){
    var d = drag;
    stopDrag();
    drag = null;
    if(!d) return;
    if(!d.on){
      /* a click on a block's handle, not a drag: its options */
      if(d.kind === "block") openMenu(gGrip, blockMenu(d.node));
      return;
    }
    if(!d.gap) return;
    var g = d.gap, name = d.kind === "block" ? blockName(d.node) : kindOfItem(d.node)[1];
    change("Moved a " + name, function(){
      var h = P(d.node);
      if(!h) return false;
      var units = [h.unit];
      if(g.before){
        var r = P(g.before);
        if(!r) return false;
        r.node.parentNode.insertBefore(h.node, r.node);
        if(units.indexOf(r.unit) < 0) units.unshift(r.unit);
      } else if(g.after){
        var a = P(g.after);
        if(!a) return false;
        a.node.parentNode.insertBefore(h.node, a.node.nextSibling);
      } else {
        T.pristine(g.end).appendChild(h.node);
        if(units.indexOf(g.end) < 0) units.unshift(g.end);
      }
      return {units: units, flash: h.node.getAttribute("data-eid")};
    });
  }
})();
</script>
