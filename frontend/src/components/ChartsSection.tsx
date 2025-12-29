import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './ChartsSection.css'

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  Categoria?: string
  SubCategoria?: string
  Natureza?: string
  Conta?: string
}

interface ChartsSectionProps {
  charts: {
    monthly: Array<{ month: string; income: number; expenses: number }>
    categories: Array<{ category: string; amount: number }>
  }
  transactions: Transaction[]
  selectedMonth?: number
  selectedYear?: number
}

const ChartsSection = ({ charts, transactions, selectedMonth, selectedYear }: ChartsSectionProps) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'categories' | 'salary'>('monthly')
  const [salaryStatus, setSalaryStatus] = useState<'all' | 'received' | 'pending'>('all')

  const COLORS = ['#4A8FE7', '#6BA3E8', '#2B4A6F', '#10b981', '#ef4444', '#f59e0b']

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Cálculo dos dados salariais
  const salaryData = useMemo(() => {
    const currentDate = new Date()
    let salaryTransactions = transactions.filter(t => t.Categoria === 'Folha Salarial')
    
    // Filtrar por mês e ano se houver seleção
    if (selectedMonth && selectedYear) {
      salaryTransactions = salaryTransactions.filter(t => {
        const transactionDate = new Date(t.date)
        const transactionMonth = transactionDate.getMonth() + 1
        const transactionYear = transactionDate.getFullYear()
        return transactionMonth === selectedMonth && transactionYear === selectedYear
      })
    }
    
    const filteredTransactions = salaryTransactions.filter(t => {
      const transactionDate = new Date(t.date)
      if (salaryStatus === 'received') {
        return transactionDate <= currentDate
      } else if (salaryStatus === 'pending') {
        return transactionDate > currentDate
      }
      return true // 'all'
    })

    const proventos = filteredTransactions
      .filter(t => t.Natureza === 'Receita')
      .reduce((acc, t) => {
        const conta = t.Conta || t.description
        const existing = acc.find(item => item.name === conta)
        if (existing) {
          existing.value += t.amount
        } else {
          acc.push({ name: conta, value: t.amount })
        }
        return acc
      }, [] as Array<{ name: string; value: number }>)

    const descontos = filteredTransactions
      .filter(t => t.Natureza === 'Despesa')
      .reduce((acc, t) => {
        const conta = t.Conta || t.description
        const existing = acc.find(item => item.name === conta)
        if (existing) {
          existing.value += Math.abs(t.amount)
        } else {
          acc.push({ name: conta, value: Math.abs(t.amount) })
        }
        return acc
      }, [] as Array<{ name: string; value: number }>)

    const totalProventos = proventos.reduce((sum, item) => sum + item.value, 0)
    const totalDescontos = descontos.reduce((sum, item) => sum + item.value, 0)
    const liquido = totalProventos - totalDescontos

    return {
      proventos: proventos.sort((a, b) => b.value - a.value),
      descontos: descontos.sort((a, b) => b.value - a.value),
      totalProventos,
      totalDescontos,
      liquido
    }
  }, [transactions, salaryStatus, selectedMonth, selectedYear])

  return (
    <div className="charts-section">
      <div className="charts-header">
        <h2>Análise Financeira</h2>
        <div className="chart-tabs">
          <button
            className={`tab-button ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            Mensal
          </button>
          <button
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categorias
          </button>
          <button
            className={`tab-button ${activeTab === 'salary' ? 'active' : ''}`}
            onClick={() => setActiveTab('salary')}
          >
            Salário
          </button>
        </div>
      </div>

      <div className="chart-container">
        {activeTab === 'monthly' ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={charts.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                stroke="var(--text-muted)"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis
                stroke="var(--text-muted)"
                style={{ fontSize: '0.875rem' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={3}
                name="Receitas"
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={3}
                name="Despesas"
                dot={{ fill: '#ef4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : activeTab === 'categories' ? (
          <div className="categories-charts">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={charts.categories}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="category"
                  stroke="var(--text-muted)"
                  style={{ fontSize: '0.875rem' }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  style={{ fontSize: '0.875rem' }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill="#4A8FE7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="salary-analysis">
            <div className="salary-filter">
              <label htmlFor="salary-status">Status:</label>
              <select 
                id="salary-status"
                value={salaryStatus} 
                onChange={(e) => setSalaryStatus(e.target.value as 'all' | 'received' | 'pending')}
                className="salary-select"
              >
                <option value="all">Todos</option>
                <option value="received">Já Recebidos</option>
                <option value="pending">À Receber</option>
              </select>
            </div>

            <div className="salary-kpis">
              <div className="salary-kpi success">
                <div className="kpi-label">Total de Proventos</div>
                <div className="kpi-value">{formatCurrency(salaryData.totalProventos)}</div>
              </div>
              <div className="salary-kpi error">
                <div className="kpi-label">Total de Descontos</div>
                <div className="kpi-value">{formatCurrency(salaryData.totalDescontos)}</div>
              </div>
              <div className="salary-kpi primary">
                <div className="kpi-label">Salário Líquido</div>
                <div className="kpi-value highlight">{formatCurrency(salaryData.liquido)}</div>
              </div>
            </div>

            <div className="salary-details">
              <div className="detail-section">
                <h4>Proventos</h4>
                <div className="detail-list">
                  {salaryData.proventos.length > 0 ? (
                    salaryData.proventos.map((item, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-name">{item.name}</span>
                        <span className="detail-value success">{formatCurrency(item.value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="detail-empty">Nenhum provento encontrado</div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>Descontos</h4>
                <div className="detail-list">
                  {salaryData.descontos.length > 0 ? (
                    salaryData.descontos.map((item, index) => (
                      <div key={index} className="detail-item">
                        <span className="detail-name">{item.name}</span>
                        <span className="detail-value error">{formatCurrency(item.value)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="detail-empty">Nenhum desconto encontrado</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChartsSection
