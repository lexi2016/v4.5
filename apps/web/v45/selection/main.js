import { DEFAULT_DATE, apiSymbol, fetchAllPreselection, fetchFormulaComparisonRows, formulaComparisonFor, normaliseDate } from "../shared/data.js";
const $ = id => document.getElementById(id);
let current = null, page = 1, pageSize = 50, filtered = [], formulaRequest = 0;
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateInput = d => d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8);
const statusClass = s => /READY|VERIFIED|COMPLETE/.test(String(s)) ? "good" : /PARTIAL|STALE|NOT_RUN/.test(String(s)) ? "warn" : "bad";
function renderFormula(date, market) {
  const request = ++formulaRequest;
  if (market === "HK") {
    $("formula").innerHTML = '<p>港股沿用港股通/0.2原合同，不适用A股原公式与v1.9.2比较。</p>';
    return;
  }
  const item = formulaComparisonFor(date);
  if (!item) { $("formula").textContent = "该观察日没有冻结的原公式/v1.9.2逐股对照；不自动重算，也不套用港股0.2合同。"; return; }
  $("formula").innerHTML = `<div class="v45-grid"><div class="v45-stat"><strong>${item.original}</strong><span>原公式入选</span></div><div class="v45-stat"><strong>${item.v192}</strong><span>v1.9.2入选</span></div><div class="v45-stat"><strong>${item.common}</strong><span>共同入选</span></div><div class="v45-stat"><strong>${item.originalOnly + item.v192Only}</strong><span>单侧入选关系</span></div></div><p class="v45-muted">来源日 ${item.sourceDate} → 观察日 ${item.observationDate}。仅原公式 ${item.originalOnly}；仅v1.9.2 ${item.v192Only}。冻结原结果，不重新计算；逐股差异原因按原证据展示，不把不同分数相加。</p><div id="formula-rows" class="v45-empty">正在读取冻结的逐股对照…</div><p><a href="/research-panel/workbench.html?mode=current">打开原公式研究面板</a></p>`;
  fetchFormulaComparisonRows(date).then(rows => {
    if (request !== formulaRequest) return;
    const host = $("formula-rows");
    if (!host) return;
    host.innerHTML = `<div class="v45-table-wrap"><table><thead><tr><th>差异类别</th><th>证券</th><th>原公式</th><th>v1.9.2角色</th><th>v1.9.2分数</th><th>追高风险分</th><th>原始差异原因</th><th>来源checkpoint SHA</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.category)}</td><td><strong>${esc(r.symbol)}</strong><small>${esc(r.display_name)}</small></td><td>${esc(r.original_status)}<small>${esc(r.original_raw_hits || "无命中说明")}</small></td><td>${esc(r.v192_multi_head_final_role || r.v192_candidate_role || "未提供")}<small>member=${esc(r.v192_member)}</small></td><td>${esc(r.v192_final_score || "未提供")}</td><td>${esc(r.v192_risk_chase_score || "未提供")}</td><td>${esc(r.difference_reason || "未提供条件明细")}</td><td><details><summary>SHA</summary><small>${esc(r.source_checkpoint_sha256)}</small></details></td></tr>`).join("")}</tbody></table></div>`;
  }).catch(error => {
    if (request !== formulaRequest) return;
    const host = $("formula-rows");
    if (host) host.textContent = (error instanceof Error ? error.message : "逐股对照不可读取") + "。汇总数字仍是冻结摘要，不代表逐股表已校验。";
  });
}
function render(data) {
  const market = $("market").value;
  const rows = data.rows.filter(r => market === "ALL" || r.market === market);
  const q = $("search").value.trim().toLowerCase();
  filtered = rows.filter(r => !q || (r.displaySymbol+" "+r.name+" "+r.symbol).toLowerCase().includes(q));
  const selected = filtered.slice((page-1)*pageSize,page*pageSize);
  $("stats").innerHTML = `<div class="v45-stat"><strong>${data.counts.A}</strong><span>A股去重候选 / API总数 ${data.expected.A}</span></div><div class="v45-stat"><strong>${data.counts.HK}</strong><span>港股去重候选 / API总数 ${data.expected.HK}</span></div><div class="v45-stat"><strong>${data.membershipCount}</strong><span>来源关系条数（非去重股票数）</span></div><div class="v45-stat"><strong>${data.pools.length}</strong><span>独立来源池</span></div>`;
  $("pools").innerHTML = data.pools.map(p => `<div class="v45-row"><div><strong>${esc(p.poolId)}</strong><small>${esc(p.market)} · ${esc(p.sourceDate || "来源日期未提供")} · ${esc(p.sourceSha256 || "SHA未提供")}</small>${p.cannotConfirm.length ? `<small>${esc(p.cannotConfirm.slice(0,2).join("；"))}</small>` : ""}</div><span class="v45-pill">${esc(p.status)} · ${p.totalRows}</span></div>`).join("") || '<p class="v45-empty">没有来源池状态。</p>';
  $("row-count").textContent = `当前筛选 ${filtered.length} 只 · 第 ${page} / ${Math.max(1,Math.ceil(filtered.length/pageSize))} 页`;
  $("candidates").innerHTML = selected.map(r => {
    const sources = r.sources.map(s => `<span class="v45-pill">${esc(s.poolId)}</span>`).join(" ");
    const ranks = r.sources.map(s => `${esc(s.poolId)}：${esc(s.rank ?? "排名未提供")} / ${esc(s.score ?? "分数未提供")}`).join("<br>");
    const sourceDate = r.sourceDates.join(", ") || "未知";
    const researchUrl = "/v45/research/?"+new URLSearchParams({market:r.market,symbol:apiSymbol(r.market,r.symbol),date:r.sourceDates[0] ?? data.date,observationDate:data.date});
    return `<tr><td>${r.market}</td><td><strong>${esc(r.displaySymbol)}</strong><small>${esc(r.name)}</small></td><td><div class="v45-pills">${sources}</div></td><td>${esc(sourceDate)}</td><td>${ranks}</td><td>${r.sources.map(s=>esc(s.poolStatus)).join("<br>")}</td><td><a href="${researchUrl}">个股研究</a></td></tr>`;
  }).join("") || '<tr><td colspan="7" class="v45-empty">当前筛选没有候选；请确认来源状态，不将空展示解释为策略淘汰。</td></tr>';
  const totalPages = Math.max(1,Math.ceil(filtered.length/pageSize));
  $("pagination").innerHTML = `<button id="prev" ${page<=1?"disabled":""}>上一页</button><span class="v45-muted">每页 ${pageSize} 只 · 完整后台名单 ${data.rows.length} 只</span><button id="next" ${page>=totalPages?"disabled":""}>下一页</button>`;
  $("prev")?.addEventListener("click",()=>{page=Math.max(1,page-1);render(data)});
  $("next")?.addEventListener("click",()=>{page=Math.min(totalPages,page+1);render(data)});
  $("status").className = "v45-status "+(data.complete?"good":"warn");
  $("status").textContent = data.complete ? `候选完整读取：${data.date} · ${data.rows.length}只去重证券 · ${data.membershipCount}条来源关系。各来源状态仍独立保留。` : `候选读取未通过完整性核验：${data.completenessReason || "CANNOT_CONFIRM"}。结果可查看但不能宣称完整。`;
  renderFormula(data.date, market);
}
async function load() {
  $("status").className="v45-status";$("status").textContent="正在按原API分页读取完整候选…";
  try { current = await fetchAllPreselection(normaliseDate($("date").value)); page=1; render(current); }
  catch(error) { $("status").className="v45-status bad";$("status").textContent=(error instanceof Error?error.message:"读取失败")+"。未用前200行或历史回执冒充完整结果。"; $("candidates").innerHTML='<tr><td colspan="7" class="v45-empty">当前API数据不可用或完整性未确认。</td></tr>'; }
}
$("selection-form").addEventListener("submit",e=>{e.preventDefault();load()});
$("search").addEventListener("input",()=>{page=1;if(current)render(current)});
$("market").addEventListener("change",()=>{page=1;if(current)render(current)});
$("date").value=dateInput(DEFAULT_DATE);
const params=new URLSearchParams(location.search);
if(params.has("date")) $("date").value=dateInput(normaliseDate(params.get("date")));
if(params.has("market") && ["A","HK","ALL"].includes(params.get("market"))) $("market").value=params.get("market");
load();
