import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useApiProxy } from "./useApiProxy";
import { supabase } from "@/integrations/supabase/client";
import { useManualRefreshLog } from "./useManualRefreshLog";

export type EstoqueRefreshStage =
  | "requesting_mapalogistico"
  | "receiving_mapalogistico"
  | "saving"
  | "done"
  | null;

export interface StockItem {
  sku: string;
  name: string;
  description: string;
  category: string;
  group: string;
  subGroup: string;
  stockQuantity: number;
  kitsQuantity: number;
  unitPrice: number;
  m3: number;
  m3Total: number;
  totalValue: number;
  imageUrl?: string;
  lastEntryQty?: number;
  lastEntryDate?: string;
  lastExitQty?: number;
  lastExitDate?: string;
  totalEntryQty?: number;
  totalExitQty?: number;
  daysSinceLastMovement?: number;
  condition?: string;
  [key: string]: any;
}

interface KitConfig {
  sku_code: string;
  sku_name: string | null;
  kit_quantity: number;
}

interface ProductWhitelist {
  product_code: string;
  product_name: string | null;
  ativo: boolean;
  unified_code: string | null;
  kit_completo: boolean;
  kit_basico: boolean;
}

export const useEstoqueData = (codCli: string) => {
  const { callMainApi, loading: apiLoading, error } = useApiProxy();
  const [mapaData, setMapaData] = useState<any[]>([]);
  const [kitConfigs, setKitConfigs] = useState<KitConfig[]>([]);
  const [whitelist, setWhitelist] = useState<ProductWhitelist[]>([]);
  const [loading, setLoading] = useState(false);

  // Cache & refresh states
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStage, setRefreshStage] = useState<EstoqueRefreshStage>(null);
  const [refreshRecordCount, setRefreshRecordCount] = useState(0);
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch kit configs and whitelist from DB
  useEffect(() => {
    const fetchConfigs = async () => {
      const [kitRes, whitelistRes] = await Promise.all([
        supabase.from("stock_kit_config").select("sku_code, sku_name, kit_quantity"),
        supabase.from("stock_product_whitelist").select("product_code, product_name, ativo, unified_code, kit_completo, kit_basico").eq("ativo", true),
      ]);
      if (kitRes.data) setKitConfigs(kitRes.data);
      if (whitelistRes.data) setWhitelist(whitelistRes.data);
    };
    fetchConfigs();
  }, []);

  // Fetch last update timestamp
  useEffect(() => {
    const fetchLastUpdate = async () => {
      const { data } = await supabase
        .from("bi_last_update")
        .select("last_update_at")
        .eq("page_id", "estoque")
        .maybeSingle();
      if (data) setLastUpdateAt(new Date(data.last_update_at));
    };
    fetchLastUpdate();
  }, []);

  // Load cached data on mount (cache-first)
  useEffect(() => {
    const loadCache = async () => {
      if (!codCli || cacheLoaded || cacheLoading) return;
      setCacheLoading(true);
      try {
        const mapaCache = await supabase
          .from("bi_data_cache")
          .select("data")
          .eq("page_id", "_shared")
          .eq("cache_key", `mapalogistico_${codCli}`)
          .maybeSingle();

        if (mapaCache.data?.data) setMapaData(mapaCache.data.data as any[]);
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
    const { error: upsertError } = await supabase
      .from("bi_last_update")
      .upsert({ page_id: "estoque", last_update_at: now.toISOString() }, { onConflict: "page_id" });
    if (!upsertError) {
      setLastUpdateAt(now);
    }
  }, []);

  const { logManualRefresh } = useManualRefreshLog();

  // Manual refresh - calls MAPALOGISTICO API and saves to cache
  const refreshData = useCallback(async () => {
    if (!codCli || refreshing) return;
    setRefreshing(true);
    const refreshStart = Date.now();

    // Fetch MAPALOGISTICO
    setRefreshStage("requesting_mapalogistico");
    setRefreshRecordCount(0);
    const mapaResult = await callMainApi("MAPALOGISTICO", codCli);

    if (mapaResult) {
      setRefreshStage("receiving_mapalogistico");
      setRefreshRecordCount(mapaResult.length);
      setMapaData(mapaResult);
    }

    // Save to cache
    setRefreshStage("saving");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      if (mapaResult && mapaResult.length > 0) await saveToCache("mapalogistico", mapaResult);
      await saveLastUpdate();
    } else {
      setLastUpdateAt(new Date());
    }

    setRefreshStage("done");
    setRefreshRecordCount(0);

    // Log manual refresh
    const totalMs = Date.now() - refreshStart;
    logManualRefresh({
      pageId: "estoque",
      apis: ["MAPALOGISTICO"],
      totalMs,
      results: [{ api: "MAPALOGISTICO", records: mapaResult?.length || 0, time_ms: totalMs }],
    });

    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    doneTimerRef.current = setTimeout(() => {
      setRefreshStage(null);
      setRefreshing(false);
    }, 3000);
  }, [codCli, refreshing, callMainApi, saveToCache, saveLastUpdate, logManualRefresh]);

  // Process stock items from MAPALOGISTICO: filter by whitelist, calculate kits, hide zero stock
  const stockItems = useMemo((): StockItem[] => {
    const whitelistCodes = new Set(whitelist.map(w => w.product_code));
    const kitMap = new Map(kitConfigs.map(k => [k.sku_code, k.kit_quantity]));
    const whitelistMap = new Map(whitelist.map(w => [w.product_code, w]));

    return mapaData
      .filter(item => {
        const code = item.produto || "";
        if (whitelistCodes.size > 0 && !whitelistCodes.has(code)) return false;
        const qty = parseInt(item.nr_qtde_saldo || "0");
        return qty > 0;
      })
      .map(item => {
        const sku = item.produto || "";
        const qty = parseInt(item.nr_qtde_saldo || "0");
        const kitQty = kitMap.get(sku) || 1;
        const totalValue = parseFloat(item.vl_total || "0");
        const unitPrice = qty > 0 ? totalValue / qty : 0;
        const wl = whitelistMap.get(sku);

        return {
          sku,
          name: item.Descricao || item.nm_produto || sku,
          description: item.Descricao || "",
          category: item.Categoria || "",
          group: item.Grupo || "",
          subGroup: item.SubGrupo || "",
          stockQuantity: qty,
          kitsQuantity: Math.floor(qty / kitQty),
          unitPrice,
          m3: parseFloat(item.m3 || "0"),
          m3Total: parseFloat(item.m3_total || "0"),
          totalValue,
          imageUrl: item.foto_produto || undefined,
          lastEntryQty: item.nr_qtde_Ultima_entrada ? parseInt(item.nr_qtde_Ultima_entrada) : undefined,
          lastEntryDate: item.dt_ultima_entrada || undefined,
          lastExitQty: item.nr_qrde_ultima_saida ? parseInt(item.nr_qrde_ultima_saida) : undefined,
          lastExitDate: item.dt_ultima_saida || undefined,
          totalEntryQty: item.nr_qtde_total_entrada ? parseInt(item.nr_qtde_total_entrada) : undefined,
          totalExitQty: item.nr_qtde_saida ? parseInt(item.nr_qtde_saida) : undefined,
          daysSinceLastMovement: item.nr_qtde_dias_ultima_mov ? parseInt(item.nr_qtde_dias_ultima_mov) : undefined,
          condition: item.fl_condicao || undefined,
          kitCompleto: wl?.kit_completo ?? true,
          kitBasico: wl?.kit_basico ?? false,
        };
      });
  }, [mapaData, kitConfigs, whitelist]);

  // Calculate totals
  const totals = useMemo(() => {
    const valor = stockItems.reduce((sum, i) => sum + i.totalValue, 0);
    const m3 = stockItems.reduce((sum, i) => sum + i.m3Total, 0);
    const kits = stockItems.reduce((sum, i) => sum + i.kitsQuantity, 0);
    return { valor, m3, qtdeSKUs: stockItems.length, kits };
  }, [stockItems]);

  return {
    stockItems,
    totals,
    loading: loading || apiLoading || cacheLoading,
    error,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    lastUpdateAt,
    refreshData,
    kitConfigs,
    whitelist,
  };
};
