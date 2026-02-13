import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FollowupItem {
  [key: string]: any;
}

const parseDateField = (item: FollowupItem): { month: number; year: number } | null => {
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

  // Extract unique years from followup data, fallback to current year
  const uniqueYears = useMemo(() => {
    const yearsSet = new Set<number>();
    followupData.forEach(item => {
      const parsed = parseDateField(item);
      if (parsed && parsed.year > 2000) {
        yearsSet.add(parsed.year);
      }
    });
    // Always include current year as fallback
    if (yearsSet.size === 0) {
      yearsSet.add(new Date().getFullYear());
    }
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [followupData]);

  return { uniqueYears, uniqueRegions: dbRegions };
};
