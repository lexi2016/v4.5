import { loadResearchBundle, normaliseDate } from "../shared/data.js";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateInput=d=>d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8);
function card(title,status,lines=[]) { return `<article class="v45-evidence"><h3>${esc(title)}</h3><span class="v45-pill">${esc(status??"CANNOT_CONFIRM")}</span>${lines.map(x=>`<p>${esc(x)}</p>`).join("")}</article>`; }
function productLines(p) {
 const row=p?.row??{}; const out=[];
 for(const [k,v] of Object.entries(row)) if(v!==null && ["string","number","boolean"].includes(typeof v) && /(symbol|name|status|stage|signal|reason|key|score|date|structure|label|support|risk|summary)/i.test(k)) out.push(k+"："+String(v));
 return out.slice(0,12);
}
function renderA(b) {
 const p=b.product??{}, c=b.chart??{}, m=b.company??{}, d2=b.d2??{}, d5=b.d5??{};
 $("overview").innerHTML=`<div class="v45-stat"><strong>${esc(p.status??"UNKNOWN")}</strong><span>数值日包</span></div><div class="v45-stat"><strong>${esc(c.status??"UNKNOWN")}</strong><span>原图描述</span></div><div class="v45-stat"><strong>${esc(m.status??"UNKNOWN")}</strong><span>公司材料</span></div><div class="v45-stat"><strong>${esc(p.source_generation??"未提供")}</strong><span>来源generation</span></div>`;
 $("evidence").innerHTML=[
 card("量价与数值日包",p.status,["材料日期："+(p.data_date??b.date),"来源身份："+(p.source_identity?.status??"未提供"),...productLines(p)]),
 card("原图 / 关键K",c.status,["图表行数："+(c.rows??"未提供"),"图表资产："+(Array.isArray(c.assets)?c.assets.length:"未提供"),"input SHA："+(c.input_sha256??"未提供"),"原图描述READY不代表图片资产已全部读取"]),
 card("公司材料",m.status,["缺失原因："+(m.missing_reason??"无"),"可用性缺口："+(m.availability_gaps??[]).join("；")||"未提供"]),
 card("D+2 / D+5案例", "按原案例接口返回",["D+2："+(d2.status??"UNKNOWN")+" · 成熟"+(d2.valid??"未知")+" · 未成熟"+(d2.not_matured??"未知")+" · 缺价"+(d2.missing_price??"未知"),"D+5："+(d5.status??"UNKNOWN")+" · 成熟"+(d5.valid??"未知")+" · 未成熟"+(d5.not_matured??"未知")+" · 缺价"+(d5.missing_price??"未知"),"历史案例统计不能替代最新信号的成熟度认证"])
 ].join("");
 $("lineage").innerHTML=`<p>市场：A股 · 证券：<strong>${esc(b.symbol)}</strong> · 来源日：${esc(b.date)}</p><p>数值日包generation：${esc(p.source_generation??"未提供")}</p><p>原图SHA：${esc(c.chart_manifest?.sha256??c.product_manifest?.sha256??"未提供")}</p><p>公司材料状态：${esc(m.status??"CANNOT_CONFIRM")}。研究回包收到不等于材料已导入。</p>`;
}
function renderHK(b) {
 const w=b.workbench??{}, row=b.row;
 $("overview").innerHTML=`<div class="v45-stat"><strong>${esc(w.status??b.status)}</strong><span>港股工作台状态</span></div><div class="v45-stat"><strong>${esc(w.trade_date??b.date)}</strong><span>交易日期</span></div><div class="v45-stat"><strong>${esc(w.market??"HK_CONNECT")}</strong><span>原市场合同</span></div><div class="v45-stat"><strong>${row?"已覆盖":"未覆盖"}</strong><span>当前证券</span></div>`;
 $("evidence").innerHTML=card("港股通 / 0.2原有工作台",w.status??b.status,["证券："+b.symbol,"slot："+(w.slot??"1530"),row?"找到该证券的原工作台记录。":"当前工作台结果未覆盖该证券；这不等于淘汰。","沿用港股自身交易日历和资格规则，不套用A股v1.9.2比较。",...(w.cannot_confirm??[]).slice(0,4)] )+card("原始证据",w.source_status??"CANNOT_CONFIRM",["generation："+(w.generation??"未提供"),"source SHA："+(w.source_sha256??"未提供"),"回看/补算与自然运行必须分别标识"]);
 $("lineage").innerHTML=`<p>市场：港股通 · 证券：<strong>${esc(b.symbol)}</strong> · 日期：${esc(b.date)}</p><p>来源：${esc(b.source)}。只读读取既有工作台，不触发ensure、retry或其他写操作。</p>`;
}
async function load() {
 const symbol=$("symbol").value.trim().toUpperCase(), market=$("market").value, date=normaliseDate($("date").value);
 $("status").className="v45-status";$("status").textContent="正在读取原研究owner…";
 const observationDate=params.get("observationDate") || date;
 $("review-link").href="/v45/review/?"+new URLSearchParams({date:observationDate,sourceDate:date,market,symbol});
 $("selection-link").href="/v45/selection/?"+new URLSearchParams({date,market});
 try {
  const b=await loadResearchBundle({market,symbol,date});
  if(market==="A") renderA(b); else renderHK(b);
  $("status").className="v45-status "+(/READY/.test(String(b.status))?"good":"warn");
  $("status").textContent="已读取原API响应。状态仅按各证据合同展示，不将HTTP成功升级为材料完整。";
 } catch(e) {
  $("status").className="v45-status bad";$("status").textContent=(e instanceof Error?e.message:"研究读取失败")+"。缺件保持未知，未使用本地旧材料覆盖当前结果。";
  $("overview").innerHTML="";$("evidence").innerHTML='<article class="v45-evidence"><h3>读取失败 / 待确认</h3><p>检查市场、来源日期和原API状态。</p></article>';$("lineage").textContent="当前没有可验证的研究结果。";
 }
}
$("research-form").addEventListener("submit",e=>{e.preventDefault();load()});
const params=new URLSearchParams(location.search);
if(params.has("symbol"))$("symbol").value=params.get("symbol");
if(params.has("market") && ["A","HK"].includes(params.get("market")))$("market").value=params.get("market");
if(params.has("date"))$("date").value=dateInput(normaliseDate(params.get("date")));
$("review-link").href="/v45/review/?"+new URLSearchParams({date:params.get("observationDate")||normaliseDate($("date").value),sourceDate:normaliseDate($("date").value)});
load();
