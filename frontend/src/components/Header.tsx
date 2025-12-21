import { Bell, Search, Settings, Plus, Upload, Trash2 } from './icons'
import './Header.css'

interface HeaderProps {
  onNewTransaction: () => void
  onImport: () => void
  onClearData: () => void
  onAdminMode: () => void
}

const Header = ({ onNewTransaction, onImport, onClearData, onAdminMode }: HeaderProps) => {
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
            <button className="action-button" onClick={onImport} title="Importar Planilha">
              <Upload size={18} />
              <span>Importar</span>
            </button>
            <button className="action-button danger" onClick={onClearData} title="Limpar Todos os Dados">
              <Trash2 size={18} />
              <span>Limpar</span>
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

