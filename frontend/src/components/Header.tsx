import { Bell, Search, Settings, Plus, Upload, Trash2 } from './icons'
import './Header.css'

interface HeaderProps {
  onNewTransaction: () => void
  onAdminMode: () => void
}

const Header = ({ onNewTransaction, onAdminMode }: HeaderProps) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="logo">Fundify</h1>
          <span className="logo-subtitle">Dashboard Financeiro</span>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button className="action-button primary" onClick={onNewTransaction} title="Nova Transação">
              <Plus size={18} />
              <span>Nova Transação</span>
            </button>
          </div>
          <div className="search-box">
            <Search size={20} />
            <input type="text" placeholder="Buscar..." />
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

