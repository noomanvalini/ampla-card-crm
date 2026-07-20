import React, { useState } from 'react';
import { useDb } from './context/DbContext';
import Dashboard from './pages/Dashboard';
import EmpresaList from './pages/EmpresaList';
import EmpresaDetail from './pages/EmpresaDetail';
import ImportarCsv from './pages/ImportarCsv';
import { 
  LayoutDashboard, 
  Building2, 
  UploadCloud, 
  RotateCcw,
  CreditCard,
  Layers
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

        <nav style={{ flexGrow: 1 }}>
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
                className={`menu-item ${currentPage === 'importar' ? 'active' : ''}`}
                onClick={() => navigate('importar')}
              >
                <UploadCloud className="menu-icon" />
                Importar CSVs
              </div>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="reset-db-btn" onClick={handleResetDb}>
            <RotateCcw size={14} />
            Redefinir Dados Originais
          </button>
        </div>
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
        
        {currentPage === 'importar' && (
          <ImportarCsv />
        )}
      </main>
    </div>
  );
}
