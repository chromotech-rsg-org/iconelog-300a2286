import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ApiProxyRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  integration_id?: string;
}

interface ApiProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  execution_time_ms?: number;
}

export const useApiProxy = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Convenience method for the main API
  const callMainApi = useCallback(async (
    query: string,
    codCli: string,
    extraBody?: Record<string, any>
  ): Promise<any[] | null> => {
    const response = await callApi({
      url: "https://nfe9.websiteseguro.com/app_api_v3.php",
      method: "POST",
      body: {
        query,
        cod_cli: codCli,
        ...extraBody,
      },
    });

    if (!response || response.status !== 200) {
      return null;
    }

    const body = response.body;
    if (Array.isArray(body)) return body;
    if (body?.data && Array.isArray(body.data)) return body.data;
    if (body?.results && Array.isArray(body.results)) return body.results;
    return body ? [body] : null;
  }, [callApi]);

  return { callApi, callMainApi, loading, error };
};
