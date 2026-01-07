# Atualização Automática de Lançamentos

## Visão Geral

Esta funcionalidade permite que, ao atualizar uma conta no Plano de Contas, todos os lançamentos relacionados sejam automaticamente atualizados com os novos dados.

## Relacionamento de Campos

O relacionamento entre Plano de Contas e Lançamentos ocorre através dos seguintes campos:

| Plano de Contas | Lançamentos |
|-----------------|-------------|
| ID_Conta        | Id_Item     |
| Natureza        | Natureza    |
| Tipo            | Tipo        |
| Categoria       | Categoria   |
| SubCategoria    | SubCategoria|
| Conta           | Item        |

## Como Funciona

### 1. Atualização Individual de Conta

Quando você atualiza uma conta específica do Plano de Contas usando o endpoint:

```
PUT /api/account-plan/:id
```

O sistema automaticamente:

1. ✅ Atualiza os dados da conta no Plano de Contas
2. ✅ Busca todos os lançamentos que possuem `Id_Item` igual ao `ID_Conta` atualizado
3. ✅ Atualiza os campos dos lançamentos com os novos dados da conta:
   - `Natureza`
   - `Tipo`
   - `Categoria`
   - `SubCategoria`
   - `Item` (corresponde ao campo `Conta` do plano)
   - `category` (para compatibilidade)
   - `description` (para compatibilidade)
4. ✅ Persiste as alterações nos arquivos JSON

**Exemplo de Request:**

```json
PUT /api/account-plan/101
{
  "Natureza": "Receita",
  "Tipo": "Fixa",
  "Categoria": "Folha Salarial",
  "SubCategoria": "Adiantamentos - Atualizado",
  "Conta": "Adiantamento de Salário - Revisado"
}
```

**Resposta:**

```json
{
  "message": "Conta atualizada com sucesso",
  "account": {
    "ID_Conta": "101",
    "Natureza": "Receita",
    "Tipo": "Fixa",
    "Categoria": "Folha Salarial",
    "SubCategoria": "Adiantamentos - Atualizado",
    "Conta": "Adiantamento de Salário - Revisado"
  },
  "transactionsUpdated": 5
}
```

### 2. Processo de Importação (NÃO Afetado)

⚠️ **IMPORTANTE:** O processo de importação continua funcionando como antes e **NÃO aciona a atualização em cascata**.

#### Importação de Plano de Contas
```
POST /api/account-plan/import
```
- Substitui completamente o plano de contas
- Não atualiza lançamentos existentes
- Mantém comportamento original

#### Importação de Lançamentos
```
POST /api/transactions/import
```
- Adiciona novos lançamentos
- Valida contra o plano de contas (se `validateAccountPlan = true`)
- Não modifica o plano de contas
- Mantém comportamento original

## Uso no Frontend

### Função para Atualizar Conta

```typescript
import { updateAccountPlan } from './services/api'

// Atualizar uma conta específica
const handleUpdateAccount = async (id: string | number) => {
  try {
    const result = await updateAccountPlan(id, {
      Natureza: "Receita",
      Tipo: "Variável",
      Categoria: "Vendas",
      SubCategoria: "Produtos",
      Conta: "Venda de Produtos"
    })
    
    console.log(result.message)
    console.log(`${result.transactionsUpdated} lançamentos atualizados`)
  } catch (error) {
    console.error('Erro ao atualizar conta:', error)
  }
}
```

## Benefícios

1. ✅ **Consistência de Dados**: Garante que os lançamentos sempre refletem as informações atualizadas do plano de contas
2. ✅ **Economia de Tempo**: Não é necessário atualizar manualmente cada lançamento
3. ✅ **Rastreabilidade**: O sistema informa quantos lançamentos foram atualizados
4. ✅ **Segurança**: O ID da conta não pode ser alterado, preservando a integridade dos relacionamentos
5. ✅ **Compatibilidade**: O processo de importação continua funcionando normalmente

## Limitações

- O campo `ID_Conta` não pode ser alterado (é a chave de relacionamento)
- Apenas atualizações individuais de contas acionam a atualização em cascata
- Importações em lote não acionam a atualização em cascata

## Logs

O sistema registra informações sobre as atualizações:

```
✅ 5 lançamentos atualizados para ID_Conta 101
💾 Plano de contas salvo (63 contas)
💾 Transações salvas (247 registros)
```
