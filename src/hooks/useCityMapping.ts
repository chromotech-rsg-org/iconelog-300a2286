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

  return { cities, loading, fetchCities, createCity, updateCity, deleteCity };
};
