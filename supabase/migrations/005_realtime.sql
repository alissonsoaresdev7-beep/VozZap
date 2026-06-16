-- ====================================================
-- VozZap - Migração 003: Supabase Realtime Configuration
-- ====================================================
-- Habilita Realtime (postgres_changes) nas tabelas críticas
-- Isso permite que os clientes se inscrevam em mudanças em tempo real

-- ====================================================
-- Habilitar Realtime na publicação 'supabase_realtime'
-- ====================================================
-- IMPORTANTE: A publicação 'supabase_realtime' deve já existir no seu projeto Supabase.
-- Se não existir, você precisa criar via Supabase Dashboard:
-- Settings > Replication > New Publication > 'supabase_realtime'

BEGIN;

-- Adiciona tabelas à publicação de realtime (se a publicação existir)
-- Nota: Isso é feito automaticamente pelo Supabase no dashboard
-- Se quiser fazer via SQL, descomente abaixo e execute manualmente:

-- CREATE PUBLICATION IF NOT EXISTS supabase_realtime;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE likes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- ====================================================
-- Confirma habilitação de Realtime
-- ====================================================
-- Após aplicar esta migração, verifique no Supabase Dashboard:
-- 1. Settings > Replication
-- 2. Certifique-se de que a publicação 'supabase_realtime' está ATIVA
-- 3. As tabelas 'messages', 'likes', 'comments', 'posts' devem estar incluídas

-- ====================================================
-- Índices adicionais para melhorar performance de Realtime
-- ====================================================
-- Índice para subscription em mensagens (sender_id, receiver_id)
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages (sender_id, receiver_id, created_at DESC);

-- Índice para likes por post
CREATE INDEX IF NOT EXISTS idx_likes_post_user 
  ON likes (post_id, user_id);

-- Índice para comentários por post
CREATE INDEX IF NOT EXISTS idx_comments_post_created 
  ON comments (post_id, created_at DESC);

COMMIT;
