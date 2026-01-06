import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, X } from './icons'
import './CashFlowPage.css'

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  Categoria?: string
  SubCategoria?: string
  Id_Item?: string | number
  Item?: string
}

interface CashFlowPageProps {
  transactions: Transaction[]
  onClose: () => void
  selectedYear: number | 'all'
}

const CashFlowPage = ({ transactions, onClose, selectedYear: initialYear }: CashFlowPageProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(initialYear)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // Obter anos disponíveis
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(transactions.map(t => new Date(t.date).getFullYear()))
    ).sort((a, b) => b - a)
    return years
  }, [transactions])

  const cashFlowData = useMemo(() => {
    // Filtrar por ano se necessário
    let filteredTransactions = transactions
    if (selectedYear !== 'all') {
      filteredTransactions = transactions.filter(t => {
        const year = new Date(t.date).getFullYear()
        return year === selectedYear
      })
    }

    // Calcular os 12 meses
    const monthsData: any[] = []
    const currentYear = selectedYear === 'all' ? new Date().getFullYear() : selectedYear
    
    for (let month = 1; month <= 12; month++) {
      const monthTransactions = filteredTransactions.filter(t => {
        const tDate = new Date(t.date)
        const tMonth = tDate.getMonth() + 1
        const tYear = tDate.getFullYear()
        return tMonth === month && tYear === currentYear
      })

      const totalIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      const totalExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      monthsData.push({
        month,
        totalIncome,
        totalExpense,
      })
    }

    // Agrupar todas as transações por categoria e item
    const incomeItems: any[] = []
    const expenseItems: any[] = []

    // Agrupar receitas
    const incomeByCategoryAndDesc = new Map<string, Map<string, { items: Transaction[] }>>()
    filteredTransactions.filter(t => t.type === 'income').forEach(t => {
      const cat = t.Categoria || t.category
      if (!incomeByCategoryAndDesc.has(cat)) {
        incomeByCategoryAndDesc.set(cat, new Map())
      }
      const catMap = incomeByCategoryAndDesc.get(cat)!
      const desc = t.description
      if (!catMap.has(desc)) {
        catMap.set(desc, { items: [] })
      }
      catMap.get(desc)!.items.push(t)
    })

    // Processar receitas para criar linhas
    incomeByCategoryAndDesc.forEach((descMap, category) => {
      const categoryMonthlyTotals = new Array(12).fill(0)
      const itemsList: any[] = []

      descMap.forEach((data, description) => {
        const monthlyValues = new Array(12).fill(0)
        let itemCode = ''
        data.items.forEach(item => {
          const month = new Date(item.date).getMonth()
          monthlyValues[month] += Math.abs(item.amount)
          if (!itemCode && item.Id_Item) {
            itemCode = String(item.Id_Item)
          }
        })
        
        monthlyValues.forEach((val, idx) => {
          categoryMonthlyTotals[idx] += val
        })

        itemsList.push({
          description,
          itemCode,
          monthlyValues,
          total: monthlyValues.reduce((sum, val) => sum + val, 0)
        })
      })

      incomeItems.push({
        category,
        categoryMonthlyTotals,
        categoryTotal: categoryMonthlyTotals.reduce((sum, val) => sum + val, 0),
        items: itemsList
      })
    })

    // Agrupar despesas
    const expenseByCategoryAndDesc = new Map<string, Map<string, { items: Transaction[] }>>()
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.Categoria || t.category
      if (!expenseByCategoryAndDesc.has(cat)) {
        expenseByCategoryAndDesc.set(cat, new Map())
      }
      const catMap = expenseByCategoryAndDesc.get(cat)!
      const desc = t.description
      if (!catMap.has(desc)) {
        catMap.set(desc, { items: [] })
      }
      catMap.get(desc)!.items.push(t)
    })

    // Processar despesas para criar linhas
    expenseByCategoryAndDesc.forEach((descMap, category) => {
      const categoryMonthlyTotals = new Array(12).fill(0)
      const itemsList: any[] = []

      descMap.forEach((data, description) => {
        const monthlyValues = new Array(12).fill(0)
        let itemCode = ''
        data.items.forEach(item => {
          const month = new Date(item.date).getMonth()
          monthlyValues[month] += Math.abs(item.amount)
          if (!itemCode && item.Id_Item) {
            itemCode = String(item.Id_Item)
          }
        })
        
        monthlyValues.forEach((val, idx) => {
          categoryMonthlyTotals[idx] += val
        })

        itemsList.push({
          description,
          itemCode,
          monthlyValues,
          total: monthlyValues.reduce((sum, val) => sum + val, 0)
        })
      })

      expenseItems.push({
        category,
        categoryMonthlyTotals,
        categoryTotal: categoryMonthlyTotals.reduce((sum, val) => sum + val, 0),
        items: itemsList
      })
    })

    // Calcular saldo inicial (0 para o primeiro mês)
    const initialBalance = 0

    // Calcular saldos acumulados
    let runningBalance = initialBalance
    monthsData.forEach((monthData) => {
      monthData.initialBalance = runningBalance
      monthData.operationalBalance = monthData.totalIncome - monthData.totalExpense
      monthData.finalBalance = monthData.initialBalance + monthData.operationalBalance
      runningBalance = monthData.finalBalance
    })

    return { monthsData, initialBalance, incomeItems, expenseItems }
  }, [transactions, selectedYear])

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  // Calcular totais por linha
  const totalsByRow = useMemo(() => {
    // Somar todos os saldos iniciais dos 12 meses
    const totalInitialBalance = cashFlowData.monthsData.reduce((sum, month) => sum + month.initialBalance, 0)
    
    const totals: any = {
      initialBalance: totalInitialBalance,
      totalIncome: 0,
      totalExpense: 0,
      operationalBalance: 0,
      finalBalance: cashFlowData.monthsData[cashFlowData.monthsData.length - 1]?.finalBalance || 0,
    }

    cashFlowData.monthsData.forEach(month => {
      totals.totalIncome += month.totalIncome
      totals.totalExpense += month.totalExpense
      totals.operationalBalance += month.operationalBalance
    })

    return totals
  }, [cashFlowData])

  return (
    <div className="cashflow-page">
      <div className="cashflow-header">
        <div className="cashflow-header-left">
          <h1>Fluxo de Caixa Financeiro</h1>
          <div className="year-filter">
            {availableYears.map(year => (
              <button
                key={year}
                className={`year-button ${selectedYear === year ? 'active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="cashflow-table-container">
        <table className="cashflow-table">
          <thead>
            <tr>
              <th className="category-column">Descrição</th>
              {monthNames.map((name, index) => (
                <th key={index} className="month-column">{name}</th>
              ))}
              <th className="total-column">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Saldo Inicial */}
            <tr className="balance-row initial">
              <td className="category-cell"><strong>Saldo Inicial</strong></td>
              {cashFlowData.monthsData.map((month, index) => (
                <td key={index} className="value-cell">
                  {formatCurrency(month.initialBalance)}
                </td>
              ))}
              <td className="value-cell total-cell">
                {formatCurrency(totalsByRow.initialBalance)}
              </td>
            </tr>

            {/* Receitas */}
            <tr className="section-header income-header">
              <td colSpan={14}><strong>RECEITAS</strong></td>
            </tr>

            {cashFlowData.incomeItems.map((categoryData, catIndex) => (
              <React.Fragment key={`income-cat-${catIndex}`}>
                <tr className="category-row income-row">
                  <td className="category-cell">
                    <button 
                      className="expand-toggle"
                      onClick={() => toggleCategory(`income-${categoryData.category}`)}
                    >
                      {expandedCategories.has(`income-${categoryData.category}`) ? 
                        <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <strong>{categoryData.category}</strong>
                  </td>
                  {categoryData.categoryMonthlyTotals.map((value, index) => (
                    <td key={index} className="value-cell income-value">
                      {value > 0 ? formatCurrency(value) : '-'}
                    </td>
                  ))}
                  <td className="value-cell total-cell income-value">
                    {formatCurrency(categoryData.categoryTotal)}
                  </td>
                </tr>
                {expandedCategories.has(`income-${categoryData.category}`) && 
                  categoryData.items.map((item: any, itemIndex: number) => (
                    <tr key={`income-item-${catIndex}-${itemIndex}`} className="item-row">
                      <td className="item-cell">&nbsp;&nbsp;&nbsp;&nbsp;↳ {item.itemCode ? `${item.itemCode} | ${item.description}` : item.description}</td>
                      {item.monthlyValues.map((value: number, idx: number) => (
                        <td key={idx} className="value-cell">
                          {value > 0 ? formatCurrency(value) : '-'}
                        </td>
                      ))}
                      <td className="value-cell total-cell">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))
                }
              </React.Fragment>
            ))}

            <tr className="total-row income-total">
              <td className="category-cell"><strong>Total de Receitas</strong></td>
              {cashFlowData.monthsData.map((month, index) => (
                <td key={index} className="value-cell income-value">
                  <strong>{formatCurrency(month.totalIncome)}</strong>
                </td>
              ))}
              <td className="value-cell total-cell income-value">
                <strong>{formatCurrency(totalsByRow.totalIncome)}</strong>
              </td>
            </tr>

            {/* Despesas */}
            <tr className="section-header expense-header">
              <td colSpan={14}><strong>DESPESAS</strong></td>
            </tr>

            {cashFlowData.expenseItems.map((categoryData, catIndex) => (
              <React.Fragment key={`expense-cat-${catIndex}`}>
                <tr className="category-row expense-row">
                  <td className="category-cell">
                    <button 
                      className="expand-toggle"
                      onClick={() => toggleCategory(`expense-${categoryData.category}`)}
                    >
                      {expandedCategories.has(`expense-${categoryData.category}`) ? 
                        <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <strong>{categoryData.category}</strong>
                  </td>
                  {categoryData.categoryMonthlyTotals.map((value, index) => (
                    <td key={index} className="value-cell expense-value">
                      {value > 0 ? formatCurrency(value) : '-'}
                    </td>
                  ))}
                  <td className="value-cell total-cell expense-value">
                    {formatCurrency(categoryData.categoryTotal)}
                  </td>
                </tr>
                {expandedCategories.has(`expense-${categoryData.category}`) && 
                  categoryData.items.map((item: any, itemIndex: number) => (
                    <tr key={`expense-item-${catIndex}-${itemIndex}`} className="item-row">
                      <td className="item-cell">&nbsp;&nbsp;&nbsp;&nbsp;↳ {item.itemCode ? `${item.itemCode} | ${item.description}` : item.description}</td>
                      {item.monthlyValues.map((value: number, idx: number) => (
                        <td key={idx} className="value-cell">
                          {value > 0 ? formatCurrency(value) : '-'}
                        </td>
                      ))}
                      <td className="value-cell total-cell">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))
                }
              </React.Fragment>
            ))}

            <tr className="total-row expense-total">
              <td className="category-cell"><strong>Total de Despesas</strong></td>
              {cashFlowData.monthsData.map((month, index) => (
                <td key={index} className="value-cell expense-value">
                  <strong>{formatCurrency(month.totalExpense)}</strong>
                </td>
              ))}
              <td className="value-cell total-cell expense-value">
                <strong>{formatCurrency(totalsByRow.totalExpense)}</strong>
              </td>
            </tr>

            {/* Saldo Operacional */}
            <tr className="balance-row operational">
              <td className="category-cell"><strong>Saldo Operacional</strong></td>
              {cashFlowData.monthsData.map((month, index) => (
                <td key={index} className="value-cell">
                  <strong>{formatCurrency(month.operationalBalance)}</strong>
                </td>
              ))}
              <td className="value-cell total-cell">
                <strong>{formatCurrency(totalsByRow.operationalBalance)}</strong>
              </td>
            </tr>

            {/* Saldo Final */}
            <tr className="balance-row final">
              <td className="category-cell"><strong>Saldo Final</strong></td>
              {cashFlowData.monthsData.map((month, index) => (
                <td key={index} className="value-cell">
                  <strong>{formatCurrency(month.finalBalance)}</strong>
                </td>
              ))}
              <td className="value-cell total-cell">
                <strong>{formatCurrency(totalsByRow.finalBalance)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CashFlowPage
