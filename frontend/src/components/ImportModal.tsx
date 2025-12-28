import { useState, useRef } from 'react'
import { X, Upload } from './icons'
import { importTransactions, importAccountPlan, type AccountPlan } from '../services/api'
import './ImportModal.css'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type ImportType = 'account-plan' | 'transactions'

interface FileWithInfo {
  file: File
  recordCount: number
}

const ImportModal = ({ isOpen, onClose, onSuccess }: ImportModalProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importType, setImportType] = useState<ImportType>('transactions')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [skipValidation, setSkipValidation] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileWithInfo[]>([])
  const [importProgress, setImportProgress] = useState<{ current: number, total: number, fileName: string }>({ current: 0, total: 0, fileName: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): string[][] => {
    // Normalizar quebras de linha e garantir UTF-8
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // Detectar separador (vírgula ou ponto-e-vírgula)
    const firstLine = text.split('\n')[0]
    const hasSemicolon = firstLine.includes(';')
    const separator = hasSemicolon ? ';' : ','
    
    const lines = text.split('\n').filter((line) => line.trim())
    return lines.map(line => {
      // Parse CSV considerando aspas e preservando encoding UTF-8
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          // Se próximo caractere também é aspas, é escape
          if (i + 1 < line.length && line[i + 1] === '"' && inQuotes) {
            current += '"'
            i++ // Pular próximo caractere
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === separator && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    })
  }

  const countRecordsInFile = async (file: File): Promise<number> => {
    try {
      const text = await file.text()
      const lines = parseCSV(text)
      // Subtrair 1 para remover o header, e filtrar linhas vazias
      const recordCount = lines.slice(1).filter(line => 
        line.some(cell => cell && cell.trim() !== '')
      ).length
      return recordCount
    } catch (err) {
      console.error('Erro ao contar registros:', err)
      return 0
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setError('')
    setSuccess('')
    setValidationErrors([])

    // Processar arquivos para contar registros
    const fileArray = Array.from(files)
    const filesWithInfo: FileWithInfo[] = await Promise.all(
      fileArray.map(async (file) => ({
        file,
        recordCount: await countRecordsInFile(file)
      }))
    )
    
    setSelectedFiles(filesWithInfo)
  }

  const processFile = async (file: File) => {
    try {
      // Ler arquivo como ArrayBuffer para garantir controle total do encoding
      const arrayBuffer = await file.arrayBuffer()
      
      // Tentar detectar encoding e converter para UTF-8
      let text: string
      
      // Verificar BOM para determinar encoding
      const bytes = new Uint8Array(arrayBuffer)
      let offset = 0
      
      // Remover BOM se presente (UTF-8 BOM: EF BB BF)
      if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        offset = 3
      }
      // UTF-16 LE BOM: FF FE
      else if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
        const uint16Array = new Uint16Array(arrayBuffer.slice(2))
        text = String.fromCharCode(...uint16Array)
      }
      // UTF-16 BE BOM: FE FF
      else if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
        const uint16Array = new Uint16Array(arrayBuffer.slice(2))
        // Inverter bytes para little-endian
        const reversed = new Uint16Array(uint16Array.length)
        for (let i = 0; i < uint16Array.length; i++) {
          reversed[i] = (uint16Array[i] >> 8) | (uint16Array[i] << 8)
        }
        text = String.fromCharCode(...reversed)
      }
      
      // Tentar diferentes encodings comuns (Windows-1252 é comum no Brasil)
      const encodings = ['utf-8', 'windows-1252', 'iso-8859-1', 'latin1', 'cp1252']
      let bestText = ''
      let bestEncoding = 'utf-8'
      let minInvalidChars = Infinity
      
      for (const encoding of encodings) {
        try {
          const decoder = new TextDecoder(encoding, { fatal: false })
          const decodedText = decoder.decode(arrayBuffer.slice(offset))
          
          // Contar caracteres de substituição inválidos
          const replacementCharCount = (decodedText.match(/�/g) || []).length
          
          // Verificar se tem acentos comuns em português (teste simples)
          const hasPortugueseChars = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(decodedText)
          
          // Preferir encoding que tenha menos caracteres inválidos E tenha caracteres portugueses válidos
          if (replacementCharCount < minInvalidChars || (hasPortugueseChars && replacementCharCount === 0)) {
            minInvalidChars = replacementCharCount
            bestText = decodedText
            bestEncoding = encoding
            if (replacementCharCount === 0 && hasPortugueseChars) {
              break // Encontrou encoding perfeito
            }
          }
        } catch (e) {
          // Tentar próximo encoding
          continue
        }
      }
      
      // Usar o melhor texto encontrado
      text = bestText || (() => {
        const decoder = new TextDecoder('utf-8', { fatal: false })
        return decoder.decode(arrayBuffer.slice(offset))
      })()
      
      console.log(`Encoding detectado: ${bestEncoding}, caracteres inválidos: ${minInvalidChars}`)
      
      // Limpar caracteres de controle inválidos mas manter UTF-8 válido
      text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      
      // Normalizar Unicode para garantir consistência
      try {
        text = text.normalize('NFC')
      } catch (e) {
        // Ignorar erro de normalização
      }
      
      const lines = parseCSV(text)
      
      if (lines.length < 2) {
        throw new Error('Arquivo vazio ou formato inválido')
      }

      const headers = lines[0].map((h) => h.trim())

      if (importType === 'account-plan') {
        // Importar plano de contas
        const accountPlan: AccountPlan[] = []
        const debugInfo: string[] = []

        // Debug: mostrar headers encontrados
        console.log('Headers encontrados:', headers)

        // Encontrar índices das colunas (case-insensitive e com variações)
        const idContaIndex = headers.findIndex(h => {
          const hLower = h.toLowerCase().replace(/[_\s]/g, '')
          return hLower === 'idconta' || hLower === 'id_conta' || hLower === 'idconta'
        })
        const naturezaIndex = headers.findIndex(h => h.toLowerCase().replace(/[_\s]/g, '') === 'natureza')
        const tipoIndex = headers.findIndex(h => h.toLowerCase().replace(/[_\s]/g, '') === 'tipo')
        const categoriaIndex = headers.findIndex(h => h.toLowerCase().replace(/[_\s]/g, '') === 'categoria')
        const subCategoriaIndex = headers.findIndex(h => {
          const hLower = h.toLowerCase().replace(/[_\s]/g, '')
          return hLower === 'subcategoria' || hLower === 'subcategoria'
        })
        const contaIndex = headers.findIndex(h => h.toLowerCase().replace(/[_\s]/g, '') === 'conta')

        if (idContaIndex === -1) {
          const availableHeaders = headers.join(', ')
          throw new Error(`Coluna ID_Conta não encontrada. Colunas disponíveis: ${availableHeaders}. Verifique o formato do arquivo.`)
        }

        debugInfo.push(`ID_Conta encontrado na coluna ${idContaIndex + 1}`)

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
          
          // Pular linhas completamente vazias
          if (values.every(v => !v || v.trim() === '')) {
            continue
          }

          // Verificar se tem pelo menos uma coluna (ID_Conta é obrigatório)
          if (values.length === 0 || idContaIndex >= values.length) {
            debugInfo.push(`Linha ${i + 1}: pulada - não tem colunas suficientes`)
            continue
          }

          // Função auxiliar para normalizar valores do plano de contas
          const normalizeAccountValue = (value: string | undefined): string => {
            if (!value) return ''
            try {
              let normalized = value.trim()
              // Normalizar para NFC (Canonical Composition)
              normalized = normalized.normalize('NFC')
              return normalized
            } catch (e) {
              return value.trim()
            }
          }

          const idConta = normalizeAccountValue(values[idContaIndex])
          
          // ID_Conta é obrigatório
          if (!idConta || idConta === '') {
            debugInfo.push(`Linha ${i + 1}: pulada - ID_Conta vazio`)
            continue
          }

          // Criar conta mesmo se outras colunas estiverem vazias
          accountPlan.push({
            ID_Conta: idConta,
            Natureza: naturezaIndex >= 0 && naturezaIndex < values.length ? normalizeAccountValue(values[naturezaIndex]) : '',
            Tipo: tipoIndex >= 0 && tipoIndex < values.length ? normalizeAccountValue(values[tipoIndex]) : '',
            Categoria: categoriaIndex >= 0 && categoriaIndex < values.length ? normalizeAccountValue(values[categoriaIndex]) : '',
            SubCategoria: subCategoriaIndex >= 0 && subCategoriaIndex < values.length ? normalizeAccountValue(values[subCategoriaIndex]) : '',
            Conta: contaIndex >= 0 && contaIndex < values.length ? normalizeAccountValue(values[contaIndex]) : '',
          })
        }

        // Debug: mostrar informações
        console.log('Debug info:', debugInfo)
        console.log('Contas processadas:', accountPlan.length)
        console.log('Primeiras contas:', accountPlan.slice(0, 3))

        if (accountPlan.length === 0) {
          const errorMsg = `Nenhuma conta válida encontrada no arquivo. ${debugInfo.length > 0 ? 'Detalhes: ' + debugInfo.slice(0, 5).join('; ') : 'Verifique se o arquivo tem o formato correto.'}`
          throw new Error(errorMsg)
        }

        await importAccountPlan(accountPlan)
        
        // Retornar informações do arquivo
        return { recordCount: accountPlan.length }
      } else {
        // Importar lançamentos
        const transactions: any[] = []
        const debugInfo: string[] = []

        // Debug: mostrar headers encontrados
        console.log('=== IMPORTAÇÃO DE LANÇAMENTOS ===')
        console.log('Headers encontrados:', headers)

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
          
          // Pular linhas completamente vazias
          if (values.every(v => !v || v.trim() === '')) {
            debugInfo.push(`Linha ${i + 1}: pulada - linha vazia`)
            continue
          }

          if (values.length < 2) {
            debugInfo.push(`Linha ${i + 1}: pulada - poucas colunas (${values.length})`)
            continue
          }

          const transaction: any = {}

          // Função auxiliar para normalizar valores
          const normalizeValue = (value: string | undefined): string => {
            if (!value) return ''
            // Normalizar Unicode e garantir UTF-8 válido
            try {
              let normalized = value.trim()
              // Normalizar para NFC (Canonical Composition)
              normalized = normalized.normalize('NFC')
              return normalized
            } catch (e) {
              return value.trim()
            }
          }

          // Mapear todas as colunas disponíveis
          headers.forEach((header, index) => {
            const headerLower = header.toLowerCase().replace(/[_\s]/g, '')
            const value = normalizeValue(values[index])
            
            if (headerLower === 'iditem' || headerLower === 'id_item') {
              transaction.Id_Item = value
            } else if (headerLower === 'natureza') {
              transaction.Natureza = value
            } else if (headerLower === 'tipo') {
              transaction.Tipo = value
            } else if (headerLower === 'categoria') {
              transaction.Categoria = value
            } else if (headerLower === 'subcategoria') {
              transaction.SubCategoria = value
            } else if (headerLower === 'operação' || headerLower === 'operacao') {
              transaction.Operação = value
            } else if (headerLower === 'origemdestino' || headerLower === 'origem|destino') {
              transaction['Origem|Destino'] = value
            } else if (headerLower === 'item') {
              transaction.Item = value
            } else if (headerLower === 'data') {
              // Converter data para formato YYYY-MM-DD se necessário
              let dateValue = value.trim()
              if (dateValue.includes('/')) {
                // Formato DD/MM/YYYY para YYYY-MM-DD
                const parts = dateValue.split('/')
                if (parts.length === 3) {
                  const [day, month, year] = parts
                  dateValue = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                }
              }
              transaction.Data = dateValue
            } else if (headerLower === 'valor') {
              // Converter valor para número
              const valorStr = value.replace(',', '.').trim()
              transaction.Valor = parseFloat(valorStr) || 0
            }
            // Compatibilidade com formato antigo
            else if (headerLower === 'date') {
              transaction.date = value
            } else if (headerLower === 'description') {
              transaction.description = value
            } else if (headerLower === 'amount') {
              transaction.amount = value
            } else if (headerLower === 'type') {
              transaction.type = value
            } else if (headerLower === 'category') {
              transaction.category = value
            }
          })

          // Validar se tem pelo menos Valor ou Item/description
          const hasValue = transaction.Valor || transaction.amount
          const hasDescription = transaction.Item || transaction.description
          
          if (!hasValue && !hasDescription) {
            debugInfo.push(`Linha ${i + 1}: pulada - sem Valor nem Item/description`)
            continue
          }

          // Log da transação processada
          console.log(`Linha ${i + 1} processada:`, {
            Id_Item: transaction.Id_Item,
            Item: transaction.Item,
            Valor: transaction.Valor,
            Data: transaction.Data
          })

          transactions.push(transaction)
        }

        console.log('Total de transações processadas:', transactions.length)
        console.log('Debug info:', debugInfo.slice(0, 10)) // Mostrar primeiros 10 erros

        if (transactions.length === 0) {
          const errorMsg = `Nenhuma transação válida encontrada no arquivo. ${debugInfo.length > 0 ? 'Detalhes: ' + debugInfo.slice(0, 10).join('; ') : 'Verifique se o arquivo tem o formato correto.'}`
          console.error('Erro na importação:', errorMsg)
          throw new Error(errorMsg)
        }

        console.log('Enviando transações para o backend...', transactions.slice(0, 3))

        const result = await importTransactions(transactions, !skipValidation)
        console.log('Resultado da importação:', result)
        
        if (result.errors && result.errors.length > 0) {
          console.error('Erros de validação:', result.errors)
          throw new Error(`Erros de validação: ${result.errors.slice(0, 3).join('; ')}`)
        }
        
        // Retornar informações do arquivo
        return { recordCount: transactions.length }
      }
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao processar arquivo')
    }
    
    return { recordCount: 0 }
  }

  const handleImportFiles = async () => {
    if (selectedFiles.length === 0) return

    setLoading(true)
    setError('')
    setSuccess('')
    setValidationErrors([])

    const allErrors: string[] = []
    const fileResults: Array<{ name: string; size: number; records: number }> = []
    let totalImported = 0
    let totalRecords = 0
    let filesWithErrors = 0

    try {
      setImportProgress({ current: 0, total: selectedFiles.length, fileName: '' })

      for (let i = 0; i < selectedFiles.length; i++) {
        const fileWithInfo = selectedFiles[i]
        const file = fileWithInfo.file
        setImportProgress({ current: i + 1, total: selectedFiles.length, fileName: file.name })

        try {
          const result = await processFile(file)
          const recordCount = result?.recordCount || 0
          totalImported++
          totalRecords += recordCount
          fileResults.push({ name: file.name, size: file.size, records: recordCount })
        } catch (err: any) {
          filesWithErrors++
          allErrors.push(`${file.name}: ${err.message || 'Erro desconhecido'}`)
          console.error(`Erro ao processar ${file.name}:`, err)
        }
      }

      // Sempre chamar onSuccess para recarregar dados, mesmo se houver alguns erros
      if (totalImported > 0) {
        const filesDetails = fileResults.map(f => 
          `${f.name} (${(f.size / 1024).toFixed(1)} KB, ${f.records} registro${f.records !== 1 ? 's' : ''})`
        ).join(', ')
        setSuccess(`✅ ${totalImported} de ${selectedFiles.length} arquivo(s) importado(s) com sucesso! Total: ${totalRecords} registro(s).\n\n📄 Arquivos: ${filesDetails}`)
        onSuccess() // Recarregar dados imediatamente se algum arquivo foi importado
      }

      if (allErrors.length > 0) {
        setValidationErrors(allErrors)
        if (totalImported === 0) {
          setError('Nenhum arquivo foi importado com sucesso.')
        }
      }

      // Fechar modal após um delay
      setTimeout(() => {
        if (allErrors.length === 0) {
          onClose()
        }
      }, allErrors.length > 0 ? 3000 : 1500)
    } catch (err: any) {
      setError(err.message || 'Erro ao importar arquivos')
      console.error(err)
    } finally {
      setLoading(false)
      setImportProgress({ current: 0, total: 0, fileName: '' })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const getTotalRecords = () => {
    return selectedFiles.reduce((sum, f) => sum + f.recordCount, 0)
  }

  const handleDownloadTemplate = () => {
    let template = ''
    let filename = ''

    if (importType === 'account-plan') {
      template = `ID_Conta,Natureza,Tipo,Categoria,SubCategoria,Conta
1,Receita,Operacional,Salários,Salário Mensal,Salário Base
2,Despesa,Operacional,Alimentação,Supermercado,Compras Mensais
3,Despesa,Operacional,Utilidades,Energia,Conta de Luz`
      filename = 'template_plano_contas.csv'
    } else {
      template = `Id_Item,Natureza,Tipo,Categoria,SubCategoria,Operação,Origem|Destino,Item,Data,Valor
1,Receita,Operacional,Salários,Salário Mensal,Entrada,Empresa,Salário Janeiro,2024-01-15,5000.00
2,Despesa,Operacional,Alimentação,Supermercado,Saída,Supermercado,Compras Semanais,2024-01-14,450.50
3,Despesa,Operacional,Utilidades,Energia,Saída,Companhia Elétrica,Conta de Luz,2024-01-13,280.00`
      filename = 'template_lancamentos.csv'
    }

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Importar Planilha</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="import-content">
          <div className="import-type-selector">
            <button
              type="button"
              className={`import-type-btn ${importType === 'account-plan' ? 'active' : ''}`}
              onClick={() => setImportType('account-plan')}
            >
              Plano de Contas
            </button>
            <button
              type="button"
              className={`import-type-btn ${importType === 'transactions' ? 'active' : ''}`}
              onClick={() => setImportType('transactions')}
            >
              Lançamentos
            </button>
          </div>

          <div className="import-instructions">
            <h3>Formato esperado (CSV)</h3>
            {importType === 'account-plan' ? (
              <>
                <p>O arquivo deve conter as seguintes colunas:</p>
                <ul>
                  <li><strong>ID_Conta</strong> - Identificador único da conta</li>
                  <li><strong>Natureza</strong> - Receita ou Despesa</li>
                  <li><strong>Tipo</strong> - Tipo da conta</li>
                  <li><strong>Categoria</strong> - Categoria principal</li>
                  <li><strong>SubCategoria</strong> - Subcategoria</li>
                  <li><strong>Conta</strong> - Nome da conta</li>
                </ul>
                <p className="import-note">⚠️ Importe o plano de contas antes dos lançamentos para habilitar validação.</p>
              </>
            ) : (
              <>
                <p>O arquivo deve conter as seguintes colunas:</p>
                <ul>
                  <li><strong>Id_Item</strong> - ID da conta do plano de contas (obrigatório para validação)</li>
                  <li><strong>Natureza</strong> - Receita ou Despesa</li>
                  <li><strong>Tipo</strong> - Tipo da operação</li>
                  <li><strong>Categoria</strong> - Categoria</li>
                  <li><strong>SubCategoria</strong> - Subcategoria</li>
                  <li><strong>Operação</strong> - Tipo de operação</li>
                  <li><strong>Origem|Destino</strong> - Origem ou destino</li>
                  <li><strong>Item</strong> - Descrição do lançamento</li>
                  <li><strong>Data</strong> - Data (YYYY-MM-DD ou DD/MM/YYYY)</li>
                  <li><strong>Valor</strong> - Valor numérico</li>
                </ul>
                <p className="import-note">ℹ️ O Id_Item será validado contra o plano de contas importado.</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={skipValidation}
                    onChange={(e) => setSkipValidation(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Desabilitar validação do plano de contas (debug)
                  </span>
                </label>
              </>
            )}
            
            <button 
              type="button" 
              className="btn-template" 
              onClick={handleDownloadTemplate}
            >
              📥 Baixar Template
            </button>
          </div>

          <div className="import-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              <Upload size={48} />
              <span>{loading ? 'Processando...' : 'Clique para selecionar arquivo(s) CSV'}</span>
              <small>ou arraste o(s) arquivo(s) aqui</small>
            </label>
          </div>

          {selectedFiles.length > 0 && !loading && (
            <div className="selected-files">
              <h4>Arquivos selecionados ({selectedFiles.length}) - Total: {getTotalRecords()} registro(s)</h4>
              <ul className="files-list">
                {selectedFiles.map((fileWithInfo, index) => (
                  <li key={index} className="file-item">
                    <span className="file-name">{fileWithInfo.file.name}</span>
                    <span className="file-size">({(fileWithInfo.file.size / 1024).toFixed(1)} KB, {fileWithInfo.recordCount} registro{fileWithInfo.recordCount !== 1 ? 's' : ''})</span>
                    <button 
                      type="button" 
                      className="btn-remove-file" 
                      onClick={() => removeFile(index)}
                      title="Remover arquivo"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button 
                type="button" 
                className="btn-import-files" 
                onClick={handleImportFiles}
              >
                Importar {selectedFiles.length} arquivo(s)
              </button>
            </div>
          )}

          {loading && importProgress.total > 0 && (
            <div className="import-progress">
              <div className="progress-info">
                <span>Importando {importProgress.current} de {importProgress.total}</span>
                <span className="current-file">{importProgress.fileName}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {error && (
            <div className="form-error">
              <strong>Erro:</strong> {error}
            </div>
          )}
          {success && (
            <div className="form-success" style={{ whiteSpace: 'pre-line' }}>
              {success}
            </div>
          )}
          {validationErrors.length > 0 && (
            <div className="form-error" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <strong>Erros de validação encontrados ({validationErrors.length}):</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px', maxHeight: '250px', overflowY: 'auto' }}>
                {validationErrors.map((err, idx) => (
                  <li key={idx} style={{ fontSize: '12px', marginTop: '4px', wordBreak: 'break-word' }}>{err}</li>
                ))}
              </ul>
              <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                💡 Abra o console do navegador (F12) para ver logs detalhados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportModal

