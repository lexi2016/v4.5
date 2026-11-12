import { apiSymbol, loadReview, normaliseDate, readJson } from "../shared/data.js";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateInput=d=>d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8);
function marketCard(label,value) {
 const model=value?.model_selection_review??value?.model_selection??value??{};
 const status=value?.status??model.status??"CANNOT_CONFIRM";
 const missing=[...(model.missing_stages??[]),...(model.cannot_confirm??[]),...(value?.cannot_confirm??[])];
 const close=Array.isArray(model.close_top20)?model.close_top20.length:null;
 const stage=model.stage_union?.candidate_count??model.stage_union?.selected_count??model.stage_union?.count??null;
 return `<article class="v45-evidence"><h3>${label}</h3><span class="v45-pill">${esc(status)}</span><p>收盘候选：${close===null?"未提供":close}</p><p>阶段并集：${stage===null?"未提供":stage}</p><p>证据模式：${esc(model.evidence_mode??"未提供")}</p><p>缺失阶段 / 不能确认：${missing.length?esc(missing.join("；")):"无明确缺口字段；不等于所有子项READY"}</p></article>`;
}
async function load() {
 const date=normaliseDate($("date").value);
 $("status").className="v45-status";$("status").textContent="读取原精确日期复盘…";
 try {
  const p=await loadReview(date);
  const a=p.market_reviews?.A??p.market_reviews?.A_SHARE??{};
  const hk=p.market_reviews?.HK??p.market_reviews?.HK_CONNECT??{};
  $("markets").innerHTML=marketCard("A股",a)+marketCard("港股",hk);
  $("status").className="v45-status "+(p.reference_snapshot===true?"warn":"good");
  $("status").textContent=`已读取 ${date} 原复盘envelope；reference_snapshot=${String(p.reference_snapshot??"未提供")}。各市场子项状态独立判定。`;
 } catch(e) {
  $("status").className="v45-status bad";$("status").textContent=(e instanceof Error?e.message:"复盘读取失败")+"。不使用其他日期结果替代。";
  $("markets").innerHTML='<article class="v45-evidence"><h3>复盘不可确认</h3><p>精确日期结果未读取成功。</p></article>';
 }
}
async function maturity(e) {
 e?.preventDefault();
 const market=$("market").value, symbol=$("symbol").value.trim().toUpperCase(), date=normaliseDate($("source-date").value);
 if(market==="HK") {
  $("maturity").innerHTML='<article class="v45-evidence"><h3>港股成熟度</h3><span class="v45-pill">CANNOT_CONFIRM</span><p>当前证券级D+2/D+5接口证据未在本批合同中确认。保持未知，不套用A股事件案例或交易日历。</p></article>';
  return;
 }
 const resolvedSymbol=apiSymbol("A",symbol);
 const qs=h=>new URLSearchParams({date,symbol:resolvedSymbol,group:"original",horizon:h});
 try {
  const [d2,d5]=await Promise.all([readJson("/api/v4/research/a-share/event-cases?"+qs("d2")),readJson("/api/v4/research/a-share/event-cases?"+qs("d5"))]);
  for(const item of [d2,d5]) if(item.data_date && item.data_date!==date) throw new Error("D+2/D+5来源日期不匹配，拒绝混合展示");
  const render=(label,x)=>`<article class="v45-evidence"><h3>${label}</h3><span class="v45-pill">${esc(x.status??"CANNOT_CONFIRM")}</span><p>总案例：${esc(x.total??"未知")} · 有效：${esc(x.valid??"未知")}</p><p>未成熟：${esc(x.not_matured??"未知")} · 缺价：${esc(x.missing_price??"未知")}</p><p>排除/异常：非有限收益 ${esc(x.nonfinite_return??"未知")} · 非正价格 ${esc(x.nonpositive_price??"未知")}</p></article>`;
  $("maturity").innerHTML=render("D+2",d2)+render("D+5",d5);
 } catch(e) {$("maturity").innerHTML='<article class="v45-evidence"><h3>成熟度不可确认</h3><p>'+esc(e instanceof Error?e.message:"接口读取失败")+'</p></article>';}
}
$("review-form").addEventListener("submit",e=>{e.preventDefault();load()});
$("maturity-form").addEventListener("submit",maturity);
const params=new URLSearchParams(location.search);
if(params.has("date"))$("date").value=dateInput(normaliseDate(params.get("date")));
if(params.has("market") && ["A","HK"].includes(params.get("market")))$("market").value=params.get("market");
if(params.has("symbol"))$("symbol").value=params.get("symbol");
$("source-date").value=dateInput(normaliseDate(params.get("sourceDate")||"20261111"));
load();
