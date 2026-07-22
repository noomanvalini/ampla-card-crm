import React, { useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { FileDown, Download, Building2, Store } from 'lucide-react';

export default function ExportarCsv() {
  const { empresas, faturamentos, estabelecimentos, getBandeiraName } = useDb();

  // 1. Filtered active companies with movements (excluding July)
  const activeMovingCompanies = useMemo(() => {
    const activeIds = new Set(empresas.filter(e => e.STATUS === 'L').map(e => e.COD_EMPRESA));
    const movingIds = new Set();
    
    (faturamentos || []).forEach(f => {
      if (f.MES_REFERENCIA !== '2026-jul' && activeIds.has(f.COD_EMPRESA)) {
        movingIds.add(f.COD_EMPRESA);
      }
    });

    return empresas.filter(e => movingIds.has(e.COD_EMPRESA));
  }, [empresas, faturamentos]);

  // Helper: export CSV file
  const handleExportCSV = (type) => {
    if (type === 'empresas') {
      const headers = [
        'COD_EMPRESA', 
        'RAZAO_SOCIAL', 
        'NOME_FANTASIA', 
        'CNPJ', 
        'LOGRADOURO', 
        'NUMERO', 
        'COMPLEMENTO', 
        'BAIRRO', 
        'MUNICIPIO', 
        'CEP', 
        'COD_BANDEIRA', 
        'NOME_BANDEIRA',
        'STATUS', 
        'NUMERO_CARTOES_ATIVOS'
      ];

      const rows = activeMovingCompanies.map(e => [
        e.COD_EMPRESA,
        e.RAZAO || '',
        e.FANTASIA || '',
        e.CNPJ || '',
        e.LOGRADOURO || '',
        e.NUMERO || '',
        e.COMPLEMENTO || '',
        e.BAIRRO || '',
        e.MUNICIPIO || '',
        e.CEP || '',
        e.COD_BANDEIRA || '',
        getBandeiraName(e.COD_BANDEIRA),
        e.STATUS || '',
        e.NUMERO_CARTOES_ATIVOS || 0
      ]);

      downloadCSV('empresas_consolidadas.csv', headers, rows);
    } 
    
    else if (type === 'estabelecimentos') {
      const headers = [
        'CNPJ', 
        'ESTABELECIMENTO', 
        'MUNICIPIO', 
        'TIPO_ESTABELECIMENTO', 
        'TAXA_ADM_PERCENTUAL', 
        'VALOR_TOTAL_VENDAS', 
        'VALOR_TAXA_COBRADA', 
        'QUANTIDADE_VENDAS', 
        'QUANTIDADE_CARTOES_UTILIZADOS'
      ];

      const rows = estabelecimentos.map(e => [
        e.CNPJ || '',
        e.ESTABELECIMENTO || '',
        e.MUNICIPIO || '',
        e.TIPO || '',
        // Format decimal values with comma for PT-BR Excel compatibility
        String(e.TAXA_ADM || 0).replace('.', ','),
        String(e.VALOR_TOTAL || 0).replace('.', ','),
        String(e.VALOR_TAXA || 0).replace('.', ','),
        e.QUANTIDADE_VENDAS || 0,
        e.QUANTIDADE_CARTOES || 0
      ]);

      downloadCSV('estabelecimentos_consolidados.csv', headers, rows);
    }
  };

  const downloadCSV = (filename, headers, rows) => {
    // UTF-8 BOM to ensure accents and characters are shown correctly in Excel
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(row => row.map(val => {
        const clean = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
        // Wrap in quotes if contains semicolon, comma, or newlines
        return clean.includes(';') || clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
      }).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <h1>Exportar Dados</h1>
          <p>Exportação consolidada de bases de dados do CRM em formato CSV compatível com Excel</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Export Companies */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="chart-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-container blue" style={{ width: '36px', height: '36px', borderRadius: '8px' }}>
                <Building2 size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Base de Empresas</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Ativas com movimentação</p>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Gera um arquivo de planilha consolidado contendo as <strong>{activeMovingCompanies.length}</strong> empresas ativas com movimentações financeiras registradas (dados do mês de Julho/2026 foram desconsiderados por estar em aberto).
              </p>
              <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Colunas incluídas:</span>
                <code style={{ fontSize: '11px', color: '#475569', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  COD_EMPRESA, RAZAO_SOCIAL, NOME_FANTASIA, CNPJ, MUNICIPIO, COD_BANDEIRA, NOME_BANDEIRA, CARTOES_ATIVOS...
                </code>
              </div>
            </div>

            <button 
              className="pagination-btn" 
              onClick={() => handleExportCSV('empresas')}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                backgroundColor: '#2563eb', 
                color: '#fff', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              <Download size={16} />
              Exportar Empresas (.csv)
            </button>
          </div>
        </div>

        {/* Export Establishments */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="chart-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="kpi-icon-container orange" style={{ width: '36px', height: '36px', borderRadius: '8px' }}>
                <Store size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Base de Estabelecimentos</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Todos os credenciados</p>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                Gera um arquivo contendo os <strong>{estabelecimentos.length}</strong> estabelecimentos credenciados e sua respectiva volumetria de vendas consolidada, taxas aplicadas e cartões utilizados.
              </p>
              <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Colunas incluídas:</span>
                <code style={{ fontSize: '11px', color: '#475569', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  CNPJ, ESTABELECIMENTO, MUNICIPIO, TIPO_ESTABELECIMENTO, TAXA_ADM, VALOR_TOTAL, VALOR_TAXA, QTD_VENDAS...
                </code>
              </div>
            </div>

            <button 
              className="pagination-btn" 
              onClick={() => handleExportCSV('estabelecimentos')}
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                backgroundColor: '#ea580c', 
                color: '#fff', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c2410c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ea580c'}
            >
              <Download size={16} />
              Exportar Estabelecimentos (.csv)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
