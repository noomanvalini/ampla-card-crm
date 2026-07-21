import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, FileText, Check, X, Edit2, Save, CreditCard, TrendingUp 
} from 'lucide-react';

export default function EmpresaDetail({ companyId, onBack }) {
  const { getCompanyDetails, updateCartoesAtivos, getBandeiraName } = useDb();
  
  // Get data for this company
  const company = useMemo(() => getCompanyDetails(companyId), [companyId, getCompanyDetails]);
  
  // Active cards editing state
  const [isEditingCards, setIsEditingCards] = useState(false);
  const [cardsCount, setCardsCount] = useState(0);

  // Initialize card count when company changes
  useEffect(() => {
    if (company) {
      setCardsCount(company.NUMERO_CARTOES_ATIVOS || 0);
    }
    setIsEditingCards(false);
  }, [company]);

  if (!company) {
    return (
      <div className="animate-fade-in" style={{ padding: '20px', textAlign: 'center' }}>
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft /> Voltar para a lista
        </button>
        <div style={{ marginTop: '40px', color: '#64748b' }}>
          <h3>Empresa #{companyId} não encontrada.</h3>
        </div>
      </div>
    );
  }

  // Handle saving active card count
  const handleSaveCards = () => {
    updateCartoesAtivos(company.COD_EMPRESA, cardsCount);
    setIsEditingCards(false);
  };

  // Format currency value helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // CNPJ formatter
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

  // CEP Formatter
  const formatCEP = (cep) => {
    if (!cep) return '';
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      return clean.replace(/^(\d{5})(\d{3})$/, "$1-$2");
    }
    return cep;
  };

  // Phone Formatter
  const formatPhone = (ddd, num) => {
    const cleanDdd = (ddd || '').replace(/\D/g, '');
    const cleanNum = (num || '').replace(/\D/g, '');
    if (!cleanNum) return 'N/A';
    
    if (cleanDdd) {
      if (cleanNum.length === 9) {
        return `(${cleanDdd}) ${cleanNum.substring(0, 5)}-${cleanNum.substring(5)}`;
      }
      return `(${cleanDdd}) ${cleanNum.substring(0, 4)}-${cleanNum.substring(4)}`;
    }
    return num;
  };

  // Billing Chart Data
  const chartData = useMemo(() => {
    const months = ['2026-mar', '2026-abr', '2026-mai', '2026-jun'];
    const monthLabels = {
      '2026-mar': 'Março',
      '2026-abr': 'Abril',
      '2026-mai': 'Maio',
      '2026-jun': 'Junho'
    };

    // Calculate sum of billing for this company per month
    const monthlyBilling = {};
    months.forEach(m => {
      monthlyBilling[m] = 0;
    });

    company.faturamentos.forEach(f => {
      if (monthlyBilling[f.MES_REFERENCIA] !== undefined) {
        monthlyBilling[f.MES_REFERENCIA] += f.VALOR || 0;
      }
    });

    return months.map(m => ({
      month: monthLabels[m] || m,
      'Faturamento': parseFloat(monthlyBilling[m].toFixed(2))
    }));
  }, [company.faturamentos]);

  // Billing custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#0f172a' }}>{label}</p>
          <p style={{ fontWeight: 600, fontSize: '15px', color: '#2563eb' }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

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
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft /> Voltar para a lista
      </button>

      {/* Header Profile View */}
      <div className="content-header" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div className="header-title-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '32px' }}>{company.FANTASIA || 'N/A'}</h1>
            {getStatusBadge(company.STATUS)}
          </div>
          <p style={{ fontSize: '16px', color: '#475569', marginTop: '6px' }}>{company.RAZAO}</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>CNPJ: {formatCNPJ(company.CNPJ)} &bull; Código Interno: #{company.COD_EMPRESA}</p>
        </div>

        {/* Active Cards edit panel */}
        <div className="cards-editor-container">
          <div className="phone-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Cartões Ativos</div>
            {isEditingCards ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="number"
                  min="0"
                  className="cards-editor-input"
                  value={cardsCount}
                  onChange={(e) => setCardsCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  autoFocus
                />
                <button className="btn btn-primary" style={{ padding: '6px 10px' }} onClick={handleSaveCards}>
                  <Save size={14} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => { setCardsCount(company.NUMERO_CARTOES_ATIVOS || 0); setIsEditingCards(false); }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  {company.NUMERO_CARTOES_ATIVOS || 0}
                </span>
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '2px' }}
                  onClick={() => setIsEditingCards(true)}
                  title="Editar Cartões"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="profile-grid">
        {/* Address Card */}
        <div className="profile-card">
          <div className="profile-card-title">
            <MapPin size={20} color="#2563eb" />
            Endereço
          </div>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">Logradouro</span>
              <span className="info-value">{company.LOGRADOURO || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Número</span>
              <span className="info-value">{company.NUMERO || 'S/N'}</span>
            </div>
            {company.COMPLEMENTO && (
              <div className="info-item">
                <span className="info-label">Complemento</span>
                <span className="info-value">{company.COMPLEMENTO}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Bairro</span>
              <span className="info-value">{company.BAIRRO || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Município</span>
              <span className="info-value">{company.MUNICIPIO || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">CEP</span>
              <span className="info-value">{formatCEP(company.CEP)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Bandeira Operadora</span>
              <span className="info-value">{getBandeiraName(company.COD_BANDEIRA)} {company.COD_BANDEIRA ? `(#${company.COD_BANDEIRA})` : ''}</span>
            </div>
          </div>
        </div>

        {/* Contacts (Phones & Emails) */}
        <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="profile-card-title" style={{ marginBottom: '10px' }}>
              <Phone size={20} color="#2563eb" />
              Telefones
            </div>
            {company.telefones.length > 0 ? (
              <div className="contacts-grid">
                {company.telefones.map((t) => (
                  <div key={t.ID} className="phone-card">
                    <div className="phone-icon-wrapper">
                      <Phone size={16} />
                    </div>
                    <div className="phone-details">
                      <div className="phone-number">
                        <a 
                          href={`tel:${(t.DDD || '').replace(/\D/g, '')}${(t.NUMERO || '').replace(/\D/g, '')}`} 
                          style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '700' }}
                        >
                          {formatPhone(t.DDD, t.NUMERO)}
                        </a>
                      </div>
                      <div className="phone-type">{t.COD_TIPO === '2' ? 'Celular' : t.COD_TIPO === '1' ? 'Fixo' : 'Outro'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '14px' }}>Nenhum telefone cadastrado.</p>
            )}
          </div>

          <div>
            <div className="profile-card-title" style={{ marginBottom: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <Mail size={20} color="#2563eb" />
              E-mails de Contato / Responsáveis
            </div>
            {company.emails.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="email-table">
                  <thead>
                    <tr>
                      <th>Nome / Responsável</th>
                      <th>E-mail</th>
                      <th>Fechamento</th>
                      <th>Nota Fiscal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.emails.map((e) => (
                      <tr key={e.ID}>
                        <td style={{ fontWeight: '500' }}>{e.NOME || 'Não Informado'}</td>
                        <td style={{ color: '#475569' }}>
                          <a 
                            href={`mailto:${e.EMAIL}`} 
                            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
                          >
                            {e.EMAIL}
                          </a>
                        </td>
                        <td>
                          {e.EMAIL_FECHTO ? (
                            <span className="email-flag active"><Check size={12} /> Sim</span>
                          ) : (
                            <span className="email-flag inactive"><X size={12} /> Não</span>
                          )}
                        </td>
                        <td>
                          {e.EMAIL_NOTA_FISCAL ? (
                            <span className="email-flag active"><Check size={12} /> Sim</span>
                          ) : (
                            <span className="email-flag inactive"><X size={12} /> Não</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '14px' }}>Nenhum email cadastrado.</p>
            )}
          </div>
        </div>
      </div>

      {/* Historical Billing section */}
      <div className="profile-card" style={{ marginBottom: '24px' }}>
        <div className="profile-card-title">
          <FileText size={20} color="#2563eb" />
          Histórico e Evolução de Faturamento
        </div>

        <div className="charts-grid" style={{ marginBottom: '0', gap: '32px' }}>
          {/* Billing list table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ cursor: 'default' }}>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Vencimento</th>
                  <th>Tipo</th>
                  <th>Benefício</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {company.faturamentos.filter(f => f.MES_REFERENCIA !== '2026-jul').length > 0 ? (
                  [...company.faturamentos]
                    .filter(f => f.MES_REFERENCIA !== '2026-jul')
                    .sort((a, b) => {
                      const monthOrder = {
                        '2026-mar': 1,
                        '2026-abr': 2,
                        '2026-mai': 3,
                        '2026-jun': 4
                      };
                      return (monthOrder[a.MES_REFERENCIA] || 99) - (monthOrder[b.MES_REFERENCIA] || 99);
                    })
                    .map((f) => (
                      <tr key={f.ID} style={{ cursor: 'default' }}>
                        <td style={{ fontWeight: '600' }}>
                          {f.MES_REFERENCIA === '2026-mar' ? 'Março/2026' :
                           f.MES_REFERENCIA === '2026-abr' ? 'Abril/2026' :
                           f.MES_REFERENCIA === '2026-mai' ? 'Maio/2026' :
                           f.MES_REFERENCIA === '2026-jun' ? 'Junho/2026' :
                           f.MES_REFERENCIA === '2026-jul' ? 'Julho/2026' : f.MES_REFERENCIA}
                        </td>
                        <td>{formatDate(f.DATA_VENCIMENTO)}</td>
                        <td>{f.TIPO || 'N/A'}</td>
                        <td>{f.BENEFICIO || 'N/A'}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                          {formatCurrency(f.VALOR)}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                      Nenhum registro de faturamento encontrado para esta empresa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Line Chart */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: '600', fontSize: '14px', color: '#475569' }}>
              <TrendingUp size={16} /> Tendência de Faturamento
            </div>
            <div className="chart-wrapper" style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => `R$ ${val}`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="Faturamento" 
                    stroke="#2563eb" 
                    strokeWidth={3} 
                    activeDot={{ r: 6 }} 
                    dot={{ stroke: '#2563eb', strokeWidth: 2, r: 4, fill: '#fff' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
