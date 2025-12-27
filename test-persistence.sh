#!/bin/bash

# Script de Teste - Persistência de Dados
# Este script testa a funcionalidade de persistência de dados

echo "🧪 Teste de Persistência de Dados - Fundify Dashboard"
echo "======================================================"
echo ""

BASE_URL="http://localhost:3001/api"

echo "📝 1. Criando uma transação de teste..."
RESPONSE=$(curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-27",
    "description": "Teste de Persistência",
    "amount": 100.00,
    "type": "income",
    "category": "Testes"
  }')

echo "Resposta: $RESPONSE"
echo ""

echo "📂 2. Verificando se arquivo foi criado..."
if [ -f "backend/data/transactions.json" ]; then
  echo "✅ Arquivo transactions.json criado!"
  echo "Conteúdo:"
  jq . backend/data/transactions.json 2>/dev/null || cat backend/data/transactions.json
else
  echo "❌ Arquivo não encontrado"
fi
echo ""

echo "🔄 3. Verificando dados via API..."
curl -s "$BASE_URL/transactions" | jq . | head -20
echo ""

echo "📊 4. Dashboard Data:"
curl -s "$BASE_URL/dashboard" | jq '.balance' 
echo ""

echo "✅ Teste Concluído!"
echo ""
echo "💡 Para testar persistência real:"
echo "   1. Execute este script enquanto o backend está rodando"
echo "   2. Reinicie o backend"
echo "   3. Execute o script novamente"
echo "   4. Os dados devem ser mantidos!"
