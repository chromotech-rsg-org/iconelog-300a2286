import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_TIMEOUT_MS = 20000;
const HEAVY_API_TIMEOUT_MS = 45000;
const MAX_EXECUTION_MS = 50000;
const RETRY_DELAY_MINUTES = 5;
const FRESHNESS_THRESHOLD_MINUTES = 30;
const DATE_RANGE_APIS = ["FOLLOWUP", "PRODUTOSDISTRIBUIDOS"];
const MAX_CHAIN_DEPTH = 5;
const CHAIN_DELAY_MS = 2000;

type DueSchedule = {
  id: string;
  page_id: string;
  update_time: string;
  schedule_type: string;
  interval_minutes: number | null;
  last_executed_at: string | null;
};

type QueueJob = {
  id: string;
  schedule_id: string;
  page_id: string;
  cod_cli: string | null;
  api_integration_id: string;
  attempts: number;
  queue_key: string;
  available_at: string;
};

type IntegrationRow = {
  id: string;
  name: string;
  base_url: string | null;
  auth_token: string | null;
  auth_type: string;
  headers_json: Record<string, string> | null;
  default_body: Record<string, unknown> | null;
};

type QueueBatch = {
  batchKey: string;
  integrationId: string;
  integrationName: string;
  codCli: string;
  jobs: QueueJob[];
  firstAvailableAt: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const globalStart = Date.now();

  // Parse chain depth from request body
  let chainDepth = 0;
  let parentLogId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    chainDepth = body?.chain_depth ?? 0;
    parentLogId = body?.parent_log_id ?? null;
  } catch (_) {
    // ignore
  }

  const stageLabel = chainDepth > 0 ? ` [stage ${chainDepth + 1}]` : "";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const brtTime = getBrtTime(now);
    const currentTime = `${String(brtTime.getHours()).padStart(2, "0")}:${String(brtTime.getMinutes()).padStart(2, "0")}`;

    console.log(`Scheduled update check at BRT: ${currentTime}${stageLabel}`);

    // Only enqueue new jobs on the first stage (depth 0)
    const enqueueResult = chainDepth === 0
      ? await enqueueDueScheduleJobs(supabase, now, brtTime, currentTime)
      : { dueSchedules: [], enqueuedJobs: 0, autoCompletedSchedules: [] as string[], notes: [] as unknown[] };

    const pendingJobs = await getPendingQueueJobs(supabase, now);

    if (enqueueResult.dueSchedules.length === 0 && pendingJobs.length === 0) {
      console.log(`No schedules or pending queue items to execute at ${currentTime}${stageLabel}`);
      return new Response(JSON.stringify({ message: "No schedules or pending queue items", time: currentTime, stage: chainDepth + 1 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const logScheduleIds = new Set<string>(enqueueResult.dueSchedules.map((schedule) => schedule.id));
    const logPageIds = new Set<string>(enqueueResult.dueSchedules.map((schedule) => schedule.page_id));
    pendingJobs.forEach((job) => {
      logScheduleIds.add(job.schedule_id);
      logPageIds.add(job.page_id);
    });

    // Only create a new log row on stage 1; continuation stages update the parent log
    let logId = parentLogId;
    if (chainDepth === 0) {
      const triggerDetails = enqueueResult.dueSchedules.map((s: DueSchedule) => ({
        schedule_id: s.id,
        page_id: s.page_id,
        schedule_type: s.schedule_type,
        ...(s.schedule_type === "interval"
          ? { interval_minutes: s.interval_minutes }
          : { update_time: s.update_time }),
      }));

      const { data: logRow } = await supabase
        .from("scheduled_update_logs")
        .insert({
          executed_at: now.toISOString(),
          schedule_ids: [...logScheduleIds],
          page_ids: [...logPageIds],
          status: "running",
          total_ms: 0,
          apis_processed: 0,
          results: [] as unknown[],
          trigger_type: "scheduled",
          trigger_details: { schedules: triggerDetails },
        } as never)
        .select("id")
        .single();
      logId = logRow?.id;
    }

    const processResult = await processPendingQueueBatches(supabase, now, globalStart, pendingJobs);

    const totalTime = Date.now() - globalStart;
    const hasRemaining = processResult.remainingJobs > 0;
    const willChain = hasRemaining && chainDepth < MAX_CHAIN_DEPTH;
    const finalStatus = willChain ? "chaining" : (processResult.hasErrors || hasRemaining ? "partial" : "success");

    const stageResult = {
      stage: chainDepth + 1,
      processed_batches: processResult.processedBatches,
      remaining_jobs: processResult.remainingJobs,
      time_ms: totalTime,
      will_chain: willChain,
      results: [
        ...(chainDepth === 0 ? [{
          type: "enqueue",
          due_schedules: enqueueResult.dueSchedules.length,
          enqueued_jobs: enqueueResult.enqueuedJobs,
          skipped_schedules_without_queue: enqueueResult.autoCompletedSchedules.length,
        }] : []),
        ...enqueueResult.notes,
        ...processResult.results,
      ],
    };

    if (logId) {
      const { data: existingLog } = await supabase
        .from("scheduled_update_logs")
        .select("results, apis_processed, total_ms")
        .eq("id", logId)
        .single();

      const prevResults = Array.isArray(existingLog?.results) ? existingLog.results : [];
      const prevApis = existingLog?.apis_processed ?? 0;
      const prevMs = existingLog?.total_ms ?? 0;

      await supabase
        .from("scheduled_update_logs")
        .update({
          status: willChain ? "running" : finalStatus,
          total_ms: prevMs + totalTime,
          apis_processed: prevApis + processResult.processedBatches,
          results: [...prevResults, stageResult] as never,
        } as never)
        .eq("id", logId);
    }

    console.log(`Stage ${chainDepth + 1} completed in ${totalTime}ms, ${processResult.processedBatches} batches processed, ${processResult.remainingJobs} remaining${willChain ? " → chaining next stage" : ""}`);

    // Self-chain: invoke this same function again for the next stage
    if (willChain) {
      setTimeout(async () => {
        try {
          const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || serviceRoleKey;
          await fetch(`${supabaseUrl}/functions/v1/scheduled-update`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              chain_depth: chainDepth + 1,
              parent_log_id: logId,
            }),
          });
          console.log(`Chained stage ${chainDepth + 2} triggered`);
        } catch (err: any) {
          console.error(`Failed to chain stage ${chainDepth + 2}:`, err.message);
        }
      }, CHAIN_DELAY_MS);
    }

    return new Response(JSON.stringify({
      success: true,
      time: currentTime,
      stage: chainDepth + 1,
      total_ms: totalTime,
      will_chain: willChain,
      ...stageResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`Scheduled update error${stageLabel}:`, error.message);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, serviceRoleKey);

      if (parentLogId) {
        await sb.from("scheduled_update_logs").update({
          status: "error",
          error_message: `Stage ${chainDepth + 1}: ${error.message}`,
        } as never).eq("id", parentLogId);
      } else {
        await sb.from("scheduled_update_logs").insert({
          status: "error",
          total_ms: Date.now() - globalStart,
          error_message: error.message,
        } as never);
      }
    } catch (_) {
      // ignore logging errors
    }

    return new Response(JSON.stringify({ error: error.message, stage: chainDepth + 1 }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getBrtTime(now: Date) {
  const brtOffset = -3 * 60;
  return new Date(now.getTime() + (brtOffset + now.getTimezoneOffset()) * 60000);
}

async function enqueueDueScheduleJobs(supabase: any, now: Date, brtTime: Date, currentTime: string) {
  const { data: schedules, error: schedError } = await supabase
    .from("bi_scheduled_updates")
    .select("id, page_id, update_time, schedule_type, interval_minutes, last_executed_at")
    .eq("is_active", true);

  if (schedError) {
    throw new Error(`Error fetching schedules: ${schedError.message}`);
  }

  const dueSchedules: DueSchedule[] = (schedules || []).filter((schedule: DueSchedule) => isScheduleDue(schedule, now, currentTime));

  if (dueSchedules.length === 0) {
    return { dueSchedules: [], enqueuedJobs: 0, autoCompletedSchedules: [] as string[], notes: [] as unknown[] };
  }

  const duePageIds = [...new Set(dueSchedules.map((schedule) => schedule.page_id))];
  const { data: biSettings } = await supabase
    .from("bi_settings")
    .select("page_id, cod_cli")
    .in("page_id", duePageIds);

  const { data: apiLinks } = await supabase
    .from("bi_api_integrations")
    .select("bi_page_id, api_integration_id")
    .in("bi_page_id", duePageIds);

  const codCliByPage = new Map<string, string | null>();
  (biSettings || []).forEach((setting: { page_id: string; cod_cli: string | null }) => {
    codCliByPage.set(setting.page_id, setting.cod_cli);
  });

  const apiIdsByPage = new Map<string, string[]>();
  (apiLinks || []).forEach((link: { bi_page_id: string; api_integration_id: string }) => {
    const current = apiIdsByPage.get(link.bi_page_id) || [];
    current.push(link.api_integration_id);
    apiIdsByPage.set(link.bi_page_id, current);
  });

  // Load integration names to identify DATE_RANGE_APIS
  const allApiIds = [...new Set((apiLinks || []).map((l: any) => l.api_integration_id))];
  const { data: integrationRows } = allApiIds.length > 0
    ? await supabase.from("api_integrations").select("id, name").in("id", allApiIds)
    : { data: [] };
  const integrationNameById = new Map<string, string>();
  (integrationRows || []).forEach((r: any) => integrationNameById.set(r.id, r.name));

  const queueRows: Array<Record<string, unknown>> = [];
  const autoCompletedSchedules: string[] = [];
  const notes: unknown[] = [];

  for (const schedule of dueSchedules) {
    const codCli = codCliByPage.get(schedule.page_id) ?? null;
    const apiIds = apiIdsByPage.get(schedule.page_id) || [];

    if (apiIds.length === 0 || !codCli) {
      autoCompletedSchedules.push(schedule.id);
      notes.push({
        type: "auto_completed",
        page_id: schedule.page_id,
        schedule_id: schedule.id,
        reason: apiIds.length === 0 ? "no_api_links" : "missing_cod_cli",
      });
      continue;
    }

    for (const apiIntegrationId of apiIds) {
      const apiName = integrationNameById.get(apiIntegrationId) || "";
      const isDateRange = DATE_RANGE_APIS.includes(apiName.toUpperCase());

      if (isDateRange) {
        // Create one job per month for heavy APIs
        const chunks = getMonthChunks(getBrtTime(new Date()));
        for (const chunk of chunks) {
          const monthNum = parseInt(chunk.data_inicial.substring(5, 7), 10);
          const yearNum = parseInt(chunk.data_inicial.substring(0, 4), 10);
          const monthSuffix = `_${yearNum}_${String(monthNum).padStart(2, "0")}`;
          queueRows.push({
            schedule_id: schedule.id,
            page_id: schedule.page_id,
            cod_cli: codCli,
            api_integration_id: apiIntegrationId,
            status: "pending",
            attempts: 0,
            available_at: now.toISOString(),
            queue_key: buildQueueKey(schedule, apiIntegrationId, codCli) + monthSuffix,
          });
        }
      } else {
        queueRows.push({
          schedule_id: schedule.id,
          page_id: schedule.page_id,
          cod_cli: codCli,
          api_integration_id: apiIntegrationId,
          status: "pending",
          attempts: 0,
          available_at: now.toISOString(),
          queue_key: buildQueueKey(schedule, apiIntegrationId, codCli),
        });
      }
    }
  }

  if (queueRows.length > 0) {
    const { error: queueError } = await supabase
      .from("bi_scheduled_update_queue")
      .upsert(queueRows as never[], { onConflict: "queue_key", ignoreDuplicates: true });

    if (queueError) {
      throw new Error(`Error enqueueing scheduled jobs: ${queueError.message}`);
    }
  }

  if (autoCompletedSchedules.length > 0) {
    await supabase
      .from("bi_scheduled_updates")
      .update({ last_executed_at: now.toISOString() } as never)
      .in("id", autoCompletedSchedules);
  }

  const autoCompletedPageIds = dueSchedules
    .filter((schedule) => autoCompletedSchedules.includes(schedule.id))
    .map((schedule) => schedule.page_id);

  if (autoCompletedPageIds.length > 0) {
    await updateAllPages(supabase, [...new Set(autoCompletedPageIds)]);
  }

  console.log(`Found ${dueSchedules.length} due schedules, enqueued ${queueRows.length} jobs (date-range APIs split by month)`);

  return {
    dueSchedules,
    enqueuedJobs: queueRows.length,
    autoCompletedSchedules,
    notes,
  };
}

function isScheduleDue(schedule: DueSchedule, now: Date, currentTime: string) {
  if (schedule.schedule_type === "interval" && schedule.interval_minutes) {
    if (!schedule.last_executed_at) return true;
    const lastExec = new Date(schedule.last_executed_at).getTime();
    const elapsedMinutes = (now.getTime() - lastExec) / 60000;
    return elapsedMinutes >= schedule.interval_minutes;
  }

  const schedTime = (schedule.update_time || "").substring(0, 5);
  if (schedTime !== currentTime) return false;

  if (!schedule.last_executed_at) return true;
  const lastExec = new Date(schedule.last_executed_at);
  const sameYear = lastExec.getUTCFullYear() === now.getUTCFullYear();
  const sameMonth = lastExec.getUTCMonth() === now.getUTCMonth();
  const sameDay = lastExec.getUTCDate() === now.getUTCDate();
  return !(sameYear && sameMonth && sameDay);
}

function buildQueueKey(schedule: DueSchedule, apiIntegrationId: string, codCli: string) {
  return `${schedule.id}|${apiIntegrationId}|${codCli}|${schedule.last_executed_at ?? "never"}`;
}

async function getPendingQueueJobs(supabase: any, now: Date): Promise<QueueJob[]> {
  const { data, error } = await supabase
    .from("bi_scheduled_update_queue")
    .select("id, schedule_id, page_id, cod_cli, api_integration_id, attempts, queue_key, available_at")
    .eq("status", "pending")
    .lte("available_at", now.toISOString())
    .order("available_at", { ascending: true })
    .limit(200);

  if (error) {
    throw new Error(`Error fetching pending queue jobs: ${error.message}`);
  }

  return (data || []) as QueueJob[];
}

/**
 * Extract month suffix from queue_key if present.
 * Queue keys for date-range APIs end with _YYYY_MM (e.g. ...|never_2026_01)
 */
function extractMonthFromQueueKey(queueKey: string): { year: number; month: number } | null {
  const match = queueKey.match(/_(\d{4})_(\d{2})$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), month: parseInt(match[2], 10) };
}

async function processPendingQueueBatches(supabase: any, now: Date, globalStart: number, pendingJobs: QueueJob[]) {
  if (pendingJobs.length === 0) {
    return {
      processedBatches: 0,
      remainingJobs: 0,
      hasErrors: false,
      results: [] as unknown[],
    };
  }

  const integrationIds = [...new Set(pendingJobs.map((job) => job.api_integration_id))];
  const { data: integrations, error: integrationError } = await supabase
    .from("api_integrations")
    .select("id, name, base_url, auth_token, auth_type, headers_json, default_body")
    .in("id", integrationIds);

  if (integrationError) {
    throw new Error(`Error fetching integrations: ${integrationError.message}`);
  }

  const integrationMap = new Map<string, IntegrationRow>();
  (integrations || []).forEach((integration: IntegrationRow) => {
    integrationMap.set(integration.id, integration);
  });

  // Process jobs individually (each job = one API call, possibly one month chunk)
  const results: unknown[] = [];
  let processedBatches = 0;
  let hasErrors = false;

  // Group jobs: non-date-range APIs are batched; date-range jobs are processed individually
  const nonDateRangeJobs: QueueJob[] = [];
  const dateRangeJobs: QueueJob[] = [];

  for (const job of pendingJobs) {
    const integration = integrationMap.get(job.api_integration_id);
    if (integration && DATE_RANGE_APIS.includes(integration.name.toUpperCase())) {
      dateRangeJobs.push(job);
    } else {
      nonDateRangeJobs.push(job);
    }
  }

  // Process non-date-range APIs as batches (original logic)
  const nonDateRangeBatches = buildQueueBatches(nonDateRangeJobs, integrationMap);
  for (const batch of nonDateRangeBatches) {
    const elapsed = Date.now() - globalStart;
    if (elapsed > MAX_EXECUTION_MS) {
      console.warn(`Time budget exhausted (${elapsed}ms), keeping remaining batches pending`);
      break;
    }

    const integration = integrationMap.get(batch.integrationId);
    if (!integration) {
      await retryBatch(supabase, batch.jobs, now, "integration_not_found");
      hasErrors = true;
      results.push({ type: "batch", api: batch.integrationName, cod_cli: batch.codCli, status: "error", error: "integration_not_found" });
      processedBatches += 1;
      continue;
    }

    try {
      const startTime = Date.now();
      const cacheKey = `${integration.name.toLowerCase()}_${batch.codCli}`;

      await supabase
        .from("bi_scheduled_update_queue")
        .update({ status: "running", started_at: new Date().toISOString(), error_message: null } as never)
        .in("id", batch.jobs.map((job) => job.id));

      const cacheAge = await getCacheAgeMinutes(supabase, cacheKey, now);
      if (cacheAge !== null && cacheAge < FRESHNESS_THRESHOLD_MINUTES) {
        await completeBatch(supabase, batch.jobs, { execution_ms: Date.now() - startTime, records_processed: 0, pageIds: [...new Set(batch.jobs.map((job) => job.page_id))] });
        await finalizeSchedulesForJobs(supabase, batch.jobs, now);
        results.push({ type: "batch", api: integration.name, cod_cli: batch.codCli, status: "skipped", reason: "cache_fresh", cache_age_minutes: Math.round(cacheAge) });
        processedBatches += 1;
        continue;
      }

      const allDataArray = await fetchSingleApiCall(integration, batch.codCli);
      const execTime = Date.now() - startTime;

      if (allDataArray.length > 0) {
        await supabase.from("bi_data_cache").upsert(
          { page_id: "_shared", cache_key: cacheKey, data: allDataArray as never, cached_at: new Date().toISOString() },
          { onConflict: "page_id,cache_key" }
        );
      }

      const pageIds = [...new Set(batch.jobs.map((job) => job.page_id))];
      await completeBatch(supabase, batch.jobs, { execution_ms: execTime, records_processed: allDataArray.length, pageIds });
      await finalizeSchedulesForJobs(supabase, batch.jobs, now);

      console.log(`Done batch: ${integration.name} (${batch.codCli}) => ${allDataArray.length} records, ${execTime}ms`);
      results.push({ type: "batch", api: integration.name, cod_cli: batch.codCli, status: 200, records: allDataArray.length, time_ms: execTime, pages: pageIds });
    } catch (error: any) {
      hasErrors = true;
      console.error(`Batch error: ${batch.integrationName} (${batch.codCli}) => ${error.message}`);
      await retryBatch(supabase, batch.jobs, now, error.message);
      results.push({ type: "batch", api: batch.integrationName, cod_cli: batch.codCli, status: "error", error: error.message });
    }
    processedBatches += 1;
  }

  // Process date-range jobs individually (one month per job)
  for (const job of dateRangeJobs) {
    const elapsed = Date.now() - globalStart;
    if (elapsed > MAX_EXECUTION_MS) {
      console.warn(`Time budget exhausted (${elapsed}ms), keeping remaining date-range jobs pending`);
      break;
    }

    const integration = integrationMap.get(job.api_integration_id);
    if (!integration || !job.cod_cli) {
      await retryBatch(supabase, [job], now, "integration_not_found");
      hasErrors = true;
      processedBatches += 1;
      continue;
    }

    const monthInfo = extractMonthFromQueueKey(job.queue_key);
    if (!monthInfo) {
      // Legacy job without month suffix — process all months (fallback)
      console.warn(`Legacy date-range job without month suffix: ${job.queue_key}`);
      await retryBatch(supabase, [job], now, "legacy_queue_key_no_month");
      hasErrors = true;
      processedBatches += 1;
      continue;
    }

    const fragmentKey = `${integration.name.toLowerCase()}_${job.cod_cli}_${monthInfo.year}_${String(monthInfo.month).padStart(2, "0")}`;

    try {
      const startTime = Date.now();

      await supabase
        .from("bi_scheduled_update_queue")
        .update({ status: "running", started_at: new Date().toISOString(), error_message: null } as never)
        .eq("id", job.id);

      // Check freshness of this specific month fragment
      const cacheAge = await getCacheAgeMinutes(supabase, fragmentKey, now);
      if (cacheAge !== null && cacheAge < FRESHNESS_THRESHOLD_MINUTES) {
        await completeBatch(supabase, [job], { execution_ms: Date.now() - startTime, records_processed: 0, pageIds: [job.page_id] });
        await finalizeSchedulesForJobs(supabase, [job], now);
        results.push({ type: "month_chunk", api: integration.name, cod_cli: job.cod_cli, month: `${monthInfo.year}/${String(monthInfo.month).padStart(2, "0")}`, status: "skipped", reason: "cache_fresh", cache_age_minutes: Math.round(cacheAge!) });
        processedBatches += 1;
        continue;
      }

      // Build date range for this specific month
      const firstDay = new Date(monthInfo.year, monthInfo.month - 1, 1);
      const lastDay = new Date(monthInfo.year, monthInfo.month, 0);
      const dataInicial = `${formatDate(firstDay)} 00:00`;
      const dataFinal = `${formatDate(lastDay)} 23:59`;

      const chunkData = await fetchSingleApiCall(integration, job.cod_cli, { data_inicial: dataInicial, data_final: dataFinal }, true);
      const execTime = Date.now() - startTime;

      // Tag records with month/year
      const tagged = chunkData.map((row: any) => ({
        ...row,
        _fetch_month: monthInfo.month,
        _fetch_year: monthInfo.year,
      }));

      // Save directly with fragmented key
      await supabase.from("bi_data_cache").upsert(
        { page_id: "_shared", cache_key: fragmentKey, data: tagged as never, cached_at: new Date().toISOString() },
        { onConflict: "page_id,cache_key" }
      );

      const pageIds = [job.page_id];
      await completeBatch(supabase, [job], { execution_ms: execTime, records_processed: tagged.length, pageIds });
      await finalizeSchedulesForJobs(supabase, [job], now);

      console.log(`Done month chunk: ${integration.name} ${monthInfo.year}/${String(monthInfo.month).padStart(2, "0")} (${job.cod_cli}) => ${tagged.length} records, ${execTime}ms`);
      results.push({ type: "month_chunk", api: integration.name, cod_cli: job.cod_cli, month: `${monthInfo.year}/${String(monthInfo.month).padStart(2, "0")}`, status: 200, records: tagged.length, time_ms: execTime });
    } catch (error: any) {
      hasErrors = true;
      console.error(`Month chunk error: ${integration.name} ${monthInfo.year}/${String(monthInfo.month).padStart(2, "0")} (${job.cod_cli}) => ${error.message}`);
      await retryBatch(supabase, [job], now, error.message);
      results.push({ type: "month_chunk", api: integration.name, cod_cli: job.cod_cli, month: `${monthInfo.year}/${String(monthInfo.month).padStart(2, "0")}`, status: "error", error: error.message });
    }
    processedBatches += 1;
  }

  const remainingJobs = await countPendingQueueJobs(supabase, now);

  return {
    processedBatches,
    remainingJobs,
    hasErrors,
    results,
  };
}

function buildQueueBatches(pendingJobs: QueueJob[], integrationMap: Map<string, IntegrationRow>) {
  const grouped = new Map<string, QueueBatch>();

  for (const job of pendingJobs) {
    if (!job.cod_cli) continue;
    const integration = integrationMap.get(job.api_integration_id);
    const integrationName = integration?.name || job.api_integration_id;
    const batchKey = `${job.api_integration_id}::${job.cod_cli}`;
    const current = grouped.get(batchKey);

    if (current) {
      current.jobs.push(job);
      if (job.available_at < current.firstAvailableAt) {
        current.firstAvailableAt = job.available_at;
      }
      continue;
    }

    grouped.set(batchKey, {
      batchKey,
      integrationId: job.api_integration_id,
      integrationName,
      codCli: job.cod_cli,
      jobs: [job],
      firstAvailableAt: job.available_at,
    });
  }

  return [...grouped.values()].sort((a, b) => a.firstAvailableAt.localeCompare(b.firstAvailableAt));
}

async function getCacheAgeMinutes(supabase: any, cacheKey: string, now: Date) {
  const { data, error } = await supabase
    .from("bi_data_cache")
    .select("cached_at")
    .eq("page_id", "_shared")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Error checking cache freshness: ${error.message}`);
  }

  if (!data?.cached_at) return null;
  return (now.getTime() - new Date(data.cached_at).getTime()) / 60000;
}

/**
 * Fetch data from a single API call (non-date-range or a specific month chunk).
 * Uses HEAVY_API_TIMEOUT_MS for date-range APIs.
 */
async function fetchSingleApiCall(
  integration: IntegrationRow,
  codCli: string,
  extraBody?: Record<string, unknown>,
  isHeavy?: boolean,
): Promise<any[]> {
  if (!integration.base_url) {
    throw new Error("missing_base_url");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (integration.auth_token) {
    if (integration.auth_type === "bearer") headers["Authorization"] = `Bearer ${integration.auth_token}`;
    else if (integration.auth_type === "basic") headers["Authorization"] = `Basic ${integration.auth_token}`;
    else headers["Authorization"] = integration.auth_token;
  }
  if (integration.headers_json && typeof integration.headers_json === "object") {
    Object.assign(headers, integration.headers_json);
  }

  const defaultBody = integration.default_body && typeof integration.default_body === "object"
    ? integration.default_body
    : {};

  const timeout = isHeavy ? HEAVY_API_TIMEOUT_MS : API_TIMEOUT_MS;

  return await fetchSinglePayload(integration.base_url, headers, {
    ...defaultBody,
    cod_cli: codCli,
    ...extraBody,
  }, timeout);
}

async function fetchSinglePayload(url: string, headers: Record<string, string>, body: Record<string, unknown>, timeoutMs: number = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`http_${response.status}`);
    }

    return extractDataArray(responseBody);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getMonthChunks(referenceDate: Date) {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1;
  const chunks: { data_inicial: string; data_final: string }[] = [];

  for (let month = 1; month <= currentMonth; month += 1) {
    const firstDay = new Date(currentYear, month - 1, 1);
    const lastDay = new Date(currentYear, month, 0);
    chunks.push({
      data_inicial: `${formatDate(firstDay)} 00:00`,
      data_final: `${formatDate(lastDay)} 23:59`,
    });
  }

  return chunks;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function completeBatch(
  supabase: any,
  jobs: QueueJob[],
  payload: { execution_ms: number; records_processed: number; pageIds: string[] },
) {
  await supabase
    .from("bi_scheduled_update_queue")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      execution_ms: payload.execution_ms,
      records_processed: payload.records_processed,
      error_message: null,
    } as never)
    .in("id", jobs.map((job) => job.id));

  await updateAllPages(supabase, payload.pageIds);
}

async function retryBatch(supabase: any, jobs: QueueJob[], now: Date, errorMessage: string) {
  const nextAvailableAt = new Date(now.getTime() + RETRY_DELAY_MINUTES * 60000).toISOString();
  const attempts = Math.max(...jobs.map((job) => job.attempts)) + 1;

  await supabase
    .from("bi_scheduled_update_queue")
    .update({
      status: "pending",
      available_at: nextAvailableAt,
      error_message: errorMessage,
      attempts,
    } as never)
    .in("id", jobs.map((job) => job.id));
}

async function finalizeSchedulesForJobs(supabase: any, jobs: QueueJob[], now: Date) {
  const scheduleMarkers = new Map<string, string>();

  jobs.forEach((job) => {
    const parts = job.queue_key.split("|");
    // For date-range jobs, the marker is the 4th segment (before _YYYY_MM suffix)
    // Original format: scheduleId|apiId|codCli|marker or scheduleId|apiId|codCli|marker_YYYY_MM
    const marker = parts.length >= 4 ? parts[3].replace(/_\d{4}_\d{2}$/, "") : "never";
    scheduleMarkers.set(job.schedule_id, marker);
  });

  for (const [scheduleId, marker] of scheduleMarkers.entries()) {
    const likePattern = `${scheduleId}|%|${marker}%`;
    const { data, error } = await supabase
      .from("bi_scheduled_update_queue")
      .select("status")
      .eq("schedule_id", scheduleId)
      .like("queue_key", likePattern);

    if (error) {
      throw new Error(`Error finalizing schedule ${scheduleId}: ${error.message}`);
    }

    if (!data || data.length === 0) continue;
    const allCompleted = data.every((row: { status: string }) => row.status === "completed");
    if (!allCompleted) continue;

    await supabase
      .from("bi_scheduled_updates")
      .update({ last_executed_at: now.toISOString() } as never)
      .eq("id", scheduleId);
  }
}

async function countPendingQueueJobs(supabase: any, now: Date) {
  const { count, error } = await supabase
    .from("bi_scheduled_update_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lte("available_at", now.toISOString());

  if (error) {
    throw new Error(`Error counting pending queue jobs: ${error.message}`);
  }

  return count || 0;
}

async function updateAllPages(supabase: any, pageIds: string[]) {
  const uniquePageIds = [...new Set(pageIds.filter(Boolean))];
  if (uniquePageIds.length === 0) return;

  const ts = new Date().toISOString();
  for (const pageId of uniquePageIds) {
    await supabase.from("bi_last_update").upsert(
      { page_id: pageId, last_update_at: ts },
      { onConflict: "page_id" }
    );
  }
}

function extractDataArray(body: any): any[] {
  if (!body) return [];
  if (body?.ocorrencias && Array.isArray(body.ocorrencias)) return body.ocorrencias;
  if (body?.pedidos && Array.isArray(body.pedidos)) return body.pedidos;
  if (Array.isArray(body)) return body;
  if (body?.data && Array.isArray(body.data)) return body.data;
  if (body?.results && Array.isArray(body.results)) return body.results;
  return [];
}
