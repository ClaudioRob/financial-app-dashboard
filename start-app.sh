#!/bin/bash

# Script para iniciar a aplicação Financial Dashboard
# Este script inicia o backend e o frontend automaticamente

# Define o diretório do projeto
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$PROJECT_DIR"

echo "🚀 Iniciando Financial Dashboard..."
echo "📁 Diretório: $PROJECT_DIR"
echo ""

# Verifica se as dependências estão instaladas
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Inicia a aplicação usando o script do package.json
echo "🎯 Iniciando backend e frontend..."
npm run dev

# Quando o usuário pressionar Ctrl+C, o script irá parar
echo ""
echo "✅ Aplicação encerrada"
