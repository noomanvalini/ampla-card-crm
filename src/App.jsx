import React, { useState } from 'react';
import { useDb } from './context/DbContext';
import Dashboard from './pages/Dashboard';
import EmpresaList from './pages/EmpresaList';
import EmpresaDetail from './pages/EmpresaDetail';
import DashboardEstabelecimentos from './pages/DashboardEstabelecimentos';
import EstabelecimentoList from './pages/EstabelecimentoList';
import MovimentacaoCidade from './pages/MovimentacaoCidade';
import MovimentacaoCidadeEmpresa from './pages/MovimentacaoCidadeEmpresa';
import { 
  LayoutDashboard, 
  Building2, 
  RotateCcw,
  Store,
  Layers,
  ListCollapse,
  MapPin
} from 'lucide-react';

export default function App() {
  const { loading, resetDatabase } = useDb();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const navigate = (page, companyId = null) => {
    setCurrentPage(page);
    if (companyId !== null) {
      setSelectedCompanyId(companyId);
    }
  };

  const handleResetDb = () => {
    if (window.confirm("Deseja realmente redefinir a base de dados aos valores padrão das planilhas originais? Isso limpará todas as edições de cartões e importações customizadas.")) {
      resetDatabase();
      alert("Base de dados redefinida para os dados padrão!");
      navigate('dashboard');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e2e8f0',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p style={{ color: '#475569', fontWeight: '500' }}>Carregando base consolidada...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Layers size={20} />
          </div>
          <span className="logo-text">Ampla Card</span>
        </div>

        <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Companies Module */}
          <div>
            <div style={{ padding: '0 12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px' }}>
              Módulo Empresas
            </div>
            <ul className="sidebar-menu">
              <li>
                <div 
                  className={`menu-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                  onClick={() => navigate('dashboard')}
                >
                  <LayoutDashboard className="menu-icon" />
                  Dashboard Geral
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentPage === 'empresas' || currentPage === 'detalhe' ? 'active' : ''}`}
                  onClick={() => navigate('empresas')}
                >
                  <Building2 className="menu-icon" />
                  Lista de Empresas
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentPage === 'movimentacao_cidade_empresa' ? 'active' : ''}`}
                  onClick={() => navigate('movimentacao_cidade_empresa')}
                >
                  <MapPin className="menu-icon" />
                  Movimentação por Cidade
                </div>
              </li>
            </ul>
          </div>

          {/* Establishments Module */}
          <div>
            <div style={{ padding: '0 12px 8px', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', letterSpacing: '0.5px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
              Módulo Estabelecimentos
            </div>
            <ul className="sidebar-menu">
              <li>
                <div 
                  className={`menu-item ${currentPage === 'dashboard_estabelecimentos' ? 'active' : ''}`}
                  onClick={() => navigate('dashboard_estabelecimentos')}
                >
                  <Store className="menu-icon" />
                  Dashboard Estab.
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentPage === 'lista_estabelecimentos' ? 'active' : ''}`}
                  onClick={() => navigate('lista_estabelecimentos')}
                >
                  <ListCollapse className="menu-icon" />
                  Lista de Estab.
                </div>
              </li>
              <li>
                <div 
                  className={`menu-item ${currentPage === 'movimentacao_cidade' ? 'active' : ''}`}
                  onClick={() => navigate('movimentacao_cidade')}
                >
                  <MapPin className="menu-icon" />
                  Vendas por Cidade
                </div>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard onNavigate={navigate} />
        )}
        
        {currentPage === 'empresas' && (
          <EmpresaList onSelectCompany={(id) => navigate('detalhe', id)} />
        )}
        
        {currentPage === 'detalhe' && (
          <EmpresaDetail 
            companyId={selectedCompanyId} 
            onBack={() => navigate('empresas')} 
          />
        )}
        
        {currentPage === 'dashboard_estabelecimentos' && (
          <DashboardEstabelecimentos />
        )}
        
        {currentPage === 'lista_estabelecimentos' && (
          <EstabelecimentoList />
        )}

        {currentPage === 'movimentacao_cidade' && (
          <MovimentacaoCidade />
        )}

        {currentPage === 'movimentacao_cidade_empresa' && (
          <MovimentacaoCidadeEmpresa />
        )}
      </main>
    </div>
  );
}
