import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { ArrowUpDown, ArrowUp, ArrowDown, Flag } from 'lucide-react';

export default function BandeiraList() {
  const { empresas, faturamentos } = useDb();

  // Sorting state (defaults to sorting by Name ascending)
  const [sortField, setSortField] = useState('NOME');
  const [sortDirection, setSortDirection] = useState('asc');

  // 1. Group faturamentos to see who has movements (excluding July 2026)
  const movingCompanyIds = useMemo(() => {
    return new Set(
      (faturamentos || [])
        .filter(f => f.MES_REFERENCIA !== '2026-jul')
        .map(f => f.COD_EMPRESA)
    );
  }, [faturamentos]);

  // 2. Filter active companies with movements
  const activeMovingCompanies = useMemo(() => {
    return empresas.filter(e => e.STATUS === 'L' && movingCompanyIds.has(e.COD_EMPRESA));
  }, [empresas, movingCompanyIds]);

  // 3. Aggregate stats into only two categories: Ampla Alimentação (COD_BANDEIRA === '2') and Ampla Convênio (others)
  const aggregatedData = useMemo(() => {
    let alimentacao = { totalCards: 0, titulares: 0, dependentes: 0 };
    let convenio = { totalCards: 0, titulares: 0, dependentes: 0 };

    activeMovingCompanies.forEach(emp => {
      const bandCode = emp.COD_BANDEIRA;
      if (!bandCode) return; // Skip if no bandeira is linked

      if (bandCode === '2') {
        alimentacao.totalCards += (emp.TOTAL_CARTOES || 0);
        alimentacao.titulares += (emp.QTD_TITULARES || 0);
        alimentacao.dependentes += (emp.QTD_DEPENDENTES || 0);
      } else {
        convenio.totalCards += (emp.TOTAL_CARTOES || 0);
        convenio.titulares += (emp.QTD_TITULARES || 0);
        convenio.dependentes += (emp.QTD_DEPENDENTES || 0);
      }
    });

    return [
      {
        id: 'alimentacao',
        NOME: 'Ampla Alimentação',
        totalCards: alimentacao.totalCards,
        titulares: alimentacao.titulares,
        dependentes: alimentacao.dependentes
      },
      {
        id: 'convenio',
        NOME: 'Ampla Convênio',
        totalCards: convenio.totalCards,
        titulares: convenio.titulares,
        dependentes: convenio.dependentes
      }
    ];
  }, [activeMovingCompanies]);

  // 4. Sorting logic
  const sortedBandeiras = useMemo(() => {
    const sorted = [...aggregatedData];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        // Numeric sort
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });
    return sorted;
  }, [aggregatedData, sortField, sortDirection]);

  const requestSort = (field) => {
    let direction = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    setSortField(field);
    setSortDirection(direction);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} style={{ marginLeft: '4px', color: '#94a3b8', verticalAlign: 'middle' }} />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={13} style={{ marginLeft: '4px', color: '#2563eb', verticalAlign: 'middle' }} />
      : <ArrowDown size={13} style={{ marginLeft: '4px', color: '#2563eb', verticalAlign: 'middle' }} />;
  };

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="kpi-icon-container blue" style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Flag size={20} />
            </div>
            <h1>Bandeiras Operadoras</h1>
          </div>
          <p>Consolidado operacional simplificado de bandeiras vinculadas a empresas com movimentações no CRM.</p>
        </div>
      </div>

      <div className="table-container">
        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th 
                  onClick={() => requestSort('NOME')} 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome da Bandeira {getSortIcon('NOME')}
                </th>
                <th 
                  onClick={() => requestSort('totalCards')} 
                  style={{ width: '200px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                >
                  Cartões Totais {getSortIcon('totalCards')}
                </th>
                <th 
                  onClick={() => requestSort('titulares')} 
                  style={{ width: '200px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                >
                  Titulares {getSortIcon('titulares')}
                </th>
                <th 
                  onClick={() => requestSort('dependentes')} 
                  style={{ width: '200px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                >
                  Dependentes {getSortIcon('dependentes')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBandeiras.map((b) => (
                <tr key={b.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: '600', fontSize: '15px' }}>{b.NOME}</td>
                  <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                    {b.totalCards}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '14px', color: '#475569' }}>
                    {b.titulares}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '14px', color: '#475569' }}>
                    {b.dependentes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
