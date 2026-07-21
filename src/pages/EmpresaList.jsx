import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function EmpresaList({ onSelectCompany }) {
  const { empresas, faturamentos } = useDb();
  
  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Group faturamentos to see who has movements (excluding July 2026)
  const movingCompanyIds = useMemo(() => {
    return new Set(
      (faturamentos || [])
        .filter(f => f.MES_REFERENCIA !== '2026-jul')
        .map(f => f.COD_EMPRESA)
    );
  }, [faturamentos]);

  // Filter and Search logic
  const filteredEmpresas = useMemo(() => {
    return empresas.filter(emp => {
      // Exclude cancelled (C) and suspended (S) companies - show only Active (L)
      if (emp.STATUS !== 'L') return false;

      // Show ONLY companies with active movements/billing (excluding July)
      if (!movingCompanyIds.has(emp.COD_EMPRESA)) return false;

      // Search term match (CNPJ, Fantasia, Razao)
      const matchesSearch = 
        (emp.FANTASIA || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.RAZAO || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.CNPJ || '').includes(searchTerm);
      
      return matchesSearch;
    });
  }, [empresas, movingCompanyIds, searchTerm]);

  // Reset page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredEmpresas.length / itemsPerPage));
  
  const paginatedEmpresas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmpresas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmpresas, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0); // Scroll to top of table
    }
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
        {/* Search bar */}
        <div className="table-header-controls" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="search-wrapper" style={{ flexGrow: 1, minWidth: '280px' }}>
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por Nome Fantasia, Razão ou CNPJ de empresas movimentando..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Código</th>
                <th>Nome Fantasia</th>
                <th>CNPJ</th>
                <th>Município</th>
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
                      <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                        {emp.RAZAO}
                      </div>
                    </td>
                    <td>{formatCNPJ(emp.CNPJ)}</td>
                    <td>{emp.MUNICIPIO || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    Nenhuma empresa movimentando encontrada com os termos informados.
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
              Mostrando registros <strong>{Math.min(filteredEmpresas.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredEmpresas.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredEmpresas.length}</strong>
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
