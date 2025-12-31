# 📝 submitin

Um sistema moderno para criar formulários personalizados, gerar links públicos e coletar respostas.

## ✨ Features

- **Builder Intuitivo**: Crie formulários com campos de texto, email, número, data, múltipla escolha e checkbox
- **Links Públicos**: Gere links únicos para compartilhar seus formulários
- **Autenticação Magic Link**: Login sem senha, apenas com email
- **Painel de Respostas**: Visualize todas as respostas em uma tabela organizada
- **Exportação CSV**: Exporte suas respostas para análise externa
- **Notificações por Email**: Receba alertas a cada nova resposta
- **Webhooks**: Integre com sistemas externos
- **Design Moderno**: Interface escura com glassmorphism e animações suaves

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 (App Router) + React 18 |
| Styling | TailwindCSS + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (Magic Link) |
| Email | React Email + Resend |
| Validação | Zod + React Hook Form |

## 📁 Estrutura do Projeto

```
submitin/
├── apps/
│   └── web/                    # Aplicação Next.js principal
│       ├── app/
│       │   ├── (auth)/         # Rotas de autenticação
│       │   ├── (dashboard)/    # Painel admin (protegido)
│       │   ├── f/[slug]/       # Formulários públicos
│       │   └── api/            # API Routes
│       ├── components/
│       └── lib/
├── packages/
│   ├── database/               # Prisma schema e cliente
│   ├── ui/                     # Componentes shadcn compartilhados
│   ├── email/                  # Templates React Email
│   └── config/                 # Configs ESLint, TypeScript, Tailwind
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL (local ou cloud)

### 1. Clone e instale as dependências

```bash
git clone <repo-url>
cd submitin
pnpm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na pasta `apps/web/`:

```env
# Database
# Para PostgreSQL local:
DATABASE_URL="postgresql://postgres:password@localhost:5432/submitin?schema=public"

# Para Supabase (obtenha em: Dashboard > Project Settings > Database):
# DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NextAuth
AUTH_SECRET="gere-com-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Email (Resend) - OBRIGATÓRIO para envio de emails
AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
AUTH_EMAIL_FROM="Seu Nome <noreply@seudominio.com>"
```

**⚠️ IMPORTANTE:**
- Use `.env.local` (não `.env`) - o `.env.local` é ignorado pelo git
- Se usar Supabase, substitua `DATABASE_URL` pela connection string do Supabase
- `AUTH_RESEND_KEY` e `AUTH_EMAIL_FROM` são obrigatórios para o envio de emails funcionar

**⚠️ Importante para Deploy (Vercel/Supabase):**

- Para gerar `AUTH_SECRET`: `openssl rand -base64 32`
- Configure todas as variáveis no dashboard do seu provedor:
  - **Vercel**: Project Settings > Environment Variables
  - **Supabase**: Project Settings > Edge Functions > Secrets (se usar Edge Functions) ou variáveis de ambiente do seu deploy
- Variáveis obrigatórias: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`
- Variáveis opcionais: `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM`
- O build falhará se as variáveis obrigatórias não estiverem configuradas

**📌 Nota sobre Supabase:**
- Este projeto usa **Next.js API Routes** (não Supabase Edge Functions)
- Se você usa Supabase como banco de dados, configure `DATABASE_URL` com a connection string do Supabase
- As variáveis de ambiente devem ser configuradas no provedor onde você faz deploy do Next.js (Vercel, Railway, etc.)
- O envio de emails funciona da mesma forma, independente de usar Supabase como banco

### ✅ Checklist para Deploy em Produção

Antes de fazer deploy, verifique:

1. **Variáveis de Ambiente Configuradas**:
   - [ ] `DATABASE_URL` - Connection string do Supabase (não use localhost!)
   - [ ] `AUTH_SECRET` - Gerado com `openssl rand -base64 32`
   - [ ] `AUTH_URL` - URL do seu site em produção (ex: `https://seudominio.com`)
   - [ ] `AUTH_RESEND_KEY` - API key da Resend
   - [ ] `AUTH_EMAIL_FROM` - Email verificado na Resend

2. **Database**:
   - [ ] `DATABASE_URL` aponta para Supabase (não localhost)
   - [ ] Use "Connection pooling" do Supabase para melhor performance
   - [ ] Migrations aplicadas (`pnpm db:push` ou via Supabase)

3. **Resend**:
   - [ ] Domínio verificado na Resend Dashboard
   - [ ] Status do domínio: `verified` (SPF e DKIM configurados)
   - [ ] `AUTH_EMAIL_FROM` usa o domínio verificado

4. **Após o Deploy**:
   - [ ] Verifique os logs do servidor para diagnóstico
   - [ ] Teste o login (envio de email)
   - [ ] Verifique se as respostas dos formulários estão sendo salvas

### 3. Configure o banco de dados

```bash
# Gerar o cliente Prisma
pnpm db:generate

# Criar as tabelas
pnpm db:push
```

### 4. Inicie o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia todos os apps em modo desenvolvimento |
| `pnpm build` | Build de produção de todos os apps |
| `pnpm lint` | Executa o linter em todos os packages |
| `pnpm db:generate` | Gera o cliente Prisma |
| `pnpm db:push` | Sincroniza o schema com o banco |
| `pnpm db:studio` | Abre o Prisma Studio |

## 🔐 Autenticação

O sistema usa Magic Link para autenticação:

1. Usuário informa o email
2. Um link mágico é enviado por email
3. Ao clicar no link, o usuário é autenticado automaticamente

Para desenvolvimento local sem email, você pode usar o Prisma Studio para visualizar os tokens de verificação.

## 📧 Configuração de Email (Resend)

### Passo a Passo

1. **Crie uma conta** em [resend.com](https://resend.com)

2. **Adicione e verifique seu domínio** (⚠️ **OBRIGATÓRIO**)
   - Acesse o dashboard da Resend > **Domains**
   - Clique em **Add Domain**
   - **Recomendação**: Use um subdomínio (ex: `updates.seudominio.com`) para isolar a reputação de envio
   - Configure os registros DNS conforme instruções:
     - **SPF**: Registro TXT que autoriza a Resend a enviar emails
     - **DKIM**: Registro TXT com chave pública para verificar autenticidade
     - **DMARC** (opcional): Aumenta a confiança com provedores de email
   - Aguarde a verificação (status deve ficar `verified`)
   - 📖 [Documentação completa](https://resend.com/docs/dashboard/domains/introduction)

3. **Crie uma API Key**
   - Acesse **API Keys** no dashboard
   - Clique em **Create API Key**
   - Copie a chave (formato: `re_xxxxxxxxxxxx`)

4. **Configure as variáveis de ambiente**
   ```env
   AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
   AUTH_EMAIL_FROM="Seu Nome <noreply@seudominio.com>"
   ```
   
   ⚠️ **IMPORTANTE**: 
   - O domínio em `AUTH_EMAIL_FROM` **DEVE** estar verificado na Resend
   - Use o formato: `"Nome <email@dominio.com>"` ou `"email@dominio.com"`
   - O domínio precisa ter status `verified` no dashboard da Resend

## 🗄️ Database

O projeto usa PostgreSQL com Prisma ORM. Você pode usar:

- **Local**: PostgreSQL instalado localmente
- **Cloud**: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app)

### Configurando Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Project Settings** > **Database**
3. Copie a **Connection String** (use a opção "Connection pooling" para melhor performance)
4. Cole no arquivo `.env.local` como `DATABASE_URL`

## 🔧 Troubleshooting

### Erro: "Can't reach database server at 'localhost:5432'"

**Problema**: O Prisma está tentando conectar em um PostgreSQL local que não está rodando.

**Soluções**:
1. **Se você usa Supabase**: Atualize `DATABASE_URL` no `.env.local` com a connection string do Supabase
2. **Se você usa PostgreSQL local**: Certifique-se de que o PostgreSQL está rodando:
   ```bash
   # macOS (Homebrew)
   brew services start postgresql
   
   # Linux
   sudo systemctl start postgresql
   ```

### Erro: "Configuration" no login

**Problema**: As variáveis `AUTH_RESEND_KEY` ou `AUTH_EMAIL_FROM` não estão configuradas.

**Solução**:
1. Crie/edite o arquivo `.env.local` na pasta `apps/web/`
2. Adicione as variáveis:
   ```env
   AUTH_RESEND_KEY="re_xxxxxxxxxxxx"
   AUTH_EMAIL_FROM="Seu Nome <noreply@seudominio.com>"
   ```
3. Reinicie o servidor: `pnpm dev`

### Verificar configuração

Ao iniciar o servidor, você verá um diagnóstico automático no console mostrando:
- ✅ Variáveis configuradas corretamente
- ❌ Variáveis faltando ou incorretas
- ⚠️ Avisos sobre configurações

Se algo estiver errado, o diagnóstico mostrará instruções específicas para corrigir.

## 🎨 Customização

### Temas

O design system está configurado em `apps/web/app/globals.css`. As variáveis CSS podem ser ajustadas para personalizar cores, bordas e espaçamentos.

### Componentes

Os componentes UI estão em `packages/ui/src/components/` e seguem os padrões do shadcn/ui.

## 📄 Licença

MIT

---

Feito com ❤️ por Vitor Hugo

