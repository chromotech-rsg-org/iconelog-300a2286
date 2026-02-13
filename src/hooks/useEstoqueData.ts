import { useState, useEffect, useCallback, useMemo } from "react";
import { useApiProxy } from "./useApiProxy";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchSaldoBase = useCallback(async () => {
    if (!codCli) return;
    setLoading(true);
    const data = await callMainApi("SaldoBase", codCli);
    if (data) setSaldoData(data);
    setLoading(false);
  }, [codCli, callMainApi]);

  const fetchRecebimentos = useCallback(async () => {
    if (!codCli) return;
    const data = await callMainApi("Recebimentos", codCli);
    if (data) setRecebimentosData(data);
  }, [codCli, callMainApi]);

  // Process stock items: filter by whitelist, calculate kits, hide zero stock
  const stockItems = useMemo((): StockItem[] => {
    const whitelistCodes = new Set(whitelist.map(w => w.product_code));
    const kitMap = new Map(kitConfigs.map(k => [k.sku_code, k.kit_quantity]));

    // Build recebimentos lookup by SKU
    const recebimentoMap = new Map<string, { qty: number; date: string }>();
    recebimentosData.forEach(r => {
      const sku = r.cd_produto || r.sku || "";
      const existing = recebimentoMap.get(sku);
      const date = r.dt_recebimento || r.data || "";
      const qty = parseInt(r.qt_recebida || r.quantidade || "0");
      if (!existing || date > existing.date) {
        recebimentoMap.set(sku, { qty, date });
      }
    });

    return saldoData
      .filter(item => {
        const code = item.cd_produto || item.sku || "";
        // If whitelist exists, only show whitelisted products
        if (whitelistCodes.size > 0 && !whitelistCodes.has(code)) return false;
        // Hide zero stock
        const qty = parseInt(item.qt_saldo || item.quantidade || "0");
        return qty > 0;
      })
      .map(item => {
        const sku = item.cd_produto || item.sku || "";
        const qty = parseInt(item.qt_saldo || item.quantidade || "0");
        const kitQty = kitMap.get(sku) || 1;
        const recebimento = recebimentoMap.get(sku);

        return {
          sku,
          name: item.ds_produto || item.nome || sku,
          description: item.ds_produto_completo || item.descricao || "",
          stockQuantity: qty,
          kitsQuantity: Math.floor(qty / kitQty),
          unitPrice: parseFloat(item.vl_unitario || "0"),
          m3: parseFloat(item.vl_m3 || item.m3 || "0"),
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
    loading: loading || apiLoading,
    error,
    fetchSaldoBase,
    fetchRecebimentos,
    kitConfigs,
    whitelist,
  };
};
