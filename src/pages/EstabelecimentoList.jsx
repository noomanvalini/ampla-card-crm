import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

export default function EstabelecimentoList() {
  const { estabelecimentos } = useDb();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Sorting state (defaults to sorting by VALOR_TOTAL desc for "mais vendas")
  const [sortField, setSortField] = useState('VALOR_TOTAL');
  const [sortDirection, setSortDirection] = useState('desc');

  // Search filter logic
  const searchedEstabelecimentos = useMemo(() => {
    return estabelecimentos.filter(est => {
      const name = (est.ESTABELECIMENTO || '').toLowerCase();
      const city = (est.MUNICIPIO || '').toLowerCase();
      const type = (est.TIPO || '').toLowerCase();
      const cnpj = (est.CNPJ || '');
      const search = searchTerm.toLowerCase();

      return name.includes(search) || city.includes(search) || type.includes(search) || cnpj.includes(search);
    });
  }, [estabelecimentos, searchTerm]);

  // Sort logic
  const sortedEstabelecimentos = useMemo(() => {
    const sorted = [...searchedEstabelecimentos];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle string comparisons
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
  }, [searchedEstabelecimentos, sortField, sortDirection]);

  // Reset page when search or sort changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sortedEstabelecimentos.length / itemsPerPage));
  const paginatedEstabelecimentos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEstabelecimentos.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEstabelecimentos, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // Toggle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to desc for numeric, asc for strings
      setSortField(field);
      setSortDirection(field === 'VALOR_TOTAL' || field === 'QUANTIDADE_VENDAS' ? 'desc' : 'asc');
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

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const clean = cnpj.replace(/\D/g, '');
    const padded = clean.padStart(14, '0');
    return padded.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <h1>Lista de Estabelecimentos</h1>
          <p>Gerenciamento, filtragem e ordenação comercial dos estabelecimentos parceiros ({sortedEstabelecimentos.length} de {estabelecimentos.length} credenciados)</p>
        </div>
      </div>

      <div className="table-container">
        {/* Controls bar */}
        <div className="table-header-controls">
          <div className="search-wrapper" style={{ maxWidth: '450px' }}>
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por Nome, CNPJ, Cidade ou Segmento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Dica: Clique nos cabeçalhos da tabela para ordenar os dados.
          </div>
        </div>

        {/* Table representation */}
        <div className="data-table-wrapper">
          <table className="data-table" style={{ cursor: 'default' }}>
            <thead>
              <tr style={{ cursor: 'pointer' }}>
                <th onClick={() => handleSort('ESTABELECIMENTO')} style={{ select: 'none' }}>
                  Estabelecimento / CNPJ {renderSortIndicator('ESTABELECIMENTO')}
                </th>
                <th onClick={() => handleSort('MUNICIPIO')} style={{ select: 'none' }}>
                  Cidade {renderSortIndicator('MUNICIPIO')}
                </th>
                <th onClick={() => handleSort('TIPO')} style={{ select: 'none' }}>
                  Segmento / Tipo {renderSortIndicator('TIPO')}
                </th>
                <th onClick={() => handleSort('QUANTIDADE_VENDAS')} style={{ textAlign: 'center', width: '130px', select: 'none' }}>
                  Vendas {renderSortIndicator('QUANTIDADE_VENDAS')}
                </th>
                <th onClick={() => handleSort('VALOR_TOTAL')} style={{ textAlign: 'right', width: '180px', select: 'none' }}>
                  Valor Total {renderSortIndicator('VALOR_TOTAL')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedEstabelecimentos.length > 0 ? (
                paginatedEstabelecimentos.map((est) => (
                  <tr key={est.CNPJ} style={{ cursor: 'default' }}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{est.ESTABELECIMENTO}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>CNPJ: {formatCNPJ(est.CNPJ)}</div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{est.MUNICIPIO || 'N/A'}</td>
                    <td>
                      <span className="badge neutral" style={{ fontSize: '12px', padding: '4px 8px' }}>
                        {est.TIPO || 'N/A'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '500' }}>
                      {est.QUANTIDADE_VENDAS.toLocaleString('pt-BR')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>
                      {formatCurrency(est.VALOR_TOTAL)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    Nenhum estabelecimento encontrado com os termos de busca informados.
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
              Mostrando <strong>{Math.min(sortedEstabelecimentos.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(sortedEstabelecimentos.length, currentPage * itemsPerPage)}</strong> de <strong>{sortedEstabelecimentos.length}</strong> estabelecimentos
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
