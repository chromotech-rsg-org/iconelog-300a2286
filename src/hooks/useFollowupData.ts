import { useState, useEffect, useCallback, useRef } from "react";
import { useApiProxy } from "./useApiProxy";
import { supabase } from "@/integrations/supabase/client";
import type { RefreshStage } from "@/components/dashboard/RefreshProgress";
import { useManualRefreshLog } from "./useManualRefreshLog";

interface CityRegionalMapping {
  cidade: string;
  regional: string;
  uf: string;
}

interface FollowupItem {
  [key: string]: any;
}

const normalize = (str: string): string =>
  str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const resolveRegionalAndUf = (cidade: string, mappings: CityRegionalMapping[]): { regional: string; uf: string } => {
  if (!cidade) return { regional: "Sem Regional", uf: "" };
  const normalized = normalize(cidade);
  const found = mappings.find(m => normalize(m.cidade) === normalized);
  return { regional: found?.regional || "Sem Regional", uf: found?.uf || "" };
};

const resolveRegional = (cidade: string, mappings: CityRegionalMapping[]): string => {
  return resolveRegionalAndUf(cidade, mappings).regional;
};

const parseDateStr = (dt: any): { month: number; year: number; date: Date | null } | null => {
  if (!dt) return null;
  const d = safeParseDate(String(dt));
  if (!d) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1, date: d };
};

const dateMatchesMonthYear = (dt: any, months: number[], years: number[]): boolean => {
  const parsed = parseDateStr(dt);
  if (!parsed) return false;
  const matchYear = years.length === 0 || years.includes(parsed.year);
  const matchMonth = months.length === 0 || months.includes(parsed.month);
  return matchYear && matchMonth;
};

const filterByMonthYear = (items: FollowupItem[], months: number[], years: number[]): FollowupItem[] => {
  if (!months.length && !years.length) return items;
  return items.filter(item => {
    // First try _fetch_year/_fetch_month metadata (historical data)
    if (item._fetch_year && Number(item._fetch_year) > 2000) {
      const metaYear = Number(item._fetch_year);
      const metaMonth = Number(item._fetch_month) || 1;
      const matchYear = years.length === 0 || years.includes(metaYear);
      const matchMonth = months.length === 0 || months.includes(metaMonth);
      if (matchYear && matchMonth) return true;
    }
    // Fallback to date field parsing
    return dateMatchesMonthYear(item.dt_expedicao, months, years) ||
           dateMatchesMonthYear(item.dt_baixa_minuta, months, years);
  });
};

const safeParseDate = (dt: string): Date | null => {
  if (!dt) return null;
  // Remove time portion if present (e.g. "2026-02-09 14:30:00")
  const dateOnly = dt.trim().split(/[\sT]/)[0];
  const parts = dateOnly.split(/[\/\-]/);
  if (parts.length < 3) return null;

  let year: number, month: number, day: number;
  if (parts[0].length === 4) {
    // YYYY-MM-DD or YYYY/MM/DD
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    // DD/MM/YYYY or DD-MM-YYYY
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  // Use local date constructor to avoid timezone shifts
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
};

const isDateInDateRange = (dt: any, fromDate: Date, toDate: Date): boolean => {
  if (!dt) return false;
  const parsed = safeParseDate(String(dt));
  if (!parsed) return false;
  // Compare date-only (start of day) to avoid time issues
  const startOfDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const fromStart = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const toStart = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return startOfDay >= fromStart && startOfDay <= toStart;
};

const filterByDateRange = (items: FollowupItem[], from: Date, to: Date): FollowupItem[] => {
  return items.filter(item => {
    return isDateInDateRange(item.dt_expedicao, from, to) ||
           isDateInDateRange(item.dt_baixa_minuta, from, to);
  });
};

const dateMatchesPeriod = (
  dt: any,
  months: number[],
  years: number[],
  dateRange?: { from?: Date; to?: Date }
): boolean => {
  if (dateRange?.from) {
    return isDateInDateRange(dt, dateRange.from, dateRange.to || dateRange.from);
  }

  return dateMatchesMonthYear(dt, months, years);
};

export const useFollowupData = (codCli: string, pageId: string = "minutas") => {
  const { callMainApi, error } = useApiProxy();
  const [followupData, setFollowupData] = useState<FollowupItem[]>([]);
  const [produtosData, setProdutosData] = useState<FollowupItem[]>([]);
  const [cityMappings, setCityMappings] = useState<CityRegionalMapping[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStage, setRefreshStage] = useState<RefreshStage>(null);
  const [refreshRecordCount, setRefreshRecordCount] = useState(0);
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const fetchMappings = async () => {
      const { data } = await supabase.from("city_regional_mapping").select("cidade, regional, uf");
      if (data) setCityMappings(data);
    };
    fetchMappings();
  }, []);

  useEffect(() => {
    const fetchLastUpdate = async () => {
      const { data } = await supabase
        .from("bi_last_update")
        .select("last_update_at")
        .eq("page_id", pageId)
        .maybeSingle();
      if (data) setLastUpdateAt(new Date(data.last_update_at));
    };
    fetchLastUpdate();
  }, [pageId]);

  // Load cached data on mount - uses shared cache (one extraction per API)
  // Loads main cache first, then historical caches sequentially to avoid timeout
  // Helper: fetch a single cache key with a 10s timeout via AbortController
  const fetchCacheWithTimeout = useCallback(async (cacheKey: string): Promise<FollowupItem[] | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const queryPromise = supabase
        .from("bi_data_cache")
        .select("data")
        .eq("page_id", "_shared")
        .eq("cache_key", cacheKey)
        .maybeSingle();
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("CACHE_TIMEOUT")), 10000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      clearTimeout(timeoutId);
      if (error) {
        console.warn(`Cache fetch error (${cacheKey}):`, error.message);
        return null;
      }
      if (data?.data && Array.isArray(data.data)) return data.data as FollowupItem[];
      return null;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.message === 'CACHE_TIMEOUT') console.warn(`Cache fetch timed out (${cacheKey})`);
      else console.warn(`Cache fetch failed (${cacheKey}):`, err.message);
      return null;
    }
  }, []);

  // Track which historical fragments have been loaded
  const [loadedFragments, setLoadedFragments] = useState<Set<string>>(new Set());

  // Load ALL fragments for this client on mount using .like() query
  useEffect(() => {
    const loadCache = async () => {
      if (!codCli || cacheLoaded || cacheLoading) return;
      setCacheLoading(true);
      try {
        // Load all followup fragments: both formats
        // Unified format: followup_YYYY_MM_codCli (from manual & new scheduled)
        // Old format: followup_codCli_YYYY_MM (legacy scheduled)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const { data: allFragments, error } = await Promise.race([
          supabase
            .from("bi_data_cache")
            .select("data, cache_key")
            .eq("page_id", "_shared")
            .or(`cache_key.like.followup_%_${codCli},cache_key.like.followup_${codCli}_%,cache_key.eq.followup_${codCli}`),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 15000))
        ]);
        clearTimeout(timeoutId);

        if (!error && allFragments && allFragments.length > 0) {
          const allFollowup: FollowupItem[] = [];
          for (const frag of allFragments) {
            if (Array.isArray(frag.data)) {
              allFollowup.push(...frag.data);
            }
          }
          // Deduplicate
          const seen = new Set<string>();
          const deduped = allFollowup.filter(item => {
            const key = item.cod_conhecimento ? String(item.cod_conhecimento) : JSON.stringify(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          if (deduped.length > 0) {
            console.log(`Loaded ${deduped.length} followup records from ${allFragments.length} cache fragments`);
            setFollowupData(deduped);
          }
        }

        // Load produtos for minutas/tracking
        if (pageId === "minutas" || pageId === "tracking") {
          const { data: prodFragments } = await Promise.race([
            supabase
              .from("bi_data_cache")
              .select("data, cache_key")
              .eq("page_id", "_shared")
              .or(`cache_key.like.produtosdistribuidos_%_${codCli},cache_key.like.produtosdistribuidos_${codCli}_%,cache_key.eq.produtosdistribuidos_${codCli}`),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 15000))
          ]);

          if (prodFragments && prodFragments.length > 0) {
            const allProdutos: FollowupItem[] = [];
            for (const frag of prodFragments) {
              if (Array.isArray(frag.data)) {
                allProdutos.push(...frag.data);
              }
            }
            const seen = new Set<string>();
            const deduped = allProdutos.filter(item => {
              const key = item.cod_conhecimento ? String(item.cod_conhecimento) : JSON.stringify(item);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            if (deduped.length > 0) {
              console.log(`Loaded ${deduped.length} produtos records from ${prodFragments.length} cache fragments`);
              setProdutosData(deduped);
            }
          }
        }
      } catch (err: any) {
        if (err.message === 'TIMEOUT') console.warn("Cache load timed out, will use API data");
        else console.error("Unexpected cache load error:", err);
      } finally {
        setCacheLoaded(true);
        setCacheLoading(false);
      }
    };
    loadCache();
  }, [codCli, cacheLoaded, cacheLoading, pageId]);

  // Lazy-load historical fragments when user filters by specific month/year
  const loadHistoricalFragments = useCallback(async (year: number, month: number) => {
    if (!codCli) return;
    const fragKey = `followup_${codCli}_${year}_${String(month).padStart(2, "0")}`;
    if (loadedFragments.has(fragKey)) return; // Already loaded

    console.log(`Lazy-loading historical fragment: ${fragKey}`);
    const fragData = await fetchCacheWithTimeout(fragKey);
    if (fragData && fragData.length > 0) {
      setFollowupData(prev => {
        const combined = [...prev, ...fragData];
        // Deduplicate
        const seen = new Set<string>();
        return combined.filter(item => {
          const key = item.cod_conhecimento ? String(item.cod_conhecimento) : JSON.stringify(item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
    }

    // Also load produtos fragment if applicable
    if (pageId === "minutas" || pageId === "tracking") {
      const prodFragKey = `produtosdistribuidos_${codCli}_${year}_${String(month).padStart(2, "0")}`;
      const prodFragData = await fetchCacheWithTimeout(prodFragKey);
      if (prodFragData && prodFragData.length > 0) {
        setProdutosData(prev => {
          const combined = [...prev, ...prodFragData];
          const seen = new Set<string>();
          return combined.filter(item => {
            const key = item.cod_conhecimento ? String(item.cod_conhecimento) : JSON.stringify(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      }
    }

    setLoadedFragments(prev => new Set(prev).add(fragKey));
  }, [codCli, pageId, loadedFragments, fetchCacheWithTimeout]);

  const saveLastUpdate = useCallback(async () => {
    const now = new Date();
    const { error: upsertError } = await supabase
      .from("bi_last_update")
      .upsert({ page_id: pageId, last_update_at: now.toISOString() }, { onConflict: "page_id" });
    if (!upsertError) {
      setLastUpdateAt(now);
    } else {
      console.error("Failed to save last update:", upsertError.message);
    }
  }, [pageId]);

  const saveToCache = useCallback(async (cacheKey: string, data: FollowupItem[]) => {
    await supabase
      .from("bi_data_cache")
      .upsert(
        { page_id: "_shared", cache_key: `${cacheKey}_${codCli}`, data: data as any, cached_at: new Date().toISOString() },
        { onConflict: "page_id,cache_key" }
      );
  }, [codCli]);

  // 2025 data fetch temporarily disabled

  const { logManualRefresh } = useManualRefreshLog();

  // Deduplicate records by cod_conhecimento (or full JSON as fallback)
  const deduplicateRecords = useCallback((records: FollowupItem[]): FollowupItem[] => {
    const seen = new Set<string>();
    return records.filter(item => {
      const key = item.cod_conhecimento
        ? String(item.cod_conhecimento)
        : JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  // Tag each record with _fetch_month/_fetch_year based on dt_expedicao (primary) or dt_baixa_minuta (fallback)
  const tagRecordWithDate = useCallback((item: FollowupItem, fallbackYear: number): FollowupItem => {
    const dtExp = safeParseDate(String(item.dt_expedicao || ""));
    const dtBaixa = safeParseDate(String(item.dt_baixa_minuta || ""));
    const refDate = dtExp || dtBaixa;
    if (refDate) {
      return { ...item, _fetch_month: refDate.getMonth() + 1, _fetch_year: refDate.getFullYear() };
    }
    return { ...item, _fetch_month: 1, _fetch_year: fallbackYear };
  }, []);

  const fetchFollowup = useCallback(async (_months?: number[], _years?: number[]) => {
    if (!codCli) return;
    const refreshStart = Date.now();
    setRefreshing(true);
    const now = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const currentYear = now.getFullYear();

    // Single full-year request: Jan 1 → today
    // This avoids losing records where dt_inicio differs from dt_expedicao across month boundaries
    const yearStart = new Date(currentYear, 0, 1);
    const singleRange = {
      data_inicial: `${fmt(yearStart)} 00:00`,
      data_final: `${fmt(now)} 23:59`,
    };

    // 1) Fetch FOLLOWUP for the entire year in one request
    setRefreshStage("requesting_followup");
    setRefreshRecordCount(0);
    let allFollowup: FollowupItem[] = [];
    const result = await callMainApi("FOLLOWUP", codCli, singleRange, pageId);
    if (result && Array.isArray(result)) {
      // Tag each record based on its actual dt_expedicao/dt_baixa_minuta
      allFollowup = result.map((item: FollowupItem) => tagRecordWithDate(item, currentYear));
      // Deduplicate
      allFollowup = deduplicateRecords(allFollowup);
    }

    if (allFollowup.length > 0) {
      setRefreshStage("receiving_followup");
      setRefreshRecordCount(allFollowup.length);
      setFollowupData(allFollowup);
    }

    // Fetch PRODUTOSDISTRIBUIDOS for minutas and tracking (also single request)
    let allProdutos: FollowupItem[] = [];
    if (pageId === "minutas" || pageId === "tracking") {
      setRefreshStage("requesting_produtos");
      setRefreshRecordCount(0);
      const prodResult = await callMainApi("PRODUTOSDISTRIBUIDOS", codCli, singleRange, pageId);
      if (prodResult && Array.isArray(prodResult)) {
        allProdutos = deduplicateRecords(prodResult);
      }

      if (allProdutos.length > 0) {
        setRefreshStage("receiving_produtos");
        setRefreshRecordCount(allProdutos.length);
        setProdutosData(allProdutos);
      }
    }

    setRefreshStage("saving");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Save per-month fragments instead of one giant blob to reduce DB load
      const followupByMonth = new Map<string, FollowupItem[]>();
      for (const item of allFollowup) {
        const y = Number(item._fetch_year) || currentYear;
        const m = Number(item._fetch_month) || 1;
        const key = `${y}_${String(m).padStart(2, "0")}`;
        const arr = followupByMonth.get(key) || [];
        arr.push(item);
        followupByMonth.set(key, arr);
      }
      for (const [monthKey, items] of followupByMonth) {
        await saveToCache(`followup_${monthKey}`, items);
      }

      if ((pageId === "minutas" || pageId === "tracking") && allProdutos.length > 0) {
        const produtosByMonth = new Map<string, FollowupItem[]>();
        for (const item of allProdutos) {
          const dtExp = safeParseDate(String(item.dt_expedicao || ""));
          const y = dtExp ? dtExp.getFullYear() : currentYear;
          const m = dtExp ? dtExp.getMonth() + 1 : 1;
          const key = `${y}_${String(m).padStart(2, "0")}`;
          const arr = produtosByMonth.get(key) || [];
          arr.push(item);
          produtosByMonth.set(key, arr);
        }
        for (const [monthKey, items] of produtosByMonth) {
          await saveToCache(`produtosdistribuidos_${monthKey}`, items);
        }
      }
      // Clean up old giant main cache entries (replaced by per-month fragments)
      await supabase.from("bi_data_cache").delete().eq("page_id", "_shared").eq("cache_key", `followup_${codCli}`);
      await supabase.from("bi_data_cache").delete().eq("page_id", "_shared").eq("cache_key", `produtosdistribuidos_${codCli}`);
      await saveLastUpdate();
    } else {
      setLastUpdateAt(new Date());
    }

    setRefreshStage("done");
    setRefreshRecordCount(0);

    // Log manual refresh
    const refreshApis = ["FOLLOWUP"];
    const refreshResults: Array<{ api: string; records: number; time_ms: number }> = [
      { api: "FOLLOWUP", records: allFollowup.length, time_ms: Date.now() - refreshStart },
    ];
    if (pageId === "minutas" || pageId === "tracking") {
      refreshApis.push("PRODUTOSDISTRIBUIDOS");
      refreshResults.push({ api: "PRODUTOSDISTRIBUIDOS", records: allProdutos.length, time_ms: Date.now() - refreshStart });
    }
    logManualRefresh({ pageId, apis: refreshApis, totalMs: Date.now() - refreshStart, results: refreshResults });

    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    doneTimerRef.current = setTimeout(() => {
      setRefreshStage(null);
      setRefreshing(false);
    }, 3000);
  }, [codCli, callMainApi, saveLastUpdate, saveToCache, pageId, logManualRefresh, deduplicateRecords, tagRecordWithDate]);

  const getMinutasData = useCallback((months: number[], years: number[], dateRange?: { from?: Date; to?: Date }) => {
    const filtered = dateRange?.from
      ? filterByDateRange(followupData, dateRange.from, dateRange.to || dateRange.from)
      : filterByMonthYear(followupData, months, years);
    const regionMap = new Map<string, { expedidas: number; baixadas: number }>();

    const hasDateRange = !!dateRange?.from;
    const fromDate = hasDateRange ? dateRange.from! : null;
    const toDate = hasDateRange ? (dateRange.to || dateRange.from!) : null;

    filtered.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const regional = resolveRegional(cidade, cityMappings);

      if (!regionMap.has(regional)) {
        regionMap.set(regional, { expedidas: 0, baixadas: 0 });
      }
      const totals = regionMap.get(regional)!;

      // Count expedida only if dt_expedicao falls within the selected period
      if (hasDateRange && fromDate && toDate) {
        if (isDateInDateRange(item.dt_expedicao, fromDate, toDate)) totals.expedidas++;
        if (isDateInDateRange(item.dt_baixa_minuta, fromDate, toDate)) totals.baixadas++;
      } else {
        if (dateMatchesMonthYear(item.dt_expedicao, months, years)) totals.expedidas++;
        if (dateMatchesMonthYear(item.dt_baixa_minuta, months, years)) totals.baixadas++;
      }
    });

    return Array.from(regionMap.entries()).map(([name, totals]) => ({
      name,
      ...totals,
    }));
  }, [followupData, cityMappings]);

  const getMinutasDailyData = useCallback((months: number[], years: number[], dateRange?: { from?: Date; to?: Date }) => {
    const filtered = dateRange?.from
      ? filterByDateRange(followupData, dateRange.from, dateRange.to || dateRange.from)
      : filterByMonthYear(followupData, months, years);
    
    const hasDateRange = dateRange?.from;
    const rangeFrom = hasDateRange ? dateRange.from! : null;
    const rangeTo = hasDateRange ? (dateRange.to || dateRange.from!) : null;

    const regionDayMap = new Map<string, Map<string, { expedidas: number; baixadas: number }>>();

    const addToDay = (regional: string, dateKey: string) => {
      if (!regionDayMap.has(regional)) {
        regionDayMap.set(regional, new Map());
      }
      const dayMap = regionDayMap.get(regional)!;
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, { expedidas: 0, baixadas: 0 });
      }
      return dayMap.get(dateKey)!;
    };

    const isDateInRange = (d: Date): boolean => {
      if (!rangeFrom || !rangeTo) return true;
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const fromStart = new Date(rangeFrom.getFullYear(), rangeFrom.getMonth(), rangeFrom.getDate());
      const toStart = new Date(rangeTo.getFullYear(), rangeTo.getMonth(), rangeTo.getDate());
      return dStart >= fromStart && dStart <= toStart;
    };

    const toDateKey = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    filtered.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const regional = resolveRegional(cidade, cityMappings);

      const dtExp = item.dt_expedicao ? safeParseDate(String(item.dt_expedicao)) : null;
      const dtBaixa = item.dt_baixa_minuta ? safeParseDate(String(item.dt_baixa_minuta)) : null;

      if (dtExp && isDateInRange(dtExp) && dateMatchesPeriod(item.dt_expedicao, months, years, dateRange)) {
        const totals = addToDay(regional, toDateKey(dtExp));
        totals.expedidas++;
      }
      if (dtBaixa && isDateInRange(dtBaixa) && dateMatchesPeriod(item.dt_baixa_minuta, months, years, dateRange)) {
        const totals = addToDay(regional, toDateKey(dtBaixa));
        totals.baixadas++;
      }
    });

    const allDateKeys = new Set<string>();
    if (rangeFrom && rangeTo) {
      const cur = new Date(rangeFrom);
      while (cur <= rangeTo) {
        allDateKeys.add(toDateKey(cur));
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      regionDayMap.forEach(dayMap => dayMap.forEach((_, key) => allDateKeys.add(key)));
    }

    const sortedKeys = Array.from(allDateKeys).sort();

    return Array.from(regionDayMap.entries()).map(([region, dayMap]) => ({
      region,
      data: sortedKeys.map(dateKey => {
        const totals = dayMap.get(dateKey) || { expedidas: 0, baixadas: 0 };
        const parts = dateKey.split("-");
        return {
          day: parseInt(parts[2], 10),
          dateStr: dateKey,
          ...totals,
        };
      }),
    }));
  }, [followupData, cityMappings]);

  const getTotalValue = useCallback(() => {
    return produtosData.reduce((sum, item) => {
      const val = parseFloat(item.vl_total || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [produtosData]);

  const getEntregasData = useCallback((months?: number[], years?: number[], campaignMode: "kit-completo" | "kit-basico" = "kit-completo") => {
    // Use _fetch_month/_fetch_year tags when available for accurate filtering
    // This matches the API's internal date logic rather than parsing record date fields
    const filtered = (months?.length || years?.length) 
      ? followupData.filter(item => {
          const ms = months || [];
          const ys = years || [];
          // Prefer fetch tags if available
          if (item._fetch_month != null && item._fetch_year != null) {
            const matchYear = ys.length === 0 || ys.includes(Number(item._fetch_year));
            const matchMonth = ms.length === 0 || ms.includes(Number(item._fetch_month));
            return matchYear && matchMonth;
          }
          // Fallback to date field matching for legacy cached data
          return dateMatchesMonthYear(item.dt_expedicao, ms, ys) ||
                 dateMatchesMonthYear(item.dt_baixa_minuta, ms, ys) ||
                 dateMatchesMonthYear(item.dt_previsao, ms, ys) ||
                 dateMatchesMonthYear(item.dt_entrega_real, ms, ys) ||
                 dateMatchesMonthYear(item.dt_emissao, ms, ys);
        })
      : followupData;

    const regionMap = new Map<string, {
      entregaFinalizado: number; entregaEmTransito: number;
      reposicaoFinalizado: number; reposicaoEmTransito: number;
      uf: string;
    }>();

    const BASICO_CAMPAIGNS = ["99FOOD_BASICO_POSITIVACAO KIT", "99FOOD_BASICO_KIT RESTAURANTE", "99FOOD_BASICO_REPOSICAO KIT"];

    filtered.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const { regional, uf } = resolveRegionalAndUf(cidade, cityMappings);
      const tipoServico = (item.ds_tipo_servico || "").toLowerCase();
      const campanhaNorm = normalize(item.nm_campanha || item.ds_campanha || item.campanha || "");
      const statusReal = (item.fl_status_real || "").toLowerCase();

      if (tipoServico.includes("reentrega")) return;

      const isBasico = BASICO_CAMPAIGNS.some(exc => campanhaNorm.includes(exc));

      if (campaignMode === "kit-completo" && isBasico) return;
      if (campaignMode === "kit-basico" && !isBasico) return;

      let tipo: "entrega" | "reposicao" | null = null;
      if (campanhaNorm.includes("REPOSICAO") || campanhaNorm.includes("REPOSITIVACAO")) {
        tipo = "reposicao";
      } else if (campanhaNorm.includes("KIT RESTAURANTE") || campanhaNorm.includes("POSITIVACAO") || campanhaNorm.includes("PIZZA KIT")) {
        tipo = "entrega";
      }
      if (!tipo) return;

      if (!regionMap.has(regional)) {
        regionMap.set(regional, {
          entregaFinalizado: 0, entregaEmTransito: 0,
          reposicaoFinalizado: 0, reposicaoEmTransito: 0,
          uf,
        });
      }
      const totals = regionMap.get(regional)!;

      const isFinalizado = statusReal.includes("finalizado") || statusReal.includes("entregue");

      if (tipo === "entrega") {
        if (isFinalizado) totals.entregaFinalizado++;
        else totals.entregaEmTransito++;
      } else {
        if (isFinalizado) totals.reposicaoFinalizado++;
        else totals.reposicaoEmTransito++;
      }
    });

    return Array.from(regionMap.entries()).map(([regional, totals]) => ({
      id: `delivery-${regional}`,
      regional,
      uf: totals.uf,
      ...totals,
      entregaTotal: totals.entregaFinalizado + totals.entregaEmTransito,
      reposicaoTotal: totals.reposicaoFinalizado + totals.reposicaoEmTransito,
    }));
  }, [followupData, cityMappings]);

  const getTrackingData = useCallback((months: number[], years: number[], dateRange?: { from?: Date; to?: Date }) => {
    // Filter followup data by date
    const hasDateRange = !!dateRange?.from;
    let filtered = followupData;
    if (hasDateRange) {
      filtered = filtered.filter(item => {
        const from = dateRange.from!;
        const to = dateRange.to || dateRange.from!;
        return isDateInDateRange(item.dt_previsao, from, to) ||
               isDateInDateRange(item.dt_entrega_real, from, to) ||
               isDateInDateRange(item.dt_expedicao, from, to);
      });
    } else if (months.length || years.length) {
      const ms = months || [];
      const ys = years || [];
      filtered = filtered.filter(item => {
        // Prefer _fetch_month/_fetch_year tags for accurate filtering (same as getEntregasData)
        if (item._fetch_month != null && item._fetch_year != null) {
          const matchYear = ys.length === 0 || ys.includes(Number(item._fetch_year));
          const matchMonth = ms.length === 0 || ms.includes(Number(item._fetch_month));
          return matchYear && matchMonth;
        }
        // Fallback for legacy cached data without tags
        return dateMatchesMonthYear(item.dt_previsao, ms, ys) ||
               dateMatchesMonthYear(item.dt_entrega_real, ms, ys) ||
               dateMatchesMonthYear(item.dt_expedicao, ms, ys);
      });
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let noPrazo = 0;
    let foraPrazo = 0;
    let finalizado = 0;
    let transito = 0;
    const tipoServicoMap = new Map<string, number>();
    const modalidadeMap = new Map<string, number>();
    const cidadeStatusMap = new Map<string, { finalizado: number; transito: number }>();
    const estadoMap = new Map<string, { value: number; noPrazo: number; foraPrazo: number; semOcorrencia: number; comOcorrencia: number }>();
    const regionalMap = new Map<string, number>();

    filtered.forEach(item => {
      const statusReal = (item.fl_status_real || "").toUpperCase();
      const isFinalizado = statusReal.includes("FINALIZADO") || statusReal.includes("ENTREGUE");

      if (isFinalizado) finalizado++;
      else transito++;

      // On-time logic: orders without dt_previsao count as "Fora do Prazo"
      const dtPrevisao = item.dt_previsao ? safeParseDate(String(item.dt_previsao)) : null;
      const dtEntregaReal = item.dt_entrega_real ? safeParseDate(String(item.dt_entrega_real)) : null;

      if (dtPrevisao) {
        if (dtEntregaReal) {
          if (dtEntregaReal <= dtPrevisao) noPrazo++;
          else foraPrazo++;
        } else {
          if (now <= dtPrevisao) noPrazo++;
          else foraPrazo++;
        }
      } else {
        // No dt_previsao = Fora do Prazo
        foraPrazo++;
      }

      // Tipo servico
      const tipo = (item.ds_tipo_servico || "OUTROS").toUpperCase();
      tipoServicoMap.set(tipo, (tipoServicoMap.get(tipo) || 0) + 1);

      // Modalidade
      const mod = (item.ds_modalidade_transporte || "OUTROS").toUpperCase();
      modalidadeMap.set(mod, (modalidadeMap.get(mod) || 0) + 1);

      // Cidade with status
      const cidade = (item.ds_cidade_DES || "").toUpperCase();
      if (cidade) {
        if (!cidadeStatusMap.has(cidade)) cidadeStatusMap.set(cidade, { finalizado: 0, transito: 0 });
        const cs = cidadeStatusMap.get(cidade)!;
        if (isFinalizado) cs.finalizado++;
        else cs.transito++;
      }

      // Estado with detailed stats
      const uf = (item.ds_uf_DES || "").toUpperCase();
      if (uf) {
        if (!estadoMap.has(uf)) estadoMap.set(uf, { value: 0, noPrazo: 0, foraPrazo: 0, semOcorrencia: 0, comOcorrencia: 0 });
        const es = estadoMap.get(uf)!;
        es.value++;
        // On-time logic per state
        if (dtPrevisao) {
          if (dtEntregaReal) {
            if (dtEntregaReal <= dtPrevisao) es.noPrazo++; else es.foraPrazo++;
          } else {
            if (now <= dtPrevisao) es.noPrazo++; else es.foraPrazo++;
          }
        }
        // Ocorrência: items with status issues are "com ocorrência"
        const hasOcorrencia = statusReal.includes("OCORRENCIA") || statusReal.includes("DEVOLU") || statusReal.includes("SINISTRO");
        if (hasOcorrencia) es.comOcorrencia++; else es.semOcorrencia++;
      }

      // Regional from city mapping
      const cidadeOriginal = item.ds_cidade_DES || item.ds_cidade || "";
      const regional = resolveRegional(cidadeOriginal, cityMappings);
      regionalMap.set(regional, (regionalMap.get(regional) || 0) + 1);
    });

    const total = filtered.length;
    const percNoPrazo = total > 0 ? (noPrazo / total) * 100 : 0;
    const percForaPrazo = total > 0 ? (foraPrazo / total) * 100 : 0;

    return {
      kpis: { total, noPrazo, foraPrazo, percNoPrazo, percForaPrazo, finalizado, transito },
      tipoServico: Array.from(tipoServicoMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      modalidade: Array.from(modalidadeMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      cidade: Array.from(cidadeStatusMap.entries()).map(([name, v]) => ({ name, ...v, total: v.finalizado + v.transito })).sort((a, b) => b.total - a.total).slice(0, 15),
      estado: Array.from(estadoMap.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value),
      regional: Array.from(regionalMap.entries()).map(([name, value]) => ({ name, value })).filter(r => r.name !== "Sem Regional").sort((a, b) => b.value - a.value),
      filteredOrders: filtered,
    };
  }, [followupData, cityMappings]);

  const getFaturamentoData = useCallback((
    months: number[],
    years: number[],
    sides: string[] = [],
    interactiveFilters?: {
      selectedMonth?: string | null;
      selectedRegional?: string | null;
      selectedModalidade?: string | null;
      selectedTipoServico?: string | null;
      selectedCampanha?: string | null;
    }
  ) => {
    // Filter by _fetch_month/_fetch_year tags (same pattern as other getters)
    let filtered = (months?.length || years?.length)
      ? followupData.filter(item => {
          const ms = months || [];
          const ys = years || [];
          if (item._fetch_month != null && item._fetch_year != null) {
            const matchYear = ys.length === 0 || ys.includes(Number(item._fetch_year));
            const matchMonth = ms.length === 0 || ms.includes(Number(item._fetch_month));
            return matchYear && matchMonth;
          }
          return dateMatchesMonthYear(item.dt_expedicao, ms, ys) ||
                 dateMatchesMonthYear(item.dt_emissao, ms, ys);
        })
      : [...followupData];

    // B-SIDE / D-SIDE filter
    if (sides.length > 0) {
      filtered = filtered.filter(item => {
        const ccusto = (item.nr_ccusto_ped_cliente || "").toUpperCase().trim();
        return sides.some(s => {
          const sNorm = s.replace("-", "").replace(" ", "").toUpperCase();
          const ccustoNorm = ccusto.replace("-", "").replace(" ", "");
          return ccustoNorm.includes(sNorm) || ccustoNorm === sNorm || ccusto.includes(s.toUpperCase());
        });
      });
    }

    // Apply interactive cross-filters on raw data
    if (interactiveFilters) {
      const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      if (interactiveFilters.selectedMonth) {
        const selMonth = interactiveFilters.selectedMonth;
        filtered = filtered.filter(item => {
          const fm = item._fetch_month;
          if (fm) return mesesNomes[fm - 1] === selMonth;
          return false;
        });
      }
      if (interactiveFilters.selectedTipoServico) {
        const sel = interactiveFilters.selectedTipoServico.toUpperCase();
        filtered = filtered.filter(item => {
          const tipo = (item.ds_tipo_servico || "OUTROS").toUpperCase();
          return tipo === sel;
        });
      }
      if (interactiveFilters.selectedModalidade) {
        const sel = interactiveFilters.selectedModalidade.toUpperCase();
        filtered = filtered.filter(item => {
          const mod = (item.ds_modalidade_transporte || "OUTROS").toUpperCase();
          return mod === sel;
        });
      }
      if (interactiveFilters.selectedCampanha) {
        const sel = interactiveFilters.selectedCampanha.toUpperCase();
        filtered = filtered.filter(item => {
          const campanha = (item.nm_campanha || item.ds_campanha || item.campanha || "OUTROS").toUpperCase();
          return campanha === sel;
        });
      }
      if (interactiveFilters.selectedRegional) {
        const sel = interactiveFilters.selectedRegional;
        const UF_TO_MACRO: Record<string, string> = {
          SP: "Sudeste", RJ: "Sudeste", MG: "Sudeste", ES: "Sudeste",
          BA: "Nordeste", SE: "Nordeste", AL: "Nordeste", PE: "Nordeste", PB: "Nordeste", RN: "Nordeste", CE: "Nordeste", PI: "Nordeste", MA: "Nordeste",
          PR: "Sul", SC: "Sul", RS: "Sul",
          AM: "Norte", PA: "Norte", AC: "Norte", RO: "Norte", RR: "Norte", AP: "Norte", TO: "Norte",
          GO: "Centro-Oeste", MT: "Centro-Oeste", MS: "Centro-Oeste", DF: "Centro-Oeste",
        };
        filtered = filtered.filter(item => {
          const uf = (item.ds_uf_DES || item.ds_uf || "").toUpperCase().trim();
          const macroRegion = UF_TO_MACRO[uf] || "Outros";
          return macroRegion === sel;
        });
      }
    }

    // Monthly breakdown
    const monthlyMap = new Map<string, { mes: string; mesNum: number; ano: number; faturamento: number; armazenagem: number; transporte: number }>();
    const tipoServicoMap = new Map<string, number>();
    const modalidadeMap = new Map<string, number>();
    const campanhaMap = new Map<string, number>();
    const regionalMap = new Map<string, number>();

    const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    filtered.forEach(item => {
      // Use vl_frete as the billing value; fallback to vl_total
      const valor = parseFloat(item.vl_frete || item.vl_total || "0") || 0;
      if (valor === 0) return;

      const tipoServico = (item.ds_tipo_servico || "OUTROS").toUpperCase();
      const isArmazenagem = tipoServico.includes("ARMAZENAGEM") || tipoServico.includes("ARMAZENA");

      // Monthly aggregation - use _fetch_month/_fetch_year when available
      const fetchMonth = item._fetch_month;
      const fetchYear = item._fetch_year;
      if (fetchMonth && fetchYear) {
        const key = `${fetchYear}-${fetchMonth}`;
        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            mes: mesesNomes[fetchMonth - 1] || `Mês ${fetchMonth}`,
            mesNum: fetchMonth,
            ano: fetchYear,
            faturamento: 0,
            armazenagem: 0,
            transporte: 0,
          });
        }
        const m = monthlyMap.get(key)!;
        m.faturamento += valor;
        if (isArmazenagem) m.armazenagem += valor;
        else m.transporte += valor;
      }

      // Tipo de Serviço
      tipoServicoMap.set(tipoServico, (tipoServicoMap.get(tipoServico) || 0) + valor);

      // Modalidade
      const mod = (item.ds_modalidade_transporte || "OUTROS").toUpperCase();
      modalidadeMap.set(mod, (modalidadeMap.get(mod) || 0) + valor);

      // Campanha
      const campanha = (item.nm_campanha || item.ds_campanha || item.campanha || "OUTROS").toUpperCase();
      campanhaMap.set(campanha, (campanhaMap.get(campanha) || 0) + valor);

      // Regional - macro region based on UF
      const UF_TO_MACRO: Record<string, string> = {
        SP: "Sudeste", RJ: "Sudeste", MG: "Sudeste", ES: "Sudeste",
        BA: "Nordeste", SE: "Nordeste", AL: "Nordeste", PE: "Nordeste", PB: "Nordeste", RN: "Nordeste", CE: "Nordeste", PI: "Nordeste", MA: "Nordeste",
        PR: "Sul", SC: "Sul", RS: "Sul",
        AM: "Norte", PA: "Norte", AC: "Norte", RO: "Norte", RR: "Norte", AP: "Norte", TO: "Norte",
        GO: "Centro-Oeste", MT: "Centro-Oeste", MS: "Centro-Oeste", DF: "Centro-Oeste",
      };
      const uf = (item.ds_uf_DES || item.ds_uf || "").toUpperCase().trim();
      const macroRegion = UF_TO_MACRO[uf] || "Outros";
      regionalMap.set(macroRegion, (regionalMap.get(macroRegion) || 0) + valor);
    });

    const mensal = Array.from(monthlyMap.values()).sort((a, b) => a.ano - b.ano || a.mesNum - b.mesNum);

    const totalFaturamento = mensal.reduce((s, m) => s + m.faturamento, 0);
    const totalArmazenagem = mensal.reduce((s, m) => s + m.armazenagem, 0);
    const totalTransporte = mensal.reduce((s, m) => s + m.transporte, 0);

    return {
      mensal,
      totals: {
        faturamento: totalFaturamento,
        armazenagem: totalArmazenagem,
        transporte: totalTransporte,
        percentArmazenagem: totalFaturamento > 0 ? (totalArmazenagem / totalFaturamento) * 100 : 0,
        percentTransporte: totalFaturamento > 0 ? (totalTransporte / totalFaturamento) * 100 : 0,
      },
      tipoServico: Array.from(tipoServicoMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      modalidade: Array.from(modalidadeMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      campanha: Array.from(campanhaMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      regional: Array.from(regionalMap.entries()).map(([name, value]) => ({ name, value })).filter(r => r.name !== "Sem Regional").sort((a, b) => b.value - a.value),
    };
  }, [followupData, cityMappings]);

  return {
    followupData,
    produtosData,
    loading: false,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    error,
    fetchFollowup,
    getMinutasData,
    getMinutasDailyData,
    getTotalValue,
    getEntregasData,
    getTrackingData,
    getFaturamentoData,
    cityMappings,
    lastUpdateAt,
  };
};
