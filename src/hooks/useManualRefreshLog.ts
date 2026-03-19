import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ManualRefreshLogParams {
  pageId: string;
  apis: string[];
  totalMs: number;
  results: Array<{ api: string; records: number; time_ms: number }>;
}

export const useManualRefreshLog = () => {
  const logManualRefresh = useCallback(async (params: ManualRefreshLogParams) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      const userEmail = session.user.email || "unknown";

      await supabase.from("scheduled_update_logs").insert({
        executed_at: new Date().toISOString(),
        schedule_ids: [],
        page_ids: [params.pageId],
        status: "success",
        total_ms: params.totalMs,
        apis_processed: params.apis.length,
        results: params.results as any,
        trigger_type: "manual",
        triggered_by: userId,
        trigger_details: {
          user_email: userEmail,
          page_id: params.pageId,
          apis: params.apis,
        },
      } as any);
    } catch (err) {
      console.warn("Failed to log manual refresh:", err);
    }
  }, []);

  return { logManualRefresh };
};
