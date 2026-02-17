import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CityMapping {
  id: string;
  cidade: string;
  regional: string;
  uf: string;
  created_at: string;
  updated_at: string;
}

export const useCityMapping = () => {
  const [cities, setCities] = useState<CityMapping[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("city_regional_mapping")
      .select("*")
      .order("uf")
      .order("regional")
      .order("cidade");

    if (error) {
      console.error("Error fetching cities:", error);
      toast.error("Erro ao carregar cidades");
    } else {
      setCities(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const createCity = useCallback(async (cidade: string, regional: string, uf: string) => {
    const { error } = await supabase
      .from("city_regional_mapping")
      .insert({ cidade, regional, uf: uf.toUpperCase() });

    if (error) {
      toast.error("Erro ao cadastrar cidade: " + error.message);
      return false;
    }
    toast.success("Cidade cadastrada com sucesso!");
    await fetchCities();
    return true;
  }, [fetchCities]);

  const updateCity = useCallback(async (id: string, cidade: string, regional: string, uf: string) => {
    const { error } = await supabase
      .from("city_regional_mapping")
      .update({ cidade, regional, uf: uf.toUpperCase() })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar cidade: " + error.message);
      return false;
    }
    toast.success("Cidade atualizada com sucesso!");
    await fetchCities();
    return true;
  }, [fetchCities]);

  const deleteCity = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("city_regional_mapping")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir cidade: " + error.message);
      return false;
    }
    toast.success("Cidade excluída com sucesso!");
    await fetchCities();
    return true;
  }, [fetchCities]);

  const bulkCreate = useCallback(async (entries: { cidade: string; regional: string; uf: string }[]) => {
    const batchSize = 500;
    let totalInserted = 0;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const { error } = await supabase
        .from("city_regional_mapping")
        .insert(batch.map(e => ({ cidade: e.cidade.trim(), regional: e.regional.trim(), uf: e.uf.trim().toUpperCase() })));
      if (error) {
        toast.error(`Erro na importação (lote ${Math.floor(i / batchSize) + 1}): ${error.message}`);
        return false;
      }
      totalInserted += batch.length;
    }
    toast.success(`${totalInserted} cidades importadas com sucesso!`);
    await fetchCities();
    return true;
  }, [fetchCities]);

  const deleteAll = useCallback(async () => {
    const { error } = await supabase
      .from("city_regional_mapping")
      .delete()
      .gt("created_at", "2000-01-01");
    if (error) {
      toast.error("Erro ao limpar registros: " + error.message);
      return false;
    }
    await fetchCities();
    return true;
  }, [fetchCities]);

  return { cities, loading, fetchCities, createCity, updateCity, deleteCity, bulkCreate, deleteAll };
};
