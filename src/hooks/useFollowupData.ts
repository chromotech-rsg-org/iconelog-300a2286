import { useState, useEffect, useCallback, useRef } from "react";
import { useApiProxy } from "./useApiProxy";
import { supabase } from "@/integrations/supabase/client";
import type { RefreshStage } from "@/components/dashboard/RefreshProgress";

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

const resolveRegional = (cidade: string, mappings: CityRegionalMapping[]): string => {
  if (!cidade) return "Sem Regional";
  const normalized = normalize(cidade);
  const found = mappings.find(m => normalize(m.cidade) === normalized);
  return found?.regional || "Sem Regional";
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

  // Load cached data on mount
  useEffect(() => {
    const loadCache = async () => {
      if (!codCli || cacheLoaded || cacheLoading) return;
      setCacheLoading(true);
      try {
        const { data: followupCache } = await supabase
          .from("bi_data_cache")
          .select("data")
          .eq("page_id", pageId)
          .eq("cache_key", `followup_${codCli}`)
          .maybeSingle();

        if (followupCache?.data) setFollowupData(followupCache.data as FollowupItem[]);

        if (pageId === "minutas" || pageId === "tracking") {
          const { data: produtosCache } = await supabase
            .from("bi_data_cache")
            .select("data")
            .eq("page_id", pageId)
            .eq("cache_key", `produtos_${codCli}`)
            .maybeSingle();
          if (produtosCache?.data) setProdutosData(produtosCache.data as FollowupItem[]);
        }
      } finally {
        setCacheLoaded(true);
        setCacheLoading(false);
      }
    };
    loadCache();
  }, [codCli, cacheLoaded, cacheLoading, pageId]);

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
        { page_id: pageId, cache_key: `${cacheKey}_${codCli}`, data: data as any, cached_at: new Date().toISOString() },
        { onConflict: "page_id,cache_key" }
      );
  }, [codCli, pageId]);

  const fetchFollowup = useCallback(async (_months?: number[], _years?: number[]) => {
    if (!codCli) return;
    setRefreshing(true);
    const now = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // Build month-by-month chunks from Jan of current year to current month
    const chunks: { data_inicial: string; data_final: string }[] = [];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    for (let m = 1; m <= currentMonth; m++) {
      const firstDay = new Date(currentYear, m - 1, 1);
      const lastDay = new Date(currentYear, m, 0);
      chunks.push({
        data_inicial: `${fmt(firstDay)} 00:00`,
        data_final: `${fmt(lastDay)} 23:59`,
      });
    }

    // Fetch FOLLOWUP month by month and merge, tagging each record with source month/year
    setRefreshStage("requesting_followup");
    let allFollowup: FollowupItem[] = [];
    for (let i = 0; i < chunks.length; i++) {
      setRefreshRecordCount(allFollowup.length);
      const result = await callMainApi("FOLLOWUP", codCli, chunks[i], pageId);
      if (result) {
        const monthIndex = i + 1; // 1-based month
        const tagged = result.map((item: FollowupItem) => ({
          ...item,
          _fetch_month: monthIndex,
          _fetch_year: currentYear,
        }));
        allFollowup = allFollowup.concat(tagged);
      }
    }

    if (allFollowup.length > 0) {
      setRefreshStage("receiving_followup");
      setRefreshRecordCount(allFollowup.length);
      setFollowupData(allFollowup);
    }

    // Fetch PRODUTOSDISTRIBUIDOS for minutas and tracking
    let allProdutos: FollowupItem[] = [];
    if (pageId === "minutas" || pageId === "tracking") {
      setRefreshStage("requesting_produtos");
      for (let i = 0; i < chunks.length; i++) {
        setRefreshRecordCount(allProdutos.length);
        const result = await callMainApi("PRODUTOSDISTRIBUIDOS", codCli, chunks[i], pageId);
        if (result) allProdutos = allProdutos.concat(result);
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
      if (allFollowup.length > 0) await saveToCache("followup", allFollowup);
      if ((pageId === "minutas" || pageId === "tracking") && allProdutos.length > 0) {
        await saveToCache("produtos", allProdutos);
      }
      await saveLastUpdate();
    } else {
      setLastUpdateAt(new Date());
    }

    setRefreshStage("done");
    setRefreshRecordCount(0);

    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    doneTimerRef.current = setTimeout(() => {
      setRefreshStage(null);
      setRefreshing(false);
    }, 3000);
  }, [codCli, callMainApi, saveLastUpdate, saveToCache, pageId]);

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

      if (dtExp && isDateInRange(dtExp)) {
        const totals = addToDay(regional, toDateKey(dtExp));
        totals.expedidas++;
      }
      if (dtBaixa && isDateInRange(dtBaixa)) {
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

  const getEntregasData = useCallback((months?: number[], years?: number[]) => {
    // Use _fetch_month/_fetch_year tags when available for accurate filtering
    // This matches the API's internal date logic rather than parsing record date fields
    const filtered = (months?.length || years?.length) 
      ? followupData.filter(item => {
          const ms = months || [];
          const ys = years || [];
          // Prefer fetch tags if available
          if (item._fetch_month != null && item._fetch_year != null) {
            const matchYear = ys.length === 0 || ys.includes(item._fetch_year);
            const matchMonth = ms.length === 0 || ms.includes(item._fetch_month);
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
    }>();

    filtered.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const regional = resolveRegional(cidade, cityMappings);
      const tipoServico = (item.ds_tipo_servico || "").toLowerCase();
      const campanhaNorm = normalize(item.nm_campanha || item.ds_campanha || item.campanha || "");
      const statusReal = (item.fl_status_real || "").toLowerCase();

      if (tipoServico.includes("reentrega")) return;

      let tipo: "entrega" | "reposicao" | null = null;
      if (campanhaNorm.includes("REPOSICAO") || campanhaNorm.includes("REPOSITIVACAO")) {
        tipo = "reposicao";
      } else if (campanhaNorm.includes("KIT RESTAURANTE") || campanhaNorm.includes("POSITIVACAO")) {
        tipo = "entrega";
      }
      if (!tipo) return;

      if (!regionMap.has(regional)) {
        regionMap.set(regional, {
          entregaFinalizado: 0, entregaEmTransito: 0,
          reposicaoFinalizado: 0, reposicaoEmTransito: 0,
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
          const matchYear = ys.length === 0 || ys.includes(item._fetch_year);
          const matchMonth = ms.length === 0 || ms.includes(item._fetch_month);
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

  const getFaturamentoData = useCallback((months: number[], years: number[]) => {
    // Filter by _fetch_month/_fetch_year tags (same pattern as other getters)
    const filtered = (months?.length || years?.length)
      ? followupData.filter(item => {
          const ms = months || [];
          const ys = years || [];
          if (item._fetch_month != null && item._fetch_year != null) {
            const matchYear = ys.length === 0 || ys.includes(item._fetch_year);
            const matchMonth = ms.length === 0 || ms.includes(item._fetch_month);
            return matchYear && matchMonth;
          }
          return dateMatchesMonthYear(item.dt_expedicao, ms, ys) ||
                 dateMatchesMonthYear(item.dt_emissao, ms, ys);
        })
      : followupData;

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

      // Regional
      const cidade = item.ds_cidade_DES || item.ds_cidade || "";
      const regional = resolveRegional(cidade, cityMappings);
      regionalMap.set(regional, (regionalMap.get(regional) || 0) + valor);
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
