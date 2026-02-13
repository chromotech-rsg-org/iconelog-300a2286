import { useState, useEffect, useCallback } from "react";
import { useApiProxy } from "./useApiProxy";
import { supabase } from "@/integrations/supabase/client";

interface CityRegionalMapping {
  cidade: string;
  regional: string;
  uf: string;
}

interface FollowupItem {
  [key: string]: any;
}

// Normalize string: remove accents, trim, uppercase
const normalize = (str: string): string =>
  str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

// Resolve regional from city using the mapping table
const resolveRegional = (cidade: string, mappings: CityRegionalMapping[]): string => {
  if (!cidade) return "Sem Regional";
  const normalized = normalize(cidade);
  const found = mappings.find(m => normalize(m.cidade) === normalized);
  return found?.regional || "Sem Regional";
};

export const useFollowupData = (codCli: string) => {
  const { callMainApi, loading: apiLoading, error } = useApiProxy();
  const [followupData, setFollowupData] = useState<FollowupItem[]>([]);
  const [produtosData, setProdutosData] = useState<FollowupItem[]>([]);
  const [cityMappings, setCityMappings] = useState<CityRegionalMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);

  // Fetch city-regional mappings
  useEffect(() => {
    const fetchMappings = async () => {
      const { data } = await supabase.from("city_regional_mapping").select("cidade, regional, uf");
      if (data) setCityMappings(data);
    };
    fetchMappings();
  }, []);

  // Fetch last update from DB
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

  // Save last update to DB
  const saveLastUpdate = useCallback(async () => {
    const now = new Date();
    setLastUpdateAt(now);
    await supabase
      .from("bi_last_update")
      .upsert({ page_id: "minutas", last_update_at: now.toISOString() }, { onConflict: "page_id" });
  }, []);

  // Build date range for given months/years
  const getDateRange = useCallback((months: number[], years: number[]) => {
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // Find earliest first-day and latest last-day across all month/year combos
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

  const fetchFollowup = useCallback(async (months?: number[], years?: number[]) => {
    if (!codCli) return;
    setLoading(true);
    const now = new Date();
    const m = months || [now.getMonth() + 1];
    const y = years || [now.getFullYear()];
    const dates = getDateRange(m, y);
    const data = await callMainApi("FOLLOWUP", codCli, dates);
    if (data) setFollowupData(data);
    await saveLastUpdate();
    setLoading(false);
  }, [codCli, callMainApi, getDateRange, saveLastUpdate]);

  const fetchProdutosDistribuidos = useCallback(async (months?: number[], years?: number[]) => {
    if (!codCli) return;
    const now = new Date();
    const m = months || [now.getMonth() + 1];
    const y = years || [now.getFullYear()];
    const dates = getDateRange(m, y);
    const data = await callMainApi("PRODUTOSDISTRIBUIDOS", codCli, dates);
    if (data) setProdutosData(data);
  }, [codCli, callMainApi, getDateRange]);

  // Process Minutas data: group by regional, count expedidas vs baixadas
  const getMinutasData = useCallback(() => {
    const regionMap = new Map<string, { expedidas: number; baixadas: number }>();

    followupData.forEach(item => {
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

  // Process daily Minutas data for line charts
  const getMinutasDailyData = useCallback(() => {
    const regionDayMap = new Map<string, Map<number, { expedidas: number; baixadas: number }>>();

    followupData.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const regional = resolveRegional(cidade, cityMappings);

      // Parse day from dt_expedicao
      const dtExp = item.dt_expedicao ? new Date(item.dt_expedicao) : null;
      const dtBaixa = item.dt_baixa_minuta ? new Date(item.dt_baixa_minuta) : null;
      const day = dtExp?.getDate() || dtBaixa?.getDate();
      if (!day) return;

      if (!regionDayMap.has(regional)) {
        regionDayMap.set(regional, new Map());
      }
      const dayMap = regionDayMap.get(regional)!;
      if (!dayMap.has(day)) {
        dayMap.set(day, { expedidas: 0, baixadas: 0 });
      }
      const totals = dayMap.get(day)!;

      if (dtExp) totals.expedidas++;
      if (dtBaixa) totals.baixadas++;
    });

    return Array.from(regionDayMap.entries()).map(([region, dayMap]) => ({
      region,
      data: Array.from(dayMap.entries())
        .map(([day, totals]) => ({ day, ...totals }))
        .sort((a, b) => a.day - b.day),
    }));
  }, [followupData, cityMappings]);

  // Calculate total value from ProdutosDistribuidos
  const getTotalValue = useCallback(() => {
    return produtosData.reduce((sum, item) => {
      const val = parseFloat(item.vl_total || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [produtosData]);

  // Process Entregas data from Followup
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

      // Exclude "Reentrega"
      if (tipoServico.includes("reentrega")) return;

      // Determine tipo
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
    loading: loading || apiLoading,
    error,
    fetchFollowup,
    fetchProdutosDistribuidos,
    getMinutasData,
    getMinutasDailyData,
    getTotalValue,
    getEntregasData,
    cityMappings,
    lastUpdateAt,
  };
};
