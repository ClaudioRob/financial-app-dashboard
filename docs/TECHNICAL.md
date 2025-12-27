# 📚 Documentação Técnica

## 📑 Índice

1. [Arquitetura de Persistência](#arquitetura-de-persistência)
2. [Implementação](#implementação)
3. [Estrutura dos Arquivos JSON](#estrutura-dos-arquivos-json)
4. [API Endpoints](#api-endpoints)
5. [Troubleshooting](#troubleshooting)
6. [Deployment](#deployment)

---

## Arquitetura de Persistência

### Overview

O sistema utiliza arquivos JSON para persistir dados localmente, eliminando a necessidade de um banco de dados para desenvolvimento.

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
└────────┬────────┘
         │
    HTTP │ REST API
         ▼
┌─────────────────────────────┐
│    Backend Express.js       │
│                             │
│  📊 Memória (runtime)       │
│  ↕️ Sincronização           │
│  📁 Arquivos JSON (disco)   │
└─────────────────────────────┘
```

### Fluxo de Dados

1. **Inicialização**: Backend carrega dados dos arquivos JSON
2. **Operações**: Dados manipulados em memória
3. **Persistência**: Cada alteração é salva automaticamente no disco
4. **Reinício**: Dados são recarregados dos arquivos

---

## Implementação

### Arquivos de Dados

Localização: `backend/data/`

- `transactions.json` - Todas as transações
- `account-plan.json` - Estrutura do plano de contas

### Funções Principais (`backend/src/index.ts`)

#### Configuração

```typescript
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json')
const ACCOUNT_PLAN_FILE = path.join(DATA_DIR, 'account-plan.json')
```

#### Salvamento

```typescript
function saveTransactions() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(
      TRANSACTIONS_FILE,
      JSON.stringify({ transactions, nextId }, null, 2)
    )
    console.log('✅ Transações salvas com sucesso')
  } catch (error) {
    console.error('❌ Erro ao salvar transações:', error)
  }
}

function saveAccountPlan() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(
      ACCOUNT_PLAN_FILE,
      JSON.stringify(accountPlan, null, 2)
    )
    console.log('✅ Plano de contas salvo')
  } catch (error) {
    console.error('❌ Erro ao salvar plano de contas:', error)
  }
}
```

#### Carregamento

```typescript
function loadTransactions() {
  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const data = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      console.log(`📂 ${parsed.transactions.length} transações carregadas`)
      return parsed
    }
  } catch (error) {
    console.error('❌ Erro ao carregar transações:', error)
  }
  return { transactions: [], nextId: 1 }
}

function loadAccountPlan() {
  try {
    if (fs.existsSync(ACCOUNT_PLAN_FILE)) {
      const data = fs.readFileSync(ACCOUNT_PLAN_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      console.log(`📂 Plano de contas carregado`)
      return parsed
    }
  } catch (error) {
    console.error('❌ Erro ao carregar plano de contas:', error)
  }
  return { receitas: [], despesas: [] }
}
```

#### Inicialização

```typescript
// Carrega dados na inicialização
const loadedData = loadTransactions()
let transactions: Transaction[] = loadedData.transactions
let nextId = loadedData.nextId
let accountPlan = loadAccountPlan()
```

---

## Estrutura dos Arquivos JSON

### transactions.json

```json
{
  "transactions": [
    {
      "id": 1,
      "description": "Venda de Produto",
      "amount": 1500.00,
      "type": "income",
      "category": "Receitas de Vendas",
      "date": "2025-01-15",
      "account": "Caixa Geral"
    }
  ],
  "nextId": 2
}
```

### account-plan.json

```json
{
  "receitas": [
    {
      "code": "3.1.001",
      "name": "Receitas de Vendas",
      "type": "Analítica"
    }
  ],
  "despesas": [
    {
      "code": "4.1.001",
      "name": "Despesas Administrativas",
      "type": "Analítica"
    }
  ]
}
```

---

## API Endpoints

### Transações

| Método | Endpoint | Descrição | Persiste |
|--------|----------|-----------|----------|
| GET | `/api/transactions` | Lista transações | - |
| POST | `/api/transactions` | Cria transação | ✅ |
| PUT | `/api/transactions/:id` | Edita transação | ✅ |
| DELETE | `/api/transactions/:id` | Deleta transação | ✅ |
| DELETE | `/api/transactions/all` | Limpa todas | ✅ |

### Plano de Contas

| Método | Endpoint | Descrição | Persiste |
|--------|----------|-----------|----------|
| GET | `/api/account-plan` | Obtém plano | - |
| POST | `/api/account-plan` | Importa plano | ✅ |

### Importação

| Método | Endpoint | Descrição | Persiste |
|--------|----------|-----------|----------|
| POST | `/api/import/transactions` | Importa transações | ✅ |
| POST | `/api/import/account-plan` | Importa plano | ✅ |

---

## Troubleshooting

### Dados não estão persistindo

**Problema**: Dados são perdidos após reinício

**Soluções**:
1. Verificar se `backend/data/` existe
2. Verificar permissões de escrita
3. Checar logs do console para erros
4. Verificar se `saveTransactions()` é chamado após operações

### Erro ao carregar dados

**Problema**: Erro ao iniciar o backend

**Soluções**:
1. Verificar se arquivos JSON estão bem formatados
2. Deletar arquivos corrompidos (serão recriados)
3. Verificar encoding UTF-8

### Dados duplicados

**Problema**: Dados aparecem duplicados

**Soluções**:
1. Verificar se `nextId` está sendo incrementado
2. Limpar dados e reimportar
3. Verificar lógica de importação

---

## Deployment

### Desenvolvimento

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Produção

```bash
# Build backend
cd backend
npm run build
npm start

# Build frontend
cd frontend
npm run build
npm run preview
```

### Variáveis de Ambiente

Criar `.env` no backend:

```env
PORT=3000
NODE_ENV=production
DATA_DIR=./data
```

### Docker (Opcional)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
VOLUME /app/data
EXPOSE 3000
CMD ["npm", "start"]
```

### Backup dos Dados

```bash
# Backup manual
cp -r backend/data backend/data.backup

# Backup automatizado (crontab)
0 2 * * * cp -r /path/to/backend/data /path/to/backups/data-$(date +\%Y\%m\%d)
```

---

## Segurança

### .gitignore

Certifique-se de que os dados não sejam versionados:

```gitignore
# Data persistence
data/
backend/data/
*.json.backup
```

### Validação

Sempre valide dados antes de salvar:

```typescript
function validateTransaction(transaction: Transaction): boolean {
  return (
    transaction.description &&
    transaction.amount > 0 &&
    transaction.type &&
    transaction.date
  )
}
```

---

## Próximos Passos

### Melhorias Sugeridas

1. **Banco de Dados**: Migrar para PostgreSQL/MongoDB
2. **Backup Automático**: Implementar backup periódico
3. **Versionamento**: Manter histórico de alterações
4. **Validação**: Adicionar schemas (Zod, Yup)
5. **Logs**: Sistema de logging estruturado
6. **Testes**: Adicionar testes unitários e integração

### Migração para Banco de Dados

Quando o projeto crescer, considere:

- **SQLite**: Simples, arquivo único
- **PostgreSQL**: Robusto, features avançadas
- **MongoDB**: Flexível, schema-less
- **Prisma**: ORM moderno com TypeScript

---

## Suporte

Para questões ou problemas:
1. Verifique os logs do console
2. Consulte esta documentação
3. Revise o código em `backend/src/index.ts`
4. Abra uma issue no repositório
