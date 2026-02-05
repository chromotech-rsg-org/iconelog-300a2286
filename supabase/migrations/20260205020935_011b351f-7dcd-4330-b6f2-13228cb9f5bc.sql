-- Adicionar coluna de ordenação à tabela bi_settings
ALTER TABLE bi_settings 
ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Inserir registro do sistema (para telas administrativas: Login, Admin, Settings)
INSERT INTO bi_settings (page_id, display_name, logo_url, display_order)
VALUES ('system', 'Relatórios Ícone Log', NULL, -1)
ON CONFLICT (page_id) DO NOTHING;

-- Definir ordem inicial dos BIs existentes
UPDATE bi_settings SET display_order = 1 WHERE page_id = 'minutas';
UPDATE bi_settings SET display_order = 2 WHERE page_id = 'entregas';
UPDATE bi_settings SET display_order = 3 WHERE page_id = 'estoque';
UPDATE bi_settings SET display_order = 4 WHERE page_id = 'tracking';
UPDATE bi_settings SET display_order = 5 WHERE page_id = 'estoque-consolidado';
UPDATE bi_settings SET display_order = 6 WHERE page_id = 'faturamento';
UPDATE bi_settings SET display_order = 7 WHERE page_id = 'analitico';