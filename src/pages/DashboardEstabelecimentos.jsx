import React, { useMemo } from 'react';
import { useDb } from '../context/DbContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Store, MapPin, CreditCard, DollarSign, TrendingUp, Layers } from 'lucide-react';

const COLORS = [
  '#2563eb', '#3b82f6', '#60a5fa', '#38bdf8', '#a78bfa', 
  '#c084fc', '#f472b6', '#fb7185', '#34d399', '#fbbf24',
  '#0d9488', '#ea580c', '#16a34a', '#db2777', '#4f46e5'
];

export default function DashboardEstabelecimentos() {
  const { estabelecimentos } = useDb();

  // 1. Top KPIs
  const kpis = useMemo(() => {
    const totalEst = estabelecimentos.length;
    const totalSalesVol = estabelecimentos.reduce((sum, e) => sum + (e.VALOR_TOTAL || 0), 0);
    const totalSalesQty = estabelecimentos.reduce((sum, e) => sum + (e.QUANTIDADE_VENDAS || 0), 0);
    const totalCardsUsed = estabelecimentos.reduce((sum, e) => sum + (e.QUANTIDADE_CARTOES || 0), 0);

    return {
      totalEst,
      totalSalesVol,
      totalSalesQty,
      totalCardsUsed
    };
  }, [estabelecimentos]);

  // 2. Sales by City (Top 20 Cities by Volume)
  const salesByCityData = useMemo(() => {
    const citySums = {};
    estabelecimentos.forEach(e => {
      const city = e.MUNICIPIO || 'Desconhecida';
      citySums[city] = (citySums[city] || 0) + (e.VALOR_TOTAL || 0);
    });

    return Object.entries(citySums)
      .map(([name, value]) => ({
        name,
        'Volume de Vendas': parseFloat(value.toFixed(2))
      }))
      .sort((a, b) => b['Volume de Vendas'] - a['Volume de Vendas'])
      .slice(0, 20); // Top 20 cities as requested
  }, [estabelecimentos]);

  // 3. Sales by Establishment Type (Raw data for list rendering)
  const salesByTypeData = useMemo(() => {
    const typeSums = {};
    estabelecimentos.forEach(e => {
      const type = e.TIPO || 'Outro';
      typeSums[type] = (typeSums[type] || 0) + (e.VALOR_TOTAL || 0);
    });

    return Object.entries(typeSums)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  }, [estabelecimentos]);

  // 4. Sales items with percentages computed for list rendering
  const establishmentTypeListItems = useMemo(() => {
    const totalSales = kpis.totalSalesVol || 1;
    return salesByTypeData.map((item, index) => {
      const pct = (item.value / totalSales) * 100;
      return {
        name: item.name,
        value: item.value,
        percentage: pct,
        color: COLORS[index % COLORS.length]
      };
    });
  }, [salesByTypeData, kpis.totalSalesVol]);

  // 5. Top 10 Establishments by Sales Volume
  const top10Estabelecimentos = useMemo(() => {
    return [...estabelecimentos]
      .sort((a, b) => (b.VALOR_TOTAL || 0) - (a.VALOR_TOTAL || 0))
      .slice(0, 10);
  }, [estabelecimentos]);

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

  // Custom tooltips
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

  return (
    <div className="animate-fade-in">
      <div className="content-header">
        <div className="header-title-container">
          <h1>Dashboard Estabelecimentos</h1>
          <p>Análise operacional e comercial dos estabelecimentos parceiros credenciados</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Credenciados</h3>
            <div className="kpi-value">{kpis.totalEst}</div>
          </div>
          <div className="kpi-icon-container blue">
            <Store size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Volume Total Vendas</h3>
            <div className="kpi-value">{formatCurrency(kpis.totalSalesVol)}</div>
          </div>
          <div className="kpi-icon-container green">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Transações</h3>
            <div className="kpi-value">{kpis.totalSalesQty.toLocaleString('pt-BR')}</div>
          </div>
          <div className="kpi-icon-container orange">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <h3>Cartões Utilizados</h3>
            <div className="kpi-value">{kpis.totalCardsUsed.toLocaleString('pt-BR')}</div>
          </div>
          <div className="kpi-icon-container blue" style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* City Sales Chart (Full Width) */}
      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <div className="chart-title">Volume de Vendas por Cidade (Top 20)</div>
          <MapPin size={20} color="#94a3b8" />
        </div>
        <div className="chart-wrapper" style={{ height: '360px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesByCityData}
              margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 9 }}
                angle={-35}
                textAnchor="end"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.02)' }} />
              <Bar 
                dataKey="Volume de Vendas" 
                fill="url(#colorEstSales)" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={30}
              >
                <defs>
                  <linearGradient id="colorEstSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.5}/>
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales by Segment List (Below City Chart, Full Width) */}
      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <div className="chart-header">
          <div className="chart-title">Representação Comercial por Tipo de Estabelecimento</div>
          <Layers size={20} color="#94a3b8" />
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {establishmentTypeListItems.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '600' }}>
                <span style={{ color: '#334155' }}>{item.name}</span>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ color: '#2563eb', fontSize: '12px', fontWeight: '700', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatCurrency(item.value)}</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${item.percentage}%`, 
                    height: '100%', 
                    backgroundColor: item.color, 
                    borderRadius: '4px'
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 10 Establishments Table */}
      <div className="table-container" style={{ marginBottom: '32px' }}>
        <div className="table-header-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon" style={{ width: '28px', height: '28px', borderRadius: '6px' }}>
              <TrendingUp size={14} />
            </div>
            <span className="chart-title" style={{ fontSize: '16px' }}>Ranking: Top 10 Estabelecimentos por Faturamento</span>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table" style={{ cursor: 'default' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Pos.</th>
                <th>Razão Social / CNPJ</th>
                <th>Cidade</th>
                <th>Segmento / Tipo</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Qtd Vendas</th>
                <th style={{ textAlign: 'right', width: '180px' }}>Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {top10Estabelecimentos.map((est, idx) => (
                <tr key={est.CNPJ} style={{ cursor: 'default' }}>
                  <td style={{ textAlign: 'center', fontWeight: '800', color: idx < 3 ? '#2563eb' : '#64748b' }}>
                    {idx + 1}º
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{est.ESTABELECIMENTO}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>CNPJ: {formatCNPJ(est.CNPJ)}</div>
                  </td>
                  <td>{est.MUNICIPIO}</td>
                  <td>
                    <span className="badge neutral" style={{ fontSize: '11px' }}>{est.TIPO}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    {est.QUANTIDADE_VENDAS.toLocaleString('pt-BR')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>
                    {formatCurrency(est.VALOR_TOTAL)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
