import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useApiProxy } from "./useApiProxy";
import { supabase } from "@/integrations/supabase/client";

export type EstoqueConsolidadoRefreshStage =
  | "requesting_mapalogistico"
  | "receiving_mapalogistico"
  | "requesting_saldobase"
  | "receiving_saldobase"
  | "saving"
  | "done"
  | null;

export interface EstoqueMatrizItem {
  id: string;
  base: string;
  codigo: string;
  descricao: string;
  grupo: string;
  subGrupo: string;
  categoria: string;
  qtdeEntrada: number;
  qtdeSaida: number;
  estoque: number;
  vlItem: number;
  vlTotal: number;
  m3Unitario: number;
  m3Total: number;
  dtUltimaEntrada: string;
  qtdeUltimaEntrada: number;
  dtUltimaSaida: string;
  qtdeUltimaSaida: number;
  diasSemMovto: number;
  tempoParado: string; // faixa
  fotoUrl?: string;
}

export interface EstoqueBaseItem {
  id: string;
  base: string;
  cidade: string;
  uf: string;
  codigo: string;
  m3: number;
  produto: string;
  qtdeEntrada: number;
  qtdeSaida: number;
  regiao: string;
  saldo: number;
  vlTotal: number;
  fotoUrl?: string;
}

const getTempoParadoFaixa = (dias: number): string => {
  if (dias <= 30) return "Antes que 30 dias";
  if (dias <= 60) return "Entre 31 e 60 dias";
  if (dias <= 90) return "Entre 61 e 90 dias";
  return "Mais que 91 dias";
};

export const useEstoqueConsolidadoData = (codCli: string) => {
  const { callMainApi, loading: apiLoading, error } = useApiProxy();
  const [mapaData, setMapaData] = useState<any[]>([]);
  const [saldoData, setSaldoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStage, setRefreshStage] = useState<EstoqueConsolidadoRefreshStage>(null);
  const [refreshRecordCount, setRefreshRecordCount] = useState(0);
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch last update timestamp
  useEffect(() => {
    const fetchLastUpdate = async () => {
      const { data } = await supabase
        .from("bi_last_update")
        .select("last_update_at")
        .eq("page_id", "estoque-consolidado")
        .maybeSingle();
      if (data) setLastUpdateAt(new Date(data.last_update_at));
    };
    fetchLastUpdate();
  }, []);

  // Load cached data on mount
  useEffect(() => {
    const loadCache = async () => {
      if (!codCli || cacheLoaded || cacheLoading) return;
      setCacheLoading(true);
      try {
        const [mapaCache, saldoCache] = await Promise.all([
          supabase.from("bi_data_cache").select("data").eq("page_id", "_shared").eq("cache_key", `mapalogistico_${codCli}`).maybeSingle(),
          supabase.from("bi_data_cache").select("data").eq("page_id", "_shared").eq("cache_key", `saldobase_${codCli}`).maybeSingle(),
        ]);
        if (mapaCache.data?.data) setMapaData(mapaCache.data.data as any[]);
        if (saldoCache.data?.data) setSaldoData(saldoCache.data.data as any[]);
      } finally {
        setCacheLoaded(true);
        setCacheLoading(false);
      }
    };
    loadCache();
  }, [codCli, cacheLoaded, cacheLoading]);

  const saveToCache = useCallback(async (cacheKey: string, data: any[]) => {
    await supabase
      .from("bi_data_cache")
      .upsert(
        { page_id: "_shared", cache_key: `${cacheKey}_${codCli}`, data: data as any, cached_at: new Date().toISOString() },
        { onConflict: "page_id,cache_key" }
      );
  }, [codCli]);

  const saveLastUpdate = useCallback(async () => {
    const now = new Date();
    await supabase
      .from("bi_last_update")
      .upsert({ page_id: "estoque-consolidado", last_update_at: now.toISOString() }, { onConflict: "page_id" });
    setLastUpdateAt(now);
  }, []);

  const refreshData = useCallback(async () => {
    if (!codCli || refreshing) return;
    setRefreshing(true);

    // MAPALOGISTICO
    setRefreshStage("requesting_mapalogistico");
    setRefreshRecordCount(0);
    const mapaResult = await callMainApi("MAPALOGISTICO", codCli);
    if (mapaResult) {
      setRefreshStage("receiving_mapalogistico");
      setRefreshRecordCount(mapaResult.length);
      setMapaData(mapaResult);
    }

    // SALDOBASE
    setRefreshStage("requesting_saldobase");
    setRefreshRecordCount(0);
    const saldoResult = await callMainApi("SALDOBASE", codCli);
    if (saldoResult) {
      setRefreshStage("receiving_saldobase");
      setRefreshRecordCount(saldoResult.length);
      setSaldoData(saldoResult);
    }

    // Save to cache
    setRefreshStage("saving");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      if (mapaResult && mapaResult.length > 0) {
        await saveToCache("mapalogistico", mapaResult);
        // Update foto_url on stock_product_whitelist from API foto_produto
        const photoMap = new Map<string, string>();
        for (const item of mapaResult) {
          if (item.foto_produto && item.produto) {
            photoMap.set(item.produto, item.foto_produto);
          }
        }
        if (photoMap.size > 0) {
          for (const [code, url] of photoMap) {
            await supabase.from("stock_product_whitelist").update({ foto_url: url } as any).eq("product_code", code);
          }
        }
      }
      if (saldoResult && saldoResult.length > 0) await saveToCache("saldobase", saldoResult);
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
  }, [codCli, refreshing, callMainApi, saveToCache, saveLastUpdate]);

  // Process MAPALOGISTICO into EstoqueMatrizItem[]
  const estoqueMatriz = useMemo((): EstoqueMatrizItem[] => {
    return mapaData.map((item, index) => {
      const estoque = parseInt(item.nr_qtde_saldo || "0");
      const vlTotal = parseFloat(item.vl_total || "0");
      const dias = parseInt(item.nr_qtde_dias_ultima || item.nr_qtde_dias_ultima_mov || "0");
      return {
        id: `matriz-${index}`,
        base: item.base || "BARUERI",
        codigo: item.produto || "",
        descricao: item.Descricao || item.nm_produto || "",
        grupo: item.Grupo || "",
        subGrupo: item.SubGrupo || "",
        categoria: item.Categoria || "",
        qtdeEntrada: parseInt(item.nr_qtde_total_entrada || "0"),
        qtdeSaida: parseInt(item.nr_qtde_saida || "0"),
        estoque,
        vlItem: estoque > 0 ? vlTotal / estoque : 0,
        vlTotal,
        m3Unitario: parseFloat(item.m3 || "0"),
        m3Total: parseFloat(item.m3_total || "0"),
        dtUltimaEntrada: item.dt_ultima_entrada || "",
        qtdeUltimaEntrada: parseInt(item.nr_qtde_Ultima_entrada || "0"),
        dtUltimaSaida: item.dt_ultima_saida || "",
        qtdeUltimaSaida: parseInt(item.nr_qrde_ultima_saida || "0"),
        diasSemMovto: dias,
        tempoParado: getTempoParadoFaixa(dias),
        fotoUrl: item.foto_produto || undefined,
      };
    });
  }, [mapaData]);

  // Process SALDOBASE into EstoqueBaseItem[]
  const estoqueBase = useMemo((): EstoqueBaseItem[] => {
    return saldoData.map((item, index) => ({
      id: `base-${index}`,
      base: item.base || item.ds_base || item.nm_base || "",
      cidade: item.cidade || item.ds_cidade || item.nm_cidade || "",
      uf: item.uf || item.ds_uf || item.sg_uf || "",
      codigo: item.produto || item.cd_produto || "",
      m3: parseFloat(item.M3 || item.m3 || item.nr_m3 || "0"),
      produto: item.Descricao || item.nm_produto || item.descricao || "",
      qtdeEntrada: parseInt(item.nr_qtde_total_entrada || item.qtde_entrada || "0"),
      qtdeSaida: parseInt(item.nr_qtde_saida || item.qtde_saida || "0"),
      regiao: item.regiao || item.regional || "",
      saldo: parseInt(item.nr_qtde_saldo || item.saldo || "0"),
      vlTotal: parseFloat(item.vl_total || "0"),
      fotoUrl: item.foto_produto || undefined,
    }));
  }, [saldoData]);

  // KPI totals
  const matrizTotals = useMemo(() => ({
    valor: estoqueMatriz.reduce((sum, i) => sum + i.vlTotal, 0),
    m3: estoqueMatriz.reduce((sum, i) => sum + i.m3Total, 0),
    qtdeSKUs: new Set(estoqueMatriz.map(i => i.codigo)).size,
  }), [estoqueMatriz]);

  const baseTotals = useMemo(() => ({
    valor: estoqueBase.reduce((sum, i) => sum + i.vlTotal, 0),
    m3: estoqueBase.reduce((sum, i) => sum + i.m3, 0),
    qtdeSKUs: new Set(estoqueBase.map(i => i.codigo)).size,
  }), [estoqueBase]);

  return {
    estoqueMatriz,
    estoqueBase,
    matrizTotals,
    baseTotals,
    loading: loading || apiLoading || cacheLoading,
    error,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    lastUpdateAt,
    refreshData,
  };
};
