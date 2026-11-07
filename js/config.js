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
       * Retorna rótulo amigável relativo à data de hoje (ex: Hoje, Amanhã, Atrasada há X dias)
       * @param {string} dueDateStr
       * @param {string} status
       * @returns {{ text: string, type: 'today'|'overdue'|'upcoming'|'normal' }}
       */
      getRelativeDateInfo(dueDateStr, status) {
        if (!dueDateStr) return { text: '-', type: 'normal' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parts = dueDateStr.split('-');
        const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (status === 'pago') {
          return { text: this.formatDate(dueDateStr), type: 'normal' };
        }

        if (diffDays === 0) {
          return { text: 'Vence Hoje!', type: 'today' };
        } else if (diffDays === 1) {
          return { text: 'Vence Amanhã', type: 'upcoming' };
        } else if (diffDays === -1) {
          return { text: 'Venceu Ontem', type: 'overdue' };
        } else if (diffDays < -1) {
          return { text: `Atrasada há ${Math.abs(diffDays)} dias`, type: 'overdue' };
        } else if (diffDays <= 5) {
          return { text: `Vence em ${diffDays} dias`, type: 'upcoming' };
        } else {
          return { text: this.formatDate(dueDateStr), type: 'normal' };
        }
      },

      /**
       * Se a data cair em sábado ou domingo, avança para a próxima segunda-feira (vencimento bancário efetivo)
       * @param {Date|string} dateVal
       * @returns {Date}
       */
      getEffectiveBusinessDueDate(dateVal) {
        let d = typeof dateVal === 'string' ? new Date(dateVal + 'T00:00:00') : new Date(dateVal);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        if (day === 6) { // Sábado -> Segunda (+2)
          d.setDate(d.getDate() + 2);
        } else if (day === 0) { // Domingo -> Segunda (+1)
          d.setDate(d.getDate() + 1);
        }
        return d;
      },

      /**
       * Adiciona N dias úteis a uma data (pula sábados e domingos)
       * @param {Date|string} startDate
       * @param {number} businessDays
       * @returns {Date}
       */
      addBusinessDays(startDate, businessDays = 2) {
        let cur = typeof startDate === 'string' ? new Date(startDate + 'T00:00:00') : new Date(startDate);
        cur.setHours(0, 0, 0, 0);
        let added = 0;
        while (added < businessDays) {
          cur.setDate(cur.getDate() + 1);
          const day = cur.getDay();
          if (day !== 0 && day !== 6) {
            added++;
          }
        }
        return cur;
      },

      /**
       * Calcula a diferença em dias úteis entre duas datas
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

        while (isForward ? cur.getTime() < target.getTime() : cur.getTime() > target.getTime()) {
          cur.setDate(cur.getDate() + step);
          const day = cur.getDay();
          if (day !== 0 && day !== 6) {
            count += step;
          }
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
