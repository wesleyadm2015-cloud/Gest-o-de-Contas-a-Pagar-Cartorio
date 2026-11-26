/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Configurações Gerais, Definições de Domínio e Helpers Globais
 */

(function (window) {
  'use strict';

  const AppConfig = {
    APP_NAME: '2º Oficial SJC',
    APP_TAGLINE: 'Registro de Imóveis, Títulos e Documentos e Civil de Pessoa Jurídica de São José dos Campos',
    STORAGE_KEY: 'contadiaria_bills_v1',
    SETTINGS_KEY: 'contadiaria_settings_v1',

    // Locais das Contas (Unidades / Filiais)
    LOCATIONS: {
      LD: { id: 'LD', label: 'LD' },
      CG: { id: 'LD', label: 'LD' }, // Compatibilidade reversa automática para registros legados
      REC: { id: 'REC', label: 'REC' },
      SE: { id: 'SE', label: 'SE' }
    },

    // Tipo / Classificação de Despesa (Fixa = F ou Variável = V)
    EXPENSE_TYPES: {
      fixa: {
        id: 'fixa',
        code: 'F',
        label: 'Fixa',
        shortLabel: 'F',
        icon: 'pin',
        color: '#059669',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      },
      variavel: {
        id: 'variavel',
        code: 'V',
        label: 'Variável',
        shortLabel: 'V',
        icon: 'trending-up',
        color: '#d97706',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      }
    },

    // Categorias de despesas
    CATEGORIES: {
      moradia: {
        id: 'moradia',
        label: 'Moradia',
        icon: 'home',
        color: '#3b82f6',
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
      },
      alimentacao: {
        id: 'alimentacao',
        label: 'Alimentação',
        icon: 'utensils',
        color: '#10b981',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      },
      fixas: {
        id: 'fixas',
        label: 'Fixas',
        icon: 'pin',
        color: '#6366f1',
        badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
      },
      variaveis: {
        id: 'variaveis',
        label: 'Variáveis',
        icon: 'trending-up',
        color: '#f59e0b',
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      },
      negocios: {
        id: 'negocios',
        label: 'Negócios',
        icon: 'briefcase',
        color: '#8b5cf6',
        badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
      },
      lazer: {
        id: 'lazer',
        label: 'Lazer',
        icon: 'gamepad-2',
        color: '#ec4899',
        badgeClass: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800'
      },
      transporte: {
        id: 'transporte',
        label: 'Transporte',
        icon: 'car',
        color: '#06b6d4',
        badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
      },
      saude: {
        id: 'saude',
        label: 'Saúde',
        icon: 'heart-pulse',
        color: '#f43f5e',
        badgeClass: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
      },
      educacao: {
        id: 'educacao',
        label: 'Educação',
        icon: 'graduation-cap',
        color: '#eab308',
        badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800'
      },
      outros: {
        id: 'outros',
        label: 'Outros',
        icon: 'tag',
        color: '#64748b',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      }
    },

    // Métodos de Pagamento
    PAYMENT_METHODS: {
      pix: { id: 'pix', label: 'PIX', icon: 'zap' },
      cartao_credito: { id: 'cartao_credito', label: 'Cartão de Crédito', icon: 'credit-card' },
      boleto: { id: 'boleto', label: 'Boleto Bancário', icon: 'barcode' },
      debito_automatico: { id: 'debito_automatico', label: 'Débito Automático', icon: 'refresh-cw' },
      transferencia: { id: 'transferencia', label: 'Transferência Bancária', icon: 'arrow-right-left' },
      dinheiro: { id: 'dinheiro', label: 'Dinheiro', icon: 'banknote' }
    },

    // Status da Nota Fiscal (NF)
    INVOICE_STATUSES: {
      aguardando: {
        id: 'aguardando',
        label: 'Aguardando',
        icon: 'file-clock',
        color: '#f59e0b',
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      },
      recebida: {
        id: 'recebida',
        label: 'Recebida',
        icon: 'file-check-2',
        color: '#10b981',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      }
    },

    // Status da Conta
    STATUSES: {
      pendente: {
        id: 'pendente',
        label: 'Aguardando Pagamento',
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
        dotClass: 'bg-amber-500'
      },
      pago: {
        id: 'pago',
        label: 'Pago',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
        dotClass: 'bg-emerald-500'
      },
      atrasado: {
        id: 'atrasado',
        label: 'Atrasado',
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
        dotClass: 'bg-rose-500 animate-pulse'
      }
    },

    // Perfis / Cargos de Usuários do Cartório
    USER_ROLES: {
      admin: {
        id: 'admin',
        label: 'Administrador',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
        icon: 'shield-check'
      },
      financeiro: {
        id: 'financeiro',
        label: 'Financeiro',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800',
        icon: 'calculator'
      },
      operador: {
        id: 'operador',
        label: 'Operador',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800',
        icon: 'user-check'
      },
      consulta: {
        id: 'consulta',
        label: 'Consulta (Visualizador)',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        icon: 'eye'
      }
    },

    // Tipos / Abrangências de Feriados
    HOLIDAY_TYPES: {
      municipal_sjc: {
        id: 'municipal_sjc',
        label: 'Municipal (SJC)',
        shortLabel: 'SJC',
        color: '#0284c7',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800'
      },
      estadual_sp: {
        id: 'estadual_sp',
        label: 'Estadual (SP)',
        shortLabel: 'Estadual SP',
        color: '#7c3aed',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
      },
      nacional: {
        id: 'nacional',
        label: 'Nacional',
        shortLabel: 'Nacional',
        color: '#059669',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
      },
      bancario_cartorio: {
        id: 'bancario_cartorio',
        label: 'Bancário / Cartorário',
        shortLabel: 'Bancário',
        color: '#d97706',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
      },
      facultativo: {
        id: 'facultativo',
        label: 'Ponto Facultativo',
        shortLabel: 'Facultativo',
        color: '#64748b',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      }
    },

    // Feriados Padrão Oficiais (São José dos Campos & Nacionais)
    DEFAULT_HOLIDAYS: [
      // 2025
      { id: 'hol_2025_01_01', date: '2025-01-01', name: 'Confraternização Universal (Ano Novo)', type: 'nacional' },
      { id: 'hol_2025_03_03', date: '2025-03-03', name: 'Carnaval (Segunda-feira)', type: 'bancario_cartorio' },
      { id: 'hol_2025_03_04', date: '2025-03-04', name: 'Carnaval (Terça-feira)', type: 'bancario_cartorio' },
      { id: 'hol_2025_03_05', date: '2025-03-05', name: 'Quarta-feira de Cinzas', type: 'facultativo' },
      { id: 'hol_2025_03_19', date: '2025-03-19', name: 'Dia de São José (Padroeiro de SJC)', type: 'municipal_sjc' },
      { id: 'hol_2025_04_18', date: '2025-04-18', name: 'Sexta-feira Santa (Paixão de Cristo)', type: 'nacional' },
      { id: 'hol_2025_04_21', date: '2025-04-21', name: 'Tiradentes', type: 'nacional' },
      { id: 'hol_2025_05_01', date: '2025-05-01', name: 'Dia do Trabalho', type: 'nacional' },
      { id: 'hol_2025_06_19', date: '2025-06-19', name: 'Corpus Christi', type: 'municipal_sjc' },
      { id: 'hol_2025_07_09', date: '2025-07-09', name: 'Revolução Constitucionalista de 1932', type: 'estadual_sp' },
      { id: 'hol_2025_07_27', date: '2025-07-27', name: 'Aniversário de São José dos Campos', type: 'municipal_sjc' },
      { id: 'hol_2025_09_07', date: '2025-09-07', name: 'Independência do Brasil', type: 'nacional' },
      { id: 'hol_2025_10_12', date: '2025-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
      { id: 'hol_2025_11_02', date: '2025-11-02', name: 'Finados', type: 'nacional' },
      { id: 'hol_2025_11_15', date: '2025-11-15', name: 'Proclamação da República', type: 'nacional' },
      { id: 'hol_2025_11_20', date: '2025-11-20', name: 'Dia Nacional de Zumbi e da Consciência Negra', type: 'nacional' },
      { id: 'hol_2025_12_25', date: '2025-12-25', name: 'Natal', type: 'nacional' },
      { id: 'hol_2025_12_31', date: '2025-12-31', name: 'Véspera de Ano Novo (Sem expediente bancário)', type: 'bancario_cartorio' },

      // 2026 (Ano Corrente)
      { id: 'hol_2026_01_01', date: '2026-01-01', name: 'Confraternização Universal (Ano Novo)', type: 'nacional' },
      { id: 'hol_2026_02_16', date: '2026-02-16', name: 'Carnaval (Segunda-feira)', type: 'bancario_cartorio' },
      { id: 'hol_2026_02_17', date: '2026-02-17', name: 'Carnaval (Terça-feira)', type: 'bancario_cartorio' },
      { id: 'hol_2026_02_18', date: '2026-02-18', name: 'Quarta-feira de Cinzas', type: 'facultativo' },
      { id: 'hol_2026_03_19', date: '2026-03-19', name: 'Dia de São José (Padroeiro de SJC)', type: 'municipal_sjc' },
      { id: 'hol_2026_04_03', date: '2026-04-03', name: 'Sexta-feira Santa (Paixão de Cristo)', type: 'nacional' },
      { id: 'hol_2026_04_21', date: '2026-04-21', name: 'Tiradentes', type: 'nacional' },
      { id: 'hol_2026_05_01', date: '2026-05-01', name: 'Dia do Trabalho', type: 'nacional' },
      { id: 'hol_2026_06_04', date: '2026-06-04', name: 'Corpus Christi', type: 'municipal_sjc' },
      { id: 'hol_2026_07_09', date: '2026-07-09', name: 'Revolução Constitucionalista de 1932', type: 'estadual_sp' },
      { id: 'hol_2026_07_27', date: '2026-07-27', name: 'Aniversário de São José dos Campos', type: 'municipal_sjc' },
      { id: 'hol_2026_09_07', date: '2026-09-07', name: 'Independência do Brasil', type: 'nacional' },
      { id: 'hol_2026_10_12', date: '2026-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
      { id: 'hol_2026_11_02', date: '2026-11-02', name: 'Finados', type: 'nacional' },
      { id: 'hol_2026_11_15', date: '2026-11-15', name: 'Proclamação da República', type: 'nacional' },
      { id: 'hol_2026_11_20', date: '2026-11-20', name: 'Dia Nacional de Zumbi e da Consciência Negra', type: 'nacional' },
      { id: 'hol_2026_12_25', date: '2026-12-25', name: 'Natal', type: 'nacional' },
      { id: 'hol_2026_12_31', date: '2026-12-31', name: 'Véspera de Ano Novo (Sem expediente bancário)', type: 'bancario_cartorio' },

      // 2027
      { id: 'hol_2027_01_01', date: '2027-01-01', name: 'Confraternização Universal (Ano Novo)', type: 'nacional' },
      { id: 'hol_2027_02_08', date: '2027-02-08', name: 'Carnaval (Segunda-feira)', type: 'bancario_cartorio' },
      { id: 'hol_2027_02_09', date: '2027-02-09', name: 'Carnaval (Terça-feira)', type: 'bancario_cartorio' },
      { id: 'hol_2027_02_10', date: '2027-02-10', name: 'Quarta-feira de Cinzas', type: 'facultativo' },
      { id: 'hol_2027_03_19', date: '2027-03-19', name: 'Dia de São José (Padroeiro de SJC)', type: 'municipal_sjc' },
      { id: 'hol_2027_03_26', date: '2027-03-26', name: 'Sexta-feira Santa (Paixão de Cristo)', type: 'nacional' },
      { id: 'hol_2027_04_21', date: '2027-04-21', name: 'Tiradentes', type: 'nacional' },
      { id: 'hol_2027_05_01', date: '2027-05-01', name: 'Dia do Trabalho', type: 'nacional' },
      { id: 'hol_2027_05_27', date: '2027-05-27', name: 'Corpus Christi', type: 'municipal_sjc' },
      { id: 'hol_2027_07_09', date: '2027-07-09', name: 'Revolução Constitucionalista de 1932', type: 'estadual_sp' },
      { id: 'hol_2027_07_27', date: '2027-07-27', name: 'Aniversário de São José dos Campos', type: 'municipal_sjc' },
      { id: 'hol_2027_09_07', date: '2027-09-07', name: 'Independência do Brasil', type: 'nacional' },
      { id: 'hol_2027_10_12', date: '2027-10-12', name: 'Nossa Senhora Aparecida', type: 'nacional' },
      { id: 'hol_2027_11_02', date: '2027-11-02', name: 'Finados', type: 'nacional' },
      { id: 'hol_2027_11_15', date: '2027-11-15', name: 'Proclamação da República', type: 'nacional' },
      { id: 'hol_2027_11_20', date: '2027-11-20', name: 'Dia Nacional de Zumbi e da Consciência Negra', type: 'nacional' },
      { id: 'hol_2027_12_25', date: '2027-12-25', name: 'Natal', type: 'nacional' },
      { id: 'hol_2027_12_31', date: '2027-12-31', name: 'Véspera de Ano Novo (Sem expediente bancário)', type: 'bancario_cartorio' }
    ],

    // Parâmetros de Feriados e Aviso Prévio de Vencimento
    HOLIDAY_PARAMS: {
      alertAdvanceBusinessDays: 2, // 1, 2, 3 ou 5 dias úteis de aviso prévio
      autoProrogateNonBusinessDays: true, // Prorroga vencimento em sáb/dom/feriados
      consideredTypes: ['municipal_sjc', 'estadual_sp', 'nacional', 'bancario_cartorio', 'facultativo'],
      autoShowDailyPopup: true // Exibe o lembrete diário em popup ao carregar a página
    },

    // Cache interno de feriados cadastrados (carregado dinamicamente)
    _holidaysCache: null,

    // Utilitários de formatação e datas
    utils: {
      /**
       * Formata número para moeda brasileira (R$)
       * @param {number} value
       * @returns {string}
       */
      formatBRL(value) {
        const num = Number(value) || 0;
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2
        }).format(num);
      },

      /**
       * Formata data YYYY-MM-DD para DD/MM/YYYY
       * @param {string} dateString
       * @returns {string}
       */
      formatDate(dateString) {
        if (!dateString) return '-';
        // Divide sem timezone para evitar deslocamento de fuso horário
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateString;
      },

      /**
       * Retorna string ISO YYYY-MM-DD de um objeto Date local
       * @param {Date} dateObj
       * @returns {string}
       */
      toISODateString(dateObj = new Date()) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      },

      /**
       * Retorna rótulo amigável relativo à data de hoje considerando o vencimento efetivo e feriados
       * @param {string} dueDateStr
       * @param {string} status
       * @returns {{ text: string, type: 'today'|'overdue'|'upcoming'|'normal', isProrogated: boolean, holiday: Object|null }}
       */
      getRelativeDateInfo(dueDateStr, status) {
        if (!dueDateStr) return { text: '-', type: 'normal', isProrogated: false, holiday: null };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const effectiveDue = this.getEffectiveBusinessDueDate(dueDateStr);
        effectiveDue.setHours(0, 0, 0, 0);

        const diffTime = effectiveDue.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const bDaysDiff = this.getBusinessDaysDiff(this.toISODateString(today), this.toISODateString(effectiveDue));

        if (status === 'pago') {
          return { text: this.formatDate(dueDateStr), type: 'normal', isProrogated: false, holiday: null };
        }

        const isProrogated = this.toISODateString(effectiveDue) !== dueDateStr;
        const holiday = this.isHoliday(dueDateStr);

        if (diffDays === 0) {
          return {
            text: isProrogated ? 'Vence Hoje! (Prorrogado)' : 'Vence Hoje!',
            type: 'today',
            isProrogated,
            holiday
          };
        } else if (bDaysDiff === 1 && diffDays > 0) {
          return {
            text: isProrogated ? 'Vence Amanhã (Prorrogado)' : 'Vence Amanhã',
            type: 'upcoming',
            isProrogated,
            holiday
          };
        } else if (effectiveDue.getTime() < today.getTime()) {
          const pastDays = Math.abs(diffDays);
          return {
            text: pastDays === 1 ? 'Venceu Ontem' : `Atrasada há ${pastDays} dias`,
            type: 'overdue',
            isProrogated,
            holiday
          };
        } else if (bDaysDiff === 2) {
          return {
            text: isProrogated ? 'Vence em 2 dias úteis (Prorrogado)' : 'Vence em 2 dias úteis',
            type: 'upcoming',
            isProrogated,
            holiday
          };
        } else if (bDaysDiff <= 5 && bDaysDiff > 2) {
          return {
            text: `Vence em ${bDaysDiff} dias úteis`,
            type: 'upcoming',
            isProrogated,
            holiday
          };
        } else {
          return {
            text: this.formatDate(this.toISODateString(effectiveDue)),
            type: 'normal',
            isProrogated,
            holiday
          };
        }
      },

      /**
       * Recarrega a lista de feriados e parâmetros cadastrados no LocalStorage para o cache interno
       * @returns {Array<Object>}
       */
      reloadHolidays() {
        try {
          const rawParams = localStorage.getItem('contadiaria_holiday_params_v1');
          if (rawParams) {
            const parsedParams = JSON.parse(rawParams);
            if (parsedParams && typeof parsedParams === 'object') {
              window.AppConfig.HOLIDAY_PARAMS = parsedParams;
            }
          }

          const raw = localStorage.getItem('contadiaria_holidays_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              window.AppConfig._holidaysCache = parsed;
              return parsed;
            }
          }
        } catch (e) {
          console.warn('Erro ao carregar feriados e parâmetros:', e);
        }
        window.AppConfig._holidaysCache = [...window.AppConfig.DEFAULT_HOLIDAYS];
        return window.AppConfig._holidaysCache;
      },

      /**
       * Retorna todos os feriados cadastrados no sistema
       * @returns {Array<Object>}
       */
      getHolidays() {
        if (!window.AppConfig._holidaysCache) {
          return this.reloadHolidays();
        }
        return window.AppConfig._holidaysCache;
      },

      /**
       * Verifica se uma data específica é feriado cadastrado
       * @param {Date|string} dateVal
       * @returns {Object|null}
       */
      isHoliday(dateVal) {
        if (!dateVal) return null;
        let isoStr = '';
        if (typeof dateVal === 'string') {
          isoStr = dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
        } else if (dateVal instanceof Date) {
          isoStr = this.toISODateString(dateVal);
        }
        const holidays = this.getHolidays();
        return holidays.find((h) => h.date === isoStr) || null;
      },

      /**
       * Verifica se um dia é dia útil (não é sábado, não é domingo e não é feriado considerado ativo)
       * @param {Date|string} dateVal
       * @returns {boolean}
       */
      isBusinessDay(dateVal) {
        let d = typeof dateVal === 'string' ? new Date(dateVal + 'T00:00:00') : new Date(dateVal);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        if (day === 0 || day === 6) return false; // Sábado ou Domingo

        const hol = this.isHoliday(d);
        if (hol) {
          const params = window.AppConfig.HOLIDAY_PARAMS || {
            consideredTypes: ['municipal_sjc', 'estadual_sp', 'nacional', 'bancario_cartorio', 'facultativo']
          };
          const types = params.consideredTypes || ['municipal_sjc', 'estadual_sp', 'nacional', 'bancario_cartorio', 'facultativo'];
          if (types.includes(hol.type)) {
            return false; // É feriado considerado ativo
          }
        }
        return true;
      },

      /**
       * Se a data cair em final de semana ou feriado, avança para o próximo dia útil bancário/cartorário
       * @param {Date|string} dateVal
       * @returns {Date}
       */
      getEffectiveBusinessDueDate(dateVal) {
        if (!dateVal) return new Date();
        const params = window.AppConfig.HOLIDAY_PARAMS || { autoProrogateNonBusinessDays: true };
        let d = typeof dateVal === 'string' ? new Date(dateVal + 'T00:00:00') : new Date(dateVal);
        d.setHours(0, 0, 0, 0);

        if (params.autoProrogateNonBusinessDays === false) {
          return d;
        }

        let maxLoop = 30; // Proteção contra loops infinitos
        while (!this.isBusinessDay(d) && maxLoop > 0) {
          d.setDate(d.getDate() + 1);
          maxLoop--;
        }
        return d;
      },

      /**
       * Adiciona N dias úteis a uma data (pula sábados, domingos e feriados cadastrados)
       * @param {Date|string} startDate
       * @param {number} businessDays
       * @returns {Date}
       */
      addBusinessDays(startDate, businessDays = 2) {
        let cur = typeof startDate === 'string' ? new Date(startDate + 'T00:00:00') : new Date(startDate);
        cur.setHours(0, 0, 0, 0);
        let added = 0;
        let maxLoop = 120; // Proteção contra loops infinitos
        while (added < businessDays && maxLoop > 0) {
          cur.setDate(cur.getDate() + 1);
          if (this.isBusinessDay(cur)) {
            added++;
          }
          maxLoop--;
        }
        return cur;
      },

      /**
       * Calcula a diferença em dias úteis entre duas datas (descontando fins de semana e feriados)
       * @param {Date|string} startDate
       * @param {Date|string} targetDate
       * @returns {number}
       */
      getBusinessDaysDiff(startDate, targetDate) {
        let cur = typeof startDate === 'string' ? new Date(startDate + 'T00:00:00') : new Date(startDate);
        cur.setHours(0, 0, 0, 0);
        let target = typeof targetDate === 'string' ? new Date(targetDate + 'T00:00:00') : new Date(targetDate);
        target.setHours(0, 0, 0, 0);

        if (cur.getTime() === target.getTime()) return 0;

        const isForward = target.getTime() > cur.getTime();
        const step = isForward ? 1 : -1;
        let count = 0;
        let maxLoop = 365;

        while ((isForward ? cur.getTime() < target.getTime() : cur.getTime() > target.getTime()) && maxLoop > 0) {
          cur.setDate(cur.getDate() + step);
          if (this.isBusinessDay(cur)) {
            count += step;
          }
          maxLoop--;
        }
        return count;
      },

      /**
       * Retorna o nome por extenso do dia da semana em Português
       * @param {string|Date} dateVal
       * @returns {string}
       */
      getDayOfWeekName(dateVal) {
        const d = typeof dateVal === 'string' ? new Date(dateVal + 'T00:00:00') : new Date(dateVal);
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return days[d.getDay()] || '';
      },

      /**
       * Gera ID único
       */
      generateId() {
        return 'bill_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      }
    }
  };

  window.AppConfig = AppConfig;
})(window);
