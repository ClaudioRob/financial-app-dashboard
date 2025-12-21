import type { DashboardData } from '../App'

const API_BASE_URL = 'http://localhost:3001/api'

export interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Erro ao buscar dados:', error)
    // Retornar dados mockados em caso de erro
    return getMockData()
  }
}

export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export const clearAllData = async (): Promise<void> => {
  console.log('Chamando clearAllData...')
  const response = await fetch(`${API_BASE_URL}/transactions/all`, {
    method: 'DELETE',
  })
  
  console.log('Resposta recebida:', response.status, response.statusText)
  
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
      console.error('Erro do servidor:', errorData)
    } catch (e) {
      const text = await response.text()
      console.error('Resposta de erro (texto):', text)
      errorMessage = text || errorMessage
    }
    throw new Error(errorMessage)
  }
  
  // Tentar parsear resposta de sucesso
  try {
    const result = await response.json()
    console.log('Dados limpos com sucesso:', result)
  } catch (e) {
    // Se não houver JSON, tudo bem
    console.log('Resposta sem JSON, mas status OK')
  }
}

export const clearAccountPlan = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/account-plan/all`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
}

export const updateTransaction = async (id: number | string, transaction: Partial<Transaction>): Promise<Transaction> => {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export const deleteTransaction = async (id: number | string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
}

export interface AccountPlan {
  ID_Conta: number | string
  Natureza: string
  Tipo: string
  Categoria: string
  SubCategoria: string
  Conta: string
}

export const importAccountPlan = async (accountPlan: AccountPlan[]): Promise<{ message: string; count: number }> => {
  const response = await fetch(`${API_BASE_URL}/account-plan/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accountPlan }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export const fetchAccountPlan = async (): Promise<AccountPlan[]> => {
  const response = await fetch(`${API_BASE_URL}/account-plan`)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export const importTransactions = async (
  transactions: any[], 
  validateAccountPlan: boolean = true
): Promise<{ message: string; transactions: Transaction[]; errors?: string[] }> => {
  console.log('Enviando para API:', { 
    transactionsCount: transactions.length, 
    validateAccountPlan 
  })
  
  const response = await fetch(`${API_BASE_URL}/transactions/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactions, validateAccountPlan }),
  })
  
  const responseData = await response.json()
  
  if (!response.ok) {
    console.error('Erro na resposta da API:', responseData)
    // Se tem erros detalhados, incluir na mensagem
    if (responseData.errors) {
      const errorMsg = JSON.stringify({ 
        error: responseData.error || `HTTP error! status: ${response.status}`,
        errors: responseData.errors 
      })
      throw new Error(errorMsg)
    }
    throw new Error(responseData.error || `HTTP error! status: ${response.status}`)
  }
  
  console.log('Resposta da API:', responseData)
  return responseData
}

const getMockData = (): DashboardData => {
  return {
    balance: {
      total: 125430.50,
      income: 150000.00,
      expenses: 24569.50,
      savings: 100861.00,
    },
    transactions: [
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
    ],
    charts: {
      monthly: [
        { month: 'Jul', income: 45000, expenses: 32000 },
        { month: 'Ago', income: 52000, expenses: 35000 },
        { month: 'Set', income: 48000, expenses: 33000 },
        { month: 'Out', income: 55000, expenses: 38000 },
        { month: 'Nov', income: 60000, expenses: 40000 },
        { month: 'Dez', income: 65000, expenses: 42000 },
      ],
      categories: [
        { category: 'Alimentação', amount: 8500 },
        { category: 'Transporte', amount: 3200 },
        { category: 'Utilidades', amount: 2800 },
        { category: 'Lazer', amount: 1500 },
        { category: 'Saúde', amount: 2200 },
        { category: 'Outros', amount: 6369.50 },
      ],
    },
  }
}

