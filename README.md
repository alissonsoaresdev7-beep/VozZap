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
4. `supabase/migrations/005_realtime.sql` — Documentação de Realtime (manual) + Índices

### 5. Habilitar Realtime no Supabase Dashboard

Para o chat em **tempo real** funcionar:

1. Acesse: **Settings > Replication > Manage Realtime publications**
2. Crie a publicação `supabase_realtime` (se não existir)
3. Adicione as tabelas:
   - `messages` (para chat)
   - `likes` (para curtidas)
   - `comments` (para comentários)
   - `posts` (para posts)

> Sem essa configuração, o chat não receberá atualizações em tempo real!

---

## 🔄 Chat em Tempo Real (Realtime)

### ✅ Funcionalidades Implementadas

- **Mensagens em tempo real**: Novas mensagens aparecem instantaneamente
- **Indicador de leitura**: `read_at` atualiza em tempo real
- **Otimistic updates**: Mensagens aparecem localmente antes da confirmação do servidor
- **Cleanup automático**: Subscriptions são limpas quando sair do chat

### 📝 Ver mais detalhes

Para informações técnicas detalhadas sobre o fix do chat realtime:

```bash
cat CHAT_REALTIME_FIX.md
```

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

---

## 🌐 Deploy na Vercel

### 1. Conecte ao GitHub

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em "Add New" > "Project"
3. Selecione o repositório `vozzap`
4. Clique em "Import"

### 2. Configure as variáveis de ambiente

Na tela de configuração do Vercel:

1. **Environment Variables** > Adicione:
   - `VITE_SUPABASE_URL`: `https://xxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Sua chave anônima

2. Clique em "Deploy"

### 3. Verificar o deploy

```bash
# Você receberá um URL como: https://vozzap.vercel.app
# Abre automaticamente após o build
```

> **Deploy automático**: Cada `git push` para `main` acionará um novo deploy!

---

## 🔧 Troubleshooting

### Erro: "Variáveis de ambiente do Supabase não configuradas"

**Solução**: Verifique se o arquivo `.env` existe e tem as variáveis corretas:

```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### Erro: "Chat não atualiza em tempo real"

**Verificar**:

1. Supabase Realtime está habilitado?
   - Settings > Replication > Publicação `supabase_realtime` criada? ✅

2. Tabela `messages` está na publicação?
   - Settings > Replication > `messages` adicionada? ✅

3. Verificar console do navegador:
   ```bash
   # DevTools > Console
   # Procure por logs: "[Chat] ✅ Realtime subscription ATIVA"
   ```

### Erro: "Build fails on Vercel"

**Verificar**:

```bash
npm run build  # Testar localmente
npm run preview
```

Se houver erro, veja `CHAT_REALTIME_FIX.md`.

---

## 📚 Stack Técnico

| Camada      | Tecnologia |
|----------|-----------|
| Frontend | React 19.2.6 + TypeScript 5.9.3 + Vite 8.0.16 |
| UI Components | shadcn/ui (Radix UI) |
| Styling | Tailwind CSS 4.1.17 |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime (WebSocket) |
| Storage | Supabase Storage |
| Query | TanStack React Query 5.101.0 |
| Router | React Router 7.17.0 |
| Icons | Lucide React |

---

## 📄 Licença

MIT

---

## 👤 Contribuindo

Pull requests são bem-vindos!

```bash
git checkout -b feature/sua-feature
git commit -m "feat: sua-feature"
git push origin feature/sua-feature
```
