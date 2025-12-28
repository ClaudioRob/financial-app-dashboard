import { useState, useEffect, useMemo } from 'react'
import { X, Edit2, Trash2, Save, Plus, Upload, ChevronUp, ChevronDown } from './icons'
import { fetchAccountPlan, importAccountPlan, type AccountPlan, clearAccountPlan } from '../services/api'
import { fetchDashboardData, updateTransaction, deleteTransaction, clearAllData } from '../services/api'
import ImportModal from './ImportModal'
import './AdminDashboard.css'

interface AdminDashboardProps {
  onClose: () => void
}

type SortField = string
type SortDirection = 'asc' | 'desc' | null

const AdminDashboard = ({ onClose }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'account-plan' | 'transactions'>('account-plan')
  const [accountPlan, setAccountPlan] = useState<AccountPlan[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [editedAccount, setEditedAccount] = useState<AccountPlan | null>(null)
  const [editedTransaction, setEditedTransaction] = useState<any>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  
  // Estados para ordenação e filtros do Plano de Contas
  const [accountSortField, setAccountSortField] = useState<SortField | null>(null)
  const [accountSortDirection, setAccountSortDirection] = useState<SortDirection>(null)
  
  // Estados para ordenação de Lançamentos
  const [transactionSortField, setTransactionSortField] = useState<SortField | null>(null)
  const [transactionSortDirection, setTransactionSortDirection] = useState<SortDirection>(null)
  
  // Estados para filtros globais (combo box com coluna específica)
  const [accountFilterColumn, setAccountFilterColumn] = useState<string>('')
  const [accountFilterValue, setAccountFilterValue] = useState<string>('')
  const [transactionFilterColumn, setTransactionFilterColumn] = useState<string>('')
  const [transactionFilterValue, setTransactionFilterValue] = useState<string>('')
  
  // Estados para filtro de período de data
  const [transactionDateFrom, setTransactionDateFrom] = useState<string>('')
  const [transactionDateTo, setTransactionDateTo] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [planData, dashboardData] = await Promise.all([
        fetchAccountPlan(),
        fetchDashboardData()
      ])
      setAccountPlan(planData)
      setTransactions(dashboardData.transactions)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditAccount = (account: AccountPlan) => {
    setEditingId(account.ID_Conta)
    setEditedAccount({ ...account })
  }

  const handleSaveAccount = async () => {
    if (!editedAccount) return

    try {
      const updated = accountPlan.map(acc => 
        acc.ID_Conta === editedAccount.ID_Conta ? editedAccount : acc
      )
      setAccountPlan(updated)
      
      // Atualizar no backend
      await importAccountPlan(updated)
      
      setEditingId(null)
      setEditedAccount(null)
      alert('Conta atualizada com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar conta:', err)
      alert('Erro ao salvar conta')
    }
  }

  const handleDeleteAccount = async (idConta: string | number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return

    try {
      const updated = accountPlan.filter(acc => acc.ID_Conta !== idConta)
      setAccountPlan(updated)
      await importAccountPlan(updated)
      alert('Conta excluída com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir conta:', err)
      alert('Erro ao excluir conta')
    }
  }

  const handleAddAccount = () => {
    const newAccount: AccountPlan = {
      ID_Conta: `NEW_${Date.now()}`,
      Natureza: '',
      Tipo: '',
      Categoria: '',
      SubCategoria: '',
      Conta: ''
    }
    setAccountPlan([...accountPlan, newAccount])
    setEditingId(newAccount.ID_Conta)
    setEditedAccount({ ...newAccount })
  }

  const handleAddTransaction = () => {
    const newTransaction = {
      id: `NEW_${Date.now()}`,
      Id_Item: '',
      Natureza: '',
      Tipo: '',
      Categoria: '',
      SubCategoria: '',
      Operação: '',
      OrigemDestino: '',
      Item: '',
      Data: new Date().toISOString().split('T')[0],
      Valor: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'expense' as 'income' | 'expense',
      category: ''
    }
    setTransactions([newTransaction, ...transactions])
    setEditingId(newTransaction.id)
    setEditedTransaction({ ...newTransaction })
  }

  const handleEditTransaction = (transaction: any) => {
    setEditingId(transaction.id)
    setEditedTransaction({ ...transaction })
  }

  const handleSaveTransaction = async () => {
    if (!editedTransaction) return

    try {
      const isNewTransaction = String(editedTransaction.id).startsWith('NEW_')
      
      if (isNewTransaction) {
        // Criar nova transação via API
        const response = await fetch('http://localhost:3001/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: editedTransaction.Data || editedTransaction.date,
            description: editedTransaction.Item || editedTransaction.description,
            amount: editedTransaction.Valor || editedTransaction.amount,
            type: editedTransaction.Natureza?.toLowerCase().includes('receita') ? 'income' : 'expense',
            category: editedTransaction.Categoria || editedTransaction.category,
            Id_Item: editedTransaction.Id_Item,
            Natureza: editedTransaction.Natureza,
            Tipo: editedTransaction.Tipo,
            SubCategoria: editedTransaction.SubCategoria,
            Operação: editedTransaction.Operação,
            OrigemDestino: editedTransaction.OrigemDestino,
            Item: editedTransaction.Item,
            Data: editedTransaction.Data,
            Valor: editedTransaction.Valor
          })
        })
        
        if (!response.ok) throw new Error('Erro ao criar transação')
        
        const result = await response.json()
        
        // Atualizar lista removendo a temporária e adicionando a nova
        const updated = transactions.filter(t => t.id !== editedTransaction.id)
        setTransactions([result.transaction, ...updated])
        
        alert('Transação criada com sucesso!')
      } else {
        // Atualizar transação existente
        const transactionId = typeof editedTransaction.id === 'string' 
          ? editedTransaction.id 
          : String(editedTransaction.id)
        await updateTransaction(transactionId as any, editedTransaction)
        const updated = transactions.map(t => 
          t.id === editedTransaction.id ? editedTransaction : t
        )
        setTransactions(updated)
        
        alert('Transação atualizada com sucesso!')
      }
      
      setEditingId(null)
      setEditedTransaction(null)
    } catch (err) {
      console.error('Erro ao salvar transação:', err)
      alert('Erro ao salvar transação')
    }
  }

  const handleDeleteTransaction = async (id: number | string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      await deleteTransaction(id as any)
      const updated = transactions.filter(t => t.id !== id)
      setTransactions(updated)
      alert('Transação excluída com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir transação:', err)
      alert('Erro ao excluir transação')
    }
  }

  const handleClearAllData = async () => {
    if (activeTab === 'account-plan') {
      const confirmMessage = 'Tem certeza que deseja limpar TODOS os dados do plano de contas? Esta ação não pode ser desfeita.'
      
      if (!window.confirm(confirmMessage)) return

      try {
        // Limpar plano de contas
        await clearAccountPlan()
        setAccountPlan([])
        alert('Plano de contas limpo com sucesso!')
      } catch (err: any) {
        console.error('Erro ao limpar dados:', err)
        alert(err.message || 'Erro ao limpar dados. Tente novamente.')
      }
    } else {
      // Para lançamentos, limpar apenas os filtrados
      const hasFilter = transactionFilterColumn && 
        (transactionFilterValue || transactionDateFrom || transactionDateTo)
      
      const confirmMessage = hasFilter
        ? `Tem certeza que deseja excluir os ${filteredTransactions.length} lançamento(s) filtrado(s)? Esta ação não pode ser desfeita.`
        : 'Tem certeza que deseja limpar TODOS os lançamentos? Esta ação não pode ser desfeita.'
      
      if (!window.confirm(confirmMessage)) return

      try {
        if (hasFilter) {
          // Excluir apenas os lançamentos filtrados
          for (const transaction of filteredTransactions) {
            await deleteTransaction(transaction.id as any)
          }
          
          // Atualizar lista removendo os filtrados
          const filteredIds = new Set(filteredTransactions.map((t: any) => t.id))
          const remaining = transactions.filter((t: any) => !filteredIds.has(t.id))
          setTransactions(remaining)
          
          alert(`${filteredTransactions.length} lançamento(s) excluído(s) com sucesso!`)
        } else {
          // Limpar todos os lançamentos
          await clearAllData()
          setTransactions([])
          alert('Todos os lançamentos foram limpos com sucesso!')
        }
      } catch (err: any) {
        console.error('Erro ao limpar dados:', err)
        alert(err.message || 'Erro ao limpar dados. Tente novamente.')
      }
    }
  }

  const handleImportSuccess = () => {
    loadData()
  }

  const handleAccountSort = (field: string) => {
    if (accountSortField === field) {
      // Alternar direção: asc -> desc -> null
      if (accountSortDirection === 'asc') {
        setAccountSortDirection('desc')
      } else if (accountSortDirection === 'desc') {
        setAccountSortField(null)
        setAccountSortDirection(null)
      }
    } else {
      setAccountSortField(field)
      setAccountSortDirection('asc')
    }
  }

  const handleTransactionSort = (field: string) => {
    if (transactionSortField === field) {
      // Alternar direção: asc -> desc -> null
      if (transactionSortDirection === 'asc') {
        setTransactionSortDirection('desc')
      } else if (transactionSortDirection === 'desc') {
        setTransactionSortField(null)
        setTransactionSortDirection(null)
      }
    } else {
      setTransactionSortField(field)
      setTransactionSortDirection('asc')
    }
  }

  const sortedAccountPlan = useMemo(() => {
    if (!accountSortField || !accountSortDirection) return accountPlan
    
    const sorted = [...accountPlan].sort((a, b) => {
      const aVal = a[accountSortField as keyof AccountPlan] || ''
      const bVal = b[accountSortField as keyof AccountPlan] || ''
      
      if (accountSortDirection === 'asc') {
        return String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true })
      } else {
        return String(bVal).localeCompare(String(aVal), 'pt-BR', { numeric: true })
      }
    })
    
    return sorted
  }, [accountPlan, accountSortField, accountSortDirection])

  // Filtrar plano de contas
  const filteredAccountPlan = useMemo(() => {
    let filtered = sortedAccountPlan
    
    // Filtro por coluna específica
    if (accountFilterColumn && accountFilterValue) {
      filtered = filtered.filter((account) => {
        const columnValue = String(account[accountFilterColumn as keyof AccountPlan] || '').toLowerCase()
        return columnValue.includes(accountFilterValue.toLowerCase())
      })
    }
    
    return filtered
  }, [sortedAccountPlan, accountFilterColumn, accountFilterValue])

  const sortedTransactions = useMemo(() => {
    if (!transactionSortField || !transactionSortDirection) return transactions
    
    const sorted = [...transactions].sort((a: any, b: any) => {
      const aVal = a[transactionSortField] || ''
      const bVal = b[transactionSortField] || ''
      
      if (transactionSortDirection === 'asc') {
        return String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true })
      } else {
        return String(bVal).localeCompare(String(aVal), 'pt-BR', { numeric: true })
      }
    })
    
    return sorted
  }, [transactions, transactionSortField, transactionSortDirection])

  // Filtrar lançamentos
  const filteredTransactions = useMemo(() => {
    let filtered = sortedTransactions
    
    // Filtro por coluna específica
    if (transactionFilterColumn && transactionFilterColumn !== 'Data') {
      if (transactionFilterValue) {
        filtered = filtered.filter((transaction: any) => {
          let columnValue = transaction[transactionFilterColumn]
          
          // Tratamento especial para Valor
          if (transactionFilterColumn === 'Valor') {
            columnValue = String(transaction.Valor || transaction.amount || '')
          }
          
          return String(columnValue || '').toLowerCase().includes(transactionFilterValue.toLowerCase())
        })
      }
    }
    
    // Filtro especial por período de data
    if (transactionFilterColumn === 'Data' && (transactionDateFrom || transactionDateTo)) {
      filtered = filtered.filter((transaction: any) => {
        const transactionDate = transaction.Data || transaction.date || ''
        
        if (transactionDateFrom && transactionDate < transactionDateFrom) {
          return false
        }
        
        if (transactionDateTo && transactionDate > transactionDateTo) {
          return false
        }
        
        return true
      })
    }
    
    return filtered
  }, [sortedTransactions, transactionFilterColumn, transactionFilterValue, transactionDateFrom, transactionDateTo])

  const AccountSortIcon = ({ field }: { field: string }) => {
    if (accountSortField !== field) {
      return <span className="sort-icon-placeholder">↕</span>
    }
    return accountSortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  const TransactionSortIcon = ({ field }: { field: string }) => {
    if (transactionSortField !== field) {
      return <span className="sort-icon-placeholder">↕</span>
    }
    return transactionSortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h2>Dashboard de Administração</h2>
          <button className="admin-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="loading-admin">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Dashboard de Administração</h2>
        <div className="admin-header-actions">
          <button className="admin-btn-import" onClick={() => setIsImportModalOpen(true)}>
            <Upload size={18} />
            Importar
          </button>
          <button className="admin-btn-clear" onClick={handleClearAllData}>
            <Trash2 size={18} />
            {activeTab === 'account-plan' 
              ? 'Limpar Plano de Contas' 
              : (transactionFilterColumn && (transactionFilterValue || transactionDateFrom || transactionDateTo)
                  ? `Excluir Filtrados (${filteredTransactions.length})`
                  : 'Limpar Lançamentos')}
          </button>
          <button className="admin-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'account-plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('account-plan')}
        >
          Plano de Contas ({filteredAccountPlan.length}{filteredAccountPlan.length !== accountPlan.length ? ` / ${accountPlan.length}` : ''})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Lançamentos ({filteredTransactions.length}{filteredTransactions.length !== transactions.length ? ` / ${transactions.length}` : ''})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'account-plan' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Plano de Contas</h3>
              <div className="admin-table-actions">
                <select
                  value={accountFilterColumn}
                  onChange={(e) => {
                    setAccountFilterColumn(e.target.value)
                    setAccountFilterValue('')
                  }}
                  className="filter-select"
                >
                  <option value="">Filtrar por coluna...</option>
                  <option value="ID_Conta">ID_Conta</option>
                  <option value="Natureza">Natureza</option>
                  <option value="Tipo">Tipo</option>
                  <option value="Categoria">Categoria</option>
                  <option value="SubCategoria">SubCategoria</option>
                  <option value="Conta">Conta</option>
                </select>
                {accountFilterColumn && (
                  <input
                    type="text"
                    placeholder="Digite o valor..."
                    value={accountFilterValue}
                    onChange={(e) => setAccountFilterValue(e.target.value)}
                    className="filter-input-header"
                  />
                )}
                <button className="btn-add" onClick={handleAddAccount}>
                  <Plus size={18} />
                  Adicionar Conta
                </button>
              </div>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleAccountSort('ID_Conta')}>
                      ID_Conta <AccountSortIcon field="ID_Conta" />
                    </th>
                    <th className="sortable" onClick={() => handleAccountSort('Natureza')}>
                      Natureza <AccountSortIcon field="Natureza" />
                    </th>
                    <th className="sortable" onClick={() => handleAccountSort('Tipo')}>
                      Tipo <AccountSortIcon field="Tipo" />
                    </th>
                    <th className="sortable" onClick={() => handleAccountSort('Categoria')}>
                      Categoria <AccountSortIcon field="Categoria" />
                    </th>
                    <th className="sortable" onClick={() => handleAccountSort('SubCategoria')}>
                      SubCategoria <AccountSortIcon field="SubCategoria" />
                    </th>
                    <th className="sortable" onClick={() => handleAccountSort('Conta')}>
                      Conta <AccountSortIcon field="Conta" />
                    </th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccountPlan.map((account) => (
                    <tr key={String(account.ID_Conta)}>
                      {editingId === account.ID_Conta && editedAccount ? (
                        <>
                          <td>
                            <input
                              type="text"
                              value={editedAccount.ID_Conta}
                              onChange={(e) => setEditedAccount({ ...editedAccount, ID_Conta: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedAccount.Natureza}
                              onChange={(e) => setEditedAccount({ ...editedAccount, Natureza: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedAccount.Tipo}
                              onChange={(e) => setEditedAccount({ ...editedAccount, Tipo: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedAccount.Categoria}
                              onChange={(e) => setEditedAccount({ ...editedAccount, Categoria: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedAccount.SubCategoria}
                              onChange={(e) => setEditedAccount({ ...editedAccount, SubCategoria: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedAccount.Conta}
                              onChange={(e) => setEditedAccount({ ...editedAccount, Conta: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <button className="btn-save" onClick={handleSaveAccount}>
                              <Save size={16} />
                            </button>
                            <button className="btn-cancel" onClick={() => { setEditingId(null); setEditedAccount(null) }}>
                              <X size={16} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{account.ID_Conta}</td>
                          <td>{account.Natureza}</td>
                          <td>{account.Tipo}</td>
                          <td>{account.Categoria}</td>
                          <td>{account.SubCategoria}</td>
                          <td>{account.Conta}</td>
                          <td>
                            <button className="btn-edit" onClick={() => handleEditAccount(account)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-delete" onClick={() => handleDeleteAccount(account.ID_Conta)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Lançamentos</h3>
              <div className="admin-table-actions">
                <select
                  value={transactionFilterColumn}
                  onChange={(e) => {
                    setTransactionFilterColumn(e.target.value)
                    setTransactionFilterValue('')
                    setTransactionDateFrom('')
                    setTransactionDateTo('')
                  }}
                  className="filter-select"
                >
                  <option value="">Filtrar por coluna...</option>
                  <option value="Id_Item">Id_Item</option>
                  <option value="Natureza">Natureza</option>
                  <option value="Tipo">Tipo</option>
                  <option value="Categoria">Categoria</option>
                  <option value="SubCategoria">SubCategoria</option>
                  <option value="Operação">Operação</option>
                  <option value="OrigemDestino">Origem|Destino</option>
                  <option value="Item">Item</option>
                  <option value="Data">Data</option>
                  <option value="Valor">Valor</option>
                </select>
                {transactionFilterColumn && transactionFilterColumn !== 'Data' && (
                  <input
                    type="text"
                    placeholder="Digite o valor..."
                    value={transactionFilterValue}
                    onChange={(e) => setTransactionFilterValue(e.target.value)}
                    className="filter-input-header"
                  />
                )}
                {transactionFilterColumn === 'Data' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="date"
                      placeholder="De"
                      value={transactionDateFrom}
                      onChange={(e) => setTransactionDateFrom(e.target.value)}
                      className="filter-input-header"
                      style={{ maxWidth: '150px' }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>até</span>
                    <input
                      type="date"
                      placeholder="Até"
                      value={transactionDateTo}
                      onChange={(e) => setTransactionDateTo(e.target.value)}
                      className="filter-input-header"
                      style={{ maxWidth: '150px' }}
                    />
                  </div>
                )}
                <button className="btn-add" onClick={handleAddTransaction}>
                  <Plus size={18} />
                  Adicionar Lançamento
                </button>
              </div>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleTransactionSort('Id_Item')}>
                      Id_Item <TransactionSortIcon field="Id_Item" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('Natureza')}>
                      Natureza <TransactionSortIcon field="Natureza" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('Tipo')}>
                      Tipo <TransactionSortIcon field="Tipo" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('Categoria')}>
                      Categoria <TransactionSortIcon field="Categoria" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('SubCategoria')}>
                      SubCategoria <TransactionSortIcon field="SubCategoria" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('Operação')}>
                      Operação <TransactionSortIcon field="Operação" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('OrigemDestino')}>
                      Origem|Destino <TransactionSortIcon field="OrigemDestino" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('Item')}>
                      Item <TransactionSortIcon field="Item" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('Data')}>
                      Data <TransactionSortIcon field="Data" />
                    </th>
                    <th className="sortable" onClick={() => handleTransactionSort('Valor')}>
                      Valor <TransactionSortIcon field="Valor" />
                    </th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction: any) => (
                    <tr key={transaction.id}>
                      {editingId === transaction.id && editedTransaction ? (
                        <>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.Id_Item || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, Id_Item: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.Natureza || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, Natureza: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.Tipo || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, Tipo: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.Categoria || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, Categoria: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.SubCategoria || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, SubCategoria: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.Operação || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, Operação: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.OrigemDestino || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, OrigemDestino: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.Item || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, Item: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={editedTransaction.Data || editedTransaction.date || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, Data: e.target.value, date: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={editedTransaction.Valor || Math.abs(editedTransaction.amount || 0)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                setEditedTransaction({ ...editedTransaction, Valor: val, amount: val })
                              }}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <button className="btn-save" onClick={handleSaveTransaction}>
                              <Save size={16} />
                            </button>
                            <button className="btn-cancel" onClick={() => { setEditingId(null); setEditedTransaction(null) }}>
                              <X size={16} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{transaction.Id_Item || '-'}</td>
                          <td>{transaction.Natureza || '-'}</td>
                          <td>{transaction.Tipo || '-'}</td>
                          <td>{transaction.Categoria || '-'}</td>
                          <td>{transaction.SubCategoria || '-'}</td>
                          <td>{transaction.Operação || '-'}</td>
                          <td>{transaction.OrigemDestino || '-'}</td>
                          <td>{transaction.Item || '-'}</td>
                          <td>{transaction.Data || transaction.date || '-'}</td>
                          <td className={transaction.Natureza?.toLowerCase().includes('receita') ? 'positive' : 'negative'}>
                            R$ {Math.abs(transaction.Valor || transaction.amount || 0).toFixed(2)}
                          </td>
                          <td>
                            <button className="btn-edit" onClick={() => handleEditTransaction(transaction)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="btn-delete" onClick={() => handleDeleteTransaction(transaction.id)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}

export default AdminDashboard
