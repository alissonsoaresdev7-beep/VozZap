-- ====================================================
-- VozZap - Migração 003: Storage Buckets e Policies
-- ====================================================

-- ====================================================
-- Bucket: avatars (avatares dos usuários)
-- ====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública dos avatares
CREATE POLICY "Avatares são públicos para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Upload de avatar: apenas o próprio usuário no seu path
CREATE POLICY "Usuário pode fazer upload do próprio avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Atualização do avatar: apenas o próprio usuário
CREATE POLICY "Usuário pode atualizar o próprio avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Exclusão do avatar: apenas o próprio usuário
CREATE POLICY "Usuário pode excluir o próprio avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- ====================================================
-- Bucket: audios (arquivos de áudio dos posts)
-- ====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audios', 'audios', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública dos áudios
CREATE POLICY "Áudios são públicos para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audios');

-- Upload de áudio: apenas o próprio usuário no seu path
CREATE POLICY "Usuário pode fazer upload do próprio áudio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audios'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Atualização do áudio: apenas o próprio usuário
CREATE POLICY "Usuário pode atualizar o próprio áudio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'audios'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Exclusão do áudio: apenas o próprio usuário
CREATE POLICY "Usuário pode excluir o próprio áudio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audios'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
