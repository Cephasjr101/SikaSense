
/* SikaSense MVP — data.js: seed business data + sales/profit/stock/recon/tax engine. */
(function(){
  "use strict";
  var SS = window.SS = window.SS || {};
  var DAY = 86400000;
  function daysAgo(n){ return new Date(Date.now() - n*DAY); }
  function iso(d){ return d.toISOString().slice(0,10); }

  function seed(){
    if (SS.read("ss_seeded", false)) return;
    var products = [
      { id:"P1", name:"Rice (5kg bag)", price:65,  stock:42,  soldLast7d:56 },
      { id:"P2", name:"Palm oil (1L)",  price:28,  stock:8,   soldLast7d:35 },
      { id:"P3", name:"Tomato paste",   price:12,  stock:120, soldLast7d:30 },
      { id:"P4", name:"Frozen chicken", price:45,  stock:5,   soldLast7d:40 },
      { id:"P5", name:"Detergent",      price:18,  stock:200, soldLast7d:14 }
    ];
    var sales = [];
    var channels = ["MoMo","MoMo","MoMo","Cash","Bank"];
    var sid = 1;
    for (var dAgo = 7; dAgo >= 1; dAgo--) {
      var n = 4 + Math.floor(Math.random()*4);
      for (var i=0;i<n;i++){
        var p = products[Math.floor(Math.random()*products.length)];
        var qty = 1 + Math.floor(Math.random()*4);
        var ch = channels[Math.floor(Math.random()*channels.length)];
        sales.push({ id:"S"+(sid++), date: iso(daysAgo(dAgo)), item:p.name, qty:qty,
          amount: qty*p.price, channel: ch,
          ref: ch==="MoMo" ? "MOMO"+Math.floor(1e9+Math.random()*9e9) : (ch==="Bank" ? "BNK"+Math.floor(1e8+Math.random()*9e8) : "") });
      }
    }
    /* one MoMo sale deliberately missing from statement, one statement tx with no sale */
    var momoTx = sales.filter(function(s){ return s.channel==="MoMo"; }).map(function(s){
      return { id:"TX-"+s.id, date:s.date, ref:s.ref, amount:s.amount, fee:+(s.amount*0.01).toFixed(2), saleId:s.id };
    });
    momoTx.splice(2,1); /* missing settlement */
    momoTx.push({ id:"TX-ORPHAN", date: iso(daysAgo(2)), ref:"MOMO9988776655", amount:120, fee:1.20, saleId:null }); /* orphan */

    var expenses = [
      { id:"E1", date:iso(daysAgo(7)), desc:"Market stall rent (weekly)", amount:350 },
      { id:"E2", date:iso(daysAgo(6)), desc:"Stock delivery (trotro)", amount:85 },
      { id:"E3", date:iso(daysAgo(5)), desc:"Packaging materials", amount:60 },
      { id:"E4", date:iso(daysAgo(4)), desc:"Electricity (ECG)", amount:140 },
      { id:"E5", date:iso(daysAgo(3)), desc:"Stock restock — rice", amount:900 },
      { id:"E6", date:iso(daysAgo(2)), desc:"Phone data", amount:50 },
      { id:"E7", date:iso(daysAgo(1)), desc:"Staff allowance", amount:120 }
    ];
    var customers = [
      { id:"C1", name:"Auntie Esi Chop Bar", phone:"+233241234567", debt:340, since:iso(daysAgo(21)) },
      { id:"C2", name:"Kwame Provision Store", phone:"+233209876543", debt:150, since:iso(daysAgo(9)) },
      { id:"C3", name:"Rev. Owusu (church event)", phone:"+233551112222", debt:600, since:iso(daysAgo(30)) }
    ];
    SS.store("ss_products", products); SS.store("ss_sales", sales);
    SS.store("ss_expenses", expenses); SS.store("ss_customers", customers);
    SS.store("ss_momo", momoTx);
    SS.store("ss_seeded", true);
  }
  function store(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function read(k,f){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):f; }catch(e){ return f; } }

  var fmt = function(n){ return "GH₵ " + Number(n).toLocaleString("en-GH",{maximumFractionDigits:2}); };
  function onDate(list, dateStr){ return list.filter(function(x){ return x.date === dateStr; }); }
  function sum(list, key){ return list.reduce(function(s,x){ return s + Number(x[key]||0); }, 0); }

  SS.store = store; SS.read = read; SS.fmt = fmt; SS.seed = seed;
  SS.biz = {
    dayStats: function(dateStr){
      var s = onDate(read("ss_sales",[]), dateStr), e = onDate(read("ss_expenses",[]), dateStr);
      var rev = sum(s,"amount"), exp = sum(e,"amount");
      return { salesCount:s.length, revenue:rev, expenses:exp, profit:rev-exp, byChannel:{
        MoMo: sum(s.filter(function(x){return x.channel==="MoMo";}),"amount"),
        Cash: sum(s.filter(function(x){return x.channel==="Cash";}),"amount"),
        Bank: sum(s.filter(function(x){return x.channel==="Bank";}),"amount") } };
    },
    yesterdayStr: function(){ return iso(daysAgo(1)); },
    todayStr: function(){ return iso(daysAgo(0)); },
    stockPredict: function(){
      return read("ss_products",[]).map(function(p){
        var avg = p.soldLast7d/7, days = avg>0 ? p.stock/avg : 999;
        var status = days < 3 ? "critical" : (days < 7 ? "low" : "ok");
        return { p:p, avgDaily:+avg.toFixed(1), daysLeft: days>900 ? "∞" : Math.floor(days), status:status,
                 reorderQty: Math.max(0, Math.ceil(avg*14) - p.stock) };
      }).sort(function(a,b){ return (a.daysLeft==="∞"?999:a.daysLeft) - (b.daysLeft==="∞"?999:b.daysLeft); });
    },
    debts: function(){ return read("ss_customers",[]); },
    totalDebt: function(){ return sum(read("ss_customers",[]),"debt"); },
    reconcile: function(){
      var sales = read("ss_sales",[]), momo = read("ss_momo",[]);
      var rows = momo.map(function(t){
        var sale = sales.filter(function(s){ return s.id === t.saleId; })[0];
        return { ref:t.ref, date:t.date, amount:t.amount, fee:t.fee,
                 status: sale ? "Matched" : "No matching sale", saleRef: sale ? sale.id : "—" };
      });
      sales.filter(function(s){ return s.channel==="MoMo"; }).forEach(function(s){
        if (!momo.some(function(t){ return t.saleId === s.id; }))
          rows.push({ ref:s.ref, date:s.date, amount:s.amount, fee:0, status:"Missing settlement", saleRef:s.id });
      });
      return rows.sort(function(a,b){ return a.date < b.date ? 1 : -1; });
    },
    reconSummary: function(){
      var rows = SS.biz.reconcile(), m = rows.filter(function(r){return r.status==="Matched";}).length;
      return { matched:m, problems: rows.length - m, fees: rows.reduce(function(s,r){return s+r.fee;},0) };
    },
    taxReport: function(){
      var sales = read("ss_sales",[]), expenses = read("ss_expenses",[]);
      var rev = sum(sales,"amount"), exp = sum(expenses,"amount"), profit = rev-exp;
      return { revenue:rev, expenses:exp, profit:profit, vat:+(rev*SS.CONFIG.VAT_RATE).toFixed(2),
               period: sales.length ? sales[0].date + " → " + sales[sales.length-1].date : "—" };
    },
    recordSale: function(item, qty, amount){
      var sales = read("ss_sales",[]);
      sales.push({ id:"S"+Date.now(), date: SS.biz.todayStr(), item:item, qty:qty, amount:amount, channel:"MoMo", ref:"MOMO"+Math.floor(1e9+Math.random()*9e9) });
      store("ss_sales", sales);
    },
    recordExpense: function(desc, amount){
      var e = read("ss_expenses",[]);
      e.push({ id:"E"+Date.now(), date: SS.biz.todayStr(), desc:desc, amount:amount });
      store("ss_expenses", e);
    },
    prettyDate: function(dateStr){
      return new Date(dateStr+"T00:00:00").toLocaleDateString("en-GH",{month:"short",day:"numeric"});
    }
  };
  seed();
})();
