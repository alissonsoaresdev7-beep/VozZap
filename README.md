# 🎙️ VozZap

VozZap é uma rede social de publicação e consumo de áudios, construída com **Vite + React + TypeScript**, **shadcn/ui**, e **Supabase** (Auth, PostgreSQL, Storage).

---

## 📋 Pré-requisitos

- Node.js >= 18
- npm >= 9
- Conta no [Supabase](https://supabase.com)

---

## 🚀 Setup do projeto

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/vozzap.git
cd vozzap
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Você encontra essas credenciais em: **Supabase Dashboard → Settings → API**

---

## 🗄️ Configuração do banco de dados (Supabase)

### 4. Execute as migrations no Supabase

Acesse o **SQL Editor** do seu projeto Supabase e execute os arquivos na ordem:

1. `supabase/migrations/001_tables.sql` — Cria tabelas, índices e triggers
2. `supabase/migrations/002_policies.sql` — Configura Row Level Security (RLS)
3. `supabase/migrations/003_storage.sql` — Cria buckets de Storage e suas políticas

---

## 📦 Storage Buckets

O projeto usa dois buckets no Supabase Storage:

| Bucket   | Visibilidade | Conteúdo            |
|----------|-------------|---------------------|
| `avatars`| Público     | Fotos de perfil     |
| `audios` | Público     | Arquivos de áudio   |

Eles são criados automaticamente pela migration `003_storage.sql`.

---

## ▶️ Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## 🏗️ Build para produção

```bash
npm run build
npm run preview
```

---

## 🗂️ Estrutura do projeto

```
src/
  components/
    ui/           ← Componentes base (shadcn/ui)
    layout/       ← Header, BottomNav, Sidebar
    audio/        ← AudioPlayer, AudioUploader
    feed/         ← PostCard, FeedList
    profile/      ← ProfileHeader, FollowButton
    messages/     ← ConversationList, MessageBubble
  pages/
    Home, Login, Register, ForgotPassword,
    Profile, PublishPost, EditPost, PostDetail,
    Messages, Conversation, Explore
  hooks/
    useAuth, useFeed, useProfile, useMessages
  lib/
    supabase.ts   ← Cliente Supabase configurado
  types/
    index.ts      ← Interfaces TypeScript de todas as entidades
supabase/
  migrations/
    001_tables.sql
    002_policies.sql
    003_storage.sql
```

---

## 🎨 Paleta de cores

| Nome             | Hex       |
|-----------------|-----------|
| Verde Principal  | `#25D366` |
| Verde Escuro     | `#075E54` |
| Bege/Fundo Claro | `#ECE5DD` |
| Branco           | `#FFFFFF` |
| Preto/Texto      | `#111827` |

---

## 🔐 Autenticação

- Cadastro com e-mail e senha
- Login com e-mail e senha
- Recuperação de senha via magic link
- Perfil criado automaticamente via trigger no Supabase

---

## 📱 Funcionalidades

- 🎵 Feed de áudios públicos com player inline
- 👤 Perfis de usuário com seguidores/seguindo
- 📤 Publicar áudio (upload ou URL externa)
- ❤️ Curtir e comentar posts
- 💬 Chat direto entre usuários
- 🔍 Explorar e buscar posts/usuários
- 🌙 Tema claro e escuro
