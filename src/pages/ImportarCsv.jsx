import React, { useState } from 'react';
import { useDb } from '../context/DbContext';
import Papa from 'papaparse';
import { Upload, AlertCircle, CheckCircle2, Info, RefreshCw, FileSpreadsheet } from 'lucide-react';

export default function ImportarCsv() {
  const { importData, resetDatabase } = useDb();
  
  // Upload status states for the 5 files
  const [statuses, setStatuses] = useState({
    empresas: { loading: false, success: false, error: null, count: 0 },
    telefones: { loading: false, success: false, error: null, count: 0 },
    emails: { loading: false, success: false, error: null, count: 0 },
    faturamentos: { loading: false, success: false, error: null, count: 0 },
    bandeiras: { loading: false, success: false, error: null, count: 0 }
  });

  const updateStatus = (key, val) => {
    setStatuses(prev => ({
      ...prev,
      [key]: { ...prev[key], ...val }
    }));
  };

  // CSV Parsing helper functions
  const handleFileUpload = (type, file) => {
    if (!file) return;
    
    updateStatus(type, { loading: true, success: false, error: null, count: 0 });
    
    // Read file using FileReader to support CP1252/UTF-8 correctly
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      
      // If faturamento and has custom double-headers, we parse it manually/specially
      if (type === 'faturamentos' && text.includes('VENCIMENTO - Ano-mês')) {
        parseSpecialBillingCsv(text);
      } else {
        parseStandardCsv(type, text);
      }
    };
    
    reader.onerror = () => {
      updateStatus(type, { loading: false, error: 'Erro ao ler o arquivo no navegador.' });
    };

    // Read as UTF-8
    reader.readAsText(file, 'utf-8');
  };

  // Standard CSV parse (Empresas, Telefones, Emails, or Flat Billing)
  const parseStandardCsv = (type, text) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        if (rows.length === 0) {
          updateStatus(type, { loading: false, error: 'O arquivo CSV está vazio.' });
          return;
        }

        try {
          const formattedData = [];
          
          if (type === 'empresas') {
            rows.forEach((row, idx) => {
              const codEmp = parseInt(row.COD_EMPRESA || row.cod_empresa);
              if (isNaN(codEmp)) return;
              
              formattedData.push({
                COD_EMPRESA: codEmp,
                RAZAO: row.RAZAO || row.razao || '',
                FANTASIA: row.FANTASIA || row.fantasia || '',
                CNPJ: row.CNPJ || row.cnpj || '',
                LOGRADOURO: row.LOGRADOURO || row.logradouro || '',
                NUMERO: row.NUMERO || row.numero || '',
                COMPLEMENTO: row.COMPLEMENTO || row.complemento || '',
                BAIRRO: row.BAIRRO || row.bairro || '',
                MUNICIPIO: row.MUNICIPIO || row.municipio || '',
                CEP: row.CEP || row.cep || '',
                COD_BANDEIRA: row.COD_BANDEIRA || row.cod_bandeira || '',
                STATUS: row.STATUS || row.status || 'L',
                NUMERO_CARTOES_ATIVOS: parseInt(row.NUMERO_CARTOES_ATIVOS || row.numero_cartoes_ativos) || 0
              });
            });
          } 
          
          else if (type === 'telefones') {
            rows.forEach((row, idx) => {
              const codEmp = parseInt(row.COD_EMPRESA || row.cod_empresa);
              if (isNaN(codEmp)) return;
              
              formattedData.push({
                ID: `tel_imported_${Date.now()}_${idx}`,
                COD_EMPRESA: codEmp,
                DDD: row.DDD || row.ddd || '',
                NUMERO: row.NUMERO || row.numero || '',
                COD_TIPO: row.COD_TIPO || row.cod_tipo || ''
              });
            });
          } 
          
          else if (type === 'emails') {
            rows.forEach((row, idx) => {
              const codEmp = parseInt(row.COD_EMPRESA || row.cod_empresa);
              if (isNaN(codEmp)) return;
              
              const cleanEmail = row.EMAIL || row.email || '';
              if (!cleanEmail) return;
              
              const valFechto = row.EMAIL_FECHTO || row.email_fechto;
              const valNF = row.EMAIL_NOTA_FISCAL || row.email_nota_fiscal;
              
              formattedData.push({
                ID: `email_imported_${Date.now()}_${idx}`,
                COD_EMPRESA: codEmp,
                NOME: row.NOME || row.nome || '',
                EMAIL: cleanEmail,
                EMAIL_FECHTO: valFechto === 'S' || valFechto === 'true' || valFechto === '1' || valFechto === true,
                EMAIL_NOTA_FISCAL: valNF === 'S' || valNF === 'true' || valNF === '1' || valNF === true
              });
            });
          } 
          
          else if (type === 'faturamentos') {
            // Flat billing CSV support
            rows.forEach((row, idx) => {
              const codEmp = parseInt(row.COD_EMPRESA || row.cod_empresa);
              if (isNaN(codEmp)) return;
              
              const valorStr = row.VALOR || row.valor || '0';
              const cleanVal = valorStr.replace(/\./g, '').replace(',', '.');
              const parsedVal = parseFloat(cleanVal) || 0;
              
              formattedData.push({
                ID: `fat_imported_${Date.now()}_${idx}`,
                COD_EMPRESA: codEmp,
                TIPO: row.TIPO || row.tipo || '',
                BENEFICIO: row.BENEFICIO || row.beneficio || '',
                MES_REFERENCIA: row.MES_REFERENCIA || row.mes_referencia || '',
                DATA_VENCIMENTO: row.DATA_VENCIMENTO || row.data_vencimento || '',
                VALOR: parsedVal
              });
            });
          }
          
          else if (type === 'bandeiras') {
            rows.forEach((row, idx) => {
              const codBandeira = row.COD_BANDEIRA || row.cod_bandeira || '';
              if (!codBandeira) return;
              
              formattedData.push({
                COD_BANDEIRA: codBandeira,
                NOME: row.NOME || row.nome || ''
              });
            });
          }

          if (formattedData.length === 0) {
            updateStatus(type, { loading: false, error: 'Nenhum registro válido pôde ser importado. Verifique os cabeçalhos.' });
            return;
          }

          importData(type, formattedData);
          updateStatus(type, { loading: false, success: true, count: formattedData.length });
        } catch (err) {
          console.error(err);
          updateStatus(type, { loading: false, error: 'Erro ao processar as colunas do CSV.' });
        }
      },
      error: (error) => {
        updateStatus(type, { loading: false, error: `Erro no parse: ${error.message}` });
      }
    });
  };

  // Special unpivoting parser for double-header "Boleto em Colunas" billing CSV
  const parseSpecialBillingCsv = (text) => {
    try {
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length < 3) {
        updateStatus('faturamentos', { loading: false, error: 'Formato de faturamento em colunas inválido. Poucas linhas.' });
        return;
      }

      // Helper to parse line with quotes support
      const parseCsvLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i+1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      // Header months at row index 1 (line 2)
      // Columns index 6, 8, 10, 12, 14 represent the months
      const monthsLine = parseCsvLine(lines[1]);
      
      const periods = [];
      const columnsSearch = [6, 8, 10, 12, 14];
      columnsSearch.forEach(idx => {
        if (idx < monthsLine.length && monthsLine[idx]) {
          periods.push({
            colIdx: idx,
            month: monthsLine[idx].replace(/\.$/, '') // Remove trailing dot, e.g. "2026-mar." -> "2026-mar"
          });
        }
      });

      if (periods.length === 0) {
        updateStatus('faturamentos', { loading: false, error: 'Não foi possível encontrar as colunas de meses de vencimento.' });
        return;
      }

      const formattedFaturamentos = [];
      let rowIdx = 0;

      for (let r = 3; r < lines.length; r++) {
        const row = parseCsvLine(lines[r]);
        if (row.length < 6) continue;

        const codEmpresa = parseInt(row[0]);
        if (isNaN(codEmpresa)) continue;

        const beneficio = row[2] || '';
        const tipo = row[4] || '';

        periods.forEach(p => {
          if (p.colIdx < row.length) {
            const vencStr = row[p.colIdx];
            const valorStr = row[p.colIdx + 1];

            if (vencStr || valorStr) {
              // Convert vencStr from DD/MM/YYYY to YYYY-MM-DD
              let vencDate = '';
              if (vencStr) {
                const parts = vencStr.split('/');
                if (parts.length === 3) {
                  vencDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else {
                  vencDate = vencStr;
                }
              }

              // Parse valorStr from R$ 1.234,56 to float
              let valorNum = 0;
              if (valorStr) {
                const cleanVal = valorStr.replace(/\./g, '').replace(',', '.');
                valorNum = parseFloat(cleanVal) || 0;
              }

              formattedFaturamentos.push({
                ID: `fat_imported_${Date.now()}_${rowIdx++}`,
                COD_EMPRESA: codEmpresa,
                TIPO: tipo,
                BENEFICIO: beneficio,
                MES_REFERENCIA: p.month,
                DATA_VENCIMENTO: vencDate,
                VALOR: valorNum
              });
            }
          }
        });
      }

      importData('faturamentos', formattedFaturamentos);
      updateStatus('faturamentos', { loading: false, success: true, count: formattedFaturamentos.length });
    } catch (err) {
      console.error(err);
      updateStatus('faturamentos', { loading: false, error: 'Falha crítica ao desdobrar colunas de faturamento.' });
    }
  };

  const getDropzoneClass = (type) => {
    const status = statuses[type];
    if (status.loading) return "dropzone loading";
    if (status.success) return "dropzone success";
    if (status.error) return "dropzone error";
    return "dropzone";
  };

  const handleResetDb = () => {
    if (window.confirm("Deseja realmente limpar todas as importações e edições, redefinindo o banco de dados para os dados padrão das planilhas originais?")) {
      resetDatabase();
      alert("Banco de dados redefinido com sucesso!");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <h1>Importação de Dados (CSV)</h1>
          <p>Faça upload das planilhas CSV para atualizar a base de dados em tempo real</p>
        </div>
        
        <button className="btn btn-secondary" onClick={handleResetDb} style={{ color: '#ef4444' }}>
          <RefreshCw size={16} /> Redefinir Banco Padrão
        </button>
      </div>

      {/* Info card guidelines */}
      <div className="profile-card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Info color="var(--primary)" size={24} style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>Instruções de Importação</h3>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              Para integrar novos dados, utilize arquivos no formato <strong>CSV (.csv)</strong> separados por vírgula.
              O sistema irá ler as colunas de cabeçalho do arquivo para mapear os dados. Registros que compartilham chaves primárias existentes serão mesclados e atualizados automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Uploaders */}
      <div className="importer-grid">
        {/* empresas */}
        <div className="importer-card">
          <div className="importer-card-header">
            <div className="importer-icon">
              <FileSpreadsheet size={20} />
            </div>
            <div className="importer-card-title">
              <h3>1. Dados Empresas</h3>
              <p>Cadastro de Empresas e Endereço</p>
            </div>
          </div>
          
          <label className={getDropzoneClass('empresas')}>
            <Upload size={28} color={statuses.empresas.success ? 'var(--success)' : '#94a3b8'} />
            <span className="dropzone-text">Carregar CSV de Empresas</span>
            <span className="dropzone-subtext">COD_EMPRESA, RAZAO, FANTASIA, CNPJ, STATUS...</span>
            <input 
              type="file" 
              accept=".csv" 
              className="file-input" 
              onChange={(e) => handleFileUpload('empresas', e.target.files[0])}
              disabled={statuses.empresas.loading}
            />
          </label>

          {statuses.empresas.loading && <div className="import-status">Carregando e integrando registros...</div>}
          {statuses.empresas.success && (
            <div className="import-status" style={{ color: 'var(--success)', borderLeft: '3px solid var(--success)', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              Importado com sucesso! ({statuses.empresas.count} registros)
            </div>
          )}
          {statuses.empresas.error && (
            <div className="import-status" style={{ color: 'var(--danger)', borderLeft: '3px solid var(--danger)', backgroundColor: '#fef2f2' }}>
              <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              {statuses.empresas.error}
            </div>
          )}
        </div>

        {/* telefones */}
        <div className="importer-card">
          <div className="importer-card-header">
            <div className="importer-icon">
              <FileSpreadsheet size={20} />
            </div>
            <div className="importer-card-title">
              <h3>2. Contatos Telefones</h3>
              <p>Planilha de Telefones por Empresa</p>
            </div>
          </div>
          
          <label className={getDropzoneClass('telefones')}>
            <Upload size={28} color={statuses.telefones.success ? 'var(--success)' : '#94a3b8'} />
            <span className="dropzone-text">Carregar CSV de Telefones</span>
            <span className="dropzone-subtext">COD_EMPRESA, DDD, NUMERO, COD_TIPO</span>
            <input 
              type="file" 
              accept=".csv" 
              className="file-input" 
              onChange={(e) => handleFileUpload('telefones', e.target.files[0])}
              disabled={statuses.telefones.loading}
            />
          </label>

          {statuses.telefones.loading && <div className="import-status">Carregando e integrando registros...</div>}
          {statuses.telefones.success && (
            <div className="import-status" style={{ color: 'var(--success)', borderLeft: '3px solid var(--success)', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              Importado com sucesso! ({statuses.telefones.count} contatos)
            </div>
          )}
          {statuses.telefones.error && (
            <div className="import-status" style={{ color: 'var(--danger)', borderLeft: '3px solid var(--danger)', backgroundColor: '#fef2f2' }}>
              <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              {statuses.telefones.error}
            </div>
          )}
        </div>

        {/* emails */}
        <div className="importer-card">
          <div className="importer-card-header">
            <div className="importer-icon">
              <FileSpreadsheet size={20} />
            </div>
            <div className="importer-card-title">
              <h3>3. Contatos E-mails</h3>
              <p>Planilha de Responsáveis e E-mails</p>
            </div>
          </div>
          
          <label className={getDropzoneClass('emails')}>
            <Upload size={28} color={statuses.emails.success ? 'var(--success)' : '#94a3b8'} />
            <span className="dropzone-text">Carregar CSV de E-mails</span>
            <span className="dropzone-subtext">COD_EMPRESA, NOME, EMAIL, EMAIL_FECHTO...</span>
            <input 
              type="file" 
              accept=".csv" 
              className="file-input" 
              onChange={(e) => handleFileUpload('emails', e.target.files[0])}
              disabled={statuses.emails.loading}
            />
          </label>

          {statuses.emails.loading && <div className="import-status">Carregando e integrando registros...</div>}
          {statuses.emails.success && (
            <div className="import-status" style={{ color: 'var(--success)', borderLeft: '3px solid var(--success)', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              Importado com sucesso! ({statuses.emails.count} e-mails)
            </div>
          )}
          {statuses.emails.error && (
            <div className="import-status" style={{ color: 'var(--danger)', borderLeft: '3px solid var(--danger)', backgroundColor: '#fef2f2' }}>
              <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              {statuses.emails.error}
            </div>
          )}
        </div>

        {/* faturamentos */}
        <div className="importer-card">
          <div className="importer-card-header">
            <div className="importer-icon">
              <FileSpreadsheet size={20} />
            </div>
            <div className="importer-card-title">
              <h3>4. Histórico Faturamento</h3>
              <p>Planilha Boleto em Colunas / Flat</p>
            </div>
          </div>
          
          <label className={getDropzoneClass('faturamentos')}>
            <Upload size={28} color={statuses.faturamentos.success ? 'var(--success)' : '#94a3b8'} />
            <span className="dropzone-text">Carregar CSV de Faturamento</span>
            <span className="dropzone-subtext">Suporta modelo original (Desdobro Automático)</span>
            <input 
              type="file" 
              accept=".csv" 
              className="file-input" 
              onChange={(e) => handleFileUpload('faturamentos', e.target.files[0])}
              disabled={statuses.faturamentos.loading}
            />
          </label>

          {statuses.faturamentos.loading && <div className="import-status">Carregando e transpondo colunas em linhas...</div>}
          {statuses.faturamentos.success && (
            <div className="import-status" style={{ color: 'var(--success)', borderLeft: '3px solid var(--success)', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              Importado com sucesso! ({statuses.faturamentos.count} faturas)
            </div>
          )}
          {statuses.faturamentos.error && (
            <div className="import-status" style={{ color: 'var(--danger)', borderLeft: '3px solid var(--danger)', backgroundColor: '#fef2f2' }}>
              <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              {statuses.faturamentos.error}
            </div>
          )}
        </div>

        {/* bandeiras */}
        <div className="importer-card">
          <div className="importer-card-header">
            <div className="importer-icon">
              <FileSpreadsheet size={20} />
            </div>
            <div className="importer-card-title">
              <h3>5. Nomes de Bandeiras</h3>
              <p>Mapeamento de Código para Nome</p>
            </div>
          </div>
          
          <label className={getDropzoneClass('bandeiras')}>
            <Upload size={28} color={statuses.bandeiras.success ? 'var(--success)' : '#94a3b8'} />
            <span className="dropzone-text">Carregar CSV de Bandeiras</span>
            <span className="dropzone-subtext">COD_BANDEIRA, NOME</span>
            <input 
              type="file" 
              accept=".csv" 
              className="file-input" 
              onChange={(e) => handleFileUpload('bandeiras', e.target.files[0])}
              disabled={statuses.bandeiras.loading}
            />
          </label>

          {statuses.bandeiras.loading && <div className="import-status">Carregando e integrando registros...</div>}
          {statuses.bandeiras.success && (
            <div className="import-status" style={{ color: 'var(--success)', borderLeft: '3px solid var(--success)', backgroundColor: '#ecfdf5' }}>
              <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              Importado com sucesso! ({statuses.bandeiras.count} bandeiras)
            </div>
          )}
          {statuses.bandeiras.error && (
            <div className="import-status" style={{ color: 'var(--danger)', borderLeft: '3px solid var(--danger)', backgroundColor: '#fef2f2' }}>
              <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px', display: 'inline' }} />
              {statuses.bandeiras.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
