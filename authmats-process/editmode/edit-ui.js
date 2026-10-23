<script>
/* =====================================================================
   Live content edits: the editing interface.
   Anyone can see the Edit button; only someone with the edit password can
   use it. The password is checked on the server and never reaches the page.
   A saved change is live for everyone on their next page load, and every
   change is logged with who made it, so each one can be undone.
   ===================================================================== */
(function(){
  "use strict";
  var E = window.AMQC_EDITS;
  if(!E) return;

  var TOKEN_KEY = "amqc-edit-token";
  var ss = {
    get:function(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } },
    set:function(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} },
    del:function(k){ try{ sessionStorage.removeItem(k); }catch(e){} }
  };
  var session = null;                 /* {v: token, exp: ms, name: editor} */
  var editorName = "";                /* kept after a session ends, so asking again does not lose it */
  try{
    var s = JSON.parse(ss.get(TOKEN_KEY) || "null");
    if(s && s.v && s.exp > Date.now()){ session = s; editorName = s.name || ""; }
  }catch(e){}

  function call(fn, arg){
    return new Promise(function(done){
      var r = window.google && google.script && google.script.run;
      if(!r){ done({ok:false, reason:"offline"}); return; }
      r.withSuccessHandler(function(v){ done(v || {ok:false, reason:"error"}); })
       .withFailureHandler(function(err){ done({ok:false, reason:"error", message:String(err && err.message || err)}); })
       [fn](arg);
    });
  }

  var SAY = {
    wrong:    function(r){ return "That password is not right." +
                (r.left > 0 ? " " + r.left + (r.left === 1 ? " attempt" : " attempts") + " left." : ""); },
    locked:   function(){ return "Too many wrong attempts. Try again in 15 minutes."; },
    "not-set":function(){ return "Editing has not been switched on yet. Ask whoever manages the Apps Script project to set an edit password."; },
    offline:  function(){ return "Editing only works in the published guide, not in a saved copy of the page."; },
    expired:  function(){ return "Your editing session has ended. Enter the password again, then save."; },
    unsafe:   function(){ return "That change contains something that cannot be saved. Remove any pasted code and try again."; },
    "too-long":function(){ return "That change is too long to save in one block."; },
    busy:     function(){ return "Someone else is saving at the same moment. Try again."; },
    invalid:  function(){ return "That change could not be saved. Reload the page and try again."; },
    stale:    function(){ return "Someone else changed this section while you were working on it, so your change was not saved. Their version is showing now. Make your change again."; },
    error:    function(){ return "Could not reach the server. Check your connection and try again."; }
  };
  function say(r){ return (SAY[r && r.reason] || SAY.error)(r || {}); }

  function el(tag, cls, text){
    var n = document.createElement(tag);
    if(cls) n.className = cls;
    if(text != null) n.textContent = text;
    return n;
  }
  function btn(cls, text){ var b = el("button", cls, text); b.type = "button"; return b; }

  function whoName(){
    if(editorName) return editorName;
    if(session && session.name) return session.name;
    var w = window.AMQC && window.AMQC.who;
    if(typeof w === "string") return w;
    if(w && w.name) return w.name;
    return "";
  }
  function sectionOf(key){ return key.split(":")[0]; }
  function sectionTitle(id){
    var s = document.getElementById(id), h = s && s.querySelector("h2,h1");
    return h ? E.norm(h.textContent) : id;
  }
  function textOf(html){ var d = document.createElement("div"); d.innerHTML = html || ""; return E.norm(d.textContent); }
  function when(iso){
    var d = new Date(iso);
    if(isNaN(d)) return "";
    return d.toLocaleDateString("en-AU", {day:"numeric", month:"short", year:"numeric"}) + ", " +
           d.toLocaleTimeString("en-AU", {hour:"numeric", minute:"2-digit"});
  }

  /* ---- toast ---------------------------------------------------------- */
  var toast = el("div", "edtoast"); toast.setAttribute("role", "status"); toast.hidden = true;
  document.body.appendChild(toast);
  var toastAt;
  function notify(text, bad){
    toast.textContent = text;
    toast.classList.toggle("bad", !!bad);
    toast.hidden = false;
    clearTimeout(toastAt);
    toastAt = setTimeout(function(){ toast.hidden = true; }, bad ? 6000 : 3500);
  }

  /* ---- the password dialog ------------------------------------------ */
  var dlg = el("div", "edlg"); dlg.hidden = true;
  dlg.innerHTML =
    '<form class="edlgbox" role="dialog" aria-modal="true" aria-labelledby="edlgT">' +
      '<h2 id="edlgT">Edit this guide</h2>' +
      '<p class="edlgsub">Changes you save go live for everyone straight away, and each one is recorded with your name.</p>' +
      '<label for="edname">Your name</label>' +
      '<input id="edname" type="text" autocomplete="name" maxlength="60" required>' +
      '<label for="edpw">Edit password</label>' +
      '<input id="edpw" type="password" autocomplete="current-password" required>' +
      '<p class="edmsg" role="alert"></p>' +
      '<div class="edacts"><button type="button" class="edquiet" data-x="cancel">Cancel</button>' +
      '<button type="submit" class="edgo">Unlock editing</button></div>' +
    '</form>';
  document.body.appendChild(dlg);
  var form = dlg.querySelector("form"), nameIn = dlg.querySelector("#edname"),
      pwIn = dlg.querySelector("#edpw"), msg = dlg.querySelector(".edmsg"),
      goBtn = dlg.querySelector(".edgo");
  var lastFocus = null, afterUnlock = null;

  function openDialog(then){
    afterUnlock = then || null;
    lastFocus = document.activeElement;
    msg.textContent = "";
    nameIn.value = whoName();
    pwIn.value = "";
    dlg.hidden = false;
    (nameIn.value ? pwIn : nameIn).focus();
  }
  function closeDialog(){
    dlg.hidden = true;
    if(lastFocus && lastFocus.focus) try{ lastFocus.focus(); }catch(e){}
  }
  dlg.addEventListener("click", function(e){
    if(e.target === dlg || (e.target.dataset && e.target.dataset.x === "cancel")) closeDialog();
  });
  dlg.addEventListener("keydown", function(e){ if(e.key === "Escape"){ e.preventDefault(); closeDialog(); } });
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var name = nameIn.value.trim();
    if(!name){ msg.textContent = "Enter your name. It is recorded with each change."; nameIn.focus(); return; }
    goBtn.disabled = true; goBtn.textContent = "Checking…"; msg.textContent = "";
    call("editUnlock", {password: pwIn.value, name: name}).then(function(r){
      goBtn.disabled = false; goBtn.textContent = "Unlock editing";
      if(!r.ok){ msg.textContent = say(r); pwIn.select(); return; }
      session = {v: r.token, exp: Date.now() + (r.ttl || 10800) * 1000 - 60000, name: name};
      editorName = name;
      ss.set(TOKEN_KEY, JSON.stringify(session));
      pwIn.value = "";
      closeDialog();
      if(r.live) refresh(r.live);
      var then = afterUnlock; afterUnlock = null;
      if(then) then(); else turnOn();
    });
  });

  /* ---- entry points --------------------------------------------------
     Out of the way of somebody doing the training: the foot of the
     Contents panel, and the build line at the end of the guide. */
  function entry(where, cls){
    var b = btn("edentry " + (cls || ""), "Edit this guide");
    b.addEventListener("click", function(){
      if(on){ turnOff(); return; }
      if(session && session.exp > Date.now()) turnOn(); else openDialog();
    });
    where.appendChild(b);
    return b;
  }
  var olfoot = document.querySelector("#outline .olfoot");
  if(olfoot) entry(olfoot, "inpanel");
  var stamp = document.querySelector(".buildstamp");
  if(stamp){
    var wrap = el("div", "edstampwrap");
    stamp.parentNode.insertBefore(wrap, stamp);
    wrap.appendChild(stamp);
    entry(wrap, "atstamp");
  }

  /* ---- edit mode ------------------------------------------------------ */
  var on = false, cur = null, curOrig = "", saving = false;
  var bar = el("div", "edbar"); bar.hidden = true;
  bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Editing");
  var barText = el("p", "edbartext");
  var changesBtn = btn("edquiet", "Changes");
  var doneBtn = btn("edgo", "Finish editing");
  bar.appendChild(barText); bar.appendChild(changesBtn); bar.appendChild(doneBtn);
  document.body.appendChild(bar);

  function liveKeys(){
    return Object.keys(E.live).filter(function(k){ return !(E.tpl && E.tpl.superseded(k)); });
  }
  function paintBar(){
    var n = liveKeys().length;
    barText.innerHTML = "";
    var b = el("b", null, "Editing as " + whoName() + ". ");
    barText.appendChild(b);
    barText.appendChild(document.createTextNode(E.tpl
      ? "Select any text to change it. Use the handles beside each block to move, add or delete. Changes go live for everyone."
      : "Select any text to change it. Saved changes go live for everyone."));
    changesBtn.textContent = "Changes (" + n + ")";
  }
  function turnOn(){
    on = true;
    document.body.classList.add("editing-on");
    if(E.tpl) document.body.classList.add("editing-tpl");
    bar.hidden = false;
    paintBar();
    [].forEach.call(document.querySelectorAll(".edentry"), function(b){ b.textContent = "Finish editing"; });
    notify("Editing is on. Select any text to change it.");
    document.dispatchEvent(new CustomEvent("amqc:editing", {detail:{on:true}}));
  }
  function turnOff(){
    if(cur && dirty() && !confirm("Discard the change you have not saved?")) return;
    stop(true);
    on = false;
    document.body.classList.remove("editing-on", "editing-tpl");
    bar.hidden = true;
    closePanel();
    session = null; ss.del(TOKEN_KEY);           /* finishing locks editing again */
    [].forEach.call(document.querySelectorAll(".edentry"), function(b){ b.textContent = "Edit this guide"; });
    document.dispatchEvent(new CustomEvent("amqc:editing", {detail:{on:false}}));
    /* a section redrawn while editing has not been wired up by the page's
       own scripts; a reload does that */
    notify(shapeChanged ? "Editing is locked. Reload the page to try the self-test, checklist and option buttons with your changes."
                        : "Editing is locked.");
  }
  doneBtn.addEventListener("click", turnOff);

  /* the live set changed: from a save, an undo, or someone else's save */
  function refresh(live){
    var before = E.live;
    E.live = live || {};
    var keys = {};
    Object.keys(before).forEach(function(k){ keys[k] = 1; });
    Object.keys(E.live).forEach(function(k){ keys[k] = 1; });
    Object.keys(keys).forEach(function(k){
      if(cur && cur.getAttribute("data-ek") === k) return;  /* not under the cursor */
      var a = before[k], b = E.live[k];
      if((a && a.h) !== (b && b.h)) E.apply(k, b);
    });
    if(on) paintBar();
    if(!panel.hidden) paintPanel();
  }

  /* ---- the toolbar on the block being changed ----------------------- */
  var tools = el("div", "edtools"); tools.hidden = true;
  var tBold = btn("edtool", "B"); tBold.setAttribute("aria-label", "Bold"); tBold.title = "Bold (Ctrl+B)";
  var tSave = btn("edgo", "Save");
  var tCancel = btn("edquiet", "Cancel");
  var tRestore = btn("edquiet edrestore", "Restore original");
  tools.appendChild(tBold); tools.appendChild(tSave); tools.appendChild(tCancel); tools.appendChild(tRestore);
  document.body.appendChild(tools);
  /* keep the selection in the block when a toolbar button is pressed */
  tools.addEventListener("mousedown", function(e){ if(e.target.closest("button")) e.preventDefault(); });

  function place(){
    if(!cur){ return; }
    var r = cur.getBoundingClientRect(), h = tools.offsetHeight || 40;
    var rail = document.querySelector(".rail");
    var floor = rail ? Math.max(0, rail.getBoundingClientRect().bottom) + 6 : 6;
    var top = r.top - h - 8;
    if(top < floor) top = r.bottom + 8;
    top = Math.min(Math.max(top, floor), window.innerHeight - h - 70);
    var left = Math.min(Math.max(8, r.left), window.innerWidth - tools.offsetWidth - 8);
    tools.style.top = Math.round(top) + "px";
    tools.style.left = Math.round(left) + "px";
  }
  var placing = false;
  function queuePlace(){ if(!placing && cur){ placing = true; requestAnimationFrame(function(){ placing = false; place(); }); } }
  window.addEventListener("scroll", queuePlace, {passive:true});
  window.addEventListener("resize", queuePlace);

  function dirty(){ return !!cur && E.sanitize(cur.innerHTML) !== E.sanitize(curOrig); }

  function start(block){
    if(cur === block) return;
    if(cur && dirty()){
      notify("Save or cancel the change you are making first.", true);
      cur.focus();
      return;
    }
    stop(true);
    cur = block;
    curOrig = block.innerHTML;
    block.setAttribute("contenteditable", "true");
    block.setAttribute("spellcheck", "true");
    block.classList.add("ed-on");
    tRestore.hidden = !E.live[block.getAttribute("data-ek")];
    tools.hidden = false;
    place();
    block.focus();
  }
  function stop(revert){
    if(!cur) return;
    if(revert) cur.innerHTML = curOrig;
    cur.removeAttribute("contenteditable");
    cur.removeAttribute("spellcheck");
    cur.classList.remove("ed-on");
    cur = null; curOrig = "";
    tools.hidden = true;
  }

  function save(){
    if(!cur || saving) return;
    var block = cur, key = block.getAttribute("data-ek");
    var html = E.sanitize(block.innerHTML);
    if(!E.norm(textOf(html))){ notify(E.tpl ? "A block cannot be left empty. To remove it, use Delete beside it."
                                            : "A block cannot be left empty. Use Restore original to undo a change.", true); return; }
    if(html === E.sanitize(curOrig)){ stop(true); return; }
    var unit = E.tpl && E.tpl.unitOf(block);
    if(unit){ saveInUnit(block, unit, html); return; }
    saving = true; tSave.disabled = true; tSave.textContent = "Saving…";
    call("saveContentEdit", {
      token: session && session.v, block: key, section: sectionOf(key),
      before: textOf(curOrig), after: html, name: whoName()
    }).then(function(r){
      saving = false; tSave.disabled = false; tSave.textContent = "Save";
      if(!r.ok){
        notify(say(r), true);
        if(r.reason === "expired"){ session = null; ss.del(TOKEN_KEY); openDialog(save); }
        return;
      }
      block.innerHTML = html;
      block.setAttribute("data-edited", "1");
      stop(false);
      refresh(r.live);
      notify("Saved. It is live for everyone.");
    });
  }
  /* ---- blank guides: a section is saved whole ----------------------- */
  var undoStack = [], shapeChanged = false, undoBtn = null;
  function paintUndo(){ if(undoBtn) undoBtn.disabled = !undoStack.length; }
  if(E.tpl){
    undoBtn = btn("edquiet", "Undo");
    undoBtn.title = "Undo your last change";
    undoBtn.disabled = true;
    bar.insertBefore(undoBtn, changesBtn);
    undoBtn.addEventListener("click", undo);
  }

  /* Save the copies of these sections, and the section order if asked, one
     after another. Each save names the version it started from. */
  function commit(units, before, withOrder){
    var jobs = units.map(function(u){ return {key: u + ":all", section: u, after: E.tpl.serialize(u)}; });
    if(withOrder) jobs.push({key: E.tpl.layoutKey, section: "page", after: JSON.stringify(E.tpl.order())});
    var done = [], i = 0;
    return new Promise(function(finish){
      (function next(){
        if(i >= jobs.length){
          if(done.length) undoStack.push(done);
          paintUndo();
          finish({ok:true, saved: done.map(function(d){ return d.key; })});
          return;
        }
        var j = jobs[i++], last = E.live[j.key];
        call("saveContentEdit", {
          token: session && session.v, block: j.key, section: j.section,
          before: String(before || "").slice(0, 4000), after: j.after, base: last ? last.at : "", name: whoName()
        }).then(function(r){
          if(r.live) refresh(r.live);
          if(!r.ok){
            if(done.length) undoStack.push(done);
            paintUndo();
            r.partial = done.length > 0;
            r.saved = done.map(function(d){ return d.key; });
            if(r.reason === "stale") r.staleKey = j.key;
            if(r.reason === "expired"){ session = null; ss.del(TOKEN_KEY); }
            finish(r);
            return;
          }
          done.push({key: j.key, at: E.live[j.key] && E.live[j.key].at});
          next();
        });
      })();
    });
  }
  function saveInUnit(block, unit, html){
    var hit = E.tpl.findP(block.getAttribute("data-eid"));
    if(!hit){ notify(say({reason:"invalid"}), true); return; }
    var prev = hit.node.innerHTML;
    hit.node.innerHTML = html;
    saving = true; tSave.disabled = true; tSave.textContent = "Saving…";
    commit([unit], textOf(curOrig)).then(function(r){
      saving = false; tSave.disabled = false; tSave.textContent = "Save";
      if(!r.ok){
        if(r.reason === "stale"){ stop(true); notify(say(r), true); return; }
        hit.node.innerHTML = prev;
        notify(say(r), true);
        if(r.reason === "expired") openDialog(save);
        return;
      }
      block.innerHTML = html;
      block.setAttribute("data-edited", "1");
      stop(false);
      E.tpl.sync();
      notify("Saved. It is live for everyone.");
    });
  }
  /* step back one save at a time, newest first */
  function undo(){
    if(saving || !undoStack.length) return;
    if(cur && dirty()){ notify("Save or cancel the change you are making first.", true); return; }
    stop(true);
    var last = undoStack.pop(), i = last.length - 1;
    saving = true; paintUndo();
    (function next(){
      if(i < 0){ saving = false; paintUndo(); notify("Undone for everyone."); return; }
      var k = last[i--];
      call("revertContentEdit", {token: session && session.v, block: k.key, step: "back", base: k.at || "", name: whoName()})
        .then(function(r){
          if(r.live) refresh(r.live);
          if(!r.ok){
            saving = false; paintUndo();
            if(r.reason === "expired"){ session = null; ss.del(TOKEN_KEY); undoStack.push(last.slice(0, i + 2)); openDialog(undo); return; }
            notify(r.reason === "stale"
              ? "Someone else has changed this since, so it cannot be undone from here. Use Changes to put it back the way it was built."
              : say(r), true);
            return;
          }
          next();
        });
    })();
  }

  function restore(){
    if(!cur || saving) return;
    var block = cur, key = block.getAttribute("data-ek");
    if(!E.live[key]){ stop(true); return; }
    if(!confirm("Put back the original wording for everyone?")) return;
    saving = true;
    call("revertContentEdit", {token: session && session.v, block: key, name: whoName()}).then(function(r){
      saving = false;
      if(!r.ok){
        notify(say(r), true);
        if(r.reason === "expired"){ session = null; ss.del(TOKEN_KEY); openDialog(restore); }
        return;
      }
      stop(false);
      refresh(r.live);
      E.apply(key, null);
      notify("Original wording restored for everyone.");
    });
  }
  tBold.addEventListener("click", function(){ if(cur) document.execCommand("bold"); });
  tSave.addEventListener("click", save);
  tCancel.addEventListener("click", function(){ stop(true); });
  tRestore.addEventListener("click", restore);

  /* Selecting a block in edit mode edits it rather than following a link
     or opening a card. Anything outside the editable blocks still works. */
  document.addEventListener("click", function(e){
    if(!on) return;
    var t = e.target;
    if(!t.closest || t.closest(".edtools,.edbar,.edpanel,.edlg,.edtoast,.edarr")) return;
    if(cur && cur.contains(t)){
      if(t.closest("a")) e.preventDefault();
      /* the wording of an answer or option button: placing the caret must
         not answer the question or switch the option */
      if(cur.closest("button")){ e.preventDefault(); e.stopPropagation(); }
      return;
    }
    var block = t.closest("[data-ek]");
    if(!block) return;
    e.preventDefault();
    e.stopPropagation();
    start(block);
  }, true);
  document.addEventListener("keydown", function(e){
    if(!cur || !cur.contains(e.target)) return;
    if(e.key === "Escape"){ e.preventDefault(); stop(true); return; }
    if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){ e.preventDefault(); save(); return; }
    if(e.key === "Enter"){ e.preventDefault(); document.execCommand("insertLineBreak"); return; }
    /* a space inside a button would press it, and inside a card's title
       would open or close the card */
    if(e.key === " " && cur.closest("button,summary")){ e.preventDefault(); document.execCommand("insertText", false, " "); }
  }, true);
  /* pasting brings text only, never another page's formatting */
  document.addEventListener("paste", function(e){
    if(!cur || !cur.contains(e.target)) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  }, true);
  document.addEventListener("drop", function(e){
    if(cur && cur.contains(e.target)) e.preventDefault();
  }, true);

  /* ---- the list of live changes -------------------------------------- */
  var panel = el("div", "edpanel"); panel.hidden = true;
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Live changes");
  document.body.appendChild(panel);
  function closePanel(){ panel.hidden = true; }
  changesBtn.addEventListener("click", function(){
    if(!panel.hidden){ closePanel(); return; }
    paintPanel(); panel.hidden = false;
    var f = panel.querySelector("button"); if(f) f.focus();
  });
  panel.addEventListener("keydown", function(e){ if(e.key === "Escape"){ closePanel(); changesBtn.focus(); } });

  function undoKey(key){
    var whole = E.tpl && E.tpl.unitKey(key), order = E.tpl && key === E.tpl.layoutKey;
    if(!confirm(order ? "Put the sections back in their original order, for everyone?"
              : whole ? "Put this section back the way it was first built, for everyone? Every change made to it is undone."
              : "Put back the original wording for everyone?")) return;
    call("revertContentEdit", {token: session && session.v, block: key, name: whoName()}).then(function(r){
      if(!r.ok){
        notify(say(r), true);
        if(r.reason === "expired"){ session = null; ss.del(TOKEN_KEY); openDialog(function(){ undoKey(key); }); }
        return;
      }
      refresh(r.live);
      if(!whole && !order) E.apply(key, null);
      notify(whole || order ? "Put back the way it was built, for everyone." : "Original wording restored for everyone.");
    });
  }
  /* the section order, as section titles */
  function orderText(h){
    var ids = [];
    try{ ids = JSON.parse(h) || []; }catch(e){}
    return ids.map(function(id){ var t = sectionTitle(id); return t === id ? "a removed section" : t; }).join(", ");
  }
  /* one save back, from the list of changes */
  function stepBack(key){
    var e = E.live[key];
    if(!e) return;
    call("revertContentEdit", {token: session && session.v, block: key, step: "back", base: e.at || "", name: whoName()}).then(function(r){
      if(r.live) refresh(r.live);
      if(!r.ok){
        notify(r.reason === "stale" ? "That changed again a moment ago. Look at Changes again." : say(r), true);
        if(r.reason === "expired"){ session = null; ss.del(TOKEN_KEY); openDialog(function(){ stepBack(key); }); }
        return;
      }
      notify("Undone for everyone.");
    });
  }

  /* what the arranging tools on a blank guide need from here */
  E.ui = {
    call: call, notify: notify, say: say, whoName: whoName,
    token: function(){ return session && session.v; },
    isOn: function(){ return on; },
    busy: function(){ return saving || (!!cur && dirty()); },
    stopEditing: function(){ stop(true); },
    openDialog: openDialog,
    expire: function(){ session = null; ss.del(TOKEN_KEY); },
    commit: commit,
    shapeChanged: function(){ shapeChanged = true; },
    saving: function(v){ saving = !!v; }
  };
  function paintPanel(){
    panel.innerHTML = "";
    var head = el("div", "edpanelhead");
    head.appendChild(el("h2", null, "Live changes"));
    var x = btn("edquiet", "Close"); x.addEventListener("click", closePanel);
    head.appendChild(x);
    panel.appendChild(head);
    var keys = liveKeys().sort(function(a, b){
      return String(E.live[b].at || "").localeCompare(String(E.live[a].at || ""));
    });
    if(!keys.length){
      panel.appendChild(el("p", "edempty", "Nothing has been changed. The guide shows its original wording."));
      return;
    }
    var list = el("ol", "edlist");
    keys.forEach(function(k){
      var e = E.live[k], li = el("li");
      var whole = E.tpl && E.tpl.unitKey(k), order = E.tpl && k === E.tpl.layoutKey;
      var orphan = E.orphans().indexOf(k) > -1;
      li.appendChild(el("p", "edwhere", order ? "Section order" : whole && sectionOf(k) === "mast" ? "Page heading" : sectionTitle(sectionOf(k))));
      var snip = order ? orderText(e.h) : textOf(e.h);
      li.appendChild(el("p", "edsnip", snip.length > 140 ? snip.slice(0, 140) + "…" : snip));
      li.appendChild(el("p", "edmeta", (e.by ? "Changed by " + e.by : "Changed") + (e.at ? ", " + when(e.at) : "")));
      if(orphan) li.appendChild(el("p", "edorphan",
        "Not showing: the original wording of this block changed in an update, so this edit no longer matches anything on the page."));
      var acts = el("div", "edacts");
      if(whole || order){
        var back = btn("edquiet", "Undo last change");
        back.addEventListener("click", function(){ stepBack(k); });
        acts.appendChild(back);
      }
      if(!orphan && !order){
        var show = btn("edquiet", "Show");
        show.addEventListener("click", function(){
          closePanel();
          var b = whole ? document.getElementById(sectionOf(k)) : E.byKey[k];
          if(!b){ notify("That section is not in the guide at the moment.", true); return; }
          if(window.AMQC && window.AMQC.scrollToEl) window.AMQC.scrollToEl(b);
          else b.scrollIntoView({block:"center"});
          b.classList.add("ed-flash");
          setTimeout(function(){ b.classList.remove("ed-flash"); }, 1600);
        });
        acts.appendChild(show);
      }
      var undo = btn("edquiet", orphan ? "Remove" : "Restore original");
      undo.addEventListener("click", function(){ undoKey(k); });
      acts.appendChild(undo);
      li.appendChild(acts);
      list.appendChild(li);
    });
    panel.appendChild(list);
  }

})();
</script>
