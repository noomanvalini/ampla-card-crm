import React, { useState, useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie
} from 'recharts';
import { Building2, CreditCard, DollarSign, TrendingUp, Layers, HelpCircle } from 'lucide-react';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#a78bfa', '#c084fc', '#f472b6', '#38bdf8', '#fb7185'];

const monthNames = {
  '2026-mar': 'Março/2026',
  '2026-abr': 'Abril/2026',
  '2026-mai': 'Maio/2026',
  '2026-jun': 'Junho/2026',
  '2026-jul': 'Julho/2026'
};

const monthLabelsLong = {
  '2026-mar': 'Março 2026',
  '2026-abr': 'Abril 2026',
  '2026-mai': 'Maio 2026',
  '2026-jun': 'Junho 2026',
  '2026-jul': 'Julho 2026'
};

export default function Dashboard({ onNavigate }) {
  const { empresas, faturamentos } = useDb();
  
  // Selected Month State for interactive filters (defaults to latest month: 2026-jul)
  const [selectedMonth, setSelectedMonth] = useState('2026-jul');

  // Helper: filter out cancelled (C) and suspended (S) companies - keep only Active (L)
  const activeCompanyIds = useMemo(() => {
    return new Set(
      empresas.filter(e => e.STATUS === 'L').map(e => e.COD_EMPRESA)
    );
  }, [empresas]);

  // 1. Calculations for KPIs
  const kpis = useMemo(() => {
    // Total Active Companies (STATUS === 'L')
    const activeCompanies = empresas.filter(e => e.STATUS === 'L');
    const totalActive = activeCompanies.length;

    // Total Active Cards (Sum of NUMERO_CARTOES_ATIVOS of active/non-suspended/non-cancelled companies)
    const totalCards = empresas
      .filter(e => e.STATUS === 'L')
      .reduce((sum, e) => sum + (e.NUMERO_CARTOES_ATIVOS || 0), 0);

    // Faturamento Total do Mês Selecionado (excluding cancelled companies)
    const currentBilling = faturamentos
      .filter(f => f.MES_REFERENCIA === selectedMonth && activeCompanyIds.has(f.COD_EMPRESA))
      .reduce((sum, f) => sum + (f.VALOR || 0), 0);

    return {
      totalActive,
      totalCards,
      currentBilling
    };
  }, [empresas, faturamentos, selectedMonth, activeCompanyIds]);

  // 2. Billing history per month (Bar Chart)
  const monthlyBillingData = useMemo(() => {
    const months = ['2026-mar', '2026-abr', '2026-mai', '2026-jun', '2026-jul'];
    const monthLabelsShort = {
      '2026-mar': 'Março',
      '2026-abr': 'Abril',
      '2026-mai': 'Maio',
      '2026-jun': 'Junho',
      '2026-jul': 'Julho'
    };

    const monthlySums = {};
    months.forEach(m => {
      monthlySums[m] = 0;
    });

    faturamentos.forEach(f => {
      if (monthlySums[f.MES_REFERENCIA] !== undefined && activeCompanyIds.has(f.COD_EMPRESA)) {
        monthlySums[f.MES_REFERENCIA] += f.VALOR || 0;
      }
    });

    return months.map(m => ({
      rawMonth: m,
      month: monthLabelsShort[m] || m,
      'Faturamento Consolidado': parseFloat(monthlySums[m].toFixed(2))
    }));
  }, [faturamentos, activeCompanyIds]);

  // 3. Billing grouped by BENEFICIO (Filtered by selectedMonth)
  const billingByBeneficioData = useMemo(() => {
    const sums = {};
    faturamentos.forEach(f => {
      if (f.MES_REFERENCIA === selectedMonth && activeCompanyIds.has(f.COD_EMPRESA)) {
        const label = f.BENEFICIO || 'Outro';
        sums[label] = (sums[label] || 0) + (f.VALOR || 0);
      }
    });

    return Object.entries(sums)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  }, [faturamentos, selectedMonth, activeCompanyIds]);

  // 4. Billing grouped by TIPO (Filtered by selectedMonth)
  const billingByTipoData = useMemo(() => {
    const sums = {};
    faturamentos.forEach(f => {
      if (f.MES_REFERENCIA === selectedMonth && activeCompanyIds.has(f.COD_EMPRESA)) {
        const label = f.TIPO || 'Outro';
        sums[label] = (sums[label] || 0) + (f.VALOR || 0);
      }
    });

    return Object.entries(sums)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  }, [faturamentos, selectedMonth, activeCompanyIds]);

  // Format currency value helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Custom Tooltip for Bar Chart
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
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Clique para selecionar este mês</p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Pie Charts
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '12px 16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#0f172a' }}>{data.name}</p>
          <p style={{ fontWeight: 600, fontSize: '15px', color: '#2563eb' }}>
            {formatCurrency(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleChartClick = (state) => {
    if (state && state.activeTooltipIndex !== undefined) {
      const clickedData = monthlyBillingData[state.activeTooltipIndex];
      if (clickedData) {
        setSelectedMonth(clickedData.rawMonth);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <h1>Dashboard Geral</h1>
          <p>Visão geral de faturamento e operação consolidada (excluindo empresas canceladas)</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => onNavigate('empresas')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <h3>Empresas Ativas</h3>
            <div className="kpi-value">{kpis.totalActive}</div>
          </div>
          <div className="kpi-icon-container blue">
            <Building2 size={24} />
          </div>
        </div>

        <div className="kpi-card" style={{ border: '1px solid #3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)' }}>
          <div className="kpi-info">
            <h3>Faturamento ({monthNames[selectedMonth]})</h3>
            <div className="kpi-value">{formatCurrency(kpis.currentBilling)}</div>
          </div>
          <div className="kpi-icon-container green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Total de Cartões Ativos</h3>
            <div className="kpi-value">{kpis.totalCards.toLocaleString('pt-BR')}</div>
          </div>
          <div className="kpi-icon-container orange">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Monthly Billing Chart (Full Width) */}
      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <div>
            <div className="chart-title">Evolução do Faturamento Mensal</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Mês ativo filtrado: <span style={{ color: '#2563eb', fontWeight: '700' }}>{monthLabelsLong[selectedMonth]}</span>. Clique em outra barra para alterar o filtro.
            </div>
          </div>
          <TrendingUp size={20} color="#94a3b8" />
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyBillingData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              onClick={handleChartClick}
            >
              <defs>
                <linearGradient id="colorBilling" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorBillingActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.95}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
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
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.02)' }} />
              <Bar 
                dataKey="Faturamento Consolidado" 
                radius={[8, 8, 0, 0]} 
                maxBarSize={50}
              >
                {monthlyBillingData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.rawMonth === selectedMonth ? 'url(#colorBillingActive)' : 'url(#colorBilling)'}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Charts Grid (Two Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Beneficio Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">Distribuição por Benefício ({monthNames[selectedMonth]})</div>
            <Layers size={18} color="#94a3b8" />
          </div>
          <div className="chart-wrapper" style={{ height: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {billingByBeneficioData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billingByBeneficioData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    style={{ fontSize: '10px', fontWeight: '500' }}
                  >
                    {billingByBeneficioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                Nenhum faturamento registrado em {monthNames[selectedMonth]}.
              </div>
            )}
          </div>
        </div>

        {/* Tipo Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">Distribuição por Tipo ({monthNames[selectedMonth]})</div>
            <Layers size={18} color="#94a3b8" />
          </div>
          <div className="chart-wrapper" style={{ height: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {billingByTipoData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billingByTipoData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                    style={{ fontSize: '10px', fontWeight: '500' }}
                  >
                    {billingByTipoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                Nenhum faturamento registrado em {monthNames[selectedMonth]}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
