import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function EmpresaList({ onSelectCompany }) {
  const { empresas } = useDb();
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Filter and Search logic
  const filteredEmpresas = useMemo(() => {
    return empresas.filter(emp => {
      // Exclude cancelled companies
      if (emp.STATUS === 'C') return false;

      // 1. Search term match (CNPJ, Fantasia, Razao)
      const matchesSearch = 
        (emp.FANTASIA || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.RAZAO || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.CNPJ || '').includes(searchTerm);
      
      // 2. Status match
      const matchesStatus = 
        statusFilter === 'ALL' || 
        emp.STATUS === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [empresas, searchTerm, statusFilter]);

  // Reset page when search/filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

  // Status text & class helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'L':
        return <span className="badge active">Ativa (L)</span>;
      case 'C':
        return <span className="badge inactive">Cancelada (C)</span>;
      case 'S':
        return <span className="badge warning">Suspensa (S)</span>;
      default:
        return <span className="badge neutral">{status || 'N/A'}</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <h1>Lista de Empresas</h1>
          <p>Gerenciamento e busca de empresas cadastradas no CRM ({filteredEmpresas.length} de {empresas.length} empresas)</p>
        </div>
      </div>

      <div className="table-container">
        {/* Search and Filters bar */}
        <div className="table-header-controls">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por Nome Fantasia, Razão ou CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-wrapper">
            <Filter size={18} color="#64748b" />
            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Status:</span>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todas as Empresas</option>
              <option value="L">Somente Ativas (L)</option>
              <option value="S">Somente Suspensas (S)</option>
            </select>
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
                <th style={{ width: '150px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmpresas.length > 0 ? (
                paginatedEmpresas.map((emp) => (
                  <tr 
                    key={emp.COD_EMPRESA} 
                    onClick={() => onSelectCompany(emp.COD_EMPRESA)}
                  >
                    <td style={{ fontWeight: '600', color: '#2563eb' }}>#{emp.COD_EMPRESA}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{emp.FANTASIA || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                        {emp.RAZAO}
                      </div>
                    </td>
                    <td>{formatCNPJ(emp.CNPJ)}</td>
                    <td>{emp.MUNICIPIO || 'N/A'}</td>
                    <td>{getStatusBadge(emp.STATUS)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    Nenhuma empresa encontrada com os termos informados.
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
