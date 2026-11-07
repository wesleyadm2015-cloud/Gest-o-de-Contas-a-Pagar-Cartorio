/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Camada de Regras de Negócio e Serviços de Contas (BillService)
 */

(function (window) {
  'use strict';

  class BillService {
    /**
     * Retorna a data de hoje normalizada (meia-noite)
     * @returns {Date}
     */
    getTodayNormalized() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    /**
     * Calcula o status efetivo da conta com base na data de vencimento e pagamento
     * @param {Object} bill
     * @returns {'pago' | 'atrasado' | 'pendente'}
     */
    computeStatus(bill) {
      if (bill.status === 'pago') {
        return 'pago';
      }

      if (!bill.dueDate) {
        return 'pendente';
      }

      const today = this.getTodayNormalized();
      const parts = bill.dueDate.split('-');
      const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      due.setHours(0, 0, 0, 0);

      if (due.getTime() < today.getTime()) {
        return 'atrasado';
      }

      return 'pendente';
    }

    /**
     * Enriquece uma lista de contas com status computado, projeção mensal e metadados visuais
     * @param {Array<Object>} bills
     * @param {Object} context { targetYear, targetMonth }
     * @returns {Array<Object>}
     */
    enrichBills(bills, context = {}) {
      const today = this.getTodayNormalized();
      const todayISO = window.AppConfig.utils.toISODateString(today);

      const targetYear = context.targetYear !== undefined && context.targetYear !== null
        ? Number(context.targetYear)
        : today.getFullYear();
      const targetMonth = context.targetMonth !== undefined && context.targetMonth !== null
        ? Number(context.targetMonth)
        : today.getMonth();

      const pad = (n) => String(n).padStart(2, '0');
      const targetMonthKey = `${targetYear}-${pad(targetMonth + 1)}`;

      return bills.map((b) => {
        const expenseType = b.expenseType || (b.category === 'fixas' ? 'fixa' : 'variavel');
        const isFixed = expenseType === 'fixa';

        let dueDate = b.dueDate;
        let status = b.status || 'pendente';
        let paymentDate = b.paymentDate || null;
        let invoiceNumber = b.invoiceNumber || '';
        let documentNumber = b.documentNumber || '';

        // Origem do lançamento para determinar o mês de partida da despesa fixa
        const origDueDate = b.launchDueDate || b.dueDate;
        const startMonthKey = b.startMonthKey || (origDueDate && origDueDate.includes('-') ? origDueDate.substring(0, 7) : targetMonthKey);

        // Se a despesa for fixa e o mês visualizado for ANTERIOR ao mês de lançamento da despesa
        const isPriorToLaunch = isFixed && Boolean(startMonthKey) && (targetMonthKey < startMonthKey);

        // =========================================================================
        // REGRA DE NEGÓCIO DE DESPESAS FIXAS:
        // Todas as despesas fixas constam em todos os meses seguintes ao lançamento dela.
        // NÃO incluir em meses anteriores.
        // Status padrão de "Aguardando Pagamento" (pendente) e vencimento no dia estipulado do mês.
        // =========================================================================
        if (isFixed && b.dueDate) {
          if (!isPriorToLaunch) {
            const stipulatedDay = Number(b.dueDay) || parseInt(b.dueDate.split('-')[2], 10) || 1;
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const effectiveDay = Math.min(stipulatedDay, daysInMonth);
            dueDate = `${targetYear}-${pad(targetMonth + 1)}-${pad(effectiveDay)}`;

            // Verifica se para esse mês específico já houve registro de pagamento ou quitação
            if (b.monthlyStatus && b.monthlyStatus[targetMonthKey]) {
              status = b.monthlyStatus[targetMonthKey].status || 'pendente';
              paymentDate = b.monthlyStatus[targetMonthKey].paymentDate || null;
              if (b.monthlyStatus[targetMonthKey].invoiceNumber !== undefined) {
                invoiceNumber = b.monthlyStatus[targetMonthKey].invoiceNumber;
              }
              if (b.monthlyStatus[targetMonthKey].documentNumber !== undefined) {
                documentNumber = b.monthlyStatus[targetMonthKey].documentNumber;
              }
            } else if (origDueDate && origDueDate.startsWith(targetMonthKey)) {
              // Mês original em que a despesa foi cadastrada
              status = b.status || 'pendente';
              paymentDate = b.paymentDate || null;
            } else {
              // Em qualquer mês subsequente: status padrão "aguardando pagamento" e data pendente
              status = 'pendente';
              paymentDate = null;
            }
          }
        }

        const effectiveStatus = this.computeStatus({ dueDate, status, paymentDate });
        const relativeDate = window.AppConfig.utils.getRelativeDateInfo(dueDate, effectiveStatus);
        const categoryMeta = window.AppConfig.CATEGORIES[b.category] || window.AppConfig.CATEGORIES.outros;
        const paymentMeta = window.AppConfig.PAYMENT_METHODS[b.paymentMethod] || window.AppConfig.PAYMENT_METHODS.pix;
        const statusMeta = window.AppConfig.STATUSES[effectiveStatus] || window.AppConfig.STATUSES.pendente;
        const rawLoc = b.location || 'LD';
        const location = rawLoc === 'CG' ? 'LD' : rawLoc;
        const invoiceStatus = (invoiceNumber || documentNumber) ? 'recebida' : (b.invoiceStatus || 'aguardando');
        const invoiceMeta = (window.AppConfig.INVOICE_STATUSES && window.AppConfig.INVOICE_STATUSES[invoiceStatus]) || { id: 'aguardando', label: 'Aguardando' };
        const expenseTypeMeta = (window.AppConfig.EXPENSE_TYPES && window.AppConfig.EXPENSE_TYPES[expenseType]) || {
          id: expenseType,
          code: expenseType === 'fixa' ? 'F' : 'V',
          label: expenseType === 'fixa' ? 'Fixa' : 'Variável',
          shortLabel: expenseType === 'fixa' ? 'F' : 'V',
          icon: expenseType === 'fixa' ? 'pin' : 'trending-up',
          badgeClass: expenseType === 'fixa'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        };

        return {
          ...b,
          dueDate,
          status,
          paymentDate,
          invoiceNumber,
          documentNumber,
          location,
          expenseType,
          expenseTypeMeta,
          effectiveStatus,
          relativeDate,
          categoryMeta,
          paymentMeta,
          statusMeta,
          invoiceStatus,
          invoiceMeta,
          monthKey: targetMonthKey,
          startMonthKey,
          isPriorToLaunch
        };
      });
    }

    /**
     * Verifica se uma data pertence a um determinado período
     * @param {string} dateStr YYYY-MM-DD
     * @param {string} period 'hoje' | 'semana' | 'mes' | 'todos' | 'personalizado'
     * @param {string} customStart YYYY-MM-DD
     * @param {string} customEnd YYYY-MM-DD
     * @param {number|null} targetYear Ano específico (opcional)
     * @param {number|null} targetMonth Mês específico 0-11 (opcional)
     * @returns {boolean}
     */
    isDateInPeriod(dateStr, period, customStart = null, customEnd = null, targetYear = null, targetMonth = null) {
      if (!dateStr || period === 'todos') return true;

      const today = this.getTodayNormalized();
      const parts = dateStr.split('-');
      const targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      targetDate.setHours(0, 0, 0, 0);

      if (period === 'hoje') {
        return targetDate.getTime() === today.getTime();
      }

      if (period === 'semana') {
        // Início da semana (Segunda-feira) e Fim da semana (Domingo)
        const currentDay = today.getDay(); // 0 é Domingo, 1 é Segunda
        const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + distanceToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return targetDate.getTime() >= startOfWeek.getTime() && targetDate.getTime() <= endOfWeek.getTime();
      }

      if (period === 'mes') {
        const y = targetYear !== null && targetYear !== undefined ? Number(targetYear) : today.getFullYear();
        const m = targetMonth !== null && targetMonth !== undefined ? Number(targetMonth) : today.getMonth();
        return (
          targetDate.getFullYear() === y &&
          targetDate.getMonth() === m
        );
      }

      if (period === 'personalizado' && customStart && customEnd) {
        const start = new Date(customStart + 'T00:00:00');
        const end = new Date(customEnd + 'T23:59:59');
        return targetDate.getTime() >= start.getTime() && targetDate.getTime() <= end.getTime();
      }

      return true;
    }

    /**
     * Aplica filtros e busca sobre a lista de contas
     * @param {Array<Object>} bills
     * @param {Object} filters
     * @returns {Array<Object>}
     */
    filterBills(bills, filters = {}) {
      const targetYear = filters.selectedYear !== undefined && filters.selectedYear !== null
        ? Number(filters.selectedYear)
        : new Date().getFullYear();
      const targetMonth = filters.selectedMonth !== undefined && filters.selectedMonth !== null
        ? Number(filters.selectedMonth)
        : new Date().getMonth();

      const enriched = this.enrichBills(bills, { targetYear, targetMonth });
      const query = (filters.search || '').toLowerCase().trim();
      const period = filters.period || 'todos';
      const statusFilter = filters.status || 'todos';
      const locationFilter = filters.location || 'todos';
      const expenseTypeFilter = filters.expenseType || 'todos';
      const categoryFilter = filters.category || 'todos';
      const paymentFilter = filters.paymentMethod || 'todos';
      const invoiceFilter = filters.invoiceStatus || 'todos';

      return enriched.filter((bill) => {
        // Regra de despesa fixa: NÃO incluir em meses anteriores ao lançamento
        if (bill.isPriorToLaunch && period !== 'todos') {
          return false;
        }

        // Se a despesa for fixa e o período for 'mes', ela SEMPRE pertence ao mês selecionado!
        if (bill.expenseType === 'fixa' && period === 'mes') {
          // Já está projetada para targetYear / targetMonth com seu vencimento no dia estipulado
        } else {
          // Filtro de Período normal
          if (!this.isDateInPeriod(bill.dueDate, period, filters.customStart, filters.customEnd, targetYear, targetMonth)) {
            return false;
          }
        }

        // Filtro de Status
        if (statusFilter !== 'todos' && bill.effectiveStatus !== statusFilter) {
          return false;
        }

        // Filtro de Local (LD, REC, SE)
        if (locationFilter !== 'todos') {
          const loc = bill.location === 'CG' ? 'LD' : (bill.location || 'LD');
          if (loc !== locationFilter) {
            return false;
          }
        }

        // Filtro de Tipo de Despesa (Fixa ou Variável)
        if (expenseTypeFilter !== 'todos' && bill.expenseType !== expenseTypeFilter) {
          return false;
        }

        // Filtro de Categoria
        if (categoryFilter !== 'todos' && bill.category !== categoryFilter) {
          return false;
        }

        // Filtro de Método de Pagamento
        if (paymentFilter !== 'todos' && bill.paymentMethod !== paymentFilter) {
          return false;
        }

        // Filtro de Nota Fiscal
        if (invoiceFilter !== 'todos' && bill.invoiceStatus !== invoiceFilter) {
          return false;
        }

        // Filtro de Busca textual
        if (query) {
          const matchDesc = bill.description.toLowerCase().includes(query);
          const matchNotes = (bill.notes || '').toLowerCase().includes(query);
          const matchCat = bill.categoryMeta.label.toLowerCase().includes(query);
          const matchPay = bill.paymentMeta.label.toLowerCase().includes(query);
          const matchInvoice = bill.invoiceMeta.label.toLowerCase().includes(query);
          const matchLoc = (bill.location || 'CG').toLowerCase().includes(query);
          const matchNF = (bill.invoiceNumber || '').toLowerCase().includes(query);
          const matchDoc = (bill.documentNumber || '').toLowerCase().includes(query);
          const matchVal = String(bill.amount).includes(query);
          const matchAguardandoNF = query.includes('aguard') && (!bill.invoiceNumber && !bill.documentNumber);

          if (!matchDesc && !matchLoc && !matchNotes && !matchCat && !matchPay && !matchInvoice && !matchNF && !matchDoc && !matchVal && !matchAguardandoNF) {
            return false;
          }
        }

        return true;
      });
    }

    /**
     * Ordena a lista de contas
     * @param {Array<Object>} bills
     * @param {string} sortBy
     * @returns {Array<Object>}
     */
    sortBills(bills, sortBy = 'dueDate_asc') {
      const cloned = [...bills];

      return cloned.sort((a, b) => {
        switch (sortBy) {
          case 'dueDate_asc':
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          case 'dueDate_desc':
            return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
          case 'amount_desc':
            return b.amount - a.amount;
          case 'amount_asc':
            return a.amount - b.amount;
          case 'description_asc':
            return a.description.localeCompare(b.description, 'pt-BR');
          default:
            return 0;
        }
      });
    }

    /**
     * Calcula indicadores financeiros e KPIs para o período selecionado
     * @param {Array<Object>} bills Todas as contas cadastradas
     * @param {string} period 'hoje' | 'semana' | 'mes' | 'todos'
     * @param {number} monthlyBudget
     * @param {number|null} targetYear
     * @param {number|null} targetMonth
     * @returns {Object}
     */
    calculateKPIs(bills, period = 'mes', monthlyBudget = 8000, targetYear = null, targetMonth = null) {
      const today = this.getTodayNormalized();
      const curYear = targetYear !== null && targetYear !== undefined ? Number(targetYear) : today.getFullYear();
      const curMonth = targetMonth !== null && targetMonth !== undefined ? Number(targetMonth) : today.getMonth();
      const enriched = this.enrichBills(bills, { targetYear: curYear, targetMonth: curMonth });
      const todayISO = window.AppConfig.utils.toISODateString(today);

      // Métricas globais de urgência (verificadas para o mês corrente em relação a hoje)
      const currentMonthEnriched = (curYear === today.getFullYear() && curMonth === today.getMonth())
        ? enriched
        : this.enrichBills(bills, { targetYear: today.getFullYear(), targetMonth: today.getMonth() });

      let overdueCount = 0;
      let overdueTotal = 0;
      let dueTodayPendingCount = 0;
      let dueTodayTotal = 0;

      currentMonthEnriched.forEach((b) => {
        if (b.isPriorToLaunch) return;
        if (b.effectiveStatus === 'atrasado') {
          overdueCount++;
          overdueTotal += b.amount;
        }
        if (b.dueDate === todayISO) {
          dueTodayTotal += b.amount;
          if (b.effectiveStatus !== 'pago') {
            dueTodayPendingCount++;
          }
        }
      });

      // Métricas filtradas para o período selecionado
      const periodBills = enriched.filter((b) => {
        if (b.isPriorToLaunch && period !== 'todos') return false;
        if (b.expenseType === 'fixa' && period === 'mes') return true;
        return this.isDateInPeriod(b.dueDate, period, null, null, curYear, curMonth);
      });

      let totalAmount = 0;
      let totalPaid = 0;
      let paidCount = 0;
      let totalPending = 0;
      let pendingCount = 0;
      let totalFixed = 0;
      let totalVariable = 0;
      let fixedCount = 0;
      let variableCount = 0;

      periodBills.forEach((b) => {
        totalAmount += b.amount;
        if (b.expenseType === 'fixa') {
          totalFixed += b.amount;
          fixedCount++;
        } else {
          totalVariable += b.amount;
          variableCount++;
        }
        if (b.effectiveStatus === 'pago') {
          totalPaid += b.amount;
          paidCount++;
        } else {
          totalPending += b.amount;
          pendingCount++;
        }
      });

      const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
      const budgetRemaining = Math.max(0, monthlyBudget - totalAmount);

      return {
        period,
        totalBillsCount: periodBills.length,
        totalAmount,
        totalPaid,
        paidCount,
        totalPending,
        pendingCount,
        totalFixed,
        totalVariable,
        fixedCount,
        variableCount,
        paidPercentage: Number(paidPercentage.toFixed(1)),
        budgetRemaining,
        monthlyBudget,
        // Alertas globais
        overdueCount,
        overdueTotal,
        dueTodayPendingCount,
        dueTodayTotal
      };
    }

    /**
     * Retorna o agrupamento de despesas por categoria
     * @param {Array<Object>} bills
     * @returns {Array<Object>}
     */
    getCategoryBreakdown(bills) {
      const enriched = this.enrichBills(bills);
      const totalOverall = enriched.reduce((sum, b) => sum + b.amount, 0);
      const groups = {};

      // Inicializa com as categorias padrão
      Object.keys(window.AppConfig.CATEGORIES).forEach((catId) => {
        groups[catId] = {
          id: catId,
          meta: window.AppConfig.CATEGORIES[catId],
          total: 0,
          paidTotal: 0,
          pendingTotal: 0,
          count: 0
        };
      });

      enriched.forEach((b) => {
        const cat = groups[b.category] || groups.outros;
        cat.total += b.amount;
        cat.count += 1;
        if (b.effectiveStatus === 'pago') {
          cat.paidTotal += b.amount;
        } else {
          cat.pendingTotal += b.amount;
        }
      });

      // Converte para array e calcula porcentagens
      const result = Object.values(groups)
        .filter((g) => g.count > 0)
        .map((g) => ({
          ...g,
          percentage: totalOverall > 0 ? ((g.total / totalOverall) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.total - a.total);

      return result;
    }

    /**
     * Retorna contas urgentes (atrasadas ou vencendo hoje não pagas)
     * @param {Array<Object>} bills
     * @returns {Array<Object>}
     */
    getUrgentBills(bills) {
      const today = this.getTodayNormalized();
      const enriched = this.enrichBills(bills, { targetYear: today.getFullYear(), targetMonth: today.getMonth() });
      const todayISO = window.AppConfig.utils.toISODateString(today);

      return enriched.filter((b) => {
        if (b.isPriorToLaunch) return false;
        if (b.effectiveStatus === 'atrasado') return true;
        if (b.dueDate === todayISO && b.effectiveStatus !== 'pago') return true;
        return false;
      });
    }

    /**
     * Retorna agrupamento mensal de contas (Cronograma Mensal de Vencimentos)
     * Inclui todas as despesas fixas recorrentes em todos os meses
     * @param {Array<Object>} bills
     * @returns {Array<Object>}
     */
    getMonthlyBreakdown(bills) {
      const today = this.getTodayNormalized();
      const currentYear = today.getFullYear();
      const months = {};
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

      for (let m = 0; m < 12; m++) {
        const padM = String(m + 1).padStart(2, '0');
        const key = `${currentYear}-${padM}`;
        months[key] = {
          key,
          label: `${monthNames[m]} de ${currentYear}`,
          shortLabel: `${monthNames[m].substring(0, 3)}/${String(currentYear).substring(2)}`,
          year: currentYear,
          month: m + 1,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0
        };

        const monthBills = this.getMonthBills(bills, currentYear, m);
        monthBills.forEach((b) => {
          months[key].total += b.amount;
          months[key].count++;
          if (b.effectiveStatus === 'pago') {
            months[key].paid += b.amount;
          } else {
            months[key].pending += b.amount;
          }
        });
      }

      return Object.values(months).sort((a, b) => a.key.localeCompare(b.key));
    }

    /**
     * Retorna todas as contas que vencem no mês e ano especificados
     * @param {Array<Object>} bills
     * @param {number} year
     * @param {number} month (0-11)
     * @returns {Array<Object>}
     */
    getMonthBills(bills, year, month) {
      const enriched = this.enrichBills(bills, { targetYear: year, targetMonth: month });
      return enriched.filter((b) => {
        if (b.isPriorToLaunch) return false;
        if (b.expenseType === 'fixa') return true;
        return this.isDateInPeriod(b.dueDate, 'mes', null, null, year, month);
      });
    }

    /**
     * Retorna contas pendentes que vencem em até N dias úteis antes do vencimento
     * @param {Array<Object>} bills
     * @param {number} maxBusinessDays
     * @returns {Array<Object>}
     */
    getBillsDueInBusinessDays(bills, maxBusinessDays = 2) {
      const today = this.getTodayNormalized();
      const todayISO = window.AppConfig.utils.toISODateString(today);
      const enriched = this.enrichBills(bills, { targetYear: today.getFullYear(), targetMonth: today.getMonth() });
      const targetDate = window.AppConfig.utils.addBusinessDays(today, maxBusinessDays);
      const targetISO = window.AppConfig.utils.toISODateString(targetDate);

      return enriched
        .filter((bill) => {
          if (bill.isPriorToLaunch) return false;
          if (bill.effectiveStatus === 'pago') return false;
          if (!bill.dueDate) return false;
          // Vencimento de hoje até a data limite de N dias úteis
          return bill.dueDate >= todayISO && bill.dueDate <= targetISO;
        })
        .map((bill) => {
          const effectiveDueDate = window.AppConfig.utils.getEffectiveBusinessDueDate(bill.dueDate);
          const bDays = window.AppConfig.utils.getBusinessDaysDiff(todayISO, window.AppConfig.utils.toISODateString(effectiveDueDate));
          return {
            ...bill,
            effectiveDueDate,
            businessDaysDiff: Math.max(0, bDays)
          };
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    /**
     * Retorna contas que já estão vencidas e não pagas
     * @param {Array<Object>} bills
     * @returns {Array<Object>}
     */
    getOverdueBills(bills) {
      const today = this.getTodayNormalized();
      const enriched = this.enrichBills(bills, { targetYear: today.getFullYear(), targetMonth: today.getMonth() });
      return enriched.filter((b) => !b.isPriorToLaunch && b.effectiveStatus === 'atrasado');
    }

    /**
     * Retorna as maiores despesas (Ranking Top N)
     * @param {Array<Object>} bills
     * @param {number} limit
     * @returns {Array<Object>}
     */
    getTopBills(bills, limit = 5) {
      const enriched = this.enrichBills(bills);
      return [...enriched].sort((a, b) => b.amount - a.amount).slice(0, limit);
    }
  }

  window.BillService = new BillService();
})(window);
