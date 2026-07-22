import{r as s,C as W,f as _,j as e,u as $,a as Z,t as A,p as G,b as J,n as X,s as ee,A as te,F as re,c as ae,M as se,d as ne}from"./index-CtbD74TY.js";const le=({symbol:l,height:r=360})=>{const b=s.useRef(null),i=s.useRef(null),[w,x]=s.useState(!1);return s.useEffect(()=>{if(!l||!b.current)return;let m=!1;x(!1),i.current&&(i.current.remove(),i.current=null);const o=W(b.current,{width:b.current.clientWidth,height:r,layout:{background:{color:"#fff"},textColor:"#1e293b"},grid:{vertLines:{color:"#f3f4f6"},horzLines:{color:"#f3f4f6"}},rightPriceScale:{borderVisible:!1},timeScale:{borderVisible:!1}});i.current=o;const d=o.addCandlestickSeries({upColor:"#16a34a",downColor:"#dc2626",borderVisible:!1,wickUpColor:"#16a34a",wickDownColor:"#dc2626"});_(l).then(h=>{if(m)return;const f=(h?.data??[]).filter(c=>c.close>0).map(c=>({time:c.time,open:c.open,high:c.high,low:c.low,close:c.close}));if(f.length===0){x(!0);return}d.setData(f),o.timeScale().fitContent()}).catch(()=>{m||x(!0)});const u=()=>{b.current&&i.current&&i.current.applyOptions({width:b.current.clientWidth})};return window.addEventListener("resize",u),()=>{m=!0,window.removeEventListener("resize",u),i.current&&(i.current.remove(),i.current=null)}},[l,r]),w?e.jsx("div",{className:"flex items-center justify-center text-sm text-slate-500",style:{height:r},children:"Chart data loading…"}):e.jsx("div",{ref:b,className:"w-full",style:{height:r}})},de=({symbol:l,initialSide:r="BUY",ltp:b=0,change:i=0,changePct:w=0,onSuccess:x})=>{const{name:m}=$(),o=String(l||m||"").replace(/^NSE:/i,"").replace(/[^A-Za-z0-9&]/g,"").toUpperCase(),[d,u]=s.useState(String(r).toUpperCase()==="SELL"?"SELL":"BUY"),[h,f]=s.useState(1),[c,P]=s.useState(Number(b)||0),[R,I]=s.useState(Number(i)||0),[g,S]=s.useState(Number(w)||0),[j,C]=s.useState(Number(b)||0),[p,M]=s.useState("LIMIT"),[k,O]=s.useState("DELIVERY"),[T]=s.useState("DAY"),[L,B]=s.useState(!1);s.useEffect(()=>{u(String(r).toUpperCase()==="SELL"?"SELL":"BUY")},[r]),s.useEffect(()=>{if(!o)return;let a=!1;const v=()=>{Z(o).then(q=>{if(a)return;const U=q?.data??q??{},D=Number(U.lastPrice??U.ltp??0),z=Number(U.pChange??0);D>0&&(P(D),S(z),I(D*z/100),C(Y=>p==="MARKET"||!Y?D:Y))}).catch(()=>{})};v();const H=setInterval(v,5e3);return()=>{a=!0,clearInterval(H)}},[o,p]);const E=p==="MARKET"?c:j,t=s.useMemo(()=>h*E,[h,E]),n=s.useMemo(()=>Math.min(20,t*3e-4),[t]),N=s.useMemo(()=>t*5e-4,[t]),y=s.useMemo(()=>n+N,[n,N]),F=s.useMemo(()=>d==="BUY"?t+y:t-y,[d,t,y]),V=a=>{const v=Number(a);!Number.isNaN(v)&&v>=0&&f(Math.floor(v))},Q=a=>{const v=Number(a);!Number.isNaN(v)&&v>=0&&C(v)},K=async()=>{if(!o){A("Symbol missing");return}if(h<1){A("Enter quantity");return}if(p==="LIMIT"&&!(j>0)){A("Enter limit price");return}B(!0);try{const a=await G({symbol:o,side:d,quantity:h,order_type:p,product:k,price:p==="MARKET"?0:j,validity:T});a?.status===!0||a?.status===200?(J(a?.message||`${d} order placed on Kotak`),x?.(a)):a?.needs_setup&&A(a?.message||"Link Kotak MPIN + TOTP in Holdings first")}finally{B(!1)}};return e.jsx("div",{className:"min-h-screen bg-slate-100 dark:bg-[var(--app-bg)] flex justify-center px-4 py-6 rounded-2xl",children:e.jsxs("div",{className:"w-full max-w-4xl",children:[e.jsxs("div",{className:"mb-4 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h1",{className:`
      text-xl font-semibold
      text-slate-900
      dark:text-[var(--text-primary)]
    `,children:"Place Order"}),e.jsx("p",{className:`
      text-xs mt-1
      text-slate-500
      dark:text-[var(--text-secondary)]
    `,children:"Review all details carefully before placing your order."})]}),e.jsxs("div",{className:`
    flex gap-2 text-xs
    text-slate-500
    dark:text-[var(--text-secondary)]
  `,children:[e.jsx("span",{children:"Orders"}),e.jsx("span",{children:"/"}),e.jsx("span",{className:`
      text-slate-700 font-medium
      dark:text-[var(--text-primary)]
    `,children:"New Order"})]})]}),e.jsxs("div",{className:`
    bg-white rounded-2xl shadow-sm border border-slate-200 mb-4 p-4
    flex flex-wrap items-center justify-between gap-4

    dark:bg-[var(--card-bg)]
    dark:border-[var(--border-color)]
  `,children:[e.jsx("div",{children:e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:`
          inline-flex h-8 w-8 items-center justify-center rounded-full
          bg-emerald-100 text-emerald-700 text-sm font-semibold

          dark:bg-emerald-500/20
          dark:text-emerald-400
        `,children:"IN"}),e.jsxs("div",{children:[e.jsx("p",{className:`
            text-sm font-semibold
            text-slate-900
            dark:text-[var(--text-primary)]
          `,children:o||"—"}),e.jsx("p",{className:`
            text-[11px]
            text-slate-500
            dark:text-[var(--text-secondary)]
          `,children:o||"—"})]})]})}),e.jsxs("div",{className:"flex items-end gap-6",children:[e.jsxs("div",{children:[e.jsx("p",{className:`
          text-[11px] uppercase tracking-wide
          text-slate-500
          dark:text-[var(--text-secondary)]
        `,children:"LTP"}),e.jsxs("p",{className:`
          text-base font-semibold
          text-slate-900
          dark:text-[var(--text-primary)]
        `,children:["₹",(c||0).toFixed(2)]})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("p",{className:`text-xs font-medium ${g>=0?"text-emerald-600 dark:text-emerald-400":"text-rose-600 dark:text-rose-400"}`,children:[g>=0?"+":"",(R||0).toFixed(2)," (",g>=0?"+":"",(g||0).toFixed(2),"%)"]}),e.jsx("p",{className:`
          text-[11px] mt-0.5
          text-slate-500
          dark:text-[var(--text-secondary)]
        `,children:"NSE • Cash • T+2"})]})]})]}),e.jsxs("div",{className:"grid md:grid-cols-[1.5fr,1fr] gap-4 items-start",children:[e.jsxs("div",{className:`
    bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4

    dark:bg-[var(--card-bg)]
    dark:border-[var(--border-color)]
  `,children:[e.jsxs("div",{className:"flex gap-2 text-xs font-medium mb-2",children:[e.jsx("button",{onClick:()=>u("BUY"),className:`flex-1 py-2 rounded-xl border text-center transition-all ${d==="BUY"?"bg-emerald-500 text-white border-emerald-500 shadow-sm":"bg-emerald-50 text-emerald-700 border-transparent dark:bg-emerald-500/15 dark:text-emerald-400"}`,children:"BUY"}),e.jsx("button",{onClick:()=>u("SELL"),className:`flex-1 py-2 rounded-xl border text-center transition-all ${d==="SELL"?"bg-rose-500 text-white border-rose-500 shadow-sm":"bg-rose-50 text-rose-700 border-transparent dark:bg-rose-500/15 dark:text-rose-400"}`,children:"SELL"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3 text-xs",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1",children:"Order type"}),e.jsx("div",{className:"flex gap-1 bg-slate-50 dark:bg-[var(--gray-800)] rounded-xl p-1",children:["MARKET","LIMIT"].map(a=>e.jsx("button",{onClick:()=>M(a),className:`flex-1 py-1.5 rounded-lg text-[11px] transition ${p===a?"bg-slate-900 text-white dark:bg-[var(--white-10)]":"text-slate-600 dark:text-[var(--text-secondary)]"}`,children:a},a))})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1",children:"Product"}),e.jsx("div",{className:"flex gap-1 bg-slate-50 dark:bg-[var(--gray-800)] rounded-xl p-1",children:["DELIVERY","INTRADAY"].map(a=>e.jsx("button",{onClick:()=>O(a),className:`flex-1 py-1.5 rounded-lg text-[11px] transition ${k===a?"bg-slate-900 text-white dark:bg-[var(--white-10)]":"text-slate-600 dark:text-[var(--text-secondary)]"}`,children:a},a))})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3 text-xs",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1",children:"Quantity"}),e.jsxs("div",{className:"flex items-center rounded-xl border border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--gray-800)] px-2",children:[e.jsx("button",{type:"button",onClick:()=>f(a=>Math.max(1,a-1)),className:"px-2 py-2 text-lg leading-none text-slate-500 dark:text-[var(--text-secondary)]",children:"-"}),e.jsx("input",{type:"number",value:h,onChange:a=>V(a.target.value),className:"w-full bg-transparent text-sm text-slate-900 dark:text-[var(--text-primary)] text-center outline-none py-2"}),e.jsx("button",{type:"button",onClick:()=>f(a=>a+1),className:"px-2 py-2 text-lg leading-none text-slate-500 dark:text-[var(--text-secondary)]",children:"+"})]}),e.jsxs("p",{className:"mt-1 text-[11px] text-slate-500 dark:text-[var(--text-secondary)]",children:["Lot size: 1 • Total: ",h," shares"]})]}),e.jsxs("div",{children:[e.jsxs("p",{className:"text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-1",children:["Price (₹) ",p==="MARKET"&&"(market)"]}),e.jsx("div",{className:"flex items-center rounded-xl border border-slate-200 dark:border-[var(--border-color)] bg-slate-50 dark:bg-[var(--gray-800)] px-3",children:e.jsx("input",{type:"number",value:j,onChange:a=>Q(a.target.value),disabled:p==="MARKET",className:"w-full bg-transparent text-sm text-slate-900 dark:text-[var(--text-primary)] outline-none py-2"})}),e.jsxs("p",{className:"mt-1 text-[11px] text-slate-500 dark:text-[var(--text-secondary)]",children:["LTP: ₹",(c||0).toFixed(2)]})]})]}),e.jsxs("div",{className:"pt-1 border-t border-slate-100 dark:border-[var(--border-color)] mt-2 flex items-center justify-between gap-3",children:[e.jsxs("div",{className:"text-[11px] text-slate-500 dark:text-[var(--text-secondary)]",children:[e.jsxs("p",{children:["Notional value:"," ",e.jsxs("span",{className:"font-medium text-slate-800 dark:text-[var(--text-primary)]",children:["₹",t.toFixed(2)]})]}),e.jsxs("p",{className:"mt-0.5",children:["Total charges:"," ",e.jsxs("span",{className:"font-medium text-slate-800 dark:text-[var(--text-primary)]",children:["₹",y.toFixed(2)]})]})]}),e.jsx("button",{type:"button",disabled:L,onClick:K,className:`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-60 ${d==="BUY"?"bg-emerald-500 hover:bg-emerald-600 text-white":"bg-rose-500 hover:bg-rose-600 text-white"}`,children:L?"Placing…":d==="BUY"?"Place Buy Order":"Place Sell Order"})]})]}),e.jsxs("div",{className:`
    bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4 text-xs

    dark:bg-[var(--card-bg)]
    dark:border-[var(--border-color)]
  `,children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-2",children:"Order summary"}),e.jsxs("div",{className:"rounded-xl bg-slate-50 dark:bg-[var(--gray-800)] px-3 py-2 space-y-1",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-slate-500 dark:text-[var(--text-secondary)]",children:"Side"}),e.jsx("span",{className:`font-medium ${d==="BUY"?"text-emerald-600":"text-rose-600"}`,children:d})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-slate-500 dark:text-[var(--text-secondary)]",children:"Qty × Price"}),e.jsxs("span",{className:"font-medium text-slate-800 dark:text-[var(--text-primary)]",children:[h," × ₹",E.toFixed(2)]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-slate-500 dark:text-[var(--text-secondary)]",children:"Order type"}),e.jsx("span",{className:"font-medium text-slate-800 dark:text-[var(--text-primary)]",children:p})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-slate-500 dark:text-[var(--text-secondary)]",children:"Product"}),e.jsx("span",{className:"font-medium text-slate-800 dark:text-[var(--text-primary)]",children:k})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-slate-500 dark:text-[var(--text-secondary)]",children:"Validity"}),e.jsx("span",{className:"font-medium text-slate-800 dark:text-[var(--text-primary)]",children:T})]})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mb-2",children:"Charges (approx.)"}),e.jsxs("div",{className:`
        rounded-xl border border-slate-100 px-3 py-2 space-y-1

        dark:border-[var(--border-color)]
        dark:bg-[var(--gray-800)]
      `,children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-slate-500 dark:text-[var(--text-secondary)]",children:"Brokerage"}),e.jsxs("span",{className:"font-medium text-slate-800 dark:text-[var(--text-primary)]",children:["₹",n.toFixed(2)]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-slate-500 dark:text-[var(--text-secondary)]",children:"Taxes & others"}),e.jsxs("span",{className:"font-medium text-slate-800 dark:text-[var(--text-primary)]",children:["₹",N.toFixed(2)]})]}),e.jsxs("div",{className:`
          flex justify-between pt-1 border-t border-dashed border-slate-200 mt-1

          dark:border-[var(--border-color)]
        `,children:[e.jsx("span",{className:"font-medium text-slate-700 dark:text-[var(--text-primary)]",children:"Total charges"}),e.jsxs("span",{className:"font-semibold text-slate-900 dark:text-[var(--text-primary)]",children:["₹",y.toFixed(2)]})]})]}),e.jsx("p",{className:"mt-1 text-[10px] text-slate-400 dark:text-[var(--text-secondary)]",children:"Actual charges may vary slightly as per exchange and regulator rules."})]}),e.jsxs("div",{className:`
      rounded-2xl bg-slate-900 text-slate-50 px-4 py-3 space-y-1

      dark:bg-[var(--white-10)]
      dark:text-[var(--text-primary)]
    `,children:[e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-[11px] opacity-80",children:d==="BUY"?"Total payable":"Net receivable"}),e.jsxs("span",{className:"text-sm font-semibold",children:["₹",F.toFixed(2)]})]}),e.jsx("p",{className:"text-[10px] opacity-70",children:"Includes product, order type and taxes estimation."})]})]})]})]})})},oe=()=>{const{name:l}=$(),[r,b]=s.useState(null),[i,w]=s.useState(!0);s.useEffect(()=>{if(!l)return;let t=!1;const n=()=>{ne(l).then(y=>{!t&&y?.data&&(b(y.data),w(!1))}).catch(()=>{t||w(!1)})};n();const N=setInterval(n,5e3);return()=>{t=!0,clearInterval(N)}},[l]);const x=r?.priceInfo?.lastPrice??0,m=r?.priceInfo?.pChange??0,o=r?.securityInfo?.issuedSize&&x?(r.securityInfo.issuedSize*x/1e7).toFixed(2)+" Cr":"—",d=X(r?.info?.symbol||l)||void 0,u=(r?.info?.symbol||l||"").toString().replace(/^NSE:/i,"").replace(/[^A-Za-z0-9&]/g,"").toUpperCase(),h=r?.priceInfo?.totalTradedVolume,f=r?[{label:"Market Cap",value:o},{label:"P/E (TTM)",value:r?.metadata?.pdSymbolPe??"—"},{label:"EPS (TTM)",value:r?.metadata?.pdSectorPe??"—"},{label:"ROE",value:"—"},{label:"Debt/Equity",value:"—"},{label:"Book Value",value:r?.priceInfo?.basePrice??"—"},{label:"Dividend Yield",value:"—"},{label:"Beta",value:"—"}]:[];//! Definitons
const c={"Market Cap":"Market Capitalization represents the total value of a company's outstanding shares. It indicates the company’s overall size in the stock market.","P/E (TTM)":"Price-to-Earnings (Trailing Twelve Months) shows how much investors are willing to pay per rupee of earnings over the last 12 months.","EPS (TTM)":"Earnings Per Share (TTM) represents the company’s profit allocated per outstanding share over the last 12 months.",ROE:"Return on Equity measures how effectively a company generates profit from shareholders' equity. Higher ROE indicates better profitability.","Debt/Equity":"Debt-to-Equity ratio compares a company’s total debt to its shareholder equity. Lower D/E indicates lower financial risk.","Book Value":"Book Value represents the net value of a company's assets per share after liabilities are deducted.","Dividend Yield":"Dividend Yield shows how much a company pays in dividends relative to its share price. A higher yield indicates better cash returns.",Beta:"Beta measures the volatility of a stock compared to the overall market. A beta above 1 means higher volatility; below 1 means lower volatility."},[P,R]=s.useState(null),I=r?.marketDepth?.depth,g=I?.buy?.filter(t=>t.price).slice(0,5)??[],S=I?.sell?.filter(t=>t.price).slice(0,5)??[],j=Math.max(...g.map(t=>Number(t.quantity)||0),...S.map(t=>Number(t.quantity)||0),1),[C,p]=s.useState(!1),[M,k]=s.useState({open:!1,type:"buy"}),O=()=>k({open:!0,type:"buy"}),T=()=>k({open:!0,type:"sell"}),L=()=>k({open:!1,type:"buy"}),B=()=>{const t=r?.info?.companyName??l,n=r?.info?.symbol??l,N=`Check ${t} (${n}) price ₹${x} (${m}%).`;window.open(`https://wa.me/?text=${encodeURIComponent(N)}`,"_blank")},E=ee(r?.info?.symbol??l);return e.jsxs("div",{className:"min-h-screen bg-linear-to-b from-slate-50 to-white py-10 px-4 dark:from-[var(--app-bg)] dark:to-[var(--app-bg)] ",children:[e.jsxs("div",{className:"max-w-6xl mx-auto space-y-6",children:[e.jsxs("header",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6 items-start",children:[e.jsxs("div",{className:`
    col-span-2
    bg-white/60 backdrop-blur-sm
    border border-white/40
    rounded-2xl md:p-6 p-4 shadow-md

    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  `,children:[e.jsxs("div",{className:"flex flex-col md:flex-row md:items-start md:justify-between gap-4",children:[e.jsxs("div",{className:"flex items-center gap-4 flex-1 min-w-0",children:[e.jsx("img",{src:E,alt:"logo",className:"w-16 h-16 rounded-xl object-contain bg-white",onError:t=>{t.target.onerror=null,t.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(r?.info?.symbol??l??"?")}&background=e2e8f0&color=0f172a&size=128`}}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h1",{className:"text-2xl font-bold text-slate-900 capitalize break-words whitespace-normal dark:text-[var(--text-primary)]",children:r?.info?.companyName}),e.jsxs("div",{className:"flex items-center gap-3 mt-1",children:[e.jsx("span",{className:"text-sm text-slate-500 dark:text-[var(--text-secondary)]",children:r?.info?.symbol}),e.jsx("span",{className:"px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-100",children:r?.industryInfo?.industry})]})]})]}),e.jsxs("div",{className:"flex md:flex-row md:items-center items-start gap-3",children:[e.jsxs("button",{onClick:()=>p(!C),className:`flex items-center gap-2 px-3 py-2 rounded-xl transition
          ${C?"bg-emerald-600 text-white":`
                bg-white border border-slate-200 text-slate-700
                dark:bg-[var(--gray-800)]
                dark:border-[var(--border-color)]
                dark:text-[var(--text-secondary)]
              `}`,children:[e.jsx(te,{}),e.jsx("span",{className:"hidden md:inline",children:C?"Saved":"Save"})]}),e.jsxs("button",{onClick:B,className:`
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-white border border-slate-200 text-slate-700 hover:shadow

          dark:bg-[var(--gray-800)]
          dark:border-[var(--border-color)]
          dark:text-[var(--text-secondary)]
        `,children:[e.jsx(re,{}),e.jsx("span",{className:"hidden md:inline",children:"Share"})]})]})]}),e.jsxs("div",{className:"mt-5 flex flex-wrap items-center gap-6 justify-between",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-end gap-3",children:[e.jsxs("h2",{className:"text-4xl font-extrabold text-slate-900 dark:text-[var(--text-primary)]",children:["₹",Number(x||0).toFixed(2)]}),e.jsxs("div",{className:`px-3 py-1 rounded-md text-sm font-semibold
            ${Number(m||0)>=0?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-600"}`,children:[Number(m||0)>=0?"+":"",Number(m||0).toFixed(2),"%"]})]}),e.jsxs("p",{className:"text-xs text-slate-500 mt-1 dark:text-[var(--text-secondary)]",children:["As of ",new Date().toLocaleString()]})]}),e.jsxs("div",{className:"flex items-center gap-3 flex-wrap",children:[e.jsx("button",{onClick:O,className:"px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700",children:"Buy"}),e.jsx("button",{onClick:T,className:"px-5 py-2 rounded-xl bg-red-600 text-white font-semibold shadow hover:bg-red-700",children:"Sell"}),e.jsxs("div",{className:"text-right text-sm text-slate-500 dark:text-[var(--text-secondary)]",children:[e.jsxs("div",{children:["Vol:",e.jsxs("span",{className:"text-slate-900 font-medium dark:text-[var(--text-primary)]",children:[" ",h?Number(h).toLocaleString("en-IN"):"—"]})]}),e.jsxs("div",{children:["Mkt Cap:",e.jsxs("span",{className:"text-slate-900 font-medium dark:text-[var(--text-primary)]",children:[" ",o]})]})]})]})]})]}),e.jsx("aside",{className:`
    bg-white/60 backdrop-blur-sm
    border border-white/40
    rounded-2xl p-4 shadow-md h-full

    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  `,children:e.jsxs("div",{className:"flex flex-col gap-4",children:[e.jsxs("div",{className:`
        bg-linear-to-r from-sky-50 to-white
        p-3 rounded-lg
        dark:border

        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
      `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"P/E Ratio"}),e.jsx("p",{className:"text-lg font-semibold dark:text-[var(--text-primary)]",children:r?.metadata?.pdSymbolPe})]}),e.jsxs("div",{className:`
        bg-linear-to-r from-rose-50 to-white
        p-3 rounded-lg
 dark:border

        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
      `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"52W Range"}),e.jsxs("p",{className:"text-sm font-semibold dark:text-[var(--text-primary)]",children:["₹",r?.priceInfo?.weekHighLow?.min," - ₹",r?.priceInfo?.weekHighLow?.max]})]}),e.jsxs("div",{className:`
        bg-linear-to-r from-amber-50 to-white
        p-3 rounded-lg
 dark:border

        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
      `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"Analyst Rating"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold",children:"—"}),e.jsx("div",{className:"text-sm text-slate-700 dark:text-[var(--text-secondary)]",children:"Live market data"})]})]})]})})]}),e.jsxs("section",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[e.jsxs("div",{className:`lg:col-span-2 bg-white/60  backdrop-blur-sm border border-white/40 rounded-2xl p-2 lg:p-6 shadow-md
      dark:bg-(--white-10)
      `,children:[e.jsxs("div",{className:"flex items-center justify-between mb-2 px-1",children:[e.jsx("span",{className:"text-sm font-semibold text-slate-700 dark:text-[var(--text-primary)]",children:d||u}),d&&e.jsx("a",{href:ae(d),target:"_blank",rel:"noopener noreferrer",className:"text-sm font-medium text-blue-600 hover:underline",children:"Open on TradingView ↗"})]}),e.jsx(le,{symbol:u,height:320},u),e.jsxs("div",{className:"mt-4 grid grid-cols-2 gap-3",children:[e.jsxs("div",{className:`
      p-3 rounded-xl shadow-sm
      bg-green-50
      dark:border
      dark:bg-[var(--gray-800)] border-(--border-color)
    `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"Day High"}),e.jsxs("p",{className:"font-semibold dark:text-[var(--text-primary)]",children:["₹",r?.priceInfo?.intraDayHighLow?.max]})]}),e.jsxs("div",{className:`
      p-3 rounded-xl shadow-sm
      bg-orange-50
      dark:border
      dark:bg-[var(--gray-800)] border-(--border-color)
    `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"Day Low"}),e.jsxs("p",{className:"font-semibold dark:text-[var(--text-primary)]",children:["₹",r?.priceInfo?.intraDayHighLow?.min]})]})]})]}),e.jsxs("aside",{className:`
    bg-white/60 backdrop-blur-sm
    border border-white/40
    rounded-2xl p-4 shadow-md space-y-4

    dark:bg-[var(--white-10)]
    dark:border-[var(--border-color)]
  `,children:[e.jsxs("div",{className:`
      p-3 rounded-xl shadow-sm
      bg-linear-to-r from-sky-50 to-white
 dark:border

        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
    `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"Avg Volume (3M)"}),e.jsx("p",{className:"font-semibold dark:text-[var(--text-primary)]",children:r?.securityInfo?.issuedSize?Math.round(r.securityInfo.issuedSize/1e6*10)/10+"M":"—"})]}),e.jsxs("div",{className:`
      p-3 rounded-xl shadow-sm
      bg-linear-to-r from-rose-50 to-white
 dark:border
        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
    `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"Beta"}),e.jsx("p",{className:"font-semibold dark:text-[var(--text-primary)]",children:"—"})]}),e.jsxs("div",{className:`
      p-3 rounded-xl shadow-sm
      bg-linear-to-r from-amber-50 to-white
 dark:border
        dark:from-[var(--white-5)] dark:to-[var(--white-5)] border-[var(--border-color)]
    `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"Dividend Yield"}),e.jsx("p",{className:"font-semibold dark:text-[var(--text-primary)]",children:"—"})]})]})]}),e.jsx("section",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:e.jsxs("aside",{className:`
      lg:col-span-2
      bg-white/60 backdrop-blur-sm
      border border-white/40
      rounded-2xl p-4 shadow-md

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    `,children:[e.jsx("h4",{className:"text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)] mb-3",children:"Fundamentals"}),e.jsx("div",{className:"grid grid-cols-2 gap-3 sm:grid-cols-4",children:f.map((t,n)=>e.jsxs("div",{onClick:()=>R(P===n?null:n),className:`
            relative p-3 rounded-md shadow-sm cursor-pointer
            bg-white border border-gray-100

            dark:bg-[var(--white-5)]
            dark:border-[var(--border-color)]
          `,children:[e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:t.label}),e.jsx("span",{className:"text-gray-500 text-xs",children:e.jsx(se,{})})]}),e.jsx("p",{className:"font-semibold mt-1 dark:text-[var(--text-primary)]",children:t.value}),P===n&&e.jsx("div",{className:`
                absolute top-14 left-0 w-56 p-3 rounded-lg shadow-md z-50
                bg-white border border-gray-200 text-xs text-gray-700

                dark:bg-[var(--gray-900)]
                dark:border-[var(--border-color)]
                dark:text-[var(--text-secondary)]
              `,children:c[t.label]})]},n))})]})}),e.jsx("section",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:e.jsxs("div",{className:`
      lg:col-span-2
      bg-white/60 backdrop-blur-sm
      border border-white/40
      rounded-2xl p-6 shadow-md

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    `,children:[e.jsx("h3",{className:"text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)] mb-4",children:"Market Depth"}),g.length===0&&S.length===0?e.jsx("p",{className:"text-sm text-slate-500 dark:text-[var(--text-secondary)]",children:i?"Loading depth…":"Market depth available when Kotak API is connected."}):e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"w-full",children:[e.jsxs("div",{className:"flex justify-between text-md font-medium text-slate-600 dark:text-[var(--text-secondary)]",children:[e.jsx("span",{children:"Buy order quantity"}),e.jsx("span",{children:"Sell order quantity"})]}),e.jsxs("div",{className:"flex w-full h-2 rounded-full overflow-hidden mt-2 bg-slate-200 dark:bg-[var(--gray-800)]",children:[e.jsx("div",{className:"bg-emerald-500",style:{width:"33%"}}),e.jsx("div",{className:"bg-red-500",style:{width:"67%"}})]}),e.jsxs("div",{className:"flex justify-between mt-1 text-sm font-medium",children:[e.jsx("span",{className:"text-emerald-600",children:"33%"}),e.jsx("span",{className:"text-red-500",children:"67%"})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 mt-6 divide-x dark:divide-[var(--border-color)]",children:[e.jsxs("div",{className:"pr-4",children:[e.jsxs("div",{className:"grid grid-cols-2 text-sm mb-2 text-slate-600 dark:text-[var(--text-secondary)]",children:[e.jsx("span",{className:"font-medium",children:"Bid Price"}),e.jsx("span",{className:"text-right font-medium",children:"Qty"})]}),g.map((t,n)=>e.jsxs("div",{className:"grid grid-cols-2 items-center text-sm mb-2 relative",children:[e.jsx("span",{className:"dark:text-[var(--text-primary)]",children:Number(t.price).toLocaleString()}),e.jsxs("div",{className:"relative text-right",children:[e.jsx("span",{className:"text-emerald-600 font-medium relative z-10",children:Number(t.quantity).toLocaleString()}),e.jsx("div",{className:"absolute right-0 top-1/2 -translate-y-1/2 h-full bg-emerald-100 dark:bg-emerald-500/20 rounded",style:{width:`${Number(t.quantity)/j*100}%`}})]})]},n)),e.jsxs("div",{className:"flex justify-between mt-3 font-semibold dark:text-[var(--text-primary)]",children:[e.jsx("span",{children:"Bid Total"}),e.jsx("span",{children:g.reduce((t,n)=>t+(Number(n.quantity)||0),0).toLocaleString()})]})]}),e.jsxs("div",{className:"pl-4",children:[e.jsxs("div",{className:"grid grid-cols-2 text-sm mb-2 text-slate-600 dark:text-[var(--text-secondary)]",children:[e.jsx("span",{className:"font-medium",children:"Ask Price"}),e.jsx("span",{className:"text-right font-medium",children:"Qty"})]}),S.map((t,n)=>e.jsxs("div",{className:"grid grid-cols-2 items-center text-sm mb-2 relative",children:[e.jsx("span",{className:"dark:text-[var(--text-primary)]",children:Number(t.price).toLocaleString()}),e.jsxs("div",{className:"relative text-right",children:[e.jsx("span",{className:"text-red-500 font-medium relative z-10",children:Number(t.quantity).toLocaleString()}),e.jsx("div",{className:"absolute right-0 top-1/2 -translate-y-1/2 h-full bg-red-100 dark:bg-red-500/20 rounded",style:{width:`${Number(t.quantity)/j*100}%`}})]})]},n)),e.jsxs("div",{className:"flex justify-between mt-3 font-semibold dark:text-[var(--text-primary)]",children:[e.jsx("span",{children:"Ask Total"}),e.jsx("span",{children:S.reduce((t,n)=>t+(Number(n.quantity)||0),0).toLocaleString()})]})]})]})]})]})}),e.jsxs("section",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[e.jsxs("div",{className:`
      lg:col-span-2
      bg-white/60 backdrop-blur-sm
      border border-white/40
      rounded-2xl p-6 shadow-md

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    `,children:[e.jsxs("h3",{className:"text-lg font-semibold mb-3 text-slate-900 dark:text-[var(--text-primary)]",children:["About ",r?.info?.companyName??l]}),e.jsx("p",{className:"text-sm leading-relaxed text-slate-700 dark:text-[var(--text-secondary)]",children:r?.industryInfo?.industry?`${r.info?.companyName} operates in the ${r.industryInfo.industry} sector on NSE.`:i?"Loading company info…":"Company details will appear when market data is available."}),e.jsxs("div",{className:"mt-6 grid grid-cols-2 gap-4",children:[e.jsxs("div",{className:`
          p-4 rounded-md shadow-sm
          bg-white

          dark:bg-[var(--gray-800)]
        `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"Parent Organisation"}),e.jsx("p",{className:"font-semibold dark:text-[var(--text-primary)]",children:r?.info?.companyName??"—"})]}),e.jsxs("div",{className:`
          p-4 rounded-md shadow-sm
          bg-white

          dark:bg-[var(--gray-800)]
        `,children:[e.jsx("p",{className:"text-xs text-slate-500 dark:text-[var(--text-secondary)]",children:"Headquarters"}),e.jsx("p",{className:"font-semibold dark:text-[var(--text-primary)]",children:"India"})]})]})]}),e.jsxs("aside",{className:`
      bg-white/60 backdrop-blur-sm
      border border-white/40
      rounded-2xl p-4 shadow-md

      dark:bg-[var(--white-10)]
      dark:border-[var(--border-color)]
    `,children:[e.jsx("h4",{className:"text-lg font-semibold mb-3 dark:text-[var(--text-primary)]",children:"Quick Links"}),e.jsxs("ul",{className:"flex flex-col gap-2",children:[e.jsx("li",{children:e.jsx("a",{className:`
            text-slate-700 hover:underline
            dark:text-[var(--text-secondary)]
          `,href:"#",children:"Quarterly results"})}),e.jsx("li",{children:e.jsx("a",{className:`
            text-slate-700 hover:underline
            dark:text-[var(--text-secondary)]
          `,href:"#",children:"Shareholding pattern"})}),e.jsx("li",{children:e.jsx("a",{className:`
            text-slate-700 hover:underline
            dark:text-[var(--text-secondary)]
          `,href:"#",children:"Corporate announcements"})})]})]})]}),e.jsx("div",{className:"h-28"})]}),M.open&&e.jsx("div",{className:`
    fixed inset-0 z-50 flex items-center justify-center p-4
    bg-black/40
  `,onClick:L,children:e.jsxs("div",{className:`
      w-full max-w-2xl h-[90vh]
      rounded-2xl shadow-xl overflow-y-auto p-6 relative

      bg-white
      dark:bg-[var(--card-bg)]
      dark:border
      dark:border-[var(--border-color)]
    `,onClick:t=>t.stopPropagation(),children:[e.jsx("button",{onClick:L,className:`
        absolute top-5 right-9 text-3xl transition cursor-pointer

        text-slate-400 hover:text-slate-700
        dark:text-[var(--text-secondary)]
        dark:hover:text-[var(--text-primary)]
      `,children:"×"}),e.jsx(de,{symbol:u||l,initialSide:M.type==="sell"?"SELL":"BUY",ltp:x,changePct:m,change:x*m/100,onSuccess:L})]})})]})};export{oe as default};
