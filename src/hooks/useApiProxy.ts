import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ApiProxyRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  integration_id?: string;
  public_page_id?: string;
}

interface ApiProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  execution_time_ms?: number;
}

interface IntegrationCache {
  name: string;
  base_url: string;
  default_body: any;
}

export const useApiProxy = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const integrationsCache = useRef<IntegrationCache[]>([]);

  const loadIntegrations = useCallback(async () => {
    if (integrationsCache.current.length > 0) return;
    const { data } = await supabase
      .from("api_integrations")
      .select("name, base_url, default_body");
    if (data) {
      integrationsCache.current = data.filter(d => d.base_url) as IntegrationCache[];
    }
  }, []);

  const callApi = useCallback(async (request: ApiProxyRequest): Promise<ApiProxyResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("api-proxy", {
        body: request,
      });

      if (fnError) {
        setError(fnError.message);
        return null;
      }

      return data as ApiProxyResponse;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Call API by integration name (e.g. "FOLLOWUP", "SALDOBASE")
  // Uses the base_url from api_integrations table
  const callMainApi = useCallback(async (
    integrationName: string,
    codCli: string,
    extraBody?: Record<string, any>,
    publicPageId?: string
  ): Promise<any[] | null> => {
    await loadIntegrations();

    const integration = integrationsCache.current.find(
      i => i.name.toUpperCase() === integrationName.toUpperCase()
    );

    const url = integration?.base_url || `https://nfe9.websiteseguro.com/iconelog/public/v2/${integrationName}`;

    const defaultBody = integration?.default_body && typeof integration.default_body === "object" ? integration.default_body : {};

    const response = await callApi({
      url,
      method: "POST",
      body: {
        ...defaultBody,
        cod_cli: codCli,
        ...extraBody,
      },
      ...(publicPageId ? { public_page_id: publicPageId } : {}),
    });

    if (!response || response.status !== 200) {
      return null;
    }

    const body = response.body;
    // Handle response format: { sucesso, ocorrencias: [...] } or { mensagem, pedidos: [...] }
    if (body?.ocorrencias && Array.isArray(body.ocorrencias)) return body.ocorrencias;
    if (body?.pedidos && Array.isArray(body.pedidos)) return body.pedidos;
    if (Array.isArray(body)) return body;
    if (body?.data && Array.isArray(body.data)) return body.data;
    if (body?.results && Array.isArray(body.results)) return body.results;
    return body ? [body] : null;
  }, [callApi, loadIntegrations]);

  return { callApi, callMainApi, loading, error };
};
