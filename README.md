# Financial App Dashboard

Modern Financial Dashboard inspirado no design do [Fundify](https://dribbble.com/shots/26479102-Fundify-Modern-Financial-Dashboard-Design).

## ✨ Características

- 🎨 Design moderno e limpo
- 📊 Gráficos interativos
- 💳 Cards de métricas financeiras
- 📱 Totalmente responsivo
- ⚡ Performance otimizada
- 🎯 Interface intuitiva
- 💾 **Persistência automática de dados**

## 🚀 Quick Start

### Instalação

```bash
npm run install:all
```

### Desenvolvimento

```bash
npm run dev
```

Isso iniciará tanto o backend (porta 3000) quanto o frontend (porta 5173) simultaneamente.

Acesse: http://localhost:5173

## 📦 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Persistência**: JSON files
- **Gráficos**: Chart.js / Recharts
- **Estilização**: CSS Modules

## 💾 Persistência de Dados

Os dados são **salvos automaticamente** em arquivos JSON na pasta `backend/data/`:

- `transactions.json` - Todas as transações
- `account-plan.json` - Plano de contas

### Como funciona

1. **Importar dados** via painel Admin
2. **Dados são salvos** automaticamente
3. **Reinicie a aplicação** - os dados continuam lá! ✅

Não é necessário nenhuma configuração adicional.

## 📁 Estrutura do Projeto

```
financial-app-dashboard/
├── frontend/              # Aplicação React
│   ├── src/
│   │   ├── components/   # Componentes UI
│   │   └── services/     # API client
│   └── package.json
├── backend/              # API Node.js
│   ├── src/
│   │   └── index.ts     # Server + routes + persistence
│   ├── data/            # Arquivos JSON (criados automaticamente)
│   └── package.json
└── README.md
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento (backend + frontend)
npm run dev

# Apenas frontend
npm run dev:frontend

# Apenas backend
npm run dev:backend

# Instalar todas as dependências
npm run install:all

# Testar persistência
./test-persistence.sh
```

## 📚 Documentação Técnica

Para detalhes de implementação, arquitetura e troubleshooting, consulte [docs/TECHNICAL.md](docs/TECHNICAL.md).

