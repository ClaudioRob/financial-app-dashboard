import { Bell, Settings } from './icons'
import './Header.css'

interface HeaderProps {
  onAdminMode: () => void
  selectedMonth: number | 'all'
  selectedYear: number | 'all'
  onMonthChange: (month: number | 'all') => void
  onYearChange: (year: number | 'all') => void
  availableYears: number[]
}

const Header = ({ onAdminMode, selectedMonth, selectedYear, onMonthChange, onYearChange, availableYears }: HeaderProps) => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="logo">Dashboard Financeiro</h1>
          {/* <span className="logo-subtitle">Dashboard Financeiro</span> */}
        </div>
        <div className="header-right">
          <div className="month-year-selector">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="month-select-header"
            >
              <option value="all">Todos</option>
              {monthNames.map((name, index) => (
                <option key={index} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="year-select-header"
            >
              <option value="all">Todos</option>
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
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

