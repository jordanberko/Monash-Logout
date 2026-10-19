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
      /* a server function this deployment does not have yet (a new page
         with an old Code.gs) answers as an error rather than breaking the page */
      try{
        var api = r.withSuccessHandler(function(v){ done(v || {ok:false, reason:"error"}); })
                   .withFailureHandler(function(err){ done({ok:false, reason:"error", message:String(err && err.message || err)}); });
        if(typeof api[fn] !== "function"){ done({ok:false, reason:"error"}); return; }
        api[fn](arg);
      }catch(e){ done({ok:false, reason:"error", message:String(e && e.message || e)}); }
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
    var s = document.getElementById(id), h = s && s.querySelector("h2");
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

  function paintBar(){
    var n = Object.keys(E.live).length;
    barText.innerHTML = "";
    var b = el("b", null, "Editing as " + whoName() + ". ");
    barText.appendChild(b);
    barText.appendChild(document.createTextNode("Select any text to change it. Saved changes go live for everyone."));
    changesBtn.textContent = "Changes (" + n + ")";
  }
  function turnOn(){
    on = true;
    document.body.classList.add("editing-on");
    bar.hidden = false;
    paintBar();
    [].forEach.call(document.querySelectorAll(".edentry"), function(b){ b.textContent = "Finish editing"; });
    notify("Editing is on. Select any text to change it.");
  }
  function turnOff(){
    if(cur && dirty() && !confirm("Discard the change you have not saved?")) return;
    stop(true);
    on = false;
    document.body.classList.remove("editing-on");
    bar.hidden = true;
    closePanel();
    session = null; ss.del(TOKEN_KEY);           /* finishing locks editing again */
    [].forEach.call(document.querySelectorAll(".edentry"), function(b){ b.textContent = "Edit this guide"; });
    notify("Editing is locked.");
  }
  doneBtn.addEventListener("click", turnOff);

  /* the live set changed: from a save, an undo, or someone else's save */
  var refreshes = 0;
  function refresh(live){
    refreshes++;
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
    if(!E.norm(textOf(html))){ notify("A block cannot be left empty. Use Restore original to undo a change.", true); return; }
    if(html === E.sanitize(curOrig)){ stop(true); return; }
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
    if(!t.closest || t.closest(".edtools,.edbar,.edpanel,.edlg,.edtoast")) return;
    if(cur && cur.contains(t)){ if(t.closest("a")) e.preventDefault(); return; }
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
    if(e.key === "Enter"){ e.preventDefault(); document.execCommand("insertLineBreak"); }
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
    if(!confirm("Put back the original wording for everyone?")) return;
    call("revertContentEdit", {token: session && session.v, block: key, name: whoName()}).then(function(r){
      if(!r.ok){
        notify(say(r), true);
        if(r.reason === "expired"){ session = null; ss.del(TOKEN_KEY); openDialog(function(){ undoKey(key); }); }
        return;
      }
      refresh(r.live);
      E.apply(key, null);
      notify("Original wording restored for everyone.");
    });
  }
  function paintPanel(){
    panel.innerHTML = "";
    var head = el("div", "edpanelhead");
    head.appendChild(el("h2", null, "Live changes"));
    var x = btn("edquiet", "Close"); x.addEventListener("click", closePanel);
    head.appendChild(x);
    panel.appendChild(head);
    var keys = Object.keys(E.live).sort(function(a, b){
      return String(E.live[b].at || "").localeCompare(String(E.live[a].at || ""));
    });
    if(!keys.length){
      panel.appendChild(el("p", "edempty", "Nothing has been changed. The guide shows its original wording."));
      return;
    }
    var list = el("ol", "edlist");
    keys.forEach(function(k){
      var e = E.live[k], li = el("li");
      var orphan = !E.byKey[k];
      li.appendChild(el("p", "edwhere", sectionTitle(sectionOf(k))));
      var snip = textOf(e.h);
      li.appendChild(el("p", "edsnip", snip.length > 140 ? snip.slice(0, 140) + "…" : snip));
      li.appendChild(el("p", "edmeta", (e.by ? "Changed by " + e.by : "Changed") + (e.at ? ", " + when(e.at) : "")));
      if(orphan) li.appendChild(el("p", "edorphan",
        "Not showing: the original wording of this block changed in an update, so this edit no longer matches anything on the page."));
      var acts = el("div", "edacts");
      if(!orphan){
        var show = btn("edquiet", "Show");
        show.addEventListener("click", function(){
          closePanel();
          var b = E.byKey[k];
          /* a block inside a folded field has to be opened before it can be shown */
          for(var d = b.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) d.open = true;
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

  /* ---- on every load ---------------------------------------------------
     The edits normally arrive written into the page. Ask the server as well,
     so a saved change shows on every load even when that copy is missing or
     out of date. Only blocks that differ are touched, and the answer is
     ignored if a save, undo or unlock has already brought a newer set. */
  (function(){
    var seen = refreshes;
    call("getLiveEdits").then(function(live){
      if(!live || typeof live !== "object" || live.ok === false || refreshes !== seen) return;
      var missed = Object.keys(live).filter(function(k){ return !E.live[k] || E.live[k].h !== live[k].h; }).length;
      if(missed && window.console) console.warn("Live edits: " + missed + " applied from the server" +
        (E.filled ? " (the copy in the page was out of date)." : " (the page arrived without them)."));
      refresh(live);
    });
  })();
})();
</script>
