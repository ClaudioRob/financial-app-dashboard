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
}

const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
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

  return (
    <div className="recent-transactions">
      <div className="transactions-header">
        <h2>Transações Recentes</h2>
        <button className="view-all-button">Ver todas</button>
      </div>
      <div className="transactions-list">
        {transactions.slice(0, 5).map((transaction) => (
          <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
            <div className="transaction-icon">
              {transaction.type === 'income' ? (
                <ArrowUpRight size={20} />
              ) : (
                <ArrowDownRight size={20} />
              )}
            </div>
            <div className="transaction-details">
              <h3 className="transaction-description">{transaction.description}</h3>
              <p className="transaction-meta">
                {formatDate(transaction.date)} • {transaction.category}
              </p>
            </div>
            <div className={`transaction-amount ${transaction.type}`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(Math.abs(transaction.amount))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentTransactions

