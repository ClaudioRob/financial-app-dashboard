import { TrendingUp, TrendingDown, Wallet, PiggyBank } from './icons'
import './StatsCards.css'

interface StatsCardsProps {
  balance: {
    total: number
    income: number
    expenses: number
    savings: number
  }
}

const StatsCards = ({ balance }: StatsCardsProps) => {
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
    return `R$ ${formatted}`
  }

  const cards = [
    {
      title: 'Saldo Total',
      value: balance.total,
      icon: Wallet,
      color: 'var(--primary)',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Receitas',
      value: balance.income,
      icon: TrendingUp,
      color: 'var(--success)',
      trend: '+8.2%',
      trendUp: true,
    },
    {
      title: 'Despesas',
      value: balance.expenses,
      icon: TrendingDown,
      color: 'var(--error)',
      trend: '-3.1%',
      trendUp: false,
    },
    {
      title: 'Economias',
      value: balance.savings,
      icon: PiggyBank,
      color: 'var(--secondary)',
      trend: '+15.3%',
      trendUp: true,
    },
  ]

  return (
    <div className="stats-cards">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="stat-card">
            <div className="stat-card-header">
              <div className="stat-icon" style={{ background: `${card.color}20`, color: card.color }}>
                <Icon size={24} />
              </div>
              <span className={`stat-trend ${card.trendUp ? 'trend-up' : 'trend-down'}`}>
                {card.trend}
              </span>
            </div>
            <div className="stat-card-body">
              <h3 className="stat-title">{card.title}</h3>
              <p className="stat-value">{formatCurrency(card.value)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards

