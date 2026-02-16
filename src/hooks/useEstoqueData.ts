import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useApiProxy } from "./useApiProxy";
import { supabase } from "@/integrations/supabase/client";

export type EstoqueRefreshStage =
  | "requesting_saldo"
  | "receiving_saldo"
  | "requesting_recebimentos"
  | "receiving_recebimentos"
  | "saving"
  | "done"
  | null;

interface StockItem {
  sku: string;
  name: string;
  description: string;
  stockQuantity: number;
  kitsQuantity: number;
  unitPrice: number;
  m3: number;
  imageUrl?: string;
  lastEntryQty?: number;
  lastEntryDate?: string;
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
}

export const useEstoqueData = (codCli: string) => {
  const { callMainApi, loading: apiLoading, error } = useApiProxy();
  const [saldoData, setSaldoData] = useState<any[]>([]);
  const [recebimentosData, setRecebimentosData] = useState<any[]>([]);
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
        supabase.from("stock_product_whitelist").select("product_code, product_name, ativo").eq("ativo", true),
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
        const [saldoCache, recebCache] = await Promise.all([
          supabase
            .from("bi_data_cache")
            .select("data")
            .eq("page_id", "estoque")
            .eq("cache_key", `saldobase_${codCli}`)
            .maybeSingle(),
          supabase
            .from("bi_data_cache")
            .select("data")
            .eq("page_id", "estoque")
            .eq("cache_key", `recebimentos_${codCli}`)
            .maybeSingle(),
        ]);

        if (saldoCache.data?.data) setSaldoData(saldoCache.data.data as any[]);
        if (recebCache.data?.data) setRecebimentosData(recebCache.data.data as any[]);
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
        { page_id: "estoque", cache_key: `${cacheKey}_${codCli}`, data: data as any, cached_at: new Date().toISOString() },
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

  // Manual refresh - calls APIs and saves to cache
  const refreshData = useCallback(async () => {
    if (!codCli || refreshing) return;
    setRefreshing(true);

    // Fetch SaldoBase
    setRefreshStage("requesting_saldo");
    setRefreshRecordCount(0);
    const saldoResult = await callMainApi("SALDOBASE", codCli);

    if (saldoResult) {
      setRefreshStage("receiving_saldo");
      setRefreshRecordCount(saldoResult.length);
      setSaldoData(saldoResult);
    }

    // Fetch Recebimentos
    setRefreshStage("requesting_recebimentos");
    setRefreshRecordCount(0);
    const recebResult = await callMainApi("RECEBIMENTOS", codCli);

    if (recebResult) {
      setRefreshStage("receiving_recebimentos");
      setRefreshRecordCount(recebResult.length);
      setRecebimentosData(recebResult);
    }

    // Save to cache
    setRefreshStage("saving");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      if (saldoResult && saldoResult.length > 0) await saveToCache("saldobase", saldoResult);
      if (recebResult && recebResult.length > 0) await saveToCache("recebimentos", recebResult);
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

  // Process stock items: filter by whitelist, calculate kits, hide zero stock
  const stockItems = useMemo((): StockItem[] => {
    const whitelistCodes = new Set(whitelist.map(w => w.product_code));
    const kitMap = new Map(kitConfigs.map(k => [k.sku_code, k.kit_quantity]));

    // Build recebimentos lookup by SKU - handle nested {pedidos: [...]} structure
    const recebimentoMap = new Map<string, { qty: number; date: string }>();
    const recebList = Array.isArray(recebimentosData) 
      ? recebimentosData.flatMap(r => {
          if (r.pedidos && Array.isArray(r.pedidos)) return r.pedidos;
          return [r];
        })
      : [];
    recebList.forEach(r => {
      const sku = r.produto || r.cd_produto || r.sku || "";
      const existing = recebimentoMap.get(sku);
      const date = r.dt_recebimento || r.data || "";
      const qty = parseInt(r.nr_qtde || r.qt_recebida || r.quantidade || "0");
      if (!existing || date > existing.date) {
        recebimentoMap.set(sku, { qty, date });
      }
    });

    return saldoData
      .filter(item => {
        const code = item.produto || item.cd_produto || item.sku || "";
        if (whitelistCodes.size > 0 && !whitelistCodes.has(code)) return false;
        const qty = parseInt(item.nr_qtde_saldo || item.qt_saldo || item.quantidade || "0");
        return qty > 0;
      })
      .map(item => {
        const sku = item.produto || item.cd_produto || item.sku || "";
        const qty = parseInt(item.nr_qtde_saldo || item.qt_saldo || item.quantidade || "0");
        const kitQty = kitMap.get(sku) || 1;
        const recebimento = recebimentoMap.get(sku);
        const totalValue = parseFloat(item.vl_total || "0");
        const unitPrice = qty > 0 ? totalValue / qty : 0;

        return {
          sku,
          name: item.nm_produto || item.ds_produto || item.nome || sku,
          description: item.nm_produto || item.ds_produto_completo || item.descricao || "",
          stockQuantity: qty,
          kitsQuantity: Math.floor(qty / kitQty),
          unitPrice,
          m3: parseFloat(item.M3 || item.vl_m3 || item.m3 || "0"),
          imageUrl: item.url_imagem || item.imagem || undefined,
          lastEntryQty: recebimento?.qty,
          lastEntryDate: recebimento?.date,
        };
      });
  }, [saldoData, recebimentosData, kitConfigs, whitelist]);

  // Calculate totals
  const totals = useMemo(() => {
    const valor = stockItems.reduce((sum, i) => sum + i.stockQuantity * i.unitPrice, 0);
    const m3 = stockItems.reduce((sum, i) => sum + i.m3, 0);
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
