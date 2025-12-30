import express, { Request, Response } from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Configurar encoding UTF-8 para todas as respostas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  next()
})

// Configurar persistência de dados em arquivos JSON
const DATA_DIR = path.join(process.cwd(), 'data')
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json')
const ACCOUNT_PLAN_FILE = path.join(DATA_DIR, 'account-plan.json')

// Criar diretório de dados se não existir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  console.log(`📁 Diretório de dados criado: ${DATA_DIR}`)
}

// Funções para persistência
const saveTransactions = (transactionsData: Transaction[], nextIdValue: number) => {
  try {
    const data = { transactions: transactionsData, nextId: nextIdValue }
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`💾 Transações salvas (${transactionsData.length} registros)`)
  } catch (error) {
    console.error('❌ Erro ao salvar transações:', error)
  }
}

const loadTransactions = (): { transactions: Transaction[]; nextId: number } => {
  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const fileContent = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8')
      const data = JSON.parse(fileContent)
      console.log(`📂 Transações carregadas do arquivo (${data.transactions?.length || 0} registros)`)
      return {
        transactions: data.transactions || [],
        nextId: data.nextId || 1
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar transações:', error)
  }
  
  // Retornar dados padrão se arquivo não existir ou erro ao ler
  return { transactions: [], nextId: 1 }
}

const saveAccountPlan = (planData: Map<number | string, AccountPlan>) => {
  try {
    const planArray = Array.from(planData.values())
    fs.writeFileSync(ACCOUNT_PLAN_FILE, JSON.stringify(planArray, null, 2), 'utf-8')
    console.log(`💾 Plano de contas salvo (${planArray.length} contas)`)
  } catch (error) {
    console.error('❌ Erro ao salvar plano de contas:', error)
  }
}

const loadAccountPlan = (): Map<number | string, AccountPlan> => {
  try {
    if (fs.existsSync(ACCOUNT_PLAN_FILE)) {
      const fileContent = fs.readFileSync(ACCOUNT_PLAN_FILE, 'utf-8')
      const planArray = JSON.parse(fileContent)
      const planMap = new Map<number | string, AccountPlan>()
      
      planArray.forEach((item: AccountPlan) => {
        planMap.set(item.ID_Conta, item)
      })
      
      console.log(`📂 Plano de contas carregado (${planArray.length} contas)`)
      return planMap
    }
  } catch (error) {
    console.error('❌ Erro ao carregar plano de contas:', error)
  }
  
  return new Map()
}

// Tipos
interface AccountPlan {
  ID_Conta: number | string
  Natureza: string
  Tipo: string
  Categoria: string
  SubCategoria: string
  Conta: string
}

interface Transaction {
  id: number | string  // Pode ser número ou string (Id_Item)
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  // Campos adicionais para compatibilidade com plano de contas
  // 10 colunas da planilha: Id_Item, Natureza, Tipo, Categoria, SubCategoria, Operação, Origem|Destino, Item, Data, Valor
  Id_Item?: number | string
  Natureza?: string
  Tipo?: string
  Categoria?: string
  SubCategoria?: string
  Operação?: string
  OrigemDestino?: string  // Origem|Destino
  Item?: string
  Data?: string  // Data original do Excel
  Valor?: number  // Valor original do Excel
}

interface DashboardData {
  balance: {
    total: number
    income: number
    expenses: number
    savings: number
  }
  transactions: Transaction[]
  charts: {
    monthly: Array<{ month: string; income: number; expenses: number }>
    categories: Array<{ category: string; amount: number }>
  }
}

// Armazenamento de dados em memória com persistência em arquivo
const loadedData = loadTransactions()
let transactions: Transaction[] = loadedData.transactions
let nextId = loadedData.nextId

let accountPlan: Map<number | string, AccountPlan> = loadAccountPlan()

// Funções auxiliares
const calculateBalance = (transactions: Transaction[]) => {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const total = income - expenses
  const savings = total
  
  return { total, income, expenses, savings }
}

const calculateCharts = (transactions: Transaction[]) => {
  // Agrupar por mês com ano-mês para ordenação correta
  const monthlyMap = new Map<string, { income: number; expenses: number; sortKey: string }>()
  
  transactions.forEach((t) => {
    const date = new Date(t.date)
    const year = date.getFullYear()
    const month = date.getMonth()
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
    
    // Criar chave única com ano e mês para ordenação (formato: YYYY-MM)
    const sortKey = `${year}-${String(month + 1).padStart(2, '0')}`
    const displayKey = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    
    if (!monthlyMap.has(sortKey)) {
      monthlyMap.set(sortKey, { income: 0, expenses: 0, sortKey })
    }
    
    const monthData = monthlyMap.get(sortKey)!
    if (t.type === 'income') {
      monthData.income += Math.abs(t.amount)
    } else {
      monthData.expenses += Math.abs(t.amount)
    }
  })
  
  const monthly = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0])) // Ordenar por sortKey (YYYY-MM)
    .map(([sortKey, data]) => {
      const [year, month] = sortKey.split('-')
      const monthIndex = parseInt(month) - 1
      const date = new Date(parseInt(year), monthIndex, 1)
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
      return { 
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        income: data.income,
        expenses: data.expenses
      }
    })
  
  // Agrupar por categoria
  const categoryMap = new Map<string, number>()
  
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + Math.abs(t.amount))
    })
  
  const categories = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
  
  return { monthly, categories }
}

const getDashboardData = (): DashboardData => {
  const balance = calculateBalance(transactions)
  const charts = calculateCharts(transactions)
  
  return {
    balance,
    transactions: [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    charts,
  }
}

// Rotas
app.get('/api/dashboard', (req: Request, res: Response) => {
  res.json(getDashboardData())
})

app.get('/api/transactions', (req: Request, res: Response) => {
  res.json(transactions)
})

app.post('/api/transactions', (req: Request, res: Response) => {
  const { date, description, amount, type, category } = req.body
  
  if (!date || !description || amount === undefined || !type || !category) {
    return res.status(400).json({ error: 'Campos obrigatórios: date, description, amount, type, category' })
  }
  
  const transaction: Transaction = {
    id: nextId++,
    date: normalizeString(date),
    description: normalizeString(description),
    amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    type,
    category: normalizeString(category),
  }
  
  transactions.push(transaction)
  saveTransactions(transactions, nextId)
  res.status(201).json(transaction)
})

// IMPORTANTE: Rotas específicas devem vir ANTES das rotas com parâmetros
app.delete('/api/transactions/all', (req: Request, res: Response) => {
  console.log('Limpando todas as transações...')
  const count = transactions.length
  transactions = []
  nextId = 1
  saveTransactions(transactions, nextId)
  console.log(`${count} transações foram limpas`)
  res.json({ message: 'Todos os dados foram limpos', count })
})

app.put('/api/transactions/:id', (req: Request, res: Response) => {
  const idParam = req.params.id
  // Tentar converter para número, mas aceitar string também
  const id = isNaN(Number(idParam)) ? idParam : parseInt(idParam)
  const updateData = req.body
  
  const index = transactions.findIndex(t => String(t.id) === String(id))
  if (index === -1) {
    return res.status(404).json({ error: 'Transação não encontrada' })
  }
  
  // Atualizar todos os campos enviados, mantendo os existentes
  transactions[index] = {
    ...transactions[index],
    ...updateData,
    id: transactions[index].id, // Preservar o ID original
    // Normalizar campos de string se fornecidos
    date: updateData.date ? normalizeString(updateData.date) : transactions[index].date,
    Data: updateData.Data ? normalizeString(updateData.Data) : (updateData.date ? normalizeString(updateData.date) : transactions[index].Data),
    description: updateData.description ? normalizeString(updateData.description) : transactions[index].description,
    Item: updateData.Item ? normalizeString(updateData.Item) : transactions[index].Item,
    category: updateData.category ? normalizeString(updateData.category) : transactions[index].category,
    Categoria: updateData.Categoria ? normalizeString(updateData.Categoria) : transactions[index].Categoria,
  }
  
  saveTransactions(transactions, nextId)
  res.json(transactions[index])
})

app.delete('/api/transactions/:id', (req: Request, res: Response) => {
  const idParam = req.params.id
  // Tentar converter para número, mas aceitar string também
  const id = isNaN(Number(idParam)) ? idParam : parseInt(idParam)
  const index = transactions.findIndex(t => String(t.id) === String(id))
  
  if (index === -1) {
    return res.status(404).json({ error: 'Transação não encontrada' })
  }
  
  transactions.splice(index, 1)
  saveTransactions(transactions, nextId)
  res.json({ message: 'Transação excluída com sucesso' })
})

// Função para validar se Id_Item existe no plano de contas
const validateAccountId = (idItem: number | string | undefined): boolean => {
  if (idItem === undefined || idItem === null || idItem === '') {
    return false
  }
  return accountPlan.has(idItem)
}

// Função para normalizar strings e garantir UTF-8
const normalizeString = (str: any): string => {
  if (str === null || str === undefined) return ''
  
  // Converter para string
  let normalized = String(str)
  
  // Se contém caracteres de substituição UTF-8 (�), tentar reparar
  if (normalized.includes('�')) {
    // Tentar reparar usando diferentes encodings
    // Isso é uma tentativa de reparar dados já corrompidos
    try {
      // Se o dado veio como string já corrompida, não há muito o que fazer
      // Mas podemos tentar limpar caracteres inválidos
      normalized = normalized.replace(/�/g, '')
    } catch (e) {
      // Ignorar erro
    }
  }
  
  // Remover caracteres de controle inválidos mas manter UTF-8 válido
  normalized = normalized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
  
  // Normalizar caracteres Unicode (NFD -> NFC) para garantir consistência
  try {
    normalized = normalized.normalize('NFC')
  } catch (e) {
    // Se normalização falhar, continuar com string original
  }
  
  return normalized.trim()
}

// Endpoint para importar plano de contas
app.post('/api/account-plan/import', (req: Request, res: Response) => {
  const { accountPlan: importedPlan } = req.body
  
  if (!Array.isArray(importedPlan)) {
    return res.status(400).json({ error: 'Formato inválido. Esperado: { accountPlan: [] }' })
  }
  
  const newPlan: AccountPlan[] = []
  const planMap = new Map<number | string, AccountPlan>()
  
  importedPlan.forEach((item: any) => {
    // Aceitar contas mesmo sem todos os campos preenchidos
    if (!item.ID_Conta && item.ID_Conta !== 0 && item.ID_Conta !== '0') {
      return // Pula apenas se ID_Conta estiver completamente ausente
    }
    
    const account: AccountPlan = {
      ID_Conta: normalizeString(item.ID_Conta),
      Natureza: normalizeString(item.Natureza),
      Tipo: normalizeString(item.Tipo),
      Categoria: normalizeString(item.Categoria),
      SubCategoria: normalizeString(item.SubCategoria),
      Conta: normalizeString(item.Conta),
    }
    
    planMap.set(account.ID_Conta, account)
    newPlan.push(account)
  })
  
  accountPlan = planMap
  saveAccountPlan(accountPlan)
  
  res.status(201).json({ 
    message: `${newPlan.length} contas importadas no plano de contas`,
    count: newPlan.length 
  })
})

// Endpoint para obter plano de contas
app.get('/api/account-plan', (req: Request, res: Response) => {
  const planArray = Array.from(accountPlan.values())
  res.json(planArray)
})

app.delete('/api/account-plan/all', (req: Request, res: Response) => {
  accountPlan = new Map()
  saveAccountPlan(accountPlan)
  res.json({ message: 'Plano de contas limpo' })
})

app.post('/api/transactions/import', (req: Request, res: Response) => {
  const { transactions: importedTransactions, validateAccountPlan = true } = req.body
  
  console.log('=== IMPORTAÇÃO DE LANÇAMENTOS (BACKEND) ===')
  console.log('Total recebido:', importedTransactions?.length || 0)
  console.log('Validar plano de contas:', validateAccountPlan)
  console.log('Plano de contas atual:', accountPlan.size, 'contas')
  
  if (!Array.isArray(importedTransactions)) {
    return res.status(400).json({ error: 'Formato inválido. Esperado: { transactions: [] }' })
  }
  
  if (importedTransactions.length === 0) {
    return res.status(400).json({ 
      error: 'Nenhuma transação recebida',
      errors: ['Array de transações está vazio']
    })
  }
  
  const newTransactions: Transaction[] = []
  const errors: string[] = []
  const skipped: string[] = []
  
  importedTransactions.forEach((t: any, index: number) => {
    // Se tem Id_Item e validação está ativa, verificar se existe no plano de contas
    if (validateAccountPlan && t.Id_Item !== undefined && t.Id_Item !== null && t.Id_Item !== '') {
      const idItemStr = String(t.Id_Item).trim()
      if (idItemStr !== '' && !validateAccountId(idItemStr)) {
        const errorMsg = `Linha ${index + 2}: Id_Item "${idItemStr}" não encontrado no plano de contas`
        errors.push(errorMsg)
        skipped.push(`Linha ${index + 2}: ${JSON.stringify(t)}`)
        console.warn(errorMsg)
        return // Pula esta transação
      }
    }
    
    // Determinar tipo baseado na Natureza ou Operação
    let type: 'income' | 'expense' = 'expense'
    if (t.Natureza) {
      const natureza = String(t.Natureza).toLowerCase()
      if (natureza.includes('receita') || natureza.includes('entrada') || natureza.includes('income')) {
        type = 'income'
      }
    } else if (t.Operação) {
      const operacao = String(t.Operação).toLowerCase()
      if (operacao.includes('receita') || operacao.includes('entrada') || operacao.includes('income')) {
        type = 'income'
      }
    } else if (t.type) {
      type = t.type === 'income' ? 'income' : 'expense'
    }
    
    // Usar Valor ou amount
    const valor = t.Valor !== undefined ? parseFloat(String(t.Valor)) : (t.amount !== undefined ? parseFloat(String(t.amount)) : 0)
    
    // Pular transações com valor zerado
    if (valor === 0 || isNaN(valor)) {
      console.log(`Linha ${index + 2}: Pulando transação com valor zerado ou inválido: ${JSON.stringify(t)}`)
      return // Pula esta transação
    }
    
    // Usar Item ou description - normalizar UTF-8
    const description = normalizeString(t.Item || t.description)
    
    // Usar Data ou date - manter como string de data
    let date = String(t.Data || t.date || '').trim()
    if (!date) {
      date = new Date().toISOString().split('T')[0]
    }
    // Converter formato de data se necessário (DD/MM/YYYY para YYYY-MM-DD)
    else if (date.includes('/')) {
      const parts = date.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts
        date = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
    // Garantir que a data está no formato correto YYYY-MM-DD
    // Se já estiver no formato correto, não fazer nada
    
    // Usar Categoria do lançamento ou do plano de contas - normalizar UTF-8
    let category = normalizeString(t.Categoria || t.category || 'Outros')
    if (t.Id_Item && accountPlan.has(t.Id_Item)) {
      const account = accountPlan.get(t.Id_Item)!
      category = normalizeString(account.Categoria || category)
    }
    
    // SEMPRE gerar um ID único numérico para evitar duplicatas
    // Id_Item é mantido separadamente apenas para referência ao plano de contas
    const transactionId = nextId++
    
    const transaction: Transaction = {
      id: transactionId,
      date,
      description,
      amount: type === 'expense' ? -Math.abs(valor) : Math.abs(valor),
      type,
      category,
      // Campos adicionais preservados - 10 colunas da planilha
      Id_Item: normalizeString(t.Id_Item),
      Natureza: normalizeString(t.Natureza),
      Tipo: normalizeString(t.Tipo),
      Categoria: normalizeString(t.Categoria),
      SubCategoria: normalizeString(t.SubCategoria),
      Operação: normalizeString(t.Operação),
      OrigemDestino: normalizeString(t['Origem|Destino'] || t.OrigemDestino),
      Item: normalizeString(t.Item),
      Data: normalizeString(t.Data),  // Data original
      Valor: valor  // Valor original
    }
    
    newTransactions.push(transaction)
  })
  
  console.log('Transações processadas:', newTransactions.length)
  console.log('Erros encontrados:', errors.length)
  console.log('Transações puladas:', skipped.length)
  
  if (errors.length > 0 && newTransactions.length === 0) {
    console.error('Nenhuma transação válida após validação')
    console.error('Erros:', errors)
    console.error('Transações puladas:', skipped.slice(0, 5))
    return res.status(400).json({ 
      error: 'Nenhuma transação válida',
      errors,
      debug: {
        totalRecebidas: importedTransactions.length,
        validas: newTransactions.length,
        invalidas: errors.length,
        exemplosPuladas: skipped.slice(0, 3)
      }
    })
  }
  
  transactions.push(...newTransactions)
  saveTransactions(transactions, nextId)
  
  console.log('Importação concluída com sucesso!')
  res.status(201).json({ 
    message: `${newTransactions.length} transações importadas${errors.length > 0 ? `, ${errors.length} erro(s) encontrado(s)` : ''}`,
    transactions: newTransactions,
    errors: errors.length > 0 ? errors : undefined
  })
})

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Fundify API is running' })
})

// Rota raiz
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Fundify Dashboard API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      dashboard: '/api/dashboard',
      transactions: '/api/transactions',
      accountPlan: '/api/account-plan'
    }
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Fundify Backend running on http://localhost:${PORT}`)
  console.log(`📁 Dados persistidos em: ${DATA_DIR}`)
  console.log(`📊 Transações carregadas: ${transactions.length}`)
  console.log(`📋 Plano de contas carregado: ${accountPlan.size} contas`)
})

