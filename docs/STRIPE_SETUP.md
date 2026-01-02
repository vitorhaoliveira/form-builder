# Stripe Integration Setup

Este guia explica como configurar a integração com Stripe para habilitar pagamentos e assinaturas PRO no Submitin.

## 1. Criar Conta no Stripe

1. Acesse [https://stripe.com](https://stripe.com) e crie uma conta
2. Após o cadastro, você terá acesso ao Dashboard do Stripe

## 2. Obter Chaves da API

### Modo de Teste (Development)

1. No Dashboard do Stripe, vá em **Developers** → **API keys**
2. Copie as seguintes chaves:
   - **Publishable key** (começa com `pk_test_...`)
   - **Secret key** (começa com `sk_test_...`)

### Modo de Produção

1. Ative sua conta Stripe (preencha informações da empresa, dados bancários, etc.)
2. Acesse **Developers** → **API keys**
3. Alterne para **Viewing test data** OFF (Production mode)
4. Copie as chaves de produção:
   - **Publishable key** (começa com `pk_live_...`)
   - **Secret key** (começa com `sk_live_...`)

## 3. Criar Produto e Preço

1. No Dashboard, vá em **Products** → **Add Product**
2. Preencha:
   - **Name**: `Submitin Pro`
   - **Description**: `Plano Pro com recursos avançados`
   - **Pricing**: 
     - **Price**: `9.00` USD
     - **Billing period**: `Monthly` (Mensal)
     - **Payment type**: `Recurring` (Recorrente)
3. Clique em **Save product**
4. Após criar, copie o **Price ID** (começa com `price_...`)

## 4. Configurar Webhook

1. No Dashboard, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - **Description**: `Submitin Subscription Events`
   - **Listen to**: Selecione os seguintes eventos:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Clique em **Add endpoint**
5. Copie o **Signing secret** (começa com `whsec_...`)

## 5. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # ou sk_live_... em produção
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # ou pk_live_... em produção

# App URL (necessário para redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # ou https://seu-dominio.com em produção
```

## 6. Testar Webhooks Localmente

### Usar Stripe CLI

1. Instale o Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Faça login:
   ```bash
   stripe login
   ```
3. Encaminhe webhooks para seu ambiente local:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. O CLI exibirá um webhook signing secret temporário - use-o no `.env` local

### Testar Pagamento

1. Acesse `http://localhost:3000/dashboard/billing`
2. Clique em **Upgrade para Pro**
3. Use um cartão de teste do Stripe:
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVC: Qualquer 3 dígitos
   - CEP: Qualquer valor

## 7. Configurar Portal do Cliente

O Portal do Cliente permite que usuários gerenciem suas assinaturas.

1. No Dashboard, vá em **Settings** → **Billing** → **Customer portal**
2. Ative o portal
3. Configure:
   - **Allow customers to**: 
     - ✅ Update payment methods
     - ✅ Cancel subscriptions
     - ✅ View invoices
   - **Cancellation policy**: Configure conforme sua política
   - **Business information**: Preencha informações da empresa

## 8. Modo de Produção

Antes de ir para produção:

1. ✅ Substitua chaves de teste pelas chaves de produção
2. ✅ Configure webhook para URL de produção
3. ✅ Teste o fluxo completo em produção
4. ✅ Configure corretamente o `NEXT_PUBLIC_APP_URL`
5. ✅ Ative sua conta Stripe completamente
6. ✅ Configure dados fiscais e bancários

## 9. Monitoramento

### Logs do Stripe

- Acesse **Developers** → **Logs** para ver todas as requisições da API
- Acesse **Developers** → **Events** para ver eventos de webhook

### Logs da Aplicação

Monitore os logs do servidor para verificar:
- ✅ Webhooks sendo recebidos corretamente
- ✅ Assinaturas sendo criadas/atualizadas
- ✅ Pagamentos sendo processados

## 10. Problemas Comuns

### Webhook não está sendo recebido

1. Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
2. Confirme que a URL do webhook está acessível publicamente
3. Verifique logs em **Developers** → **Webhooks** no Dashboard

### Pagamento não está sendo processado

1. Verifique se o `STRIPE_PRO_PRICE_ID` está correto
2. Confirme que o produto está ativo no Stripe
3. Verifique logs de erro no console do servidor

### Usuário não foi atualizado para PRO

1. Verifique se o webhook `checkout.session.completed` foi recebido
2. Confirme que o `userId` está sendo passado nos metadados
3. Verifique logs do banco de dados

## Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Customer Portal Guide](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)