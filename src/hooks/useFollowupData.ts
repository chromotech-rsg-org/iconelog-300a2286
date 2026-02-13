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

const parseDateField = (item: FollowupItem): { month: number; year: number } | null => {
  const dt = item.dt_inicio || item.dt_expedicao || item.dt_baixa_minuta;
  if (!dt) return null;
  const str = typeof dt === "string" ? dt : String(dt);
  const parts = str.split(/[\/\-]/);
  if (parts.length < 2) return null;
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
};

const filterByMonthYear = (items: FollowupItem[], months: number[], years: number[]): FollowupItem[] => {
  if (!months.length && !years.length) return items;
  return items.filter(item => {
    const parsed = parseDateField(item);
    if (!parsed) return false;
    return years.includes(parsed.year) && months.includes(parsed.month);
  });
};

const filterByDateRange = (items: FollowupItem[], from: Date, to: Date): FollowupItem[] => {
  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);
  return items.filter(item => {
    const dt = item.dt_inicio || item.dt_expedicao || item.dt_baixa_minuta;
    if (!dt) return false;
    const itemDate = new Date(dt).getTime();
    return itemDate >= fromDate.getTime() && itemDate <= toDate.getTime();
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
        .eq("page_id", "minutas")
        .maybeSingle();
      if (data) setLastUpdateAt(new Date(data.last_update_at));
    };
    fetchLastUpdate();
  }, []);

  // Load cached data on mount - shows loading modal
  useEffect(() => {
    const loadCache = async () => {
      if (!codCli || cacheLoaded || cacheLoading) return;
      setCacheLoading(true);
      try {
        const { data: followupCache } = await supabase
          .from("bi_data_cache")
          .select("data")
          .eq("page_id", "minutas")
          .eq("cache_key", `followup_${codCli}`)
          .maybeSingle();
        const { data: produtosCache } = await supabase
          .from("bi_data_cache")
          .select("data")
          .eq("page_id", "minutas")
          .eq("cache_key", `produtos_${codCli}`)
          .maybeSingle();

        if (followupCache?.data) setFollowupData(followupCache.data as FollowupItem[]);
        if (produtosCache?.data) setProdutosData(produtosCache.data as FollowupItem[]);
      } finally {
        setCacheLoaded(true);
        setCacheLoading(false);
      }
    };
    loadCache();
  }, [codCli, cacheLoaded, cacheLoading]);

  const saveLastUpdate = useCallback(async () => {
    const now = new Date();
    const { error: upsertError } = await supabase
      .from("bi_last_update")
      .upsert({ page_id: "minutas", last_update_at: now.toISOString() }, { onConflict: "page_id" });
    if (!upsertError) {
      setLastUpdateAt(now);
    } else {
      console.error("Failed to save last update:", upsertError.message);
    }
  }, []);

  const saveToCache = useCallback(async (cacheKey: string, data: FollowupItem[]) => {
    await supabase
      .from("bi_data_cache")
      .upsert(
        { page_id: "minutas", cache_key: `${cacheKey}_${codCli}`, data: data as any, cached_at: new Date().toISOString() },
        { onConflict: "page_id,cache_key" }
      );
  }, [codCli]);

  const getDateRange = useCallback((months: number[], years: number[]) => {
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    let earliest: Date | null = null;
    let latest: Date | null = null;

    for (const year of years) {
      for (const month of months) {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        if (!earliest || firstDay < earliest) earliest = firstDay;
        if (!latest || lastDay > latest) latest = lastDay;
      }
    }

    if (!earliest || !latest) {
      const now = new Date();
      earliest = new Date(now.getFullYear(), now.getMonth(), 1);
      latest = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      data_inicial: `${fmt(earliest)} 00:00`,
      data_final: `${fmt(latest)} 23:59`,
    };
  }, []);

  const fetchFollowup = useCallback(async (_months?: number[], _years?: number[]) => {
    if (!codCli) return;
    setRefreshing(true);
    const now = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // Build month-by-month chunks from Jan 2024 to current month
    const chunks: { data_inicial: string; data_final: string }[] = [];
    const startYear = 2024;
    const endYear = now.getFullYear();
    const endMonth = now.getMonth() + 1; // 1-indexed

    for (let y = startYear; y <= endYear; y++) {
      const lastMonth = y === endYear ? endMonth : 12;
      for (let m = 1; m <= lastMonth; m++) {
        const firstDay = new Date(y, m - 1, 1);
        const lastDay = y === endYear && m === endMonth ? now : new Date(y, m, 0);
        chunks.push({
          data_inicial: `${fmt(firstDay)} 00:00`,
          data_final: `${fmt(lastDay)} 23:59`,
        });
      }
    }

    // Fetch FOLLOWUP month by month and merge
    setRefreshStage("requesting_followup");
    let allFollowup: FollowupItem[] = [];
    for (let i = 0; i < chunks.length; i++) {
      setRefreshRecordCount(allFollowup.length);
      const result = await callMainApi("FOLLOWUP", codCli, chunks[i], pageId);
      if (result) allFollowup = allFollowup.concat(result);
    }

    if (allFollowup.length > 0) {
      setRefreshStage("receiving_followup");
      setRefreshRecordCount(allFollowup.length);
      setFollowupData(allFollowup);
    }

    // Fetch PRODUTOSDISTRIBUIDOS month by month and merge
    setRefreshStage("requesting_produtos");
    let allProdutos: FollowupItem[] = [];
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

    setRefreshStage("saving");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      if (allFollowup.length > 0) await saveToCache("followup", allFollowup);
      if (allProdutos.length > 0) await saveToCache("produtos", allProdutos);
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

    filtered.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const regional = resolveRegional(cidade, cityMappings);

      if (!regionMap.has(regional)) {
        regionMap.set(regional, { expedidas: 0, baixadas: 0 });
      }
      const totals = regionMap.get(regional)!;

      if (item.dt_expedicao) totals.expedidas++;
      if (item.dt_baixa_minuta) totals.baixadas++;
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
    
    // Build date boundaries for constraining which days appear in the chart
    const hasDateRange = dateRange?.from;
    const rangeFrom = hasDateRange ? new Date(dateRange.from!) : null;
    const rangeTo = hasDateRange ? new Date(dateRange.to || dateRange.from!) : null;
    if (rangeFrom) rangeFrom.setHours(0, 0, 0, 0);
    if (rangeTo) rangeTo.setHours(23, 59, 59, 999);

    const regionDayMap = new Map<string, Map<number, { expedidas: number; baixadas: number }>>();

    const addToDay = (regional: string, day: number) => {
      if (!regionDayMap.has(regional)) {
        regionDayMap.set(regional, new Map());
      }
      const dayMap = regionDayMap.get(regional)!;
      if (!dayMap.has(day)) {
        dayMap.set(day, { expedidas: 0, baixadas: 0 });
      }
      return dayMap.get(day)!;
    };

    const isDateInRange = (d: Date): boolean => {
      if (!rangeFrom || !rangeTo) return true;
      return d.getTime() >= rangeFrom.getTime() && d.getTime() <= rangeTo.getTime();
    };

    filtered.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const regional = resolveRegional(cidade, cityMappings);

      const dtExp = item.dt_expedicao ? new Date(item.dt_expedicao) : null;
      const dtBaixa = item.dt_baixa_minuta ? new Date(item.dt_baixa_minuta) : null;

      // Only count each date if it falls within the selected range
      if (dtExp && isDateInRange(dtExp)) {
        const totals = addToDay(regional, dtExp.getDate());
        totals.expedidas++;
      }
      if (dtBaixa && isDateInRange(dtBaixa)) {
        const totals = addToDay(regional, dtBaixa.getDate());
        totals.baixadas++;
      }
    });

    return Array.from(regionDayMap.entries()).map(([region, dayMap]) => ({
      region,
      data: Array.from(dayMap.entries())
        .map(([day, totals]) => ({ day, ...totals }))
        .sort((a, b) => a.day - b.day),
    }));
  }, [followupData, cityMappings]);

  const getTotalValue = useCallback(() => {
    return produtosData.reduce((sum, item) => {
      const val = parseFloat(item.vl_total || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [produtosData]);

  const getEntregasData = useCallback(() => {
    const regionMap = new Map<string, {
      entregaFinalizado: number; entregaEmTransito: number;
      reposicaoFinalizado: number; reposicaoEmTransito: number;
    }>();

    followupData.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const regional = resolveRegional(cidade, cityMappings);
      const tipoServico = (item.ds_tipo_servico || "").toLowerCase();
      const campanha = (item.ds_campanha || item.campanha || "").toLowerCase();
      const statusReal = (item.fl_status_real || "").toLowerCase();

      if (tipoServico.includes("reentrega")) return;

      let tipo: "entrega" | "reposicao" | null = null;
      if (campanha.includes("kit restaurante") || campanha.includes("positivação kit") || campanha.includes("positivacao kit")) {
        tipo = "entrega";
      } else if (campanha.includes("reposição kit") || campanha.includes("reposicao kit")) {
        tipo = "reposicao";
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
    cityMappings,
    lastUpdateAt,
  };
};
