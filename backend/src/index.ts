import express, { Request, Response } from 'express'
import cors from 'cors'

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
  Id_Item?: number | string
  Natureza?: string
  Tipo?: string
  Categoria?: string
  SubCategoria?: string
  Operação?: string
  OrigemDestino?: string
  Item?: string
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

// Armazenamento de dados em memória
let accountPlan: Map<number | string, AccountPlan> = new Map()
let transactions: Transaction[] = [
  {
    id: 1,
    date: '2024-01-15',
    description: 'Salário',
    amount: 5000.00,
    type: 'income',
    category: 'Trabalho',
  },
  {
    id: 2,
    date: '2024-01-14',
    description: 'Supermercado',
    amount: -450.50,
    type: 'expense',
    category: 'Alimentação',
  },
  {
    id: 3,
    date: '2024-01-13',
    description: 'Freelance',
    amount: 1200.00,
    type: 'income',
    category: 'Trabalho',
  },
  {
    id: 4,
    date: '2024-01-12',
    description: 'Conta de Luz',
    amount: -280.00,
    type: 'expense',
    category: 'Utilidades',
  },
  {
    id: 5,
    date: '2024-01-11',
    description: 'Restaurante',
    amount: -120.00,
    type: 'expense',
    category: 'Alimentação',
  },
  {
    id: 6,
    date: '2024-01-10',
    description: 'Investimento',
    amount: 2000.00,
    type: 'income',
    category: 'Investimentos',
  },
  {
    id: 7,
    date: '2024-01-09',
    description: 'Uber',
    amount: -35.00,
    type: 'expense',
    category: 'Transporte',
  },
]

let nextId = 8

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
  // Agrupar por mês
  const monthlyMap = new Map<string, { income: number; expenses: number }>()
  
  transactions.forEach((t) => {
    const date = new Date(t.date)
    const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' })
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { income: 0, expenses: 0 })
    }
    
    const monthData = monthlyMap.get(monthKey)!
    if (t.type === 'income') {
      monthData.income += Math.abs(t.amount)
    } else {
      monthData.expenses += Math.abs(t.amount)
    }
  })
  
  const monthly = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      return months.indexOf(a.month) - months.indexOf(b.month)
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
  res.status(201).json(transaction)
})

// IMPORTANTE: Rotas específicas devem vir ANTES das rotas com parâmetros
app.delete('/api/transactions/all', (req: Request, res: Response) => {
  console.log('Limpando todas as transações...')
  const count = transactions.length
  transactions = []
  nextId = 1
  console.log(`${count} transações foram limpas`)
  res.json({ message: 'Todos os dados foram limpos', count })
})

app.put('/api/transactions/:id', (req: Request, res: Response) => {
  const idParam = req.params.id
  // Tentar converter para número, mas aceitar string também
  const id = isNaN(Number(idParam)) ? idParam : parseInt(idParam)
  const { date, description, amount, type, category } = req.body
  
  const index = transactions.findIndex(t => String(t.id) === String(id))
  if (index === -1) {
    return res.status(404).json({ error: 'Transação não encontrada' })
  }
  
  transactions[index] = {
    ...transactions[index],
    date: date ? normalizeString(date) : transactions[index].date,
    description: description ? normalizeString(description) : transactions[index].description,
    amount: amount !== undefined ? (type === 'expense' ? -Math.abs(amount) : Math.abs(amount)) : transactions[index].amount,
    type: type || transactions[index].type,
    category: category ? normalizeString(category) : transactions[index].category,
  }
  
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
    
    // Usar Item ou description - normalizar UTF-8
    const description = normalizeString(t.Item || t.description)
    
    // Usar Data ou date
    let date = normalizeString(t.Data || t.date)
    if (!date) {
      date = new Date().toISOString().split('T')[0]
    }
    // Converter formato de data se necessário (DD/MM/YYYY para YYYY-MM-DD)
    if (date.includes('/')) {
      const [day, month, year] = date.split('/')
      date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    // Usar Categoria do lançamento ou do plano de contas - normalizar UTF-8
    let category = normalizeString(t.Categoria || t.category || 'Outros')
    if (t.Id_Item && accountPlan.has(t.Id_Item)) {
      const account = accountPlan.get(t.Id_Item)!
      category = normalizeString(account.Categoria || category)
    }
    
    // Usar Id_Item como ID se disponível, senão gerar novo ID numérico
    // Mas manter Id_Item como campo separado para referência ao plano de contas
    const hasIdItem = t.Id_Item !== undefined && t.Id_Item !== null && String(t.Id_Item).trim() !== ''
    const transactionId = hasIdItem ? normalizeString(t.Id_Item) : nextId++
    
    const transaction: Transaction = {
      id: transactionId,
      date,
      description,
      amount: type === 'expense' ? -Math.abs(valor) : Math.abs(valor),
      type,
      category,
      // Campos adicionais preservados - normalizar UTF-8
      Id_Item: normalizeString(t.Id_Item),
      Natureza: normalizeString(t.Natureza),
      Tipo: normalizeString(t.Tipo),
      Categoria: normalizeString(t.Categoria),
      SubCategoria: normalizeString(t.SubCategoria),
      Operação: normalizeString(t.Operação),
      OrigemDestino: normalizeString(t['Origem|Destino'] || t.OrigemDestino),
      Item: normalizeString(t.Item),
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
})

