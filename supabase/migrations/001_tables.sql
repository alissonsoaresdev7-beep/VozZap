-- ====================================================
-- VozZap - Migração 001: Criação das tabelas principais
-- ====================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================
-- Tabela: categories (categorias pré-definidas)
-- ====================================================
CREATE TABLE IF NOT EXISTS categories (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Inserção das categorias padrão
INSERT INTO categories (name, slug) VALUES
  ('Música',    'musica'),
  ('Podcast',   'podcast'),
  ('Humor',     'humor'),
  ('Notícias',  'noticias'),
  ('Educação',  'educacao'),
  ('Outros',    'outros')
ON CONFLICT (slug) DO NOTHING;

-- ====================================================
-- Tabela: profiles (perfis dos usuários)
-- ====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at DESC);

-- ====================================================
-- Tabela: posts (publicações de áudio)
-- ====================================================
CREATE TABLE IF NOT EXISTS posts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT,
  audio_url        TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  visibility       TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  likes_count      INTEGER NOT NULL DEFAULT 0,
  comments_count   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id    ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts (visibility);
CREATE INDEX IF NOT EXISTS idx_posts_category   ON posts (category);

-- ====================================================
-- Tabela: follows (relacionamento de seguidores)
-- ====================================================
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

-- Índices de follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at   ON follows (created_at DESC);

-- ====================================================
-- Tabela: likes (curtidas em posts)
-- ====================================================
CREATE TABLE IF NOT EXISTS likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, post_id)
);

-- Índices de likes
CREATE INDEX IF NOT EXISTS idx_likes_user_id    ON likes (user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id    ON likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes (created_at DESC);

-- ====================================================
-- Tabela: comments (comentários em posts)
-- ====================================================
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id    ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id    ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at DESC);

-- ====================================================
-- Tabela: messages (mensagens diretas entre usuários)
-- ====================================================
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at  ON messages (created_at DESC);

-- ====================================================
-- Função: atualizar updated_at dos posts automaticamente
-- ====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;
CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================================
-- Função: atualizar likes_count automaticamente
-- ====================================================
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_likes_count ON likes;
CREATE TRIGGER trigger_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- ====================================================
-- Função: atualizar comments_count automaticamente
-- ====================================================
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comments_count ON comments;
CREATE TRIGGER trigger_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- ====================================================
-- Função: criar perfil automaticamente após cadastro
-- ====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Extrai username base do metadata ou do email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Garante que username é válido (sem caracteres especiais)
  base_username := lower(regexp_replace(base_username, '[^a-z0-9_]', '', 'g'));
  
  -- Se ficou vazio, usa parte do UUID
  IF base_username = '' THEN
    base_username := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;
  
  final_username := base_username;
  
  -- Tenta encontrar um username único
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter;
  END LOOP;
  
  -- Insere o perfil
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log do erro mas não falha o signup
  RAISE WARNING 'Erro ao criar profile para %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
