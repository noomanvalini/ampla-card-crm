import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, MapPin, Calendar } from 'lucide-react';

const monthOptions = [
  { value: '2026-mar', label: 'Março/2026' },
  { value: '2026-abr', label: 'Abril/2026' },
  { value: '2026-mai', label: 'Maio/2026' },
  { value: '2026-jun', label: 'Junho/2026' }
];

export default function MovimentacaoCidadeEmpresa() {
  const { empresas, faturamentos } = useDb();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-jun');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Sorting state (defaults to sorting by VALOR desc for "maior faturamento")
  const [sortField, setSortField] = useState('VALOR');
  const [sortDirection, setSortDirection] = useState('desc');

  // Group faturamentos of active companies by their city and selected month
  const cityMovements = useMemo(() => {
    // 1. Create a map of active company ID -> city name
    const companyCityMap = new Map();
    empresas.forEach(emp => {
      if (emp.STATUS === 'L') {
        companyCityMap.set(emp.COD_EMPRESA, emp.MUNICIPIO || 'Desconhecido');
      }
    });

    // 2. Sum faturamentos by city (filtered by selectedMonth)
    const groups = {};
    faturamentos.forEach(fat => {
      if (fat.MES_REFERENCIA === selectedMonth) {
        const city = companyCityMap.get(fat.COD_EMPRESA);
        if (city) {
          if (!groups[city]) {
            groups[city] = {
              MUNICIPIO: city,
              VALOR: 0,
              EMPRESAS_COUNT: new Set()
            };
          }
          groups[city].VALOR += fat.VALOR || 0;
          groups[city].EMPRESAS_COUNT.add(fat.COD_EMPRESA);
        }
      }
    });

    // Convert to array and map company count
    return Object.values(groups).map(g => ({
      MUNICIPIO: g.MUNICIPIO,
      VALOR: parseFloat(g.VALOR.toFixed(2)),
      EMPRESAS_COUNT: g.EMPRESAS_COUNT.size
    }));
  }, [empresas, faturamentos, selectedMonth]);

  // Search filter logic
  const searchedCities = useMemo(() => {
    return cityMovements.filter(cityGroup => {
      const name = cityGroup.MUNICIPIO.toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search);
    });
  }, [cityMovements, searchTerm]);

  // Sort logic
  const sortedCities = useMemo(() => {
    const sorted = [...searchedCities];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle string comparisons (City Name)
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      // Handle numeric comparisons
      valA = valA || 0;
      valB = valB || 0;
      return sortDirection === 'asc' 
        ? valA - valB 
        : valB - valA;
    });
    return sorted;
  }, [searchedCities, sortField, sortDirection]);

  // Reset page when search or sort or month changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection, selectedMonth]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedCities.length / itemsPerPage));
  const paginatedCities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCities.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCities, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // Toggle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'MUNICIPIO' ? 'asc' : 'desc');
    }
  };

  // Sort Indicator Render helper
  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} style={{ marginLeft: '6px', color: '#94a3b8', verticalAlign: 'middle' }} />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp size={14} style={{ marginLeft: '6px', color: '#2563eb', verticalAlign: 'middle' }} />
      : <ChevronDown size={14} style={{ marginLeft: '6px', color: '#2563eb', verticalAlign: 'middle' }} />;
  };

  // Helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getMonthLabel = (val) => {
    const opt = monthOptions.find(o => o.value === val);
    return opt ? opt.label : val;
  };

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <h1>Movimentação de Empresas por Cidade</h1>
          <p>Consolidado de movimentação mensal das empresas clientes agrupado por município em <strong>{getMonthLabel(selectedMonth)}</strong></p>
        </div>
      </div>

      <div className="table-container">
        {/* Controls bar */}
        <div className="table-header-controls" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="search-wrapper" style={{ flexGrow: 1, minWidth: '280px', maxWidth: '400px' }}>
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por Cidade..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-wrapper" style={{ gap: '12px' }}>
            <Calendar size={18} color="#64748b" />
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Mês de Referência:</span>
            <select 
              className="filter-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '14px', fontWeight: '500', color: '#0f172a', outline: 'none' }}
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table representation */}
        <div className="data-table-wrapper">
          <table className="data-table" style={{ cursor: 'default' }}>
            <thead>
              <tr style={{ cursor: 'pointer' }}>
                <th onClick={() => handleSort('MUNICIPIO')} style={{ select: 'none' }}>
                  Cidade {renderSortIndicator('MUNICIPIO')}
                </th>
                <th onClick={() => handleSort('EMPRESAS_COUNT')} style={{ textAlign: 'center', width: '220px', select: 'none' }}>
                  Empresas Movimentando {renderSortIndicator('EMPRESAS_COUNT')}
                </th>
                <th onClick={() => handleSort('VALOR')} style={{ textAlign: 'right', width: '280px', select: 'none' }}>
                  Movimentação Total {renderSortIndicator('VALOR')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCities.length > 0 ? (
                paginatedCities.map((cityGroup) => (
                  <tr key={cityGroup.MUNICIPIO} style={{ cursor: 'default' }}>
                    <td style={{ fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 12px' }}>
                      <MapPin size={16} color="#64748b" />
                      {cityGroup.MUNICIPIO}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '500' }}>
                      {cityGroup.EMPRESAS_COUNT.toLocaleString('pt-BR')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#2563eb', fontSize: '15px' }}>
                      {formatCurrency(cityGroup.VALOR)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    Nenhuma cidade com movimentação ativa em {getMonthLabel(selectedMonth)}.
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
              Mostrando <strong>{Math.min(sortedCities.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(sortedCities.length, currentPage * itemsPerPage)}</strong> de <strong>{sortedCities.length}</strong> cidades
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
