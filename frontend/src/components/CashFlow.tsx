import { useState, useMemo } from 'react'
import './CashFlow.css'

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  Categoria?: string
  SubCategoria?: string
  Natureza?: string
  Conta?: string
  Item?: string
  Id_Item?: string | number
}

interface CashFlowProps {
  transactions: Transaction[]
  selectedMonth?: number
  selectedYear?: number
}

type PeriodFilter = 'year' | 'month' | 'week'

const CashFlow = ({ transactions, selectedMonth, selectedYear }: CashFlowProps) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    // Adicionar 'T00:00:00' para forçar interpretação como hora local
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  // Função para obter o número da semana do ano
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // Filtrar transações baseado no período selecionado
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    const currentYear = selectedYear || now.getFullYear()
    const currentMonth = selectedMonth || (now.getMonth() + 1)

    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      const transactionYear = transactionDate.getFullYear()
      const transactionMonth = transactionDate.getMonth() + 1

      if (periodFilter === 'year') {
        return transactionYear === currentYear
      } else if (periodFilter === 'month') {
        return transactionYear === currentYear && transactionMonth === currentMonth
      } else if (periodFilter === 'week') {
        const transactionWeek = getWeekNumber(transactionDate)
        const currentWeek = getWeekNumber(new Date(currentYear, currentMonth - 1, now.getDate()))
        return transactionYear === currentYear && 
               transactionMonth === currentMonth && 
               transactionWeek === currentWeek
      }
      return true
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    return filtered
  }, [transactions, periodFilter, selectedMonth, selectedYear])

  // Calcular totais
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income' || t.Natureza === 'Receita')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense' || t.Natureza === 'Despesa')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    return {
      income,
      expenses,
      balance: income - expenses
    }
  }, [filteredTransactions])

  return (
    <div className="cash-flow">
      <div className="cash-flow-header">
        <h3>Fluxo de Caixa</h3>
        <div className="period-filters">
          <button
            className={`period-btn ${periodFilter === 'year' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('year')}
          >
            Ano
          </button>
          <button
            className={`period-btn ${periodFilter === 'month' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('month')}
          >
            Mês
          </button>
          <button
            className={`period-btn ${periodFilter === 'week' ? 'active' : ''}`}
            onClick={() => setPeriodFilter('week')}
          >
            Semana
          </button>
        </div>
      </div>

      <div className="cash-flow-summary">
        <div className="summary-item income">
          <span className="summary-label">Receitas</span>
          <span className="summary-value">{formatCurrency(totals.income)}</span>
        </div>
        <div className="summary-item expenses">
          <span className="summary-label">Despesas</span>
          <span className="summary-value">{formatCurrency(totals.expenses)}</span>
        </div>
        <div className={`summary-item balance ${totals.balance >= 0 ? 'positive' : 'negative'}`}>
          <span className="summary-label">Saldo</span>
          <span className="summary-value">{formatCurrency(totals.balance)}</span>
        </div>
      </div>

      <div className="cash-flow-table-container">
        <table className="cash-flow-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Natureza</th>
              <th>Categoria</th>
              <th>SubCategoria</th>
              <th>Item</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.Id_Item || transaction.id}</td>
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <span className={`nature-badge ${transaction.Natureza?.toLowerCase() || transaction.type}`}>
                      {transaction.Natureza || (transaction.type === 'income' ? 'Receita' : 'Despesa')}
                    </span>
                  </td>
                  <td>{transaction.Categoria || transaction.category || '-'}</td>
                  <td>{transaction.SubCategoria || '-'}</td>
                  <td>{transaction.Item || transaction.description || '-'}</td>
                  <td className={transaction.type === 'income' || transaction.Natureza === 'Receita' ? 'positive' : 'negative'}>
                    {formatCurrency(Math.abs(transaction.amount))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="empty-message">
                  Nenhum lançamento encontrado para o período selecionado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CashFlow
