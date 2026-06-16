-- ====================================================
-- VozZap Storage - VERSÃO FINAL CORRIGIDA (SEM DROP)
-- ====================================================
-- Este script NÃO precisa de permissões especiais
-- Funciona mesmo sem ser owner da tabela

-- ====================================================
-- STEP 1: Criar bucket audios
-- ====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audios', 'audios', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ====================================================
-- STEP 2: Habilitar RLS
-- ====================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- STEP 3: Criar policies (ignora se já existirem)
-- ====================================================

-- Policy 1: Leitura pública
DO $$
BEGIN
  CREATE POLICY "storage_audios_read" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'audios');
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END $$;

-- Policy 2: Upload autenticado
DO $$
BEGIN
  CREATE POLICY "storage_audios_upload" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'audios' AND auth.role() = 'authenticated');
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END $$;

-- Policy 3: Delete autenticado
DO $$
BEGIN
  CREATE POLICY "storage_audios_delete" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'audios' AND auth.role() = 'authenticated');
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END $$;

-- ====================================================
-- STEP 4: Confirmação de sucesso
-- ====================================================
SELECT 
  'Storage Audios Configurado com Sucesso!' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'audios') as bucket_existe,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'storage_audios%') as audios_policies
