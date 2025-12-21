import { useState, useEffect } from 'react'
import { X, Edit2, Trash2, Save, Plus } from './icons'
import { fetchAccountPlan, importAccountPlan, type AccountPlan } from '../services/api'
import { fetchDashboardData, updateTransaction, deleteTransaction } from '../services/api'
import './AdminDashboard.css'

interface AdminDashboardProps {
  onClose: () => void
}

const AdminDashboard = ({ onClose }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'account-plan' | 'transactions'>('account-plan')
  const [accountPlan, setAccountPlan] = useState<AccountPlan[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [editedAccount, setEditedAccount] = useState<AccountPlan | null>(null)
  const [editedTransaction, setEditedTransaction] = useState<any>(null)

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
      await updateTransaction(editedTransaction.id, editedTransaction)
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

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      await deleteTransaction(id)
      const updated = transactions.filter(t => t.id !== id)
      setTransactions(updated)
      alert('Transação excluída com sucesso!')
    } catch (err) {
      console.error('Erro ao excluir transação:', err)
      alert('Erro ao excluir transação')
    }
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
        <button className="admin-close" onClick={onClose}>
          <X size={24} />
        </button>
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
                    <th>ID_Conta</th>
                    <th>Natureza</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>SubCategoria</th>
                    <th>Conta</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {accountPlan.map((account) => (
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
                    <th>ID</th>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Id_Item</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      {editingId === transaction.id && editedTransaction ? (
                        <>
                          <td>{transaction.id}</td>
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
                          <td>{transaction.id}</td>
                          <td>{transaction.date}</td>
                          <td>{transaction.description}</td>
                          <td className={transaction.type === 'income' ? 'positive' : 'negative'}>
                            {transaction.type === 'income' ? '+' : '-'} R$ {Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td>{transaction.type === 'income' ? 'Receita' : 'Despesa'}</td>
                          <td>{transaction.category}</td>
                          <td>{transaction.Id_Item || '-'}</td>
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
    </div>
  )
}

export default AdminDashboard
