
/* SikaSense MVP — pages.js: WhatsApp chat bot (EN/TW/GA/EWE/HA), dashboard, invoice, signup. */
(function(){
  "use strict";
  var SS = window.SS; if (!SS || !SS.biz) return;
  var $ = function(s,r){ return (r||document).querySelector(s); };
  var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var esc = function(s){ return (s==null?"":String(s)).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };

  /* ============ MULTILINGUAL SUPPORT (EN / TW / GA / EWE / HA) ============ */
  /* Demo uses keyword matching + glossed native labels. Production would use an
     LLM intent parser with human-reviewed locale files per language. */
  function detectLang(t){
    if (/(^|\s)(nawa|kuɗi|kudi|jiya|yau|riba|bashi|sannu)(\s|$)/.test(t)) return "ha";
    if (/(^|\s)(shika|ojekoo|tuu|jɛ|je)(\s|$)/.test(t)) return "ga";
    if (/(^|\s)(etsɔ|egbe|vava|tɔtrɔ|woezo)(\s|$)/.test(t)) return "ee";
    if (/(^|\s)(nnora|nna|ndɛ)(\s|$)/.test(t)) return "tw";
    return "en";
  }
  function wantsYesterday(t){
    return /(^|\s)(yesterday|jiya|etsɔ|nnora|nna|jɛ|je)(\s|$)/.test(t);
  }
  var T = {
    en:{ prefix:"", sales:"Sales", exp:"Expenses", profit:"Profit", debtsH:"Outstanding debts",
      total:"Total", yest:"Yesterday", today:"Today so far", okStock:"All stock levels are healthy for the next 7 days.",
      fallback:"Hmm, I didn't catch that. Type <b>help</b> to see what I can do — or send a voice note 🎤." },
    tw:{ prefix:"Akwaaba! ", sales:"Sika a wɔanya (revenue)", exp:"Sika a wɔde atua (expenses)",
      profit:"Mpata (net profit)", debtsH:"Ka a wɔwɔ (debts owed)", total:"Nyinaa (total)",
      yest:"Nna (yesterday)", today:"Ndɛ (today)", okStock:"Nneɛma nyinaa wɔ hɔ — nnaawa 7 nkutoo.",
      fallback:"Mente aseɛ. Kyerɛw <b>help</b> ma minhu nea metumi ayɛ." },
    ga:{ prefix:"Ojekoo! ", sales:"Shika a wɔtsɛ (revenue)", exp:"Shika a wɔfaŋ (expenses)",
      profit:"Shikaŋmɔŋ (profit)", debtsH:"Shika tsɔɔ (debts owed)", total:"Kplɛŋ (total)",
      yest:"Jɛ (yesterday)", today:"Jaraa (today)", okStock:"Aadeɛ nyɛ shɛklɛŋ ehe tsɔɔ niŋŋ ei.",
      fallback:"Miŋtsɛɛ sɛɛ. Ŋaa <b>help</b> ni miŋŋɔɔ." },
    ee:{ prefix:"Woezo! ", sales:"Ga si wo tɔ (revenue)", exp:"Ga si wo feli (expenses)",
      profit:"Vava (profit)", debtsH:"Ga tsi (debts owed)", total:"Kekeme (total)",
      yest:"Etsɔ (yesterday)", today:"Egbe (today)", okStock:"Nuɖuɖu ɖe ɖe sia — ŋkeke 7 ko.",
      fallback:"Mekuɖo ŋu o. Ŋlɔ <b>help</b> be nànye nuɖuɖu siwo wɔm." },
    ha:{ prefix:"Sannu! ", sales:"Tallace-tallace", exp:"Kashe kuɗi", profit:"Riba",
      debtsH:"Bashi (debts owed)", total:"Jimla", yest:"Jiya", today:"Yau",
      okStock:"Duka ajiya lafiya — na mako 7 ne kawai.",
      fallback:"Ban gane ba. Rubuta <b>help</b> don ga ga abin da zan iya yi." }
  };

  /* ============ 1. WHATSAPP CHAT DEMO ============ */
  var chatLog = $("#chat-log");
  if (chatLog) {
    function addBubble(text, who, sub){
      var b = document.createElement("div");
      b.className = "bubble " + who;
      b.innerHTML = text + (sub ? "<small>" + esc(sub) + "</small>" : "");
      chatLog.appendChild(b); chatLog.scrollTop = chatLog.scrollHeight;
      return b;
    }
    function typing(cb, delay){
      var t = document.createElement("div"); t.className = "typing"; t.textContent = "SikaSense is typing…";
      chatLog.appendChild(t); chatLog.scrollTop = chatLog.scrollHeight;
      setTimeout(function(){ t.remove(); cb(); }, delay || 900);
    }
    function bot(raw){
      var t = raw.toLowerCase(), B = SS.biz, fmt = SS.fmt;
      var lang = detectLang(t), L = T[lang], out = null, m;
      var P = L.prefix;
      if ((m = t.match(/sold (\d+) ([\w ]+?) for (\d+(?:\.\d+)?)/))) {
        B.recordSale(m[2], Number(m[1]), Number(m[3]));
        out = "✅ Recorded: sold <b>" + esc(m[1]) + " × " + esc(m[2]) + "</b> for <span class='amount'>" + fmt(m[3]) + "</span> (MoMo). Today's profit updated.";
      } else if ((m = t.match(/spent (\d+(?:\.\d+)?) on ([\w ]+)/))) {
        B.recordExpense(m[2], Number(m[1]));
        out = "✅ Expense recorded: <b>" + esc(m[2]) + "</b> — <span class='amount'>" + fmt(m[1]) + "</span>.";
      } else if (/owe|debt|bashi|ga tsi|shika tsɔɔ|ka a wɔwɔ/.test(t)) {
        var cs = B.debts();
        out = P + "💰 <b>" + esc(L.debtsH) + " (" + cs.length + ")</b><br>" + cs.map(function(c){
          return "• " + esc(c.name) + " — <span class='amount'>" + fmt(c.debt) + "</span>"; }).join("<br>") +
          "<br><b>" + esc(L.total) + ": <span class='amount'>" + fmt(B.totalDebt()) + "</span></b>";
      } else if (/(made|profit|earn|how much|nawa|riba|vava|shikaŋmɔŋ|shikaŋmɔn|ga|mpata)/.test(t) || (/(yesterday|today|jiya|yau|etsɔ|egbe|nnora|ndɛ|jɛ|je)/.test(t) && /(much|many|didi)/.test(t))) {
        var useYest = wantsYesterday(t);
        var s = useYest ? B.dayStats(B.yesterdayStr()) : B.dayStats(B.todayStr());
        var when = useYest ? L.yest + " (" + B.prettyDate(B.yesterdayStr()) + ")" : L.today;
        out = P + "📊 <b>" + esc(when) + "</b><br>" + esc(L.sales) + ": " + s.salesCount + " → <span class='amount'>" + fmt(s.revenue) + "</span><br>" +
              esc(L.exp) + ": " + fmt(s.expenses) + "<br><b>" + esc(L.profit) + ": <span class='amount'>" + fmt(s.profit) + "</span></b> 🎉";
      } else if (/remind/.test(t) && /debt/.test(t)) {
        out = "📲 Reminders sent to " + B.debts().length + " debtors on WhatsApp. <i>(Demo — in production this sends via the WhatsApp Business API.)</i>";
      } else if (/stock|finish|run out|ajiya|nuɖuɖu|aadeɛ/.test(t)) {
        var st = B.stockPredict().filter(function(x){ return x.status !== "ok"; });
        out = st.length
          ? "⚠️ <b>Stock alerts</b><br>" + st.map(function(x){
              return "• " + esc(x.p.name) + ": " + x.p.stock + " left (~" + x.daysLeft + " days at current sales). Reorder ~" + x.reorderQty + " units."; }).join("<br>")
          : "✅ " + esc(L.okStock);
      } else if (/report|summary|labari/.test(t)) {
        var r = B.dayStats(B.todayStr()), tp = B.taxReport();
        out = "🗞️ <b>Daily report — today</b><br>Revenue: <span class='amount'>" + fmt(r.revenue) + "</span> · Expenses: " + fmt(r.expenses) + " · <b>Profit: " + fmt(r.profit) + "</b><br>Debts outstanding: " + fmt(B.totalDebt()) + "<br>Low stock: " + B.stockPredict().filter(function(x){return x.status!=="ok";}).length + " items<br>MoMo fees this week: " + fmt(B.reconSummary().fees);
      } else if (/momo|reconcile|bank/.test(t)) {
        var rs = B.reconSummary();
        out = "🏦 <b>MoMo reconciliation</b><br>" + rs.matched + " transactions matched ✅<br>" + rs.problems + " problem(s) need your review ⚠️<br>Fees paid: " + fmt(rs.fees) + "<br>See the full table on your Dashboard.";
      } else if (/tax|vat|gra|haraji/.test(t)) {
        var tx = B.taxReport();
        out = "🧾 <b>Tax snapshot (" + esc(tx.period) + ")</b><br>Revenue: " + fmt(tx.revenue) + "<br>Expenses: " + fmt(tx.expenses) + "<br>Net profit: <b>" + fmt(tx.profit) + "</b><br>Est. VAT (" + Math.round(SS.CONFIG.VAT_RATE*100) + "%): " + fmt(tx.vat) + "<br><i>Full GRA-ready report on the Dashboard.</i>";
      } else if (/invoice/.test(t)) {
        out = "🧾 You can generate a branded invoice here: <a href='invoice.html' style='color:#7FD6B6'>Open Invoice Generator</a>";
      } else if (/help|menu|commands|what can/.test(t)) {
        out = "🤖 <b>I understand English, Twi, Ga, Ewe &amp; Hausa.</b> Try:<br>• “how much did i make yesterday?” · “nawa na samu jiya?” · “etsɔ vava ɖe?” · “nnora mpata ɛwom?”<br>• “sold 3 rice for 195” · “spent 50 on data”<br>• “who owes me?” · “stock” · “daily report”<br>• “momo reconciliation” · “tax report” · “invoice”";
      } else {
        out = P + L.fallback;
      }
      return out;
    }
    function send(text){
      if (!text.trim()) return;
      addBubble(esc(text), "out", new Date().toLocaleTimeString("en-GH",{hour:"numeric",minute:"2-digit"}));
      typing(function(){ addBubble(bot(text), "in", "SikaSense · now"); }, 700 + Math.random()*700);
    }
    var input = $("#chat-input");
    $("#chat-send").addEventListener("click", function(){ send(input.value); input.value = ""; input.focus(); });
    input.addEventListener("keydown", function(e){ if (e.key === "Enter"){ send(input.value); input.value = ""; } });
    $$(".chip").forEach(function(c){ c.addEventListener("click", function(){ send(c.textContent); }); });

    /* Voice note: real recording when the mic is allowed, simulated transcript otherwise */
    var recBtn = $("#chat-voice"), recorder = null, chunks = [];
    if (recBtn) recBtn.addEventListener("click", function(){
      if (recorder && recorder.state === "recording") { recorder.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) { simulateVoice(); return; }
      navigator.mediaDevices.getUserMedia({ audio:true }).then(function(stream){
        chunks = []; recorder = new MediaRecorder(stream);
        recorder.ondataavailable = function(e){ chunks.push(e.data); };
        recorder.onstop = function(){
          recBtn.classList.remove("rec"); recBtn.textContent = "🎤";
          var url = URL.createObjectURL(new Blob(chunks, { type:"audio/webm" }));
          var b = document.createElement("div"); b.className = "bubble out";
          b.innerHTML = "<audio controls src='" + url + "' style='max-width:200px'></audio>";
          chatLog.appendChild(b); chatLog.scrollTop = chatLog.scrollHeight;
          stream.getTracks().forEach(function(tr){ tr.stop(); });
          typing(function(){
            addBubble("🎤 <i>Transcript:</i> “how much did i make yesterday?”", "in", "SikaSense · voice");
            typing(function(){ addBubble(bot("how much did i make yesterday"), "in", "SikaSense · now"); }, 800);
          }, 900);
        };
        recorder.start(); recBtn.classList.add("rec"); recBtn.textContent = "⏹";
      }).catch(simulateVoice);
    });
    function simulateVoice(){
      addBubble("🎤 <i>Voice note (mic unavailable in demo)</i>", "out", "0:04");
      typing(function(){
        addBubble("🎤 <i>Transcript:</i> “how much did i make yesterday?”", "in", "SikaSense · voice");
        typing(function(){ addBubble(bot("how much did i make yesterday"), "in", "SikaSense · now"); }, 800);
      }, 900);
    }
    typing(function(){ addBubble("Akwaaba! 👋 I'm <b>SikaSense</b> — your AI business manager. I understand <b>English, Twi, Ga, Ewe &amp; Hausa</b>. Try <i>“how much did i make yesterday?”</i> or type <b>help</b>.", "in", "SikaSense"); }, 500);
  }

  /* ============ 2. DASHBOARD ============ */
  var dash = $("#dashboard");
  if (dash) {
    var B = SS.biz, fmt = SS.fmt;
    var today = B.dayStats(B.todayStr());
    $("#kpi-revenue").textContent = fmt(today.revenue);
    $("#kpi-profit").textContent = fmt(today.profit);
    $("#kpi-debt").textContent = fmt(B.totalDebt());
    var low = B.stockPredict().filter(function(x){return x.status!=="ok";}).length;
    $("#kpi-stock").textContent = low + " item" + (low===1?"":"s");
    var rs = B.reconSummary();
    $("#kpi-recon").textContent = rs.problems + " to review";

    $("#stock-body").innerHTML = B.stockPredict().map(function(x){
      var pct = x.daysLeft==="∞" ? 100 : Math.min(100, (x.daysLeft/14)*100);
      var cls = x.status==="critical" ? "crit" : (x.status==="low" ? "low" : "");
      var badge = x.status==="ok" ? '<span class="badge badge-ok">OK</span>'
        : x.status==="low" ? '<span class="badge badge-warn">Low</span>' : '<span class="badge badge-bad">Critical</span>';
      return "<tr><td><strong>"+esc(x.p.name)+"</strong></td><td>"+x.p.stock+"</td><td>"+x.avgDaily+"/day</td>"+
        "<td>"+(x.daysLeft==="∞"?"—":x.daysLeft+" days")+" "+badge+"</td>"+
        "<td><div class='bar "+cls+"' aria-hidden='true'><i style='width:"+pct+"%'></i></div></td>"+
        "<td>"+(x.reorderQty>0?x.reorderQty+" units":"—")+"</td></tr>";
    }).join("");

    $("#debt-body").innerHTML = B.debts().map(function(c){
      var wa = "https://wa.me/" + c.phone.replace(/[^0-9]/g,"") + "?text=" +
        encodeURIComponent("Hi " + c.name + ", friendly reminder from SikaSense: you owe " + fmt(c.debt) + " on your last purchase. Thank you! 🙏");
      return "<tr><td><strong>"+esc(c.name)+"</strong><br><small>"+esc(c.phone)+"</small></td><td class='amount'>"+fmt(c.debt)+"</td>"+
        "<td>"+B.prettyDate(c.since)+"</td><td><a class='btn btn-wa btn-sm no-print' href='"+wa+"' target='_blank' rel='noopener'>Remind on WhatsApp</a></td></tr>";
    }).join("");

    $("#recon-body").innerHTML = B.reconcile().map(function(r){
      var badge = r.status==="Matched" ? '<span class="badge badge-ok">Matched</span>'
        : r.status==="Missing settlement" ? '<span class="badge badge-warn">Missing settlement</span>'
        : '<span class="badge badge-bad">No matching sale</span>';
      return "<tr><td>"+esc(r.ref)+"</td><td>"+B.prettyDate(r.date)+"</td><td>"+fmt(r.amount)+"</td><td>"+fmt(r.fee)+"</td><td>"+badge+"</td></tr>";
    }).join("");

    var tx = B.taxReport();
    $("#tax-body").innerHTML =
      "<tr><td>Reporting period</td><td>"+esc(tx.period)+"</td></tr>"+
      "<tr><td>Total revenue</td><td class='amount'>"+fmt(tx.revenue)+"</td></tr>"+
      "<tr><td>Total expenses</td><td class='amount'>"+fmt(tx.expenses)+"</td></tr>"+
      "<tr><td><strong>Net profit</strong></td><td><strong class='amount'>"+fmt(tx.profit)+"</strong></td></tr>"+
      "<tr><td>Output VAT ("+Math.round(SS.CONFIG.VAT_RATE*100)+"%)</td><td class='amount'>"+fmt(tx.vat)+"</td></tr>"+
      "<tr><td>Income tax (estimate @ 5% of profit)</td><td class='amount'>"+fmt(Math.max(0, tx.profit*0.05).toFixed(2))+"</td></tr>";

    $$(".tab").forEach(function(tab){
      tab.addEventListener("click", function(){
        $$(".tab").forEach(function(t){ t.setAttribute("aria-selected","false"); });
        tab.setAttribute("aria-selected","true");
        $$(".panel").forEach(function(p){ p.classList.remove("active"); });
        $("#panel-"+tab.getAttribute("data-tab")).classList.add("active");
      });
    });
  }

  /* ============ 3. INVOICE GENERATOR ============ */
  var invForm = $("#invoice-form");
  if (invForm) {
    var items = [];
    function render(){
      var box = $("#invoice-items");
      box.innerHTML = items.length ? items.map(function(it,i){
        return "<tr><td>"+esc(it.desc)+"</td><td>"+it.qty+"</td><td>"+SS.fmt(it.price)+"</td><td>"+SS.fmt(it.qty*it.price)+"</td>"+
          "<td class='no-print'><button type='button' class='btn btn-ghost btn-sm' data-del='"+i+"'>Remove</button></td></tr>";
      }).join("") : "<tr><td colspan='5' class='empty-state'>No items yet — add at least one.</td></tr>";
      $$("[data-del]", box).forEach(function(b){ b.addEventListener("click", function(){ items.splice(Number(b.getAttribute("data-del")),1); render(); }); });
    }
    $("#inv-add").addEventListener("click", function(){
      var desc = $("#inv-desc"), qty = $("#inv-qty"), price = $("#inv-price");
      if (!desc.value.trim() || !(Number(qty.value)>0) || !(Number(price.value)>0)) {
        alert("Enter a description, quantity and unit price."); return;
      }
      items.push({ desc:desc.value.trim(), qty:Number(qty.value), price:Number(price.value) });
      desc.value=""; qty.value=""; price.value=""; desc.focus(); render();
    });
    render();
    invForm.addEventListener("submit", function(e){
      e.preventDefault();
      var biz = $("#inv-biz").value.trim(), cust = $("#inv-cust").value.trim(), phone = $("#inv-phone").value.trim();
      if (biz.length<2 || cust.length<2) { alert("Enter your business name and the customer name."); return; }
      if (!items.length) { alert("Add at least one item."); return; }
      var sub = items.reduce(function(s,i){ return s+i.qty*i.price; },0);
      var vat = sub*SS.CONFIG.VAT_RATE, total = sub+vat, num = "INV-" + new Date().getFullYear() + "-" + String(Math.floor(1000+Math.random()*9000));
      $("#invoice-preview").innerHTML =
        "<div style='display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem'>"+
        "<div><h2>INVOICE</h2><p style='margin:0'><strong>"+esc(num)+"</strong><br>"+new Date().toLocaleDateString("en-GH",{dateStyle:"long"})+"</p></div>"+
        "<div style='text-align:right'><strong style='color:var(--green-900);font-size:1.2rem'>"+esc(biz)+"</strong><br><span class='consent-note'>Powered by SikaSense</span></div></div>"+
        "<hr style='border:none;border-top:1px solid var(--line);margin:1rem 0'>"+
        "<p><strong>Bill to:</strong> "+esc(cust)+(phone?" · "+esc(phone):"")+"</p>"+
        "<div class='table-wrap'><table><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr>"+
        items.map(function(it){ return "<tr><td>"+esc(it.desc)+"</td><td>"+it.qty+"</td><td>"+SS.fmt(it.price)+"</td><td>"+SS.fmt(it.qty*it.price)+"</td></tr>"; }).join("")+
        "</table></div>"+
        "<div style='text-align:right;margin-top:1rem'>"+
        "<p>Subtotal: "+SS.fmt(sub)+"</p><p>VAT ("+Math.round(SS.CONFIG.VAT_RATE*100)+"%): "+SS.fmt(vat.toFixed(2))+"</p>"+
        "<p style='font-size:1.3rem'><strong>Total due: "+SS.fmt(total.toFixed(2))+"</strong></p>"+
        "<p class='consent-note'>Pay via MoMo to your registered number. Thank you for your business!</p>"+
        "<button class='btn btn-primary no-print' onclick='window.print()' style='margin-top:.6rem'>Print / Save as PDF</button></div>";
      $("#invoice-preview").scrollIntoView({ behavior:"smooth" });
    });
  }

  /* ============ 4. SIGNUP FORM (index) ============ */
  var form = $("#ss-signup");
  if (form) {
    var loadedAt = Date.now();
    var hp = $(".hp-field input", form);
    var a = Math.floor(Math.random()*8)+2, b = Math.floor(Math.random()*8)+1;
    var capQ = $("#captcha-q"); if (capQ) capQ.textContent = "Spam check: what is " + a + " + " + b + "?";
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, phoneRe = /^[+0-9 ()-]{7,20}$/;
    function setErr(inp, msg){
      var err = document.getElementById(inp.id + "-error");
      inp.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
      return !msg;
    }
    form.addEventListener("submit", function(e){
      e.preventDefault();
      if (hp && hp.value) return;
      if (Date.now() - loadedAt < 2500) { alert("Please take a moment to complete the form."); return; }
      var ok = true;
      $$("input[required], select[required]", form).forEach(function(inp){
        var v = inp.value.trim(), msg = "";
        if (!v) msg = "This field is required.";
        else if (inp.type === "email" && !emailRe.test(v)) msg = "Enter a valid email.";
        else if (inp.dataset.validate === "phone" && !phoneRe.test(v)) msg = "Enter a valid phone number.";
        if (!setErr(inp, msg)) ok = false;
      });
      var cap = $("#captcha-a");
      if (cap && Number(cap.value) !== a + b) { setErr(cap, "Incorrect answer."); ok = false; }
      if (!ok) { var bad = $("[aria-invalid='true']", form); if (bad) bad.focus(); return; }
      form.reset();
      var box = $("#form-success");
      box.removeAttribute("hidden");
      box.innerHTML = "<strong>You're on the list!</strong> We'll WhatsApp you within 24 hours to set up your business. Meanwhile, try the <a href='demo.html'>live demo →</a>";
      box.focus();
    });
  }
})();
