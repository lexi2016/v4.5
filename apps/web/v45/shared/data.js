export const DEFAULT_DATE = "20261113";
export const FORMULA_COMPARISONS = Object.freeze([
  { sourceDate: "20261111", observationDate: "20261112", original: 44, v192: 25, common: 0, originalOnly: 44, v192Only: 25, status: "FROZEN_COMPARISON" },
  { sourceDate: "20261112", observationDate: "20261113", original: 40, v192: 10, common: 1, originalOnly: 39, v192Only: 9, status: "FROZEN_COMPARISON" },
]);

export function normaliseDate(value) {
  const digits = String(value ?? "").replaceAll("-", "");
  if (!/^\d{8}$/.test(digits)) throw new Error("日期必须为YYYYMMDD");
  const year = Number(digits.slice(0, 4)), month = Number(digits.slice(4, 6)), day = Number(digits.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error("日期无效");
  return digits;
}

export function marketOf(value) {
  const market = String(value ?? "").toUpperCase();
  return market === "HK" || market === "HK_CONNECT" || market === "HK_SECURITIES" ? "HK" : market === "A_SHARE" || market === "A" ? "A" : market;
}

export function securityIdentity(marketValue, symbolValue) {
  const market = marketOf(marketValue);
  const raw = String(symbolValue ?? "").trim().toUpperCase();
  if (!market || !raw) return "";
  const code = raw.replace(/^A\./, "").replace(/^HK\./, "").replace(/\.(SZ|SH|BJ|HK)$/, "");
  return market + ":" + code;
}

export function apiSymbol(marketValue, symbolValue) {
  const market = marketOf(marketValue);
  const raw = String(symbolValue ?? "").trim().toUpperCase();
  if (market === "HK") return raw.startsWith("HK.") ? raw : "HK." + raw.replace(/\.HK$/, "");
  if (market !== "A") return raw;
  if (/\.(SZ|SH|BJ)$/.test(raw)) return raw;
  const code = raw.replace(/^A\./, "");
  if (/^[569]/.test(code)) return code + ".SH";
  if (/^[023]/.test(code)) return code + ".SZ";
  if (/^[48]/.test(code)) return code + ".BJ";
  return code;
}

export function displaySymbol(marketValue, symbolValue) {
  const market = marketOf(marketValue);
  const raw = String(symbolValue ?? "").trim().toUpperCase();
  if (market === "A") return raw.replace(/^A\./, "");
  if (market === "HK") return raw.replace(/^HK\./, "").replace(/\.HK$/, "") + ".HK";
  return raw;
}

function sourceEntry(pool, row) {
  return {
    poolId: String(pool.pool_id ?? "UNKNOWN_SOURCE"),
    poolStatus: String(pool.status ?? "CANNOT_CONFIRM"),
    sourceDate: row.source_date ?? row.signal_date ?? pool.signal_date ?? pool.trade_date ?? null,
    rank: row.original_rank ?? row.pool_rank ?? row.rank ?? row.stage_rank ?? null,
    score: row.original_score ?? row.pool_score ?? row.score ?? row.stage_score ?? null,
    sourceRole: row.source_role ?? pool.source_role ?? null,
    sourceSha256: row.source_sha256 ?? pool.source_sha256 ?? pool.source_artifact_sha256 ?? null,
    stageSelectionEligible: row.stage_selection_eligible ?? pool.stage_selection_eligible ?? null,
    sourceMergeRole: row.source_merge_role ?? pool.source_merge_role ?? null,
  };
}

export function mergePoolPages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) throw new Error("没有可合并的候选页");
  const expectedDate = String(pages[0].trade_date ?? pages[0].date ?? pages[0].target_date ?? "");
  if (!expectedDate) throw new Error("候选响应缺少交易日期");
  const candidates = new Map();
  const poolStates = new Map();
  let membershipCount = 0;
  let pageComplete = true;
  for (const payload of pages) {
    const actualDate = String(payload.trade_date ?? payload.date ?? payload.target_date ?? "");
    if (actualDate !== expectedDate) throw new Error("候选日期不匹配：" + actualDate + " != " + expectedDate);
    if (!payload.pagination || typeof payload.pagination.has_more !== "boolean") pageComplete = false;
    else if (payload.pagination.has_more) pageComplete = false;
    for (const pool of payload.pools ?? []) {
      const poolId = String(pool.pool_id ?? "UNKNOWN_SOURCE");
      poolStates.set(poolId, {
        poolId, market: marketOf(pool.market), status: String(pool.status ?? "CANNOT_CONFIRM"),
        totalRows: Number(pool.pool_size ?? pool.source_row_count ?? 0),
        sourceDate: pool.signal_date ?? pool.trade_date ?? null,
        sourceSha256: pool.source_sha256 ?? pool.source_artifact_sha256 ?? null,
        cannotConfirm: Array.isArray(pool.cannot_confirm) ? pool.cannot_confirm : [],
        hasMore: Boolean(pool.has_more),
      });
      for (const row of pool.rows ?? []) {
        const market = marketOf(row.market ?? pool.market);
        if (market !== "A" && market !== "HK") continue;
        const symbol = String(row.symbol ?? row.code ?? row.stock_code ?? "").trim();
        const identity = securityIdentity(market, symbol);
        if (!identity) continue;
        membershipCount += 1;
        if (!candidates.has(identity)) candidates.set(identity, {
          identity, market, symbol, displaySymbol: displaySymbol(market, symbol),
          name: row.stock_name ?? row.name ?? row.display_name ?? symbol,
          sources: [], sourceDates: new Set(),
        });
        const candidate = candidates.get(identity);
        const entry = sourceEntry(pool, row);
        if (!candidate.sources.some(x => x.poolId === entry.poolId && x.rank === entry.rank && x.sourceSha256 === entry.sourceSha256)) candidate.sources.push(entry);
        if (entry.sourceDate) candidate.sourceDates.add(entry.sourceDate);
        if (!candidate.name || candidate.name === candidate.symbol) candidate.name = row.stock_name ?? row.name ?? row.display_name ?? candidate.name;
      }
    }
  }
  const last = pages[pages.length - 1];
  const totals = last.market_totals ?? pages[0].market_totals ?? {};
  const rows = [...candidates.values()].map(row => ({
    ...row,
    sources: row.sources.sort((a,b) => a.poolId.localeCompare(b.poolId)),
    sourceDates: [...row.sourceDates].sort(),
  })).sort((a,b) => a.market.localeCompare(b.market) || a.displaySymbol.localeCompare(b.displaySymbol));
  const counts = { A: rows.filter(x => x.market === "A").length, HK: rows.filter(x => x.market === "HK").length };
  const expected = {
    A: Number(totals.A ?? last.a_all_pool_row_count ?? 0),
    HK: Number(totals.HK ?? poolStates.get("hkconnect_d1_top100")?.totalRows ?? 0),
  };
  const lastPage = pages[pages.length - 1];
  const paginationChainValid = pages.length > 0 && lastPage.pagination?.has_more === false && pages.every((p, i) => {
    if (!p.pagination) return false;
    if (i === pages.length - 1) return true;
    return p.pagination.has_more === true && Number.isInteger(p.pagination.next_offset)
      && p.pagination.next_offset > p.pagination.offset
      && p.pagination.next_offset === pages[i + 1]?.pagination?.offset;
  });
  const allPagesComplete = paginationChainValid;
  const countsMatch = expected.A > 0 && expected.HK > 0 && counts.A === expected.A && counts.HK === expected.HK;
  const pools = [...poolStates.values()].sort((a,b) => a.poolId.localeCompare(b.poolId));
  return {
    date: expectedDate, rows, pools, counts, expected, membershipCount,
    dataStatus: String(last.data_status ?? last.daily_readiness_status ?? "CANNOT_CONFIRM"),
    complete: allPagesComplete && countsMatch,
    completenessReason: allPagesComplete && countsMatch ? null : !allPagesComplete ? "分页尚未完整读取" : "去重数量与API市场总数不一致",
    generation: last.generation ?? last.run_id ?? null,
    inputSha256: last.input_sha256 ?? null,
    marketTotals: totals,
  };
}

export async function fetchAllPreselection(dateValue, fetcher = fetch) {
  const date = normaliseDate(dateValue);
  const limit = 300, pages = [];
  let offset = 0;
  for (let page = 0; page < 20; page += 1) {
    const url = "/api/v4/preselection-pools?" + new URLSearchParams({ date, limit: String(limit), offset: String(offset) });
    const response = await fetcher(url, { method: "GET", credentials: "same-origin", redirect: "error", cache: "no-store" });
    if (!response.ok) throw new Error("候选池读取失败 HTTP " + response.status);
    const payload = await response.json();
    const responseDate = String(payload.trade_date ?? payload.date ?? payload.target_date ?? "");
    if (responseDate !== date) throw new Error("候选池日期不匹配，已拒绝展示");
    if (!payload.pagination || !Number.isInteger(payload.pagination.offset) || payload.pagination.offset !== offset) throw new Error("候选分页身份不完整");
    pages.push(payload);
    if (payload.pagination.has_more === false) return mergePoolPages(pages);
    const next = payload.pagination.next_offset;
    if (!Number.isInteger(next) || next <= offset) throw new Error("候选分页游标无效");
    offset = next;
  }
  throw new Error("候选分页超过安全页数上限，未宣称完整");
}

export async function readJson(url, fetcher = fetch) {
  const response = await fetcher(url, { method: "GET", credentials: "same-origin", redirect: "error", cache: "no-store" });
  if (!response.ok) throw new Error("读取失败 HTTP " + response.status);
  return response.json();
}

export async function loadResearchBundle({ market: marketValue, symbol, date }, fetcher = fetch) {
  const market = marketOf(marketValue);
  const safeDate = normaliseDate(date);
  if (!symbol) throw new Error("请提供证券代码");
  if (market === "HK") {
    const url = "/api/v4/manager/workbench-research?" + new URLSearchParams({ date: safeDate, market: "HK_CONNECT", slot: "1530" });
    const workbench = await readJson(url, fetcher);
    if (workbench.trade_date && workbench.trade_date !== safeDate) throw new Error("港股研究日期不匹配");
    const rows = workbench.candidates ?? workbench.rows ?? workbench.items ?? [];
    const row = Array.isArray(rows) ? rows.find(x => securityIdentity("HK", x.symbol ?? x.code) === securityIdentity("HK", symbol)) : null;
    return { market, symbol, date: safeDate, workbench, row, status: workbench.status ?? "CANNOT_CONFIRM", source: "HK_CONNECT_0_2_MANAGER_WORKBENCH" };
  }
  if (market !== "A") throw new Error("不支持的市场身份：" + market);
  const resolvedSymbol = apiSymbol(market, symbol);
  const qs = new URLSearchParams({ date: safeDate, symbol: resolvedSymbol });
  const [product, chart, company, d2, d5] = await Promise.all([
    readJson("/api/v4/research/a-share/daily-product?" + qs, fetcher),
    readJson("/api/v4/research/a-share/original-chart?" + qs, fetcher),
    readJson("/api/v4/research/a-share/company-materials?" + qs, fetcher),
    readJson("/api/v4/research/a-share/event-cases?" + new URLSearchParams({ date: safeDate, symbol, group: "original", horizon: "d2" }), fetcher),
    readJson("/api/v4/research/a-share/event-cases?" + new URLSearchParams({ date: safeDate, symbol, group: "original", horizon: "d5" }), fetcher),
  ]);
  for (const item of [product, chart, company, d2, d5]) {
    const actual = item.data_date ?? item.dataDate;
    if (actual && actual !== safeDate) throw new Error("个股研究返回日期冲突，已拒绝合并");
  }
  return { market, symbol: resolvedSymbol, date: safeDate, product, chart, company, d2, d5, status: product.status ?? "CANNOT_CONFIRM", source: "V4_A_SHARE_DAILY_PRODUCT" };
}

export async function loadReview(dateValue, fetcher = fetch) {
  const date = normaliseDate(dateValue);
  const payload = await readJson("/api/v3/review?" + new URLSearchParams({ date }), fetcher);
  if (payload.trade_date !== date) throw new Error("复盘日期不匹配，已拒绝展示");
  return payload;
}

export function formulaComparisonFor(dateValue) {
  const date = normaliseDate(dateValue);
  return FORMULA_COMPARISONS.find(x => x.observationDate === date) ?? null;
}
