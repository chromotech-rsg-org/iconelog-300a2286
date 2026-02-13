import { useMemo } from "react";

interface FollowupItem {
  [key: string]: any;
}

interface CityRegionalMapping {
  cidade: string;
  regional: string;
  uf: string;
}

const parseDateField = (item: FollowupItem): { month: number; year: number } | null => {
  const dt = item.dt_inicio || item.dt_expedicao || item.dt_baixa_minuta;
  if (!dt) return null;
  const str = typeof dt === "string" ? dt : String(dt);
  const parts = str.split(/[\/\-]/);
  if (parts.length < 2) return null;
  return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
};

const normalize = (str: string): string =>
  str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const resolveRegional = (cidade: string, mappings: CityRegionalMapping[]): string => {
  if (!cidade) return "Sem Regional";
  const normalized = normalize(cidade);
  const found = mappings.find(m => normalize(m.cidade) === normalized);
  return found?.regional || "Sem Regional";
};

export const useDynamicFilters = (
  followupData: FollowupItem[],
  cityMappings: CityRegionalMapping[]
) => {
  // Extract unique years from data
  const uniqueYears = useMemo(() => {
    const yearsSet = new Set<number>();
    followupData.forEach(item => {
      const parsed = parseDateField(item);
      if (parsed) {
        yearsSet.add(parsed.year);
      }
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [followupData]);

  // Extract unique regions from data
  const uniqueRegions = useMemo(() => {
    const regionsSet = new Set<string>();
    followupData.forEach(item => {
      const cidade = item.ds_cidade_DES || item.ds_cidade || item.cidade || "";
      const regional = resolveRegional(cidade, cityMappings);
      regionsSet.add(regional);
    });
    // Sort with "Sem Regional" at the end
    const sorted = Array.from(regionsSet).sort();
    const semRegional = sorted.filter(r => r === "Sem Regional");
    const others = sorted.filter(r => r !== "Sem Regional");
    return [...others, ...semRegional];
  }, [followupData, cityMappings]);

  return { uniqueYears, uniqueRegions };
};
