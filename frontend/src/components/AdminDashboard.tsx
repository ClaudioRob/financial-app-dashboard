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
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

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

  const handleEditTransaction = (transaction: any) => {
    setEditingId(transaction.id)
    setEditedTransaction({ ...transaction })
  }

  const handleSaveTransaction = async () => {
    if (!editedTransaction) return

    try {
      // Converter ID para string se necessário para a API
      const transactionId = typeof editedTransaction.id === 'string' 
        ? editedTransaction.id 
        : String(editedTransaction.id)
      await updateTransaction(transactionId as any, editedTransaction)
      const updated = transactions.map(t => 
        t.id === editedTransaction.id ? editedTransaction : t
      )
      setTransactions(updated)
      
      setEditingId(null)
      setEditedTransaction(null)
      alert('Transação atualizada com sucesso!')
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
    const confirmMessage = activeTab === 'account-plan' 
      ? 'Tem certeza que deseja limpar TODOS os dados do plano de contas? Esta ação não pode ser desfeita.'
      : 'Tem certeza que deseja limpar TODOS os lançamentos? Esta ação não pode ser desfeita.'
    
    if (!window.confirm(confirmMessage)) return

    try {
      if (activeTab === 'account-plan') {
        // Limpar plano de contas
        await clearAccountPlan()
        setAccountPlan([])
        alert('Plano de contas limpo com sucesso!')
      } else {
        // Limpar transações usando a função da API
        await clearAllData()
        setTransactions([])
        alert('Todos os lançamentos foram limpos com sucesso!')
      }
    } catch (err: any) {
      console.error('Erro ao limpar dados:', err)
      alert(err.message || 'Erro ao limpar dados. Tente novamente.')
    }
  }

  const handleImportSuccess = () => {
    loadData()
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Alternar direção: null -> asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedAccountPlan = useMemo(() => {
    if (!sortField || !sortDirection) return accountPlan
    
    const sorted = [...accountPlan].sort((a, b) => {
      const aVal = a[sortField as keyof AccountPlan] || ''
      const bVal = b[sortField as keyof AccountPlan] || ''
      
      if (sortDirection === 'asc') {
        return String(aVal).localeCompare(String(bVal), 'pt-BR', { numeric: true })
      } else {
        return String(bVal).localeCompare(String(aVal), 'pt-BR', { numeric: true })
      }
    })
    
    return sorted
  }, [accountPlan, sortField, sortDirection])

  const sortedTransactions = useMemo(() => {
    if (!sortField || !sortDirection) return transactions
    
    const sorted = [...transactions].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]
      
      // Tratamento especial para campos numéricos e datas
      if (sortField === 'amount') {
        aVal = Math.abs(aVal || 0)
        bVal = Math.abs(bVal || 0)
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      if (sortField === 'date') {
        aVal = new Date(aVal || 0).getTime()
        bVal = new Date(bVal || 0).getTime()
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      // Para Id_Item, usar o valor do campo Id_Item ou o id como fallback
      if (sortField === 'Id_Item') {
        aVal = a.Id_Item || a.id
        bVal = b.Id_Item || b.id
      }
      
      // Ordenação alfabética
      if (sortDirection === 'asc') {
        return String(aVal || '').localeCompare(String(bVal || ''), 'pt-BR', { numeric: true })
      } else {
        return String(bVal || '').localeCompare(String(aVal || ''), 'pt-BR', { numeric: true })
      }
    })
    
    return sorted
  }, [transactions, sortField, sortDirection])

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <span className="sort-icon-placeholder">↕</span>
    }
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
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
            Limpar {activeTab === 'account-plan' ? 'Plano de Contas' : 'Lançamentos'}
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
          Plano de Contas ({accountPlan.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Lançamentos ({transactions.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'account-plan' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Plano de Contas</h3>
              <button className="btn-add" onClick={handleAddAccount}>
                <Plus size={18} />
                Adicionar Conta
              </button>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('ID_Conta')}>
                      ID_Conta <SortIcon field="ID_Conta" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('Natureza')}>
                      Natureza <SortIcon field="Natureza" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('Tipo')}>
                      Tipo <SortIcon field="Tipo" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('Categoria')}>
                      Categoria <SortIcon field="Categoria" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('SubCategoria')}>
                      SubCategoria <SortIcon field="SubCategoria" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('Conta')}>
                      Conta <SortIcon field="Conta" />
                    </th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAccountPlan.map((account) => (
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
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('id')}>
                      ID <SortIcon field="id" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('date')}>
                      Data <SortIcon field="date" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('description')}>
                      Descrição <SortIcon field="description" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('amount')}>
                      Valor <SortIcon field="amount" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('type')}>
                      Tipo <SortIcon field="type" />
                    </th>
                    <th className="sortable" onClick={() => handleSort('category')}>
                      Categoria <SortIcon field="category" />
                    </th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      {editingId === transaction.id && editedTransaction ? (
                        <>
                          <td>{transaction.Id_Item || transaction.id}</td>
                          <td>
                            <input
                              type="date"
                              value={editedTransaction.date}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, date: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.description}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, description: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              value={Math.abs(editedTransaction.amount)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                setEditedTransaction({ 
                                  ...editedTransaction, 
                                  amount: editedTransaction.type === 'expense' ? -val : val 
                                })
                              }}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <select
                              value={editedTransaction.type}
                              onChange={(e) => {
                                const type = e.target.value as 'income' | 'expense'
                                const amount = Math.abs(editedTransaction.amount)
                                setEditedTransaction({ 
                                  ...editedTransaction, 
                                  type,
                                  amount: type === 'expense' ? -amount : amount
                                })
                              }}
                              className="admin-input"
                            >
                              <option value="income">Receita</option>
                              <option value="expense">Despesa</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.category}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, category: e.target.value })}
                              className="admin-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={editedTransaction.Id_Item || ''}
                              onChange={(e) => setEditedTransaction({ ...editedTransaction, Id_Item: e.target.value })}
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
                          <td>{transaction.Id_Item || transaction.id || '-'}</td>
                          <td>{transaction.date}</td>
                          <td>{transaction.description}</td>
                          <td className={transaction.type === 'income' ? 'positive' : 'negative'}>
                            {transaction.type === 'income' ? '+' : '-'} R$ {Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td>{transaction.type === 'income' ? 'Receita' : 'Despesa'}</td>
                          <td>{transaction.category}</td>
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
