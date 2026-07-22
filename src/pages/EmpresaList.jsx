import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function EmpresaList({ onSelectCompany }) {
  const { empresas, faturamentos } = useDb();
  
  // Search, Filter and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClosingDay, setSelectedClosingDay] = useState('');
  const [selectedPaymentDay, setSelectedPaymentDay] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Sorting state (defaults to sorting by DIA_FECHAMENTO ascending)
  const [sortField, setSortField] = useState('DIA_FECHAMENTO');
  const [sortDirection, setSortDirection] = useState('asc');

  // Group faturamentos to see who has movements (excluding July 2026)
  const movingCompanyIds = useMemo(() => {
    return new Set(
      (faturamentos || [])
        .filter(f => f.MES_REFERENCIA !== '2026-jul')
        .map(f => f.COD_EMPRESA)
    );
  }, [faturamentos]);

  // Extract unique closing days for filters dropdown
  const closingDays = useMemo(() => {
    const days = new Set();
    empresas.forEach(e => {
      if (e.STATUS === 'L' && movingCompanyIds.has(e.COD_EMPRESA) && e.DIA_FECHAMENTO) {
        days.add(e.DIA_FECHAMENTO);
      }
    });
    return Array.from(days).sort((a, b) => a - b);
  }, [empresas, movingCompanyIds]);

  // Extract unique payment days for filters dropdown
  const paymentDays = useMemo(() => {
    const days = new Set();
    empresas.forEach(e => {
      if (e.STATUS === 'L' && movingCompanyIds.has(e.COD_EMPRESA) && e.DIA_PAGAMENTO) {
        days.add(e.DIA_PAGAMENTO);
      }
    });
    return Array.from(days).sort((a, b) => a - b);
  }, [empresas, movingCompanyIds]);

  // Filter and Search logic
  const filteredEmpresas = useMemo(() => {
    return empresas.filter(emp => {
      // Exclude cancelled (C) and suspended (S) companies - show only Active (L)
      if (emp.STATUS !== 'L') return false;

      // Show ONLY companies with active movements/billing (excluding July)
      if (!movingCompanyIds.has(emp.COD_EMPRESA)) return false;

      // Filter by selected closing day
      if (selectedClosingDay && emp.DIA_FECHAMENTO !== parseInt(selectedClosingDay)) return false;

      // Filter by selected payment day
      if (selectedPaymentDay && emp.DIA_PAGAMENTO !== parseInt(selectedPaymentDay)) return false;

      // Filter by selected payment type
      if (selectedType && emp.TIPO_PAGAMENTO !== selectedType) return false;

      // Search term match (CNPJ, Fantasia, Razao)
      const matchesSearch = 
        (emp.FANTASIA || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.RAZAO || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.CNPJ || '').includes(searchTerm);
      
      return matchesSearch;
    });
  }, [empresas, movingCompanyIds, searchTerm, selectedClosingDay, selectedPaymentDay, selectedType]);

  // Sorting logic
  const sortedEmpresas = useMemo(() => {
    const sorted = [...filteredEmpresas];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      // Fallback for nulls or undefined
      if (valA === undefined || valA === null) valA = (typeof valB === 'number') ? 999 : '';
      if (valB === undefined || valB === null) valB = (typeof valA === 'number') ? 999 : '';
      
      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        // Numeric sort for COD_EMPRESA, DIA_FECHAMENTO and DIA_PAGAMENTO
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });
    return sorted;
  }, [filteredEmpresas, sortField, sortDirection]);

  // Reset page when search or filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClosingDay, selectedPaymentDay, selectedType]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedEmpresas.length / itemsPerPage));
  
  const paginatedEmpresas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEmpresas.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEmpresas, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0); // Scroll to top of table
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

  // CNPJ Formatter helper
  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 0) return '';
    
    if (clean.length <= 11) {
      const padded = clean.padStart(11, '0');
      return padded.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    }
    
    const padded = clean.padStart(14, '0');
    return padded.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <h1>Lista de Empresas</h1>
          <p>Exibindo empresas ativas com movimentações financeiras.</p>
        </div>
      </div>

      <div className="table-container">
        {/* Search and Filters bar */}
        <div className="table-header-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          
          {/* Search box */}
          <div className="search-wrapper" style={{ flexGrow: 3, minWidth: '240px' }}>
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por Nome Fantasia, Razão ou CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Closing Day Filter */}
          <div style={{ flexGrow: 1, minWidth: '160px' }}>
            <select
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                color: '#0f172a',
                fontSize: '14px',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer'
              }}
              value={selectedClosingDay}
              onChange={(e) => setSelectedClosingDay(e.target.value)}
            >
              <option value="">Fec. (Todos)</option>
              {closingDays.map(day => (
                <option key={day} value={day}>Fec. Dia {day}</option>
              ))}
            </select>
          </div>

          {/* Payment Day Filter */}
          <div style={{ flexGrow: 1, minWidth: '160px' }}>
            <select
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                color: '#0f172a',
                fontSize: '14px',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer'
              }}
              value={selectedPaymentDay}
              onChange={(e) => setSelectedPaymentDay(e.target.value)}
            >
              <option value="">Pag. (Todos)</option>
              {paymentDays.map(day => (
                <option key={day} value={day}>Pag. Dia {day}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ flexGrow: 1, minWidth: '160px' }}>
            <select
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                color: '#0f172a',
                fontSize: '14px',
                fontWeight: '500',
                outline: 'none',
                cursor: 'pointer'
              }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Tipo (Todos)</option>
              <option value="Pós-Pago">Pós-Pago</option>
              <option value="Pré-Pago">Pré-Pago</option>
            </select>
          </div>

        </div>

        {/* Table representation */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th 
                  onClick={() => requestSort('COD_EMPRESA')} 
                  style={{ width: '100px', cursor: 'pointer', userSelect: 'none' }}
                >
                  Código {getSortIcon('COD_EMPRESA')}
                </th>
                <th 
                  onClick={() => requestSort('FANTASIA')} 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome Fantasia {getSortIcon('FANTASIA')}
                </th>
                <th>CNPJ</th>
                <th 
                  onClick={() => requestSort('MUNICIPIO')} 
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Município {getSortIcon('MUNICIPIO')}
                </th>
                <th 
                  onClick={() => requestSort('DIA_FECHAMENTO')} 
                  style={{ width: '100px', cursor: 'pointer', userSelect: 'none' }}
                  title="Fechamento"
                >
                  Fec. {getSortIcon('DIA_FECHAMENTO')}
                </th>
                <th 
                  onClick={() => requestSort('DIA_PAGAMENTO')} 
                  style={{ width: '100px', cursor: 'pointer', userSelect: 'none' }}
                  title="Pagamento"
                >
                  Pag. {getSortIcon('DIA_PAGAMENTO')}
                </th>
                <th 
                  onClick={() => requestSort('TIPO_PAGAMENTO')} 
                  style={{ width: '120px', cursor: 'pointer', userSelect: 'none' }}
                >
                  Tipo {getSortIcon('TIPO_PAGAMENTO')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmpresas.length > 0 ? (
                paginatedEmpresas.map((emp) => (
                  <tr 
                    key={emp.COD_EMPRESA} 
                    onClick={() => onSelectCompany(emp.COD_EMPRESA)}
                  >
                    <td style={{ fontWeight: '600', color: '#2563eb' }}># {emp.COD_EMPRESA}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{emp.FANTASIA || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                        {emp.RAZAO}
                      </div>
                    </td>
                    <td>{formatCNPJ(emp.CNPJ)}</td>
                    <td>{emp.MUNICIPIO || 'N/A'}</td>
                    <td title="Fechamento" style={{ fontWeight: '600', color: '#0f172a' }}>
                      {emp.DIA_FECHAMENTO ? `Dia ${emp.DIA_FECHAMENTO}` : 'N/A'}
                    </td>
                    <td title="Pagamento" style={{ fontWeight: '600', color: '#0f172a' }}>
                      {emp.DIA_PAGAMENTO ? `Dia ${emp.DIA_PAGAMENTO}` : 'N/A'}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: emp.TIPO_PAGAMENTO === 'Pós-Pago' ? '#eff6ff' : emp.TIPO_PAGAMENTO === 'Pré-Pago' ? '#f0fdf4' : '#f1f5f9',
                        color: emp.TIPO_PAGAMENTO === 'Pós-Pago' ? '#2563eb' : emp.TIPO_PAGAMENTO === 'Pré-Pago' ? '#16a34a' : '#475569',
                        border: emp.TIPO_PAGAMENTO === 'Pós-Pago' ? '1px solid #bfdbfe' : emp.TIPO_PAGAMENTO === 'Pré-Pago' ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        textTransform: 'uppercase',
                        display: 'inline-block'
                      }}>
                        {emp.TIPO_PAGAMENTO || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    Nenhuma empresa encontrada com os filtros informados.
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
              Mostrando registros <strong>{Math.min(sortedEmpresas.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(sortedEmpresas.length, currentPage * itemsPerPage)}</strong> de <strong>{sortedEmpresas.length}</strong>
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
