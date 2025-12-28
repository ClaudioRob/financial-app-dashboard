import { Bell, Settings, Plus } from './icons'
import './Header.css'

interface HeaderProps {
  onNewTransaction: () => void
  onAdminMode: () => void
  selectedMonth: string
  onMonthChange: (month: string) => void
  availableMonths: string[]
}

const Header = ({ onNewTransaction, onAdminMode, selectedMonth, onMonthChange, availableMonths }: HeaderProps) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="logo">Dashboard Financeiro</h1>
          {/* <span className="logo-subtitle">Dashboard Financeiro</span> */}
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button className="action-button primary" onClick={onNewTransaction} title="Nova Transação">
              <Plus size={18} />
              <span>Nova Transação</span>
            </button>
          </div>
          <div className="month-selector-header">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="month-select-header"
            >
              <option value="">Todos os meses</option>
              {availableMonths.map(month => {
                const [year, monthNum] = month.split('-')
                const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                return (
                  <option key={month} value={month}>
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </option>
                )
              })}
            </select>
          </div>
          <button className="icon-button">
            <Bell size={20} />
            <span className="badge">3</span>
          </button>
          <button className="icon-button" onClick={onAdminMode} title="Modo Administração">
            <Settings size={20} />
          </button>
          <div className="user-avatar">
            <img src="https://ui-avatars.com/api/?name=Usuario&background=6366f1&color=fff" alt="User" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

