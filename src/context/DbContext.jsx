import React, { createContext, useContext, useState, useEffect } from 'react';
import defaultData from '../defaultData.json';

const DbContext = createContext();

export function useDb() {
  return useContext(DbContext);
}

export function DbProvider({ children }) {
  const [empresas, setEmpresas] = useState([]);
  const [telefones, setTelefones] = useState([]);
  const [emails, setEmails] = useState([]);
  const [faturamentos, setFaturamentos] = useState([]);
  const [bandeiras, setBandeiras] = useState([]);
  const [estabelecimentos, setEstabelecimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load and merge data from localstorage + defaultData.json
  const loadDatabase = () => {
    try {
      setLoading(true);

      // 1. Get overrides and imports from LocalStorage
      const cardOverrides = JSON.parse(localStorage.getItem('ampla_card_overrides') || '{}');
      const importedEmpresas = JSON.parse(localStorage.getItem('ampla_imported_empresas') || '[]');
      const importedTelefones = JSON.parse(localStorage.getItem('ampla_imported_telefones') || '[]');
      const importedEmails = JSON.parse(localStorage.getItem('ampla_imported_emails') || '[]');
      const importedFaturamentos = JSON.parse(localStorage.getItem('ampla_imported_faturamentos') || '[]');
      const importedBandeiras = JSON.parse(localStorage.getItem('ampla_imported_bandeiras') || '[]');
      const importedEstabelecimentos = JSON.parse(localStorage.getItem('ampla_imported_estabelecimentos') || '[]');

      // 2. Process Companies
      const empresaMap = new Map();
      defaultData.empresas.forEach(emp => {
        empresaMap.set(emp.COD_EMPRESA, { ...emp });
      });
      importedEmpresas.forEach(emp => {
        empresaMap.set(emp.COD_EMPRESA, { ...emp });
      });
      empresaMap.forEach((emp, cod) => {
        if (cardOverrides[cod] !== undefined) {
          emp.NUMERO_CARTOES_ATIVOS = cardOverrides[cod];
        }
      });
      const mergedEmpresas = Array.from(empresaMap.values());

      // 3. Process Phones
      const phoneMap = new Map();
      defaultData.telefones.forEach(tel => {
        const key = `${tel.COD_EMPRESA}_${tel.DDD}_${tel.NUMERO}`;
        phoneMap.set(key, { ...tel });
      });
      importedTelefones.forEach(tel => {
        const key = `${tel.COD_EMPRESA}_${tel.DDD}_${tel.NUMERO}`;
        phoneMap.set(key, { ...tel });
      });
      const mergedTelefones = Array.from(phoneMap.values());

      // 4. Process Emails
      const emailMap = new Map();
      defaultData.emails.forEach(em => {
        const key = `${em.COD_EMPRESA}_${em.EMAIL.toLowerCase()}`;
        emailMap.set(key, { ...em });
      });
      importedEmails.forEach(em => {
        const key = `${em.COD_EMPRESA}_${em.EMAIL.toLowerCase()}`;
        emailMap.set(key, { ...em });
      });
      const mergedEmails = Array.from(emailMap.values());

      // 5. Process Billings
      const billingMap = new Map();
      defaultData.faturamentos.forEach(fat => {
        const key = `${fat.COD_EMPRESA}_${fat.TIPO}_${fat.BENEFICIO}_${fat.MES_REFERENCIA}_${fat.DATA_VENCIMENTO}`;
        billingMap.set(key, { ...fat });
      });
      importedFaturamentos.forEach(fat => {
        const key = `${fat.COD_EMPRESA}_${fat.TIPO}_${fat.BENEFICIO}_${fat.MES_REFERENCIA}_${fat.DATA_VENCIMENTO}`;
        billingMap.set(key, { ...fat });
      });
      const mergedFaturamentos = Array.from(billingMap.values());

      // 6. Process Bandeiras
      const bandeiraMap = new Map();
      if (defaultData.bandeiras) {
        defaultData.bandeiras.forEach(b => {
          bandeiraMap.set(b.COD_BANDEIRA, { ...b });
        });
      }
      importedBandeiras.forEach(b => {
        bandeiraMap.set(b.COD_BANDEIRA, { ...b });
      });
      const mergedBandeiras = Array.from(bandeiraMap.values());

      // 7. Process Establishments
      const estMap = new Map();
      if (defaultData.estabelecimentos) {
        defaultData.estabelecimentos.forEach(e => {
          estMap.set(e.CNPJ, { ...e });
        });
      }
      importedEstabelecimentos.forEach(e => {
        estMap.set(e.CNPJ, { ...e });
      });
      const mergedEstabelecimentos = Array.from(estMap.values());

      // Set states
      setEmpresas(mergedEmpresas);
      setTelefones(mergedTelefones);
      setEmails(mergedEmails);
      setFaturamentos(mergedFaturamentos);
      setBandeiras(mergedBandeiras);
      setEstabelecimentos(mergedEstabelecimentos);
      setLoading(false);
    } catch (error) {
      console.error("Error loading database:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Get Bandeira Name Helper
  const getBandeiraName = (cod) => {
    if (!cod) return 'Sem Bandeira';
    const codStr = String(cod).trim();
    const band = bandeiras.find(b => String(b.COD_BANDEIRA).trim() === codStr);
    return band ? band.NOME : `Bandeira ${codStr}`;
  };

  // Update NUMERO_CARTOES_ATIVOS for a company
  const updateCartoesAtivos = (codEmpresa, count) => {
    const cardOverrides = JSON.parse(localStorage.getItem('ampla_card_overrides') || '{}');
    cardOverrides[codEmpresa] = parseInt(count, 10) || 0;
    localStorage.setItem('ampla_card_overrides', JSON.stringify(cardOverrides));
    
    setEmpresas(prev => 
      prev.map(emp => 
        emp.COD_EMPRESA === codEmpresa 
          ? { ...emp, NUMERO_CARTOES_ATIVOS: cardOverrides[codEmpresa] } 
          : emp
      )
    );
  };

  // Import dynamic CSV data into the local overrides/imports
  const importData = (type, data) => {
    const storageKey = `ampla_imported_${type}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    let updated;
    if (type === 'empresas') {
      const existingMap = new Map(existing.map(item => [item.COD_EMPRESA, item]));
      data.forEach(item => {
        existingMap.set(item.COD_EMPRESA, item);
      });
      updated = Array.from(existingMap.values());
    } else if (type === 'telefones') {
      const existingMap = new Map(existing.map(item => [`${item.COD_EMPRESA}_${item.DDD}_${item.NUMERO}`, item]));
      data.forEach(item => {
        const key = `${item.COD_EMPRESA}_${item.DDD}_${item.NUMERO}`;
        existingMap.set(key, item);
      });
      updated = Array.from(existingMap.values());
    } else if (type === 'emails') {
      const existingMap = new Map(existing.map(item => [`${item.COD_EMPRESA}_${item.EMAIL.toLowerCase()}`, item]));
      data.forEach(item => {
        const key = `${item.COD_EMPRESA}_${item.EMAIL.toLowerCase()}`;
        existingMap.set(key, item);
      });
      updated = Array.from(existingMap.values());
    } else if (type === 'faturamentos') {
      const existingMap = new Map(existing.map(item => [`${item.COD_EMPRESA}_${item.TIPO}_${item.BENEFICIO}_${item.MES_REFERENCIA}_${item.DATA_VENCIMENTO}`, item]));
      data.forEach(item => {
        const key = `${item.COD_EMPRESA}_${item.TIPO}_${item.BENEFICIO}_${item.MES_REFERENCIA}_${item.DATA_VENCIMENTO}`;
        existingMap.set(key, item);
      });
      updated = Array.from(existingMap.values());
    } else if (type === 'bandeiras') {
      const existingMap = new Map(existing.map(item => [item.COD_BANDEIRA, item]));
      data.forEach(item => {
        existingMap.set(item.COD_BANDEIRA, item);
      });
      updated = Array.from(existingMap.values());
    } else if (type === 'estabelecimentos') {
      const existingMap = new Map(existing.map(item => [item.CNPJ, item]));
      data.forEach(item => {
        existingMap.set(item.CNPJ, item);
      });
      updated = Array.from(existingMap.values());
    }

    localStorage.setItem(storageKey, JSON.stringify(updated));
    loadDatabase();
  };

  // Reset database to default seed state
  const resetDatabase = () => {
    localStorage.removeItem('ampla_card_overrides');
    localStorage.removeItem('ampla_imported_empresas');
    localStorage.removeItem('ampla_imported_telefones');
    localStorage.removeItem('ampla_imported_emails');
    localStorage.removeItem('ampla_imported_faturamentos');
    localStorage.removeItem('ampla_imported_bandeiras');
    localStorage.removeItem('ampla_imported_estabelecimentos');
    loadDatabase();
  };

  const getCompanyDetails = (codEmpresa) => {
    const cod = parseInt(codEmpresa, 10);
    const empresa = empresas.find(e => e.COD_EMPRESA === cod);
    if (!empresa) return null;

    const compTelefones = telefones.filter(t => t.COD_EMPRESA === cod);
    const compEmails = emails.filter(e => e.COD_EMPRESA === cod);
    const compFaturamentos = faturamentos.filter(f => f.COD_EMPRESA === cod);

    return {
      ...empresa,
      telefones: compTelefones,
      emails: compEmails,
      faturamentos: compFaturamentos
    };
  };

  return (
    <DbContext.Provider value={{
      empresas,
      telefones,
      emails,
      faturamentos,
      bandeiras,
      estabelecimentos,
      loading,
      getBandeiraName,
      updateCartoesAtivos,
      importData,
      resetDatabase,
      getCompanyDetails,
      reloadDatabase: loadDatabase
    }}>
      {children}
    </DbContext.Provider>
  );
}
