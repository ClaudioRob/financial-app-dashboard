import { useState } from 'react'
import { ArrowUpRight, ArrowDownRight } from './icons'
import './RecentTransactions.css'

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  onViewAll?: () => void
  selectedMonth?: number | 'all' | null
  selectedYear?: number | 'all' | null
}

const RecentTransactions = ({ transactions, onViewAll, selectedMonth, selectedYear }: RecentTransactionsProps) => {
  const [expandedReceipts, setExpandedReceipts] = useState(false)
  const [expandedPayments, setExpandedPayments] = useState(false)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    // Evitar problema de timezone fazendo parse manual
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  // Verificar se o período selecionado é anterior ao mês atual
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // getMonth() retorna 0-11
  const currentYear = now.getFullYear()
  
  let isPastPeriod = false
  
  if (selectedYear && selectedYear !== 'all' && selectedMonth && selectedMonth !== 'all') {
    // Se tem ano e mês específicos selecionados
    if (selectedYear < currentYear) {
      isPastPeriod = true
    } else if (selectedYear === currentYear && selectedMonth < currentMonth) {
      isPastPeriod = true
    }
  }

  // Obter próximos pagamentos e recebimentos do mês atual ou futuros
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Zerar horas para comparação apenas de data
  
  const upcomingTransactions = transactions.filter(t => {
    const [year, month, day] = t.date.split('-')
    const transDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    transDate.setHours(0, 0, 0, 0) // Zerar horas para comparação apenas de data
    
    // Incluir transações do dia atual e futuras
    return transDate >= today
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  })

  const upcomingReceipts = upcomingTransactions.filter(t => t.type === 'income')
  const upcomingPayments = upcomingTransactions.filter(t => t.type === 'expense')

  return (
    <div className="recent-transactions">
      <div className="transactions-header">
        <h2>Próximas Transações</h2>
        <button className="view-all-button" onClick={onViewAll}>Ver todas</button>
      </div>
      
      {/* Mensagem para períodos passados */}
      {isPastPeriod ? (
        <div className="past-period-message">
          <p>📅 Período selecionado é anterior ao mês atual</p>
          <p className="past-period-subtitle">Selecione o mês atual ou um período futuro para ver as próximas transações</p>
        </div>
      ) : (
        <>
          {/* Próximos Recebimentos */}
          {upcomingReceipts.length > 0 && (
        <>
          <div className="section-title">
            <ArrowUpRight size={16} />
            <span>Próximos Recebimentos</span>
          </div>
          <div className="transactions-list">
            {(expandedReceipts ? upcomingReceipts : upcomingReceipts.slice(0, 5)).map((transaction) => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-icon">
                  <ArrowUpRight size={20} />
                </div>
                <div className="transaction-details">
                  <h3 className="transaction-description">{transaction.description}</h3>
                  <p className="transaction-meta">
                    {formatDate(transaction.date)} • {transaction.category}
                  </p>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  +{formatCurrency(Math.abs(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
          {upcomingReceipts.length > 5 && (
            <button 
              className="expand-button"
              onClick={() => setExpandedReceipts(!expandedReceipts)}
            >
              {expandedReceipts ? 'Ver menos' : `Ver mais (${upcomingReceipts.length - 5})`}
            </button>
          )}
        </>
      )}
      
      {/* Próximos Pagamentos */}
      {upcomingPayments.length > 0 && (
        <>
          <div className="section-title">
            <ArrowDownRight size={16} />
            <span>Próximos Pagamentos</span>
          </div>
          <div className="transactions-list">
            {(expandedPayments ? upcomingPayments : upcomingPayments.slice(0, 5)).map((transaction) => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-icon">
                  <ArrowDownRight size={20} />
                </div>
                <div className="transaction-details">
                  <h3 className="transaction-description">{transaction.description}</h3>
                  <p className="transaction-meta">
                    {formatDate(transaction.date)} • {transaction.category}
                  </p>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  -{formatCurrency(Math.abs(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
          {upcomingPayments.length > 5 && (
            <button 
              className="expand-button"
              onClick={() => setExpandedPayments(!expandedPayments)}
            >
              {expandedPayments ? 'Ver menos' : `Ver mais (${upcomingPayments.length - 5})`}
            </button>
          )}
        </>
      )}
      
          {/* Mensagem quando não há transações futuras */}
          {upcomingReceipts.length === 0 && upcomingPayments.length === 0 && (
            <div className="no-upcoming-transactions">
              Nenhuma transação prevista para este período
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default RecentTransactions

