import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FollowupItem {
  [key: string]: any;
}

const parseDateField = (item: FollowupItem): { month: number; year: number } | null => {
  // First check _fetch_year metadata
  if (item._fetch_year && Number(item._fetch_year) > 2000) {
    return { year: Number(item._fetch_year), month: Number(item._fetch_month) || 1 };
  }
  const dt = item.dt_inicio || item.dt_expedicao || item.dt_baixa_minuta;
  if (!dt) return null;
  const str = typeof dt === "string" ? dt : String(dt);
  const parts = str.split(/[\/\-]/);
  if (parts.length < 2) return null;
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
};

export const useDynamicFilters = (
  followupData: FollowupItem[] = [],
  _cityMappings: any[] = []
) => {
  const [dbRegions, setDbRegions] = useState<string[]>([]);
  const [cacheYears, setCacheYears] = useState<number[]>([]);

  // Fetch all unique regions from city_regional_mapping table
  useEffect(() => {
    const fetchRegions = async () => {
      const { data } = await supabase
        .from("city_regional_mapping")
        .select("regional");

      if (data) {
        const uniqueSet = new Set<string>();
        data.forEach(row => {
          if (row.regional) uniqueSet.add(row.regional);
        });
        const sorted = Array.from(uniqueSet).sort();
        const semRegional = sorted.filter(r => r === "Sem Regional");
        const others = sorted.filter(r => r !== "Sem Regional");
        setDbRegions([...others, ...semRegional]);
      }
    };
    fetchRegions();
  }, []);

  // Fetch available years via lightweight RPC function
  useEffect(() => {
    const fetchCacheYears = async () => {
      const { data } = await supabase.rpc("get_cache_years");
      if (data && Array.isArray(data) && data.length > 0) {
        setCacheYears((data as number[]).sort((a, b) => a - b));
      }
    };
    fetchCacheYears();
  }, []);

  // Extract unique years from followup data + cache years, fallback to current year
  const uniqueYears = useMemo(() => {
    const yearsSet = new Set<number>();
    
    // From in-memory data
    followupData.forEach(item => {
      const parsed = parseDateField(item);
      if (parsed && parsed.year > 2000) {
        yearsSet.add(parsed.year);
      }
    });
    
    // From cache scan
    cacheYears.forEach(y => yearsSet.add(y));
    
    // Always include current year as fallback
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear());
    }
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [followupData, cacheYears]);

  return { uniqueYears, uniqueRegions: dbRegions };
};
