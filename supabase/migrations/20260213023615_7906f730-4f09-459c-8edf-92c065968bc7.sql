
-- Table to link API integrations to BI pages
CREATE TABLE public.bi_api_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bi_page_id TEXT NOT NULL,
  api_integration_id UUID NOT NULL REFERENCES public.api_integrations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bi_page_id, api_integration_id)
);

ALTER TABLE public.bi_api_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bi_api_integrations"
  ON public.bi_api_integrations FOR ALL
  USING (has_admin_permission(auth.uid(), 'configurar_bi', 'editar'));

CREATE POLICY "Authenticated can view bi_api_integrations"
  ON public.bi_api_integrations FOR SELECT
  USING (true);
