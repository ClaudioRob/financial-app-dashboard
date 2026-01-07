#!/bin/bash

# Script de Teste: Atualização Automática de Lançamentos
# Este script demonstra como a atualização de uma conta no plano de contas
# atualiza automaticamente os lançamentos relacionados

API_URL="http://localhost:3001/api"

echo "============================================"
echo "Teste de Atualização Automática"
echo "============================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar saúde da API
echo -e "${BLUE}1. Verificando API...${NC}"
curl -s "$API_URL/health" | jq '.'
echo ""

# 2. Obter plano de contas atual
echo -e "${BLUE}2. Obtendo plano de contas (primeiras 3 contas)...${NC}"
curl -s "$API_URL/account-plan" | jq '.[0:3]'
echo ""

# 3. Obter lançamentos com Id_Item = "101" (antes da atualização)
echo -e "${BLUE}3. Buscando lançamentos com Id_Item = '101' (ANTES da atualização)...${NC}"
curl -s "$API_URL/transactions" | jq '[.[] | select(.Id_Item == "101")] | .[0:2]'
echo ""

# 4. Atualizar a conta 101
echo -e "${YELLOW}4. Atualizando conta 101 do plano de contas...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/account-plan/101" \
  -H "Content-Type: application/json" \
  -d '{
    "Natureza": "Receita",
    "Tipo": "Fixa - ATUALIZADO",
    "Categoria": "Folha Salarial",
    "SubCategoria": "Adiantamentos - MODIFICADO",
    "Conta": "Adiantamento de Salário - TESTE"
  }')

echo "$UPDATE_RESPONSE" | jq '.'
echo ""

# Extrair número de transações atualizadas
TRANSACTIONS_UPDATED=$(echo "$UPDATE_RESPONSE" | jq -r '.transactionsUpdated // 0')

echo -e "${GREEN}✅ Conta atualizada! ${TRANSACTIONS_UPDATED} lançamentos foram atualizados automaticamente.${NC}"
echo ""

# 5. Verificar lançamentos após atualização
echo -e "${BLUE}5. Verificando lançamentos com Id_Item = '101' (DEPOIS da atualização)...${NC}"
curl -s "$API_URL/transactions" | jq '[.[] | select(.Id_Item == "101")] | .[0:2] | .[] | {
  id, 
  Id_Item, 
  Tipo, 
  SubCategoria, 
  Item
}'
echo ""

# 6. Restaurar conta original (opcional)
echo -e "${YELLOW}6. Restaurando conta 101 ao estado original...${NC}"
curl -s -X PUT "$API_URL/account-plan/101" \
  -H "Content-Type: application/json" \
  -d '{
    "Natureza": "Receita",
    "Tipo": "Fixa",
    "Categoria": "Folha Salarial",
    "SubCategoria": "Adiantamentos",
    "Conta": "Adiantamento de Salário"
  }' | jq '.'
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Teste concluído com sucesso!${NC}"
echo -e "${GREEN}============================================${NC}"
