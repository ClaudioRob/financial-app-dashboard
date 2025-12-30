import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import StatsCards from './components/StatsCards'
import ChartsSection from './components/ChartsSection'
import RecentTransactions from './components/RecentTransactions'
import TransactionModal from './components/TransactionModal'
import AdminDashboard from './components/AdminDashboard'
import { fetchDashboardData } from './services/api'

export interface DashboardData {
  balance: {
    total: number
    income: number
    expenses: number
    savings: number
  }
  transactions: Array<{
    id: number
    date: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
  }>
  charts: {
    monthly: Array<{ month: string; income: number; expenses: number }>
    categories: Array<{ category: string; amount: number }>
  }
}

function App() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  
  // Definir mês e ano serão configurados após carregar os dados
  const [selectedMonth, setSelectedMonth] = useState<number | 'all' | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | 'all' | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await fetchDashboardData()
      setData(dashboardData)
      
      // Configurar ano e mês padrão com base nos dados carregados
      if (dashboardData.transactions.length > 0 && selectedYear === null) {
        const years = Array.from(
          new Set(dashboardData.transactions.map(t => new Date(t.date).getFullYear()))
        ).sort((a, b) => b - a)
        
        const defaultYear = years[0] // Ano mais recente
        setSelectedYear(defaultYear)
        
        // Pegar o primeiro mês disponível nesse ano
        const monthsInYear = dashboardData.transactions
          .filter(t => new Date(t.date).getFullYear() === defaultYear)
          .map(t => new Date(t.date).getMonth() + 1)
        
        const defaultMonth = Math.min(...monthsInYear)
        setSelectedMonth(defaultMonth)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      console.error('Erro ao carregar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDataUpdated = () => {
    loadData()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erro ao carregar dados</h2>
        <p>{error}</p>
        <button onClick={loadData} className="retry-button">
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Aguardar configuração do mês e ano padrão
  if (selectedYear === null || selectedMonth === null) {
    return null
  }

  if (isAdminMode) {
    return (
      <div className="app">
        <AdminDashboard onClose={() => setIsAdminMode(false)} />
      </div>
    )
  }

  // Filtrar transações por mês e ano selecionados
  const filteredData = {
    ...data,
    transactions: data.transactions.filter(t => {
      const transactionDate = new Date(t.date)
      const transactionMonth = transactionDate.getMonth() + 1
      const transactionYear = transactionDate.getFullYear()
      
      const yearMatches = selectedYear === 'all' || transactionYear === selectedYear
      const monthMatches = selectedMonth === 'all' || transactionMonth === selectedMonth
      
      return yearMatches && monthMatches
    })
  }

  // Recalcular balanço com base nas transações filtradas
  const filteredBalance = {
    income: filteredData.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    expenses: filteredData.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    total: 0,
    savings: 0
  }
  filteredBalance.total = filteredBalance.income - filteredBalance.expenses
  filteredBalance.savings = filteredBalance.income * 0.1

  filteredData.balance = filteredBalance

  // Gerar lista de anos disponíveis
  const availableYears = Array.from(
    new Set(data.transactions.map(t => new Date(t.date).getFullYear()))
  ).sort((a, b) => b - a) // Ordenar do mais recente para o mais antigo

  return (
    <div className="app">
      <Header
        onAdminMode={() => setIsAdminMode(true)}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        availableYears={availableYears}
      />
      <main className="main-content">
        <StatsCards balance={filteredData.balance} />
        <div className="dashboard-grid">
          <ChartsSection 
            charts={data.charts} 
            transactions={data.transactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
          <RecentTransactions transactions={filteredData.transactions} />
        </div>
      </main>
      
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={handleDataUpdated}
      />
    </div>
  )
}

export default App

