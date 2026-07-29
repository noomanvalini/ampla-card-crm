import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Flag } from 'lucide-react';

export default function BandeiraList() {
  const { bandeiras, empresas, faturamentos } = useDb();

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

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

  // 3. Aggregate company stats by bandeira code
  const bandeiraStats = useMemo(() => {
    const stats = {};
    activeMovingCompanies.forEach(emp => {
      const bandCode = emp.COD_BANDEIRA;
      if (!bandCode) return;

      if (!stats[bandCode]) {
        stats[bandCode] = {
          companyCount: 0,
          totalCards: 0,
          titulares: 0,
          dependentes: 0
        };
      }

      stats[bandCode].companyCount += 1;
      stats[bandCode].totalCards += (emp.TOTAL_CARTOES || 0);
      stats[bandCode].titulares += (emp.QTD_TITULARES || 0);
      stats[bandCode].dependentes += (emp.QTD_DEPENDENTES || 0);
    });
    return stats;
  }, [activeMovingCompanies]);

  // 4. Map stats onto bandeiras list and filter to only show moving ones
  const filteredBandeiras = useMemo(() => {
    const list = (bandeiras || [])
      .filter(b => bandeiraStats[b.COD_BANDEIRA] !== undefined)
      .map(b => {
        const stat = bandeiraStats[b.COD_BANDEIRA];
        return {
          ...b,
          companyCount: stat.companyCount,
          totalCards: stat.totalCards,
          titulares: stat.titulares,
          dependentes: stat.dependentes
        };
      });

    // Search term matching
    return list.filter(b => 
      (b.NOME || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.COD_BANDEIRA || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bandeiras, bandeiraStats, searchTerm]);

  // 5. Sorting logic
  const sortedBandeiras = useMemo(() => {
    const sorted = [...filteredBandeiras];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Fallback for nulls or undefined
      if (valA === undefined || valA === null) valA = (typeof valB === 'number') ? 0 : '';
      if (valB === undefined || valB === null) valB = (typeof valA === 'number') ? 0 : '';

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
  }, [filteredBandeiras, sortField, sortDirection]);

  // Reset page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedBandeiras.length / itemsPerPage));
  
  const paginatedBandeiras = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedBandeiras.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedBandeiras, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

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
          <p>Consolidado operacional de bandeiras vinculadas a empresas com movimentações no CRM.</p>
        </div>
      </div>

      <div className="table-container">
        {/* Control Toolbar */}
        <div className="table-header-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Search box */}
          <div className="search-wrapper" style={{ flexGrow: 1, minWidth: '280px' }}>
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por nome ou código da bandeira..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th 
                  onClick={() => requestSort('COD_BANDEIRA')} 
                  style={{ width: '130px', cursor: 'pointer', userSelect: 'none' }}
                >
                  Código {getSortIcon('COD_BANDEIRA')}
                </th>
                <th 
                  onClick={() => requestSort('NOME')} 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome da Bandeira {getSortIcon('NOME')}
                </th>
                <th 
                  onClick={() => requestSort('companyCount')} 
                  style={{ width: '150px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                >
                  Qtd. Empresas {getSortIcon('companyCount')}
                </th>
                <th 
                  onClick={() => requestSort('totalCards')} 
                  style={{ width: '150px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                >
                  Cartões Totais {getSortIcon('totalCards')}
                </th>
                <th 
                  onClick={() => requestSort('titulares')} 
                  style={{ width: '150px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                >
                  Titulares {getSortIcon('titulares')}
                </th>
                <th 
                  onClick={() => requestSort('dependentes')} 
                  style={{ width: '150px', cursor: 'pointer', userSelect: 'none', textAlign: 'center' }}
                >
                  Dependentes {getSortIcon('dependentes')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedBandeiras.length > 0 ? (
                paginatedBandeiras.map((b) => (
                  <tr key={b.COD_BANDEIRA} style={{ cursor: 'default' }}>
                    <td style={{ fontWeight: '600', color: '#2563eb' }}># {b.COD_BANDEIRA}</td>
                    <td style={{ fontWeight: '600' }}>{b.NOME || 'N/A'}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600', color: '#475569' }}>
                      {b.companyCount}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>
                      {b.totalCards}
                    </td>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>
                      {b.titulares}
                    </td>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>
                      {b.dependentes}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    Nenhuma bandeira encontrada com os termos informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <div>
              Mostrando registros <strong>{Math.min(sortedBandeiras.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(sortedBandeiras.length, currentPage * itemsPerPage)}</strong> de <strong>{sortedBandeiras.length}</strong>
            </div>

            <div className="pagination-buttons">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Anterior
              </button>

              <span style={{ alignSelf: 'center', margin: '0 8px', fontWeight: '500' }}>
                Página {currentPage} de {totalPages}
              </span>

              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight size={16} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
