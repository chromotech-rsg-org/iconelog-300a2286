DROP POLICY IF EXISTS "Anyone can view bi_scheduled_update_queue" ON public.bi_scheduled_update_queue;
DROP POLICY IF EXISTS "Service role can manage bi_scheduled_update_queue" ON public.bi_scheduled_update_queue;

CREATE POLICY "Admins can view bi_scheduled_update_queue"
ON public.bi_scheduled_update_queue
FOR SELECT
USING (has_admin_permission(auth.uid(), 'logs_atualizacao'::text, 'ver'::text));