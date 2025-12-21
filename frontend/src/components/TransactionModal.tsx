import { useState } from 'react'
import { X } from './icons'
import { createTransaction, type Transaction } from '../services/api'
import './TransactionModal.css'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const TransactionModal = ({ isOpen, onClose, onSuccess }: TransactionModalProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    'Alimentação',
    'Transporte',
    'Utilidades',
    'Lazer',
    'Saúde',
    'Trabalho',
    'Investimentos',
    'Educação',
    'Outros',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.description || !formData.amount || !formData.category) {
        setError('Preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      await createTransaction({
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
      })

      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'expense',
        category: '',
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError('Erro ao criar transação. Tente novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova Transação</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-group">
            <label>Tipo</label>
            <div className="type-buttons">
              <button
                type="button"
                className={`type-button ${formData.type === 'income' ? 'active income' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'income' })}
              >
                Receita
              </button>
              <button
                type="button"
                className={`type-button ${formData.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                Despesa
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descrição *</label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Salário, Supermercado..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Valor *</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Data *</label>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoria *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionModal

