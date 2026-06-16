  -- ====================================================
  -- VozZap - Migração 002: Row Level Security (RLS) Policies
  -- ====================================================

  -- ====================================================
  -- Habilita RLS em todas as tabelas
  -- ====================================================
  ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE posts     ENABLE ROW LEVEL SECURITY;
  ALTER TABLE follows   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE likes     ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comments  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages  ENABLE ROW LEVEL SECURITY;
  ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

  -- ====================================================
  -- Policies: categories (leitura pública)
  -- ====================================================
  CREATE POLICY "Categorias são públicas para leitura"
    ON categories FOR SELECT
    USING (true);

  -- ====================================================
  -- Policies: profiles
  -- ====================================================

  -- Qualquer pessoa pode ler perfis
  CREATE POLICY "Perfis são públicos para leitura"
    ON profiles FOR SELECT
    USING (true);

  -- Apenas o próprio usuário pode inserir seu perfil
  CREATE POLICY "Usuário pode inserir seu próprio perfil"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

  -- Apenas o próprio usuário pode atualizar seu perfil
  CREATE POLICY "Usuário pode atualizar seu próprio perfil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  -- ====================================================
  -- Policies: posts
  -- ====================================================

  -- Leitura pública apenas para posts públicos; dono vê os privados também
  CREATE POLICY "Posts públicos ou do próprio usuário são visíveis"
    ON posts FOR SELECT
    USING (
      visibility = 'public'
      OR auth.uid() = user_id
    );

  -- Apenas usuário autenticado pode criar post
  CREATE POLICY "Usuário autenticado pode criar posts"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Apenas o dono pode editar o post
  CREATE POLICY "Apenas o dono pode editar o post"
    ON posts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Apenas o dono pode excluir o post
  CREATE POLICY "Apenas o dono pode excluir o post"
    ON posts FOR DELETE
    USING (auth.uid() = user_id);

  -- ====================================================
  -- Policies: follows
  -- ====================================================

  -- Qualquer pessoa pode ver quem segue quem
  CREATE POLICY "Follows são públicos para leitura"
    ON follows FOR SELECT
    USING (true);

  -- Usuário autenticado pode seguir alguém
  CREATE POLICY "Usuário autenticado pode seguir"
    ON follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

  -- Usuário pode deixar de seguir apenas quem ele mesmo seguiu
  CREATE POLICY "Usuário pode deixar de seguir"
    ON follows FOR DELETE
    USING (auth.uid() = follower_id);

  -- ====================================================
  -- Policies: likes
  -- ====================================================

  -- Curtidas são públicas para leitura
  CREATE POLICY "Likes são públicos para leitura"
    ON likes FOR SELECT
    USING (true);

  -- Usuário autenticado pode curtir
  CREATE POLICY "Usuário autenticado pode curtir"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Usuário pode descurtir apenas suas próprias curtidas
  CREATE POLICY "Usuário pode remover seu próprio like"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

  -- ====================================================
  -- Policies: comments
  -- ====================================================

  -- Comentários são públicos para leitura
  CREATE POLICY "Comentários são públicos para leitura"
    ON comments FOR SELECT
    USING (true);

  -- Usuário autenticado pode comentar
  CREATE POLICY "Usuário autenticado pode comentar"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Apenas o dono pode excluir o comentário
  CREATE POLICY "Apenas o dono pode excluir o comentário"
    ON comments FOR DELETE
    USING (auth.uid() = user_id);

  -- ====================================================
  -- Policies: messages
  -- ====================================================

  -- Mensagens visíveis apenas para remetente ou destinatário
  CREATE POLICY "Mensagens visíveis para remetente e destinatário"
    ON messages FOR SELECT
    USING (
      auth.uid() = sender_id
      OR auth.uid() = receiver_id
    );

  -- Apenas o remetente autenticado pode enviar mensagens
  CREATE POLICY "Usuário autenticado pode enviar mensagens"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

  -- Destinatário pode marcar mensagem como lida (UPDATE em read_at)
  CREATE POLICY "Qualquer pessoa na conversa pode atualizar read_at"
    ON messages FOR UPDATE
    USING (
      auth.uid() = receiver_id
      OR auth.uid() = sender_id
    )
    WITH CHECK (
      auth.uid() = receiver_id
      OR auth.uid() = sender_id
    );
