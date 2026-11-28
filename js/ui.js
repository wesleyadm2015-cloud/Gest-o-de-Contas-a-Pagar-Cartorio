/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Gerenciador de Interface de Usuário (UIManager)
 */

(function (window) {
  'use strict';

  class UIManager {
    constructor() {
      this.toastContainer = null;
      this.currentBillToDelete = null;
    }

    init() {
      this.toastContainer = document.getElementById('toast-container');
      this.initTheme();
    }

    /**
     * Sistema de Notificações Toast Flutuantes
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} type
     * @param {number} duration
     */
    showToast(message, type = 'success', duration = 3500) {
      if (!this.toastContainer) return;

      const toast = document.createElement('div');
      toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-toast-in pointer-events-auto transition-all ${
        type === 'success'
          ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800'
          : type === 'error'
          ? 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800'
          : type === 'warning'
          ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-800'
          : 'bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
      }`;

      let iconSvg = '';
      if (type === 'success') {
        iconSvg = `<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"></i>`;
      } else if (type === 'error') {
        iconSvg = `<i data-lucide="alert-circle" class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0"></i>`;
      } else if (type === 'warning') {
        iconSvg = `<i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0"></i>`;
      } else {
        iconSvg = `<i data-lucide="info" class="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0"></i>`;
      }

      toast.innerHTML = `
        ${iconSvg}
        <span class="flex-1">${message}</span>
        <button type="button" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2" onclick="this.parentElement.remove()">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      `;

      this.toastContainer.appendChild(toast);
      if (window.lucide) window.lucide.createIcons();

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }

    /**
     * Inicialização e Alternância de Tema (Padrão: Todo o Site em Verde Claro)
     */
    initTheme() {
      // Define o tema Verde Claro em todo o site como padrão ativo
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      this.updateThemeIcons();
    }

    toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      this.updateThemeIcons();
      if (window.ChartService) {
        window.ChartService.refreshTheme();
      }
      this.showToast(isDark ? 'Modo Escuro ativado' : 'Modo Claro ativado', 'info', 2000);
    }

    updateThemeIcons() {
      const isDark = document.documentElement.classList.contains('dark');
      const sunIcons = document.querySelectorAll('.theme-icon-sun');
      const moonIcons = document.querySelectorAll('.theme-icon-moon');

      sunIcons.forEach((el) => el.classList.toggle('hidden', !isDark));
      moonIcons.forEach((el) => el.classList.toggle('hidden', isDark));
    }

    /**
     * Atualiza os Cards de KPIs e Indicadores no Topo
     * @param {Object} kpis
     */
    renderKPIs(kpis) {
      const format = window.AppConfig.utils.formatBRL;

      // Card Total Aguardando Pagamento
      const elPending = document.getElementById('kpi-total-pending');
      const elPendingCount = document.getElementById('kpi-pending-count');
      if (elPending) elPending.textContent = format(kpis.totalPending);
      if (elPendingCount) elPendingCount.textContent = `${kpis.pendingCount} aguardando`;

      // Card Total Pago
      const elPaid = document.getElementById('kpi-total-paid');
      const elPaidPct = document.getElementById('kpi-paid-percentage');
      if (elPaid) elPaid.textContent = format(kpis.totalPaid);
      if (elPaidPct) elPaidPct.textContent = `${kpis.paidPercentage}% pago`;

      // Card Total Geral / Comprometido
      const elTotal = document.getElementById('kpi-total-amount');
      const elTotalCount = document.getElementById('kpi-total-count');
      if (elTotal) elTotal.textContent = format(kpis.totalAmount);
      if (elTotalCount) elTotalCount.textContent = `${kpis.totalBillsCount} contas`;

      // Card Contas Vencidas / Críticas
      const elOverdue = document.getElementById('kpi-overdue-total');
      const elOverdueCount = document.getElementById('kpi-overdue-count');
      const elOverdueCard = document.getElementById('kpi-overdue-card');
      if (elOverdue) elOverdue.textContent = format(kpis.overdueTotal);
      if (elOverdueCount) elOverdueCount.textContent = `${kpis.overdueCount} atrasadas`;

      if (elOverdueCard) {
        if (kpis.overdueCount > 0) {
          elOverdueCard.classList.remove('opacity-60');
          elOverdueCard.classList.add('ring-2', 'ring-rose-500/40');
        } else {
          elOverdueCard.classList.add('opacity-60');
          elOverdueCard.classList.remove('ring-2', 'ring-rose-500/40');
        }
      }

      // Card Vencendo Hoje
      const elToday = document.getElementById('kpi-today-total');
      const elTodayCount = document.getElementById('kpi-today-count');
      if (elToday) elToday.textContent = format(kpis.dueTodayTotal);
      if (elTodayCount) elTodayCount.textContent = `${kpis.dueTodayPendingCount} a pagar`;

      // Barra de Progresso Financeiro (Pago vs Pendente)
      const progressBar = document.getElementById('kpi-progress-bar');
      const progressLabel = document.getElementById('kpi-progress-label');
      if (progressBar) progressBar.style.width = `${kpis.paidPercentage}%`;
      if (progressLabel) {
        progressLabel.textContent = `${kpis.paidPercentage}% pago (${format(kpis.totalPaid)} de ${format(kpis.totalAmount)})`;
      }

      // Notificação Header Bell Badge
      const urgentCount = kpis.overdueCount + kpis.dueTodayPendingCount;
      const bellBadge = document.getElementById('notification-bell-badge');
      if (bellBadge) {
        if (urgentCount > 0) {
          bellBadge.textContent = urgentCount > 9 ? '9+' : urgentCount;
          bellBadge.classList.remove('hidden');
        } else {
          bellBadge.classList.add('hidden');
        }
      }
    }

    /**
     * Atualiza o seletor de mês de referência e o resumo dinâmico do mês
     * @param {number} selectedYear
     * @param {number} selectedMonth (0-11)
     * @param {Array<Object>} monthBills
     */
    updateMonthSelector(selectedYear, selectedMonth, monthBills = []) {
      const selectMonth = document.getElementById('select-month');
      const selectYear = document.getElementById('select-year');
      if (selectMonth && selectMonth.value !== String(selectedMonth)) {
        selectMonth.value = String(selectedMonth);
      }
      if (selectYear && selectYear.value !== String(selectedYear)) {
        selectYear.value = String(selectedYear);
      }

      const total = monthBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const totalEl = document.getElementById('month-summary-total');
      const countEl = document.getElementById('month-summary-count');
      const labelEl = document.getElementById('month-summary-label');
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];

      if (totalEl) totalEl.textContent = window.AppConfig.utils.formatBRL(total);
      if (countEl) countEl.textContent = `${monthBills.length} ${monthBills.length === 1 ? 'conta' : 'contas'}`;
      if (labelEl) {
        labelEl.textContent = `Total de ${monthNames[selectedMonth] || ''} / ${selectedYear}`;
      }
    }

    /**
     * Renderiza o banner de alerta de urgência no topo (Mantido para compatibilidade segura)
     * @param {Object} kpis
     */
    renderUrgencyBanner(kpis) {
      const banner = document.getElementById('urgency-alert-banner');
      if (!banner) return;

      const hasOverdue = kpis.overdueCount > 0;
      const hasToday = kpis.dueTodayPendingCount > 0;

      if (!hasOverdue && !hasToday) {
        banner.classList.add('hidden');
        return;
      }

      banner.classList.remove('hidden');
      const textContainer = document.getElementById('urgency-banner-text');

      let alertHtml = '';
      if (hasOverdue && hasToday) {
        alertHtml = `Atenção: Você possui <strong class="text-rose-600 dark:text-rose-400 font-bold">${kpis.overdueCount} conta(s) atrasada(s)</strong> (${window.AppConfig.utils.formatBRL(kpis.overdueTotal)}) e <strong class="text-amber-600 dark:text-amber-400 font-bold">${kpis.dueTodayPendingCount} vencendo hoje</strong>!`;
      } else if (hasOverdue) {
        alertHtml = `Atenção: Você possui <strong class="text-rose-600 dark:text-rose-400 font-bold">${kpis.overdueCount} conta(s) atrasada(s)</strong> totalizando ${window.AppConfig.utils.formatBRL(kpis.overdueTotal)}.`;
      } else {
        alertHtml = `Lembrete: Você possui <strong class="text-amber-600 dark:text-amber-400 font-bold">${kpis.dueTodayPendingCount} conta(s) com vencimento para HOJE</strong>!`;
      }

      if (textContainer) textContainer.innerHTML = alertHtml;
      if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Renderiza a Tabela Desktop e Cards Mobile de Contas
     * @param {Array<Object>} bills
     */
    renderBillsList(bills) {
      const tbody = document.getElementById('bills-table-body');
      const mobileContainer = document.getElementById('bills-mobile-cards');
      const emptyState = document.getElementById('bills-empty-state');
      const billsCountBadge = document.getElementById('bills-results-count');

      if (billsCountBadge) {
        billsCountBadge.textContent = `${bills.length} conta${bills.length === 1 ? '' : 's'}`;
      }

      if (!bills || bills.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (mobileContainer) mobileContainer.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');

      const format = window.AppConfig.utils.formatBRL;

      // 1. Renderiza Tabela Desktop
      if (tbody) {
        tbody.innerHTML = bills
          .map((bill) => {
            const isPaid = bill.effectiveStatus === 'pago';
            const isOverdue = bill.effectiveStatus === 'atrasado';

            // Classe da linha
            const rowClass = isPaid
              ? 'bg-slate-50/50 dark:bg-slate-900/30 text-slate-500'
              : isOverdue
              ? 'bg-rose-50/30 dark:bg-rose-950/20'
              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40';

            // Indicador de data relativa
            let dueBadgeClass = 'text-slate-600 dark:text-slate-300';
            if (bill.relativeDate.type === 'today') {
              dueBadgeClass = 'text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1';
            } else if (bill.relativeDate.type === 'overdue') {
              dueBadgeClass = 'text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1';
            }

            // Segmentos de data de pagamento para edição independente de Dia, Mês e Ano
            const pDateParts = bill.paymentDate ? bill.paymentDate.split('-') : [];
            const yearVal = pDateParts[0] || '';
            const monthVal = pDateParts[1] || '';
            const dayVal = pDateParts[2] || '';

            return `
              <tr class="border-b border-slate-200/80 dark:border-slate-800 transition-colors group ${rowClass}" data-id="${bill.id}">
                <!-- LOCAL: Botão compacto com lista suspensa para selecionar entre LD, REC e SE -->
                <td class="py-2 px-1 text-center whitespace-nowrap">
                  <div class="relative inline-flex items-center justify-center">
                    <select
                      class="select-inline-location btn-location-select cursor-pointer appearance-none text-xs font-black py-0.5 pl-2 pr-5 rounded-lg border transition-all hover:scale-105 active:scale-95 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      data-id="${bill.id}"
                      data-location="${bill.location === 'CG' ? 'LD' : (bill.location || 'LD')}"
                      title="Clique para selecionar o Local (LD, REC ou SE)"
                    >
                      <option value="LD" ${bill.location === 'LD' || bill.location === 'CG' || !bill.location ? 'selected' : ''} class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">LD</option>
                      <option value="REC" ${bill.location === 'REC' ? 'selected' : ''} class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">REC</option>
                      <option value="SE" ${bill.location === 'SE' ? 'selected' : ''} class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">SE</option>
                    </select>
                    <div class="pointer-events-none absolute right-1 flex items-center text-slate-500">
                      <i data-lucide="chevron-down" class="w-2.5 h-2.5"></i>
                    </div>
                  </div>
                </td>

                <!-- Descrição & Observação (Espaço Amplo) -->
                <td class="col-description py-2 px-3">
                  <div class="flex flex-col">
                    <span class="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-snug">
                      ${bill.description}
                    </span>
                    ${
                      bill.notes
                        ? `<span class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1" title="${bill.notes}">
                            <i data-lucide="align-left" class="w-2.5 h-2.5 inline mr-1 text-slate-400 shrink-0"></i>${bill.notes}
                          </span>`
                        : ''
                    }
                  </div>
                </td>

                <!-- Nota Fiscal / Documento (NF / Doc) com Botão para Adicionar / Editar Números -->
                <td class="py-2 px-2 whitespace-nowrap text-center">
                  ${
                    bill.invoiceNumber || bill.documentNumber
                      ? `
                        <div class="flex items-center justify-between gap-1.5 group/nf">
                          <div class="flex flex-col gap-0.5">
                            ${
                              bill.invoiceNumber
                                ? `<div class="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200" title="Número da Nota Fiscal: ${bill.invoiceNumber}">
                                     <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                       NF
                                     </span>
                                     <span class="font-semibold tabular-nums">${bill.invoiceNumber}</span>
                                   </div>`
                                : ''
                            }
                            ${
                              bill.documentNumber
                                ? `<div class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400" title="Número do Documento: ${bill.documentNumber}">
                                     <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                       Doc
                                     </span>
                                     <span class="tabular-nums">${bill.documentNumber}</span>
                                   </div>`
                                : ''
                            }
                          </div>
                          <button
                            type="button"
                            class="btn-quick-edit-nf p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/70 dark:hover:bg-slate-800 rounded transition-colors"
                            data-id="${bill.id}"
                            title="Editar Nota Fiscal ou Documento"
                          >
                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      `
                      : `
                        <button
                          type="button"
                          class="btn-quick-edit-nf btn-quick-nf-waiting inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/70 transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                          data-id="${bill.id}"
                          title="Aguardando Nota Fiscal ou Documento. Clique para lançar os números."
                        >
                          <i data-lucide="clock" class="w-3 h-3 text-amber-600 dark:text-amber-400"></i>
                          <span>Aguardando</span>
                        </button>
                      `
                  }
                </td>

                <!-- F/V: Fixa (F) ou Variável (V) -->
                <td class="py-2 px-1 text-center whitespace-nowrap">
                  <div class="relative inline-flex items-center justify-center">
                    <select
                      class="select-inline-expense-type btn-fv-select cursor-pointer appearance-none text-xs font-black py-0.5 px-2 rounded-lg border transition-all hover:scale-105 active:scale-95 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      data-id="${bill.id}"
                      data-type="${bill.expenseType === 'variavel' ? 'variavel' : 'fixa'}"
                      title="Classificação: ${bill.expenseType === 'variavel' ? 'Variável (V)' : 'Fixa (F)'}. Clique para alterar."
                    >
                      <option value="fixa" ${bill.expenseType !== 'variavel' ? 'selected' : ''} class="bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-bold">F</option>
                      <option value="variavel" ${bill.expenseType === 'variavel' ? 'selected' : ''} class="bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 font-bold">V</option>
                    </select>
                  </div>
                </td>

                <!-- Categoria -->
                <td class="py-2 px-2 whitespace-nowrap">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${bill.categoryMeta.badgeClass}">
                    <i data-lucide="${bill.categoryMeta.icon}" class="w-3 h-3"></i>
                    ${bill.categoryMeta.label}
                  </span>
                </td>

                <!-- Vencimento & Data Relativa -->
                <td class="py-2 px-2 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="text-xs font-semibold tabular-nums ${dueBadgeClass}">
                      ${bill.relativeDate.type === 'today' ? '<i data-lucide="clock" class="w-3 h-3 inline animate-pulse mr-1"></i>' : ''}
                      ${bill.relativeDate.type === 'overdue' ? '<i data-lucide="alert-octagon" class="w-3 h-3 inline mr-1"></i>' : ''}
                      ${window.AppConfig.utils.formatDate(bill.effectiveISO || bill.dueDate)}
                    </span>
                    <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span class="text-[10px] text-slate-400 font-medium">
                        ${bill.relativeDate.text}
                      </span>
                      ${
                        bill.isProrogated
                          ? `<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-200" title="Vencimento nominal ${window.AppConfig.utils.formatDate(bill.dueDate)} prorrogado para ${window.AppConfig.utils.formatDate(bill.effectiveISO)} por feriado/final de semana">⚖️ Prorrogado</span>`
                          : ''
                      }
                    </div>
                  </div>
                </td>

                <!-- Data de Pagamento: Segmentada (Dia, Mês e Ano Independentes + Calendário) -->
                <td class="py-2 px-2 whitespace-nowrap text-center">
                  <div class="flex items-center gap-1">
                    <div
                      class="date-segmented-container relative inline-flex items-center px-1.5 py-0.5 rounded-md border font-medium text-xs transition-all ${
                        isPaid && bill.paymentDate
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-[#edf8f1] border-[#aee4c5] text-slate-700'
                      }"
                      data-id="${bill.id}"
                    >
                      <!-- Dia (01 a 31) -->
                      <input
                        type="text"
                        inputmode="numeric"
                        maxlength="2"
                        placeholder="DD"
                        class="date-seg-day w-5 text-center bg-transparent border-0 border-none outline-none focus:ring-0 p-0 m-0 font-medium tabular-nums cursor-text"
                        data-id="${bill.id}"
                        value="${dayVal}"
                        title="Clique para alterar apenas o DIA"
                      />
                      <span class="text-slate-400 select-none px-0.5">/</span>

                      <!-- Mês (01 a 12) -->
                      <input
                        type="text"
                        inputmode="numeric"
                        maxlength="2"
                        placeholder="MM"
                        class="date-seg-month w-5 text-center bg-transparent border-0 border-none outline-none focus:ring-0 p-0 m-0 font-medium tabular-nums cursor-text"
                        data-id="${bill.id}"
                        value="${monthVal}"
                        title="Clique para alterar apenas o MÊS"
                      />
                      <span class="text-slate-400 select-none px-0.5">/</span>

                      <!-- Ano (AAAA) -->
                      <input
                        type="text"
                        inputmode="numeric"
                        maxlength="4"
                        placeholder="AAAA"
                        class="date-seg-year w-9 text-center bg-transparent border-0 border-none outline-none focus:ring-0 p-0 m-0 font-medium tabular-nums cursor-text"
                        data-id="${bill.id}"
                        value="${yearVal}"
                        title="Clique para alterar apenas o ANO"
                      />

                      <!-- Input de data nativo oculto para o botão de calendário -->
                      <input
                        type="date"
                        class="hidden-native-date-picker sr-only absolute opacity-0 pointer-events-none w-0 h-0"
                        data-id="${bill.id}"
                        value="${bill.paymentDate || ''}"
                        tabindex="-1"
                      />

                      <!-- Botão de Calendário -->
                      <button
                        type="button"
                        class="btn-open-calendar-picker p-0.5 text-slate-600 hover:text-emerald-800 rounded hover:bg-emerald-100/70 transition-colors ml-1"
                        data-id="${bill.id}"
                        title="Abrir calendário para escolher data"
                      >
                        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>

                    ${
                      isPaid && bill.paymentDate
                        ? `<button
                            type="button"
                            class="btn-clear-payment-date p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
                            data-id="${bill.id}"
                            title="Remover data de pagamento (marcar como Aguardando Pagamento)"
                          >
                            <i data-lucide="x" class="w-3 h-3"></i>
                          </button>`
                        : ''
                    }
                  </div>
                </td>

                <!-- STATUS (Lista Suspensa Discreta com Opções: Pago e Aguardando Pagamento) -->
                <td class="py-2 px-2 whitespace-nowrap text-center">
                  <div class="relative inline-flex items-center">
                    <span class="absolute left-2 pointer-events-none w-1.5 h-1.5 rounded-full ${
                      isPaid ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-amber-400'
                    }"></span>
                    <select
                      class="select-inline-status text-xs font-medium py-1 pl-5 pr-5 rounded-md border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 appearance-none cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500"
                      data-id="${bill.id}"
                      title="Clique para alterar o status da despesa"
                    >
                      <option value="pago" class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-normal" ${isPaid ? 'selected' : ''}>
                        Pago
                      </option>
                      <option value="pendente" class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-normal" ${!isPaid ? 'selected' : ''}>
                        Aguardando Pagamento
                      </option>
                    </select>
                    <div class="pointer-events-none absolute right-1.5 flex items-center text-slate-400 dark:text-slate-500">
                      <i data-lucide="chevron-down" class="w-3 h-3"></i>
                    </div>
                  </div>
                </td>

                <!-- Valor R$ (Sem riscar número quando pago) -->
                <td class="py-2 px-2 whitespace-nowrap text-right">
                  <span class="text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    ${format(bill.amount)}
                  </span>
                </td>

                <!-- Ações (Sem botão de check) -->
                <td class="py-2 px-2 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- Botão Destacado: Editar a Despesa Lançada -->
                    <button
                      type="button"
                      class="btn-edit-bill inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95"
                      data-id="${bill.id}"
                      title="Editar todos os dados desta despesa lançada"
                    >
                      <i data-lucide="edit-3" class="w-3 h-3"></i>
                      <span>Editar</span>
                    </button>

                    <!-- Botão Excluir -->
                    <button
                      type="button"
                      class="btn-delete-bill p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                      data-id="${bill.id}"
                      title="Excluir Conta"
                    >
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join('');
      }

      // 2. Renderiza Cards Mobile
      if (mobileContainer) {
        mobileContainer.innerHTML = bills
          .map((bill) => {
            const isPaid = bill.effectiveStatus === 'pago';
            const isOverdue = bill.effectiveStatus === 'atrasado';
            const pDateParts = bill.paymentDate ? bill.paymentDate.split('-') : [];
            const yearVal = pDateParts[0] || '';
            const monthVal = pDateParts[1] || '';
            const dayVal = pDateParts[2] || '';

            return `
              <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border ${
                isOverdue
                  ? 'border-rose-200 dark:border-rose-900/60 shadow-rose-100/30'
                  : 'border-slate-200 dark:border-slate-800'
              } shadow-sm space-y-3" data-id="${bill.id}">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${bill.statusMeta.badgeClass}">
                        <span class="w-1.5 h-1.5 rounded-full ${bill.statusMeta.dotClass}"></span>
                        ${bill.statusMeta.label}
                      </span>
                      <!-- LOCAL Mobile: Botão com lista para selecionar entre LD, REC e SE -->
                      <div class="relative inline-flex items-center">
                        <select
                          class="select-inline-location btn-location-select cursor-pointer appearance-none text-[11px] font-black py-0.5 pl-2 pr-5 rounded-md border"
                          data-id="${bill.id}"
                          data-location="${bill.location === 'CG' ? 'LD' : (bill.location || 'LD')}"
                          title="Alterar Local da conta (LD, REC ou SE)"
                        >
                          <option value="LD" ${bill.location === 'LD' || bill.location === 'CG' || !bill.location ? 'selected' : ''}>LD</option>
                          <option value="REC" ${bill.location === 'REC' ? 'selected' : ''}>REC</option>
                          <option value="SE" ${bill.location === 'SE' ? 'selected' : ''}>SE</option>
                        </select>
                        <div class="pointer-events-none absolute right-1 flex items-center text-slate-500">
                          <i data-lucide="chevron-down" class="w-2.5 h-2.5"></i>
                        </div>
                      </div>
                    </div>
                    <h4 class="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug">
                      ${bill.description}
                    </h4>
                  </div>
                  <span class="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    ${format(bill.amount)}
                  </span>
                </div>

                ${
                  bill.notes
                    ? `<p class="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                        ${bill.notes}
                      </p>`
                    : ''
                }

                <!-- Nota Fiscal / Documento no Mobile com Botão de Ação -->
                <div class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                  <div class="flex items-center gap-1.5 text-[11px] min-w-0">
                    <i data-lucide="file-text" class="w-3.5 h-3.5 text-emerald-600 shrink-0"></i>
                    <span class="font-semibold text-slate-500">NF/Doc:</span>
                    ${bill.invoiceNumber ? `<span class="font-bold text-emerald-900 dark:text-emerald-200 truncate">NF ${bill.invoiceNumber}</span>` : ''}
                    ${bill.invoiceNumber && bill.documentNumber ? '<span class="text-slate-300">•</span>' : ''}
                    ${bill.documentNumber ? `<span class="text-slate-600 dark:text-slate-400 truncate">Doc ${bill.documentNumber}</span>` : ''}
                    ${
                      !bill.invoiceNumber && !bill.documentNumber
                        ? '<span class="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 text-[11px]"><i data-lucide="clock" class="w-3 h-3 text-amber-600"></i> Aguardando</span>'
                        : ''
                    }
                  </div>
                  <button
                    type="button"
                    class="btn-quick-edit-nf text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2 border border-emerald-200 dark:border-emerald-800"
                    data-id="${bill.id}"
                    title="Lançar ou alterar Nota Fiscal e Documento"
                  >
                    ${bill.invoiceNumber || bill.documentNumber ? 'Alterar' : 'Lançar'}
                  </button>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${bill.categoryMeta.badgeClass}">
                      <i data-lucide="${bill.categoryMeta.icon}" class="w-3 h-3"></i>
                      ${bill.categoryMeta.label}
                    </span>
                    <!-- F/V Mobile Selector -->
                    <div class="relative inline-flex items-center">
                      <select
                        class="select-inline-expense-type btn-fv-select cursor-pointer appearance-none text-[11px] font-black py-0.5 px-2 rounded-md border"
                        data-id="${bill.id}"
                        data-type="${bill.expenseType === 'variavel' ? 'variavel' : 'fixa'}"
                        title="Classificação: ${bill.expenseType === 'variavel' ? 'Variável (V)' : 'Fixa (F)'}"
                      >
                        <option value="fixa" ${bill.expenseType !== 'variavel' ? 'selected' : ''}>F</option>
                        <option value="variavel" ${bill.expenseType === 'variavel' ? 'selected' : ''}>V</option>
                      </select>
                    </div>
                  </div>

                  <!-- STATUS: Lista suspensa discreta no Mobile -->
                  <div class="relative inline-flex items-center">
                    <span class="absolute left-2 pointer-events-none w-1.5 h-1.5 rounded-full ${
                      isPaid ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-amber-400'
                    }"></span>
                    <select
                      class="select-inline-status text-xs font-medium py-1 pl-5 pr-5 rounded-md border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 appearance-none cursor-pointer transition-all"
                      data-id="${bill.id}"
                      title="Alterar status da conta"
                    >
                      <option value="pago" class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-normal" ${isPaid ? 'selected' : ''}>
                        Pago
                      </option>
                      <option value="pendente" class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-normal" ${!isPaid ? 'selected' : ''}>
                        Aguardando Pagamento
                      </option>
                    </select>
                    <div class="pointer-events-none absolute right-1.5 flex items-center text-slate-400 dark:text-slate-500">
                      <i data-lucide="chevron-down" class="w-3 h-3"></i>
                    </div>
                  </div>
                </div>

                <!-- Datas Separadas (Vencimento vs Pagamento Editável) no Mobile -->
                <div class="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Vencimento</span>
                    <span class="font-bold ${bill.relativeDate.type === 'today' ? 'text-amber-600 dark:text-amber-400' : bill.relativeDate.type === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}">
                      ${window.AppConfig.utils.formatDate(bill.dueDate)}
                    </span>
                    <span class="text-[10px] text-slate-400 block">${bill.relativeDate.text}</span>
                  </div>

                  <div class="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <span class="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Data de Pagamento</span>
                    <div class="flex items-center gap-1">
                      <div
                        class="date-segmented-container relative inline-flex items-center px-1.5 py-0.5 rounded-md border font-medium text-xs transition-all ${
                          isPaid && bill.paymentDate
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-[#edf8f1] border-[#aee4c5] text-slate-700'
                        }"
                        data-id="${bill.id}"
                      >
                        <!-- Dia (01 a 31) -->
                        <input
                          type="text"
                          inputmode="numeric"
                          maxlength="2"
                          placeholder="DD"
                          class="date-seg-day w-5 text-center bg-transparent border-0 border-none outline-none focus:ring-0 p-0 m-0 font-medium tabular-nums cursor-text"
                          data-id="${bill.id}"
                          value="${dayVal}"
                          title="Clique para alterar apenas o DIA"
                        />
                        <span class="text-slate-400 select-none px-0.5">/</span>

                        <!-- Mês (01 a 12) -->
                        <input
                          type="text"
                          inputmode="numeric"
                          maxlength="2"
                          placeholder="MM"
                          class="date-seg-month w-5 text-center bg-transparent border-0 border-none outline-none focus:ring-0 p-0 m-0 font-medium tabular-nums cursor-text"
                          data-id="${bill.id}"
                          value="${monthVal}"
                          title="Clique para alterar apenas o MÊS"
                        />
                        <span class="text-slate-400 select-none px-0.5">/</span>

                        <!-- Ano (AAAA) -->
                        <input
                          type="text"
                          inputmode="numeric"
                          maxlength="4"
                          placeholder="AAAA"
                          class="date-seg-year w-9 text-center bg-transparent border-0 border-none outline-none focus:ring-0 p-0 m-0 font-medium tabular-nums cursor-text"
                          data-id="${bill.id}"
                          value="${yearVal}"
                          title="Clique para alterar apenas o ANO"
                        />

                        <!-- Input de data nativo oculto para o botão de calendário -->
                        <input
                          type="date"
                          class="hidden-native-date-picker sr-only absolute opacity-0 pointer-events-none w-0 h-0"
                          data-id="${bill.id}"
                          value="${bill.paymentDate || ''}"
                          tabindex="-1"
                        />

                        <!-- Botão de Calendário -->
                        <button
                          type="button"
                          class="btn-open-calendar-picker p-0.5 text-slate-600 hover:text-emerald-800 rounded hover:bg-emerald-100/70 transition-colors ml-1"
                          data-id="${bill.id}"
                          title="Abrir calendário para escolher data"
                        >
                          <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>

                      ${
                        isPaid && bill.paymentDate
                          ? `<button
                              type="button"
                              class="btn-clear-payment-date p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
                              data-id="${bill.id}"
                              title="Remover data de pagamento"
                            >
                              <i data-lucide="x" class="w-3 h-3"></i>
                            </button>`
                          : ''
                      }
                    </div>
                  </div>
                </div>

                <!-- Ações Mobile com Botão Editar em Destaque -->
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    class="btn-edit-bill flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                    data-id="${bill.id}"
                  >
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    Editar
                  </button>

                  <button
                    type="button"
                    class="btn-delete-bill flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                    data-id="${bill.id}"
                  >
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    Excluir
                  </button>
                </div>
              </div>
            `;
          })
          .join('');
      }

      if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Renderiza a apresentação anual de despesas e valores pagos no período de 12 meses
     * Atualiza os KPIs anuais consolidados, a tabela resumo e o gráfico de colunas
     * @param {Array<Object>} monthlyData Dados dos 12 meses
     * @param {number} targetYear Ano vigente de referência
     */
    renderAnnualChart(monthlyData, targetYear) {
      if (!monthlyData || monthlyData.length === 0) return;

      const format = window.AppConfig.utils.formatBRL;
      const totalExpenses = monthlyData.reduce((acc, m) => acc + (m.total || 0), 0);
      const totalPaid = monthlyData.reduce((acc, m) => acc + (m.paid || 0), 0);
      const totalPending = monthlyData.reduce((acc, m) => acc + (m.pending || 0), 0);
      const totalBillsCount = monthlyData.reduce((acc, m) => acc + (m.count || 0), 0);
      const totalPendingCount = monthlyData.reduce((acc, m) => acc + (m.pendingCount || 0), 0);
      const paidPct = totalExpenses > 0 ? ((totalPaid / totalExpenses) * 100).toFixed(1) : 0;

      // 1. Atualiza Badge do Exercício
      const yearBadge = document.getElementById('annual-chart-year-badge');
      if (yearBadge) {
        yearBadge.innerHTML = `
          <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Exercício ${targetYear} (12 Meses)</span>
        `;
      }

      // 2. Atualiza Cards de Indicadores Anuais
      const elExpenses = document.getElementById('annual-kpi-total-expenses');
      const elCount = document.getElementById('annual-kpi-total-count');
      const elPaid = document.getElementById('annual-kpi-total-paid');
      const elPaidPct = document.getElementById('annual-kpi-paid-percentage');
      const elPending = document.getElementById('annual-kpi-total-pending');
      const elPendingCount = document.getElementById('annual-kpi-pending-count');

      if (elExpenses) elExpenses.textContent = format(totalExpenses);
      if (elCount) elCount.textContent = `${totalBillsCount} conta${totalBillsCount === 1 ? '' : 's'} no ano`;
      if (elPaid) elPaid.textContent = format(totalPaid);
      if (elPaidPct) elPaidPct.textContent = `${paidPct}% quitado no ano`;
      if (elPending) elPending.textContent = format(totalPending);
      if (elPendingCount) elPendingCount.textContent = `${totalPendingCount} a pagar`;

      // 3. Atualiza Tabela Resumo Consolidada dos 12 Meses
      const tbody = document.getElementById('annual-summary-table-body');
      if (tbody) {
        const now = new Date();
        const isCurrentYear = now.getFullYear() === Number(targetYear);
        const currentMonthIdx = now.getMonth();

        tbody.innerHTML = monthlyData
          .map((m) => {
            const mPaidPct = m.total > 0 ? ((m.paid / m.total) * 100).toFixed(0) : 0;
            const isThisMonth = isCurrentYear && m.monthIndex === currentMonthIdx;
            const rowClass = isThisMonth ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40';

            return `
              <tr class="${rowClass} transition-colors">
                <td class="py-2 px-3 flex items-center gap-1.5 whitespace-nowrap">
                  <span>${m.monthName || m.label}</span>
                  ${isThisMonth ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Atual</span>' : ''}
                </td>
                <td class="py-2 px-3 text-right tabular-nums text-slate-900 dark:text-slate-100 font-bold whitespace-nowrap">
                  ${format(m.total)}
                </td>
                <td class="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                  ${format(m.paid)}
                </td>
                <td class="py-2 px-3 text-right tabular-nums ${m.pending > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400'} whitespace-nowrap">
                  ${format(m.pending)}
                </td>
                <td class="py-2 px-3 text-center whitespace-nowrap">
                  <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    mPaidPct >= 100
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : mPaidPct > 0
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }">
                    ${mPaidPct}%
                  </span>
                </td>
                <td class="py-2 px-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    class="btn-extract-month-statement inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                    data-year="${targetYear}"
                    data-month="${m.monthIndex}"
                    data-month-label="${m.label || `${m.monthName || 'Mês'} de ${targetYear}`}"
                    title="Extrair relatório completo das despesas de ${m.label || `${m.monthName || 'Mês'} de ${targetYear}`}"
                  >
                    <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                    <span>Extrair Relatório</span>
                  </button>
                </td>
              </tr>
            `;
          })
          .join('');
      }

      // 4. Renderiza o Gráfico de Colunas dos 12 Meses com Chart.js
      if (window.ChartService) {
        window.ChartService.renderAnnualBreakdownChart('chart-annual-breakdown', monthlyData, targetYear);
      }

      if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Renderiza o detalhamento de categorias na seção de Relatórios
     * @param {Array<Object>} categoryData
     */
    renderCategoryReport(categoryData) {
      const container = document.getElementById('report-category-list');
      if (!container) return;

      if (!categoryData || categoryData.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-400 py-4 text-center">Nenhum dado de categoria disponível.</p>`;
        return;
      }

      const format = window.AppConfig.utils.formatBRL;

      container.innerHTML = categoryData
        .map((cat) => {
          return `
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs font-medium">
                <span class="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <i data-lucide="${cat.meta.icon}" class="w-3.5 h-3.5" style="color: ${cat.meta.color}"></i>
                  ${cat.meta.label} (${cat.count} contas)
                </span>
                <span class="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  ${format(cat.total)} <span class="text-slate-400 font-normal">(${cat.percentage}%)</span>
                </span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500" style="width: ${cat.percentage}%; background-color: ${cat.meta.color};"></div>
              </div>
            </div>
          `;
        })
        .join('');

      if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Gerenciamento do Modal de Lançamento / Edição
     */
    /**
     * Abre o modal de cadastro/edição de conta
     * @param {'create'|'edit'} mode
     * @param {Object|null} bill
     */
    openBillModal(mode = 'create', bill = null) {
      const modal = document.getElementById('bill-modal');
      const modalTitle = document.getElementById('modal-title');
      const form = document.getElementById('bill-form');
      const billIdInput = document.getElementById('bill-id');

      if (!modal || !form) return;

      form.reset();

      // Popula campos de categoria e método de pagamento se ainda não foram populados
      this.populateSelectOptions();

      const submitBtnText = document.getElementById('btn-submit-bill-text');

      if (mode === 'edit' && bill) {
        modalTitle.textContent = 'Editar Despesa Lançada';
        if (submitBtnText) submitBtnText.textContent = 'Salvar Alterações';

        billIdInput.value = bill.id;
        document.getElementById('bill-description').value = bill.description;
        document.getElementById('bill-amount').value = bill.amount;
        document.getElementById('bill-due-date').value = bill.dueDate;
        const invoiceNumInput = document.getElementById('bill-invoice-number');
        if (invoiceNumInput) invoiceNumInput.value = bill.invoiceNumber || '';
        const docNumInput = document.getElementById('bill-document-number');
        if (docNumInput) docNumInput.value = bill.documentNumber || '';
        const locationSelect = document.getElementById('bill-location');
        if (locationSelect) locationSelect.value = bill.location === 'CG' ? 'LD' : (bill.location || 'LD');
        const expenseTypeSelect = document.getElementById('bill-expense-type');
        if (expenseTypeSelect) expenseTypeSelect.value = bill.expenseType || 'fixa';
        document.getElementById('bill-category').value = bill.category || (Object.keys(window.AppConfig.CATEGORIES || {})[0] || '');
        const paymentMethodSelect = document.getElementById('bill-payment-method');
        if (paymentMethodSelect) paymentMethodSelect.value = bill.paymentMethod || 'pix';
        const invoiceSelect = document.getElementById('bill-invoice-status');
        if (invoiceSelect) invoiceSelect.value = bill.invoiceStatus || 'aguardando';
        document.getElementById('bill-status').value = bill.status === 'atrasado' ? 'pendente' : (bill.status || 'pendente');
        document.getElementById('bill-notes').value = bill.notes || '';

        const paymentDateInput = document.getElementById('bill-payment-date');
        if (paymentDateInput) {
          paymentDateInput.value = bill.paymentDate || '';
        }
      } else {
        modalTitle.textContent = 'Nova Conta / Despesa';
        if (submitBtnText) submitBtnText.textContent = 'Cadastrar Despesa';

        billIdInput.value = '';

        const invoiceNumInput = document.getElementById('bill-invoice-number');
        if (invoiceNumInput) invoiceNumInput.value = '';
        const docNumInput = document.getElementById('bill-document-number');
        if (docNumInput) docNumInput.value = '';
        const locationSelect = document.getElementById('bill-location');
        if (locationSelect) locationSelect.value = 'LD';
        const expenseTypeSelect = document.getElementById('bill-expense-type');
        if (expenseTypeSelect) expenseTypeSelect.value = 'fixa';
        document.getElementById('bill-due-date').value = window.AppConfig.utils.toISODateString();
        const invoiceSelect = document.getElementById('bill-invoice-status');
        if (invoiceSelect) invoiceSelect.value = 'aguardando';
        document.getElementById('bill-status').value = 'pendente';
        const paymentDateInput = document.getElementById('bill-payment-date');
        if (paymentDateInput) {
          paymentDateInput.value = '';
        }
      }

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      document.getElementById('bill-description').focus();
      if (window.lucide) window.lucide.createIcons();
    }

    closeBillModal() {
      const modal = document.getElementById('bill-modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    /**
     * Abre o modal de Lembrete Diário de Contas a Vencer (2 dias úteis de antecedência)
     * @param {Array<Object>} upcomingBills
     * @param {Array<Object>} overdueBills
     */
    openDailyAlertModal(upcomingBills = [], overdueBills = []) {
      const modal = document.getElementById('daily-alert-modal');
      const listContainer = document.getElementById('daily-alert-list');
      const countBadge = document.getElementById('daily-alert-count-badge');
      const totalAmountEl = document.getElementById('daily-alert-total-amount');
      const todayLabel = document.getElementById('daily-alert-today-label');
      const overdueBanner = document.getElementById('daily-alert-overdue-banner');
      const overdueText = document.getElementById('daily-alert-overdue-text');

      if (!modal || !listContainer) return;

      const today = new Date();
      const todayISO = window.AppConfig.utils.toISODateString(today);
      const todayFormatted = window.AppConfig.utils.formatDate(todayISO);
      const dayOfWeek = window.AppConfig.utils.getDayOfWeekName(today);
      if (todayLabel) {
        todayLabel.textContent = `Hoje: ${dayOfWeek}, ${todayFormatted}`;
      }

      const totalAmount = upcomingBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      if (countBadge) {
        countBadge.textContent = `${upcomingBills.length} ${upcomingBills.length === 1 ? 'conta' : 'contas'}`;
      }
      if (totalAmountEl) {
        totalAmountEl.textContent = window.AppConfig.utils.formatBRL(totalAmount);
      }

      // Banner de contas já atrasadas, se houver
      if (overdueBanner) {
        if (overdueBills && overdueBills.length > 0) {
          overdueBanner.classList.remove('hidden');
          const overdueTotal = overdueBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
          if (overdueText) {
            overdueText.innerHTML = `Atenção: Você também possui <strong class="font-bold text-rose-700 dark:text-rose-300">${overdueBills.length} conta(s) atrasada(s)</strong> (${window.AppConfig.utils.formatBRL(overdueTotal)}) pendente(s) de regularização.`;
          }
        } else {
          overdueBanner.classList.add('hidden');
        }
      }

      const alertAdvanceDays = window.AppConfig.HOLIDAY_PARAMS?.alertAdvanceBusinessDays || 2;
      const alertBadge = document.getElementById('daily-alert-badge-days');
      if (alertBadge) {
        alertBadge.textContent = `Atenção: ${alertAdvanceDays} ${alertAdvanceDays === 1 ? 'Dia Útil' : 'Dias Úteis'}`;
      }
      const subtitle = document.getElementById('daily-alert-subtitle');
      if (subtitle) {
        subtitle.textContent = `Contas com vencimento em ${alertAdvanceDays} dias úteis de antecedência considerando o calendário cartorário`;
      }
      const summaryLabel = document.getElementById('daily-alert-summary-label');
      if (summaryLabel) {
        summaryLabel.textContent = `Total a Pagar (Em ${alertAdvanceDays} Dias Úteis)`;
      }

      if (upcomingBills.length === 0) {
        listContainer.innerHTML = `
          <div class="py-12 px-4 text-center">
            <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <i data-lucide="check-circle-2" class="w-7 h-7"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">Nenhuma conta com vencimento em ${alertAdvanceDays} dias úteis!</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Não há compromissos financeiros a vencer em exatamente ${alertAdvanceDays} dias úteis considerando o calendário cartorário.
            </p>
          </div>
        `;
      } else {
        listContainer.innerHTML = upcomingBills.map((bill) => {
          const bDays = bill.businessDaysDiff !== undefined ? bill.businessDaysDiff : 0;
          let urgencyBadgeClass = '';
          let urgencyLabel = '';
          let borderClass = 'border-slate-200 dark:border-slate-800';
          let bgClass = 'bg-white dark:bg-slate-900/60';
          let iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-600';

          if (bDays === 0) {
            urgencyBadgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse';
            urgencyLabel = '⚠️ Vence HOJE!';
            borderClass = 'border-rose-300 dark:border-rose-900/80 shadow-rose-100/40';
            bgClass = 'bg-rose-50/40 dark:bg-rose-950/20';
            iconBg = 'bg-rose-100 dark:bg-rose-950 text-rose-600';
          } else if (bDays === 1) {
            urgencyBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
            urgencyLabel = '🕒 Vence em 1 dia útil';
            borderClass = 'border-amber-300 dark:border-amber-900/80';
            bgClass = 'bg-amber-50/30 dark:bg-amber-950/20';
            iconBg = 'bg-amber-100 dark:bg-amber-950 text-amber-600';
          } else {
            urgencyBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
            urgencyLabel = `📅 Vence em ${bDays} dias úteis`;
            borderClass = 'border-emerald-300 dark:border-emerald-900/80';
            bgClass = 'bg-emerald-50/20 dark:bg-emerald-950/10';
            iconBg = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600';
          }

          const effectiveDateObj = bill.effectiveDueDate || (bill.dueDate ? window.AppConfig.utils.getEffectiveBusinessDueDate(bill.dueDate) : new Date());
          const dayName = window.AppConfig.utils.getDayOfWeekName(effectiveDateObj);
          const loc = bill.location === 'CG' ? 'LD' : (bill.location || 'LD');
          const locBadgeClass = loc === 'LD' || loc === 'CG' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' : loc === 'REC' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300';
          const effectiveDateFormatted = window.AppConfig.utils.formatDate(bill.effectiveISO || window.AppConfig.utils.toISODateString(effectiveDateObj));
          const nominalDateFormatted = window.AppConfig.utils.formatDate(bill.dueDate);

          return `
            <div class="p-3 sm:p-3.5 rounded-xl border ${borderClass} ${bgClass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:shadow-xs" data-bill-id="${bill.id}">
              <div class="flex items-start gap-2.5 min-w-0 flex-1">
                <div class="w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <i data-lucide="${bDays === 0 ? 'alert-triangle' : bDays === 1 ? 'clock' : 'calendar-clock'}" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${urgencyBadgeClass}">
                      ${urgencyLabel}
                    </span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${locBadgeClass}">
                      ${loc}
                    </span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${bill.expenseTypeMeta?.badgeClass || 'bg-emerald-100 text-emerald-800'}">
                      ${bill.expenseType === 'variavel' ? 'V' : 'F'}
                    </span>
                    ${
                      bill.isProrogated
                        ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300" title="Vencimento nominal ${nominalDateFormatted} prorrogado para ${effectiveDateFormatted} por feriado/final de semana">
                            ⚖️ Vence: ${dayName}, ${effectiveDateFormatted} (Prorrogado)
                           </span>`
                        : `<span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            • ${dayName}, ${effectiveDateFormatted}
                           </span>`
                    }
                  </div>
                  <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 mt-1 leading-snug">
                    ${bill.description}
                  </h4>
                  <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                    <span>Cat: <strong class="text-slate-700 dark:text-slate-300">${bill.categoryMeta?.label || bill.category}</strong></span>
                    ${bill.isProrogated ? `<span class="text-amber-700 dark:text-amber-300 font-semibold">• Venc. original: ${nominalDateFormatted}</span>` : ''}
                    ${bill.holidayMatch ? `<span class="text-amber-700 dark:text-amber-300 font-bold">• Feriado: ${bill.holidayMatch.name}</span>` : ''}
                    ${bill.invoiceNumber ? `<span>• NF: <strong class="text-slate-800 dark:text-slate-200">${bill.invoiceNumber}</strong></span>` : ''}
                    ${bill.documentNumber ? `<span>• Doc: <strong class="text-slate-800 dark:text-slate-200">${bill.documentNumber}</strong></span>` : ''}
                    ${bill.notes ? `<span class="truncate max-w-[200px]" title="${bill.notes}">• Obs: ${bill.notes}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800">
                <span class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                  ${window.AppConfig.utils.formatBRL(bill.amount)}
                </span>
                <button
                  type="button"
                  class="btn-daily-alert-quick-pay px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  data-id="${bill.id}"
                  title="Marcar esta conta como Paga com a data de hoje"
                >
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>Pagar Hoje</span>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    closeDailyAlertModal() {
      const modal = document.getElementById('daily-alert-modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    /**
     * Popula os selects do modal e da barra de filtros com base nas categorias e constantes
     */
    populateSelectOptions() {
      // Categoria no formulário de Nova / Editar Conta
      const modalCategorySelect = document.getElementById('bill-category');
      if (modalCategorySelect) {
        const currentVal = modalCategorySelect.value;
        modalCategorySelect.innerHTML = Object.values(window.AppConfig.CATEGORIES)
          .map((cat) => `<option value="${cat.id}">${cat.label}</option>`)
          .join('');
        if (currentVal && window.AppConfig.CATEGORIES[currentVal]) {
          modalCategorySelect.value = currentVal;
        }
      }

      // Método de pagamento no formulário
      const modalPaymentSelect = document.getElementById('bill-payment-method');
      if (modalPaymentSelect) {
        const currentVal = modalPaymentSelect.value;
        modalPaymentSelect.innerHTML = Object.values(window.AppConfig.PAYMENT_METHODS)
          .map((pay) => `<option value="${pay.id}">${pay.label}</option>`)
          .join('');
        if (currentVal && window.AppConfig.PAYMENT_METHODS[currentVal]) {
          modalPaymentSelect.value = currentVal;
        }
      }

      // Popula filtro de categorias na barra superior
      const filterCategorySelect = document.getElementById('filter-category');
      if (filterCategorySelect) {
        const currentFilterVal = filterCategorySelect.value || 'todos';
        let options = `<option value="todos">Todas as Categorias</option>`;
        options += Object.values(window.AppConfig.CATEGORIES)
          .map((cat) => `<option value="${cat.id}">${cat.label}</option>`)
          .join('');
        filterCategorySelect.innerHTML = options;
        if (currentFilterVal === 'todos' || window.AppConfig.CATEGORIES[currentFilterVal]) {
          filterCategorySelect.value = currentFilterVal;
        }
      }

      const filterPaymentSelect = document.getElementById('filter-payment');
      if (filterPaymentSelect) {
        const currentFilterPay = filterPaymentSelect.value || 'todos';
        let options = `<option value="todos">Todos os Métodos</option>`;
        options += Object.values(window.AppConfig.PAYMENT_METHODS)
          .map((pay) => `<option value="${pay.id}">${pay.label}</option>`)
          .join('');
        filterPaymentSelect.innerHTML = options;
        if (currentFilterPay === 'todos' || window.AppConfig.PAYMENT_METHODS[currentFilterPay]) {
          filterPaymentSelect.value = currentFilterPay;
        }
      }

      // Popula selects do formulário de Despesa Recorrente
      const recurringCategorySelect = document.getElementById('recurring-category');
      if (recurringCategorySelect) {
        const currentVal = recurringCategorySelect.value;
        recurringCategorySelect.innerHTML = Object.values(window.AppConfig.CATEGORIES)
          .map((cat) => `<option value="${cat.id}">${cat.label}</option>`)
          .join('');
        if (currentVal && window.AppConfig.CATEGORIES[currentVal]) {
          recurringCategorySelect.value = currentVal;
        }
      }

      const recurringPaymentSelect = document.getElementById('recurring-payment-method');
      if (recurringPaymentSelect) {
        const currentVal = recurringPaymentSelect.value;
        recurringPaymentSelect.innerHTML = Object.values(window.AppConfig.PAYMENT_METHODS)
          .map((pay) => `<option value="${pay.id}">${pay.label}</option>`)
          .join('');
        if (currentVal && window.AppConfig.PAYMENT_METHODS[currentVal]) {
          recurringPaymentSelect.value = currentVal;
        }
      }
    }

    /**
     * Modal de Confirmação de Exclusão Direta
     * @param {Object} bill
     */
    openDeleteModal(bill) {
      this.currentBillToDelete = bill;
      const modal = document.getElementById('delete-modal');
      const descEl = document.getElementById('delete-bill-description');
      const amountEl = document.getElementById('delete-bill-amount');
      const modalTitle = document.getElementById('delete-modal-title');

      if (!modal) return;

      if (descEl) descEl.textContent = bill.description;
      if (amountEl) amountEl.textContent = window.AppConfig.utils.formatBRL(bill.amount);
      if (modalTitle) modalTitle.textContent = 'Excluir Conta?';

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    closeDeleteModal() {
      const modal = document.getElementById('delete-modal');
      this.currentBillToDelete = null;
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    /**
     * Modal Rápido de Nota Fiscal e Documento (Adicionar / Editar direto da coluna)
     * @param {Object} bill
     */
    openQuickNFModal(bill) {
      const modal = document.getElementById('quick-nf-modal');
      const idInput = document.getElementById('quick-nf-bill-id');
      const titleEl = document.getElementById('quick-nf-bill-title');
      const nfInput = document.getElementById('quick-nf-input');
      const docInput = document.getElementById('quick-doc-input');

      if (!modal || !idInput) return;

      idInput.value = bill.id;
      if (titleEl) titleEl.textContent = `Despesa: ${bill.description}`;
      if (nfInput) nfInput.value = bill.invoiceNumber || '';
      if (docInput) docInput.value = bill.documentNumber || '';

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      if (nfInput) {
        setTimeout(() => nfInput.focus(), 60);
      }
      if (window.lucide) window.lucide.createIcons();
    }

    closeQuickNFModal() {
      const modal = document.getElementById('quick-nf-modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    /**
     * Atualiza os contadores e badges numéricos da Sidebar Lateral Esquerda
     * com todos os parâmetros de gestão (Status, Unidade LD/REC/SE, F/V e Fiscal)
     * @param {Array<Object>} bills
     */
    updateSidebarBadges(bills) {
      const totalCount = bills.length;
      let pendingCount = 0;
      let overdueCount = 0;
      let todayCount = 0;
      let paidCount = 0;
      let pendingTotal = 0;

      let ldCount = 0;
      let recCount = 0;
      let seCount = 0;

      let fixedCount = 0;
      let variableCount = 0;
      let missingNfCount = 0;

      const todayISO = window.AppConfig.utils.toISODateString();
      const enriched = window.BillService.enrichBills(bills);

      enriched.forEach((b) => {
        // 1. Status Financeiro
        if (b.effectiveStatus === 'pago') {
          paidCount++;
        } else {
          pendingCount++;
          pendingTotal += b.amount;
        }

        if (b.effectiveStatus === 'atrasado') {
          overdueCount++;
        }

        if (b.dueDate === todayISO) {
          todayCount++;
        }

        // 2. Parâmetro por Unidade (Local LD, REC, SE)
        const loc = b.location === 'CG' ? 'LD' : (b.location || 'LD');
        if (loc === 'LD') ldCount++;
        else if (loc === 'REC') recCount++;
        else if (loc === 'SE') seCount++;

        // 3. Parâmetro por Natureza (Fixa F / Variável V)
        if (b.expenseType === 'fixa') fixedCount++;
        else variableCount++;

        // 4. Parâmetro Fiscal (Aguardando NF / Doc)
        if (!b.invoiceNumber && !b.documentNumber) {
          missingNfCount++;
        }
      });

      // Atualiza Badges de Situação Financeira
      const totalBadge = document.getElementById('sidebar-total-badge');
      if (totalBadge) totalBadge.textContent = `${totalCount} contas`;

      const countAll = document.getElementById('sidebar-count-all');
      if (countAll) countAll.textContent = totalCount;

      const countPending = document.getElementById('sidebar-count-pending');
      if (countPending) countPending.textContent = pendingCount;

      const countOverdue = document.getElementById('sidebar-count-overdue');
      if (countOverdue) countOverdue.textContent = overdueCount;

      const countPaid = document.getElementById('sidebar-count-paid');
      if (countPaid) countPaid.textContent = paidCount;

      const due2DaysBills = window.BillService.getBillsDueInBusinessDays(bills, 2);
      const count2Days = document.getElementById('sidebar-count-due-2days');
      if (count2Days) count2Days.textContent = due2DaysBills.length;

      // Atualiza Badges de Unidade (Local)
      const countLdEl = document.getElementById('sidebar-count-ld');
      if (countLdEl) countLdEl.textContent = ldCount;

      const countRecEl = document.getElementById('sidebar-count-rec');
      if (countRecEl) countRecEl.textContent = recCount;

      const countSeEl = document.getElementById('sidebar-count-se');
      if (countSeEl) countSeEl.textContent = seCount;

      // Atualiza Badges de Classificação (F/V)
      const countFixedEl = document.getElementById('sidebar-count-fixed');
      if (countFixedEl) countFixedEl.textContent = fixedCount;

      const countVariableEl = document.getElementById('sidebar-count-variable');
      if (countVariableEl) countVariableEl.textContent = variableCount;

      // Atualiza Badge Fiscal (Aguardando NF/Doc)
      const countMissingNfEl = document.getElementById('sidebar-count-missing-nf');
      if (countMissingNfEl) countMissingNfEl.textContent = missingNfCount;

      // Popover do sino no cabeçalho
      const popoverAlertBadge = document.getElementById('popover-alert-count-badge');
      if (popoverAlertBadge) popoverAlertBadge.textContent = due2DaysBills.length;

      // Card de Total a Pagar no rodapé da Sidebar
      const pendingEl = document.getElementById('sidebar-pending-total');
      if (pendingEl) pendingEl.textContent = window.AppConfig.utils.formatBRL(pendingTotal);
    }

    /**
     * Renderiza o Relatório de Despesas Pagas por Mês em view-relatorios
     * e garante o preenchimento do seletor de mês
     * @param {Array<Object>} monthlyData
     */
    renderMonthlyReport(monthlyData) {
      // 1. Popula o select do mês no topo da seção com os 12 meses
      const monthSelect = document.getElementById('select-report-month');
      if (monthSelect && monthlyData && monthlyData.length > 0) {
        const currentVal = monthSelect.value;
        const newHtml = monthlyData
          .map((m) => `<option value="${m.year}-${m.monthIndex}">${m.label}</option>`)
          .join('');
        if (monthSelect.innerHTML !== newHtml) {
          monthSelect.innerHTML = newHtml;
          if (currentVal && monthlyData.some((m) => `${m.year}-${m.monthIndex}` === currentVal)) {
            monthSelect.value = currentVal;
          } else {
            const now = new Date();
            const curKey = `${now.getFullYear()}-${now.getMonth()}`;
            if (monthlyData.some((m) => `${m.year}-${m.monthIndex}` === curKey)) {
              monthSelect.value = curKey;
            } else if (monthlyData.length > 0) {
              monthSelect.value = `${monthlyData[0].year}-${monthlyData[0].monthIndex}`;
            }
          }
        }
      }
    }

    /**
     * Renderiza a lista de despesas do mês selecionado em modo SOMENTE VISUALIZAÇÃO (Read-Only)
     * Não permite alterações, edições, quitações ou exclusões nessa tela
     * @param {Array<Object>} monthBills Contas enriquecidas do mês
     * @param {number} year Ano
     * @param {number} monthIndex Mês (0-11)
     * @param {string} monthLabel Rótulo do mês
     */
    renderSelectedMonthBills(monthBills = [], year, monthIndex, monthLabel) {
      const container = document.getElementById('report-selected-month-container');
      const titleEl = document.getElementById('report-selected-month-title');
      const statsEl = document.getElementById('report-selected-month-stats');
      const tbody = document.getElementById('report-selected-month-table-body');
      const emptyEl = document.getElementById('report-selected-month-empty');

      if (!container || !tbody) return;

      if (titleEl) {
        titleEl.textContent = `Despesas de ${monthLabel}`;
      }

      const format = window.AppConfig.utils.formatBRL;
      const totalAmount = monthBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const paidBills = monthBills.filter((b) => b.effectiveStatus === 'pago');
      const totalPaid = paidBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const totalPending = totalAmount - totalPaid;
      const paidPct = totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(0) : 0;

      if (statsEl) {
        statsEl.innerHTML = `
          <span class="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold">
            Total: ${format(totalAmount)}
          </span>
          <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            Pago: ${format(totalPaid)} (${paidPct}%)
          </span>
          <span class="px-2 py-0.5 rounded ${totalPending > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-500'} font-bold">
            A Pagar: ${format(totalPending)}
          </span>
          <span class="text-slate-500 font-medium">
            (${monthBills.length} ${monthBills.length === 1 ? 'conta' : 'contas'})
          </span>
        `;
      }

      if (!monthBills || monthBills.length === 0) {
        tbody.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
      }

      if (emptyEl) emptyEl.classList.add('hidden');

      tbody.innerHTML = monthBills
        .map((bill) => {
          const isPaid = bill.effectiveStatus === 'pago';
          const isOverdue = bill.effectiveStatus === 'atrasado';
          const rowBg = isPaid
            ? 'bg-slate-50/40 dark:bg-slate-900/20 text-slate-600'
            : isOverdue
            ? 'bg-rose-50/30 dark:bg-rose-950/20'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40';

          const loc = bill.location === 'CG' ? 'LD' : (bill.location || 'LD');
          const isFixed = bill.expenseType === 'fixa';

          // Status Badge Read-Only (Sem inputs ou cliques)
          let statusBadge = `
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Aguardando
            </span>
          `;
          if (isPaid) {
            statusBadge = `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Pago
              </span>
            `;
          } else if (isOverdue) {
            statusBadge = `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Atrasado
              </span>
            `;
          }

          // NF / Documento (Apenas texto)
          let nfDocText = '<span class="text-slate-400 italic text-[10px]">Sem NF</span>';
          if (bill.invoiceNumber || bill.documentNumber) {
            const parts = [];
            if (bill.invoiceNumber) parts.push(`NF: ${bill.invoiceNumber}`);
            if (bill.documentNumber) parts.push(`Doc: ${bill.documentNumber}`);
            nfDocText = `<span class="font-bold text-slate-700 dark:text-slate-200">${parts.join(' • ')}</span>`;
          }

          return `
            <tr class="transition-colors ${rowBg}">
              <!-- Descrição -->
              <td class="py-2.5 px-3">
                <div class="font-bold text-slate-900 dark:text-slate-100 text-xs">${bill.description}</div>
                ${bill.notes ? `<div class="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">${bill.notes}</div>` : ''}
              </td>
              <!-- Vencimento -->
              <td class="py-2.5 px-2.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                ${window.AppConfig.utils.formatDate(bill.dueDate)}
              </td>
              <!-- Data de Pagamento (somente texto) -->
              <td class="py-2.5 px-2.5 whitespace-nowrap text-xs">
                ${bill.paymentDate ? `<span class="font-bold text-emerald-700 dark:text-emerald-300">${window.AppConfig.utils.formatDate(bill.paymentDate)}</span>` : '<span class="text-slate-400">-</span>'}
              </td>
              <!-- Local -->
              <td class="py-2.5 px-2 text-center whitespace-nowrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${loc === 'LD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : loc === 'REC' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}">
                  ${loc}
                </span>
              </td>
              <!-- Natureza F/V -->
              <td class="py-2.5 px-2 text-center whitespace-nowrap">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isFixed ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}">
                  ${isFixed ? 'Fixa (F)' : 'Variável (V)'}
                </span>
              </td>
              <!-- Categoria -->
              <td class="py-2.5 px-2.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                ${bill.categoryMeta?.label || bill.category || 'Outros'}
              </td>
              <!-- NF / Doc -->
              <td class="py-2.5 px-2.5 whitespace-nowrap text-[11px]">
                ${nfDocText}
              </td>
              <!-- Situação -->
              <td class="py-2.5 px-2.5 text-center whitespace-nowrap">
                ${statusBadge}
              </td>
              <!-- Valor R$ -->
              <td class="py-2.5 px-3 text-right tabular-nums font-black text-slate-900 dark:text-slate-100 whitespace-nowrap text-xs">
                ${format(bill.amount)}
              </td>
            </tr>
          `;
        })
        .join('');

      if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Renderiza o Ranking das Maiores Despesas em view-relatorios
     * @param {Array<Object>} topBills
     */
    renderTopBillsReport(topBills) {
      const container = document.getElementById('report-top-bills-list');
      if (!container) return;

      if (!topBills || topBills.length === 0) {
        container.innerHTML = `
          <div class="py-6 text-center text-slate-400 text-xs">
            Nenhuma despesa para exibir no ranking.
          </div>
        `;
        return;
      }

      const maxAmount = topBills[0].amount || 1;

      container.innerHTML = topBills
        .map((bill, index) => {
          const isPaid = bill.effectiveStatus === 'pago';
          const pct = ((bill.amount / maxAmount) * 100).toFixed(0);
          return `
            <div class="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-amber-100 text-amber-800 font-extrabold' : 'bg-slate-100 text-slate-600'
              }">
                ${index + 1}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">${bill.description}</span>
                  <span class="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">${window.AppConfig.utils.formatBRL(bill.amount)}</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                  <span class="flex items-center gap-1">
                    <i data-lucide="${bill.categoryMeta.icon}" class="w-3 h-3"></i>
                    ${bill.categoryMeta.label} • Vence ${window.AppConfig.utils.formatDate(bill.dueDate)}
                  </span>
                  <span class="font-medium ${isPaid ? 'text-emerald-600' : 'text-amber-600'}">
                    ${isPaid ? 'Pago' : 'Aguardando'}
                  </span>
                </div>
                <div class="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div class="bg-indigo-500 h-full rounded-full" style="width: ${pct}%"></div>
                </div>
              </div>
            </div>
          `;
        })
        .join('');

      if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Abre o Modal do Demonstrativo Executivo Consolidado
     * @param {Array<Object>} bills
     * @param {Object} kpis
     */
    /**
     * Abre o modal de Demonstrativo Executivo (Geral ou de Mês Específico)
     * Traz todas as despesas do mês (pagas ou não) detalhadas item a item
     * e um resumo financeiro completo no final do relatório com os saldos das despesas.
     * @param {Array<Object>} bills
     * @param {Object} kpis
     * @param {Object} options { isMonthReport, monthLabel, year, monthIndex }
     */
    openStatementModal(bills, kpis, options = {}) {
      this.currentStatementData = { bills, kpis, options };
      const modal = document.getElementById('statement-modal');
      const bodyEl = document.getElementById('statement-modal-body');
      if (!modal || !bodyEl) return;

      const isMonth = Boolean(options.isMonthReport);
      const monthLabel = options.monthLabel || '';
      const baseTitle = 'RELATÓRIO DE DESPESAS PARA PAGAR';
      const title = monthLabel
        ? `${baseTitle} - ${monthLabel}`
        : baseTitle;

      const titleEl = document.getElementById('statement-modal-title');
      const subtitleEl = document.getElementById('statement-modal-subtitle');
      if (titleEl) {
        titleEl.textContent = title;
      }
      if (subtitleEl) {
        subtitleEl.textContent = isMonth
          ? `Extrato analítico detalhado item a item de todas as despesas`
          : 'Demonstrativo analítico para análise e prestação de contas';
      }

      const enriched = window.BillService.enrichBills(bills, {
        targetYear: options.year,
        targetMonth: options.monthIndex
      });

      // Cálculos consolidados dos saldos das despesas
      const totalAmount = enriched.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const paidBills = enriched.filter((b) => b.effectiveStatus === 'pago');
      const pendingBills = enriched.filter((b) => b.effectiveStatus !== 'pago');
      const overdueBills = enriched.filter((b) => b.effectiveStatus === 'atrasado');

      const totalPaid = paidBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const totalPending = pendingBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const totalOverdue = overdueBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const paidPercentage = totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(0) : 0;

      // Saldos por Local (LD, REC, SE)
      const locations = ['LD', 'REC', 'SE'];
      const locationStats = locations.map((loc) => {
        const locBills = enriched.filter((b) => (b.location === 'CG' ? 'LD' : (b.location || 'LD')) === loc);
        const locTotal = locBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
        const locPaid = locBills.filter((b) => b.effectiveStatus === 'pago').reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
        const locPending = locBills.filter((b) => b.effectiveStatus !== 'pago').reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
        return { loc, total: locTotal, paid: locPaid, pending: locPending, count: locBills.length };
      });

      // Saldos por Classificação F/V (Fixas vs Variáveis)
      const fixedBills = enriched.filter((b) => b.expenseType !== 'variavel');
      const varBills = enriched.filter((b) => b.expenseType === 'variavel');
      const fixedTotal = fixedBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const fixedPaid = fixedBills.filter((b) => b.effectiveStatus === 'pago').reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const fixedPending = fixedBills.filter((b) => b.effectiveStatus !== 'pago').reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

      const varTotal = varBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const varPaid = varBills.filter((b) => b.effectiveStatus === 'pago').reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
      const varPending = varBills.filter((b) => b.effectiveStatus !== 'pago').reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

      const now = new Date();
      const emissionDate = now.toLocaleDateString('pt-BR');
      const emissionTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      bodyEl.innerHTML = `
        <div class="space-y-4 text-xs">
          <!-- 1. CABEÇALHO OFICIAL INSTITUCIONAL -->
          <div class="p-4 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-0.5">
              <span class="text-[9px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 block">
                2º Oficial de RI, RTD e RCPJ de São José dos Campos - SP
              </span>
              <h4 class="font-extrabold text-sm sm:text-base text-emerald-950 dark:text-emerald-100">
                ${title}
              </h4>
              <p class="text-[11px] text-emerald-800 dark:text-emerald-300">
                Posição financeira gerada em <strong>${emissionDate}</strong> às <strong>${emissionTime}</strong>
              </p>
            </div>
            <div class="flex items-center gap-2 self-start sm:self-center">
              <span class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold text-emerald-800 dark:text-emerald-300 shadow-2xs">
                ${enriched.length} ${enriched.length === 1 ? 'Despesa Registrada' : 'Despesas Registradas'}
              </span>
            </div>
          </div>

          <!-- 2. DETALHAMENTO DAS DESPESAS DO MÊS (ITEM A ITEM - TODAS AS CONTAS) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between px-1">
              <h5 class="font-extrabold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="list-checks" class="w-4 h-4 text-emerald-600"></i>
                <span>Despesas Detalhadas (${enriched.length} lançamentos)</span>
              </h5>
              <span class="text-[11px] text-slate-500">Todas as despesas do mês (pagas, pendentes e atrasadas)</span>
            </div>

            <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-extrabold tracking-wider">
                    <tr>
                      <th class="py-2.5 px-3 text-center w-8">#</th>
                      <th class="py-2.5 px-3 text-center w-12">Local</th>
                      <th class="py-2.5 px-3 text-center w-12">Tipo</th>
                      <th class="py-2.5 px-3">Descrição da Despesa</th>
                      <th class="py-2.5 px-3">Categoria</th>
                      <th class="py-2.5 px-3 text-center">Vencimento</th>
                      <th class="py-2.5 px-3 text-center">Situação / Pagamento</th>
                      <th class="py-2.5 px-3 text-center">NF / Doc</th>
                      <th class="py-2.5 px-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    ${
                      enriched.length === 0
                        ? `<tr><td colspan="9" class="p-6 text-center text-slate-400">Nenhuma despesa registrada para o mês de ${monthLabel}.</td></tr>`
                        : enriched.map((b, idx) => {
                            const isPaid = b.effectiveStatus === 'pago';
                            const isOverdue = b.effectiveStatus === 'atrasado';
                            const loc = b.location === 'CG' ? 'LD' : (b.location || 'LD');
                            const rowBg = isPaid
                              ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30'
                              : isOverdue
                              ? 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40';

                            return `
                              <tr class="${rowBg} transition-colors">
                                <td class="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">${idx + 1}</td>
                                <td class="py-2 px-3 text-center">
                                  <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                    loc === 'REC' ? 'bg-sky-100 text-sky-800' : loc === 'SE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }">${loc}</span>
                                </td>
                                <td class="py-2 px-3 text-center">
                                  <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                                    b.expenseType === 'variavel' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }">${b.expenseType === 'variavel' ? 'V' : 'F'}</span>
                                </td>
                                <td class="py-2 px-3">
                                  <div class="font-bold text-slate-900 dark:text-slate-100">${b.description}</div>
                                  ${b.notes ? `<div class="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">${b.notes}</div>` : ''}
                                </td>
                                <td class="py-2 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  ${b.categoryMeta?.label || b.category || 'Outros'}
                                </td>
                                <td class="py-2 px-3 text-center tabular-nums whitespace-nowrap">
                                  ${window.AppConfig.utils.formatDate(b.dueDate)}
                                </td>
                                <td class="py-2 px-3 text-center whitespace-nowrap">
                                  ${
                                    isPaid
                                      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                           <i data-lucide="check" class="w-3 h-3"></i>
                                           <span>Pago em ${b.paymentDate ? window.AppConfig.utils.formatDate(b.paymentDate) : 'Hoje'}</span>
                                         </span>`
                                      : isOverdue
                                      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                           <i data-lucide="alert-triangle" class="w-3 h-3"></i>
                                           <span>Atrasado</span>
                                         </span>`
                                      : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                           <i data-lucide="clock" class="w-3 h-3"></i>
                                           <span>Aguardando Pagamento</span>
                                         </span>`
                                  }
                                </td>
                                <td class="py-2 px-3 text-center text-slate-500 text-[11px] whitespace-nowrap">
                                  ${
                                    (b.invoiceNumber || b.documentNumber)
                                      ? `<span>${b.invoiceNumber ? `NF: ${b.invoiceNumber}` : ''} ${b.documentNumber ? `Doc: ${b.documentNumber}` : ''}</span>`
                                      : `<span class="text-slate-300">-</span>`
                                  }
                                </td>
                                <td class="py-2 px-3 text-right font-black tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                                  ${window.AppConfig.utils.formatBRL(b.amount)}
                                </td>
                              </tr>
                            `;
                          }).join('')
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      document.body.classList.add('modal-open-statement');
      if (window.lucide) window.lucide.createIcons();
    }

    closeStatementModal() {
      const modal = document.getElementById('statement-modal');
      this.currentStatementData = null;
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        document.body.classList.remove('modal-open-statement');
      }
    }

    // =========================================================================
    // MODAIS DE ADMINISTRAÇÃO & GESTÃO
    // =========================================================================

    /**
     * Abre o modal de Cadastro e Gestão de Usuários
     */
    openUsersModal() {
      const modal = document.getElementById('users-modal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        this.resetUserForm();
        if (window.lucide) window.lucide.createIcons();
      }
    }

    closeUsersModal() {
      const modal = document.getElementById('users-modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    resetUserForm() {
      const form = document.getElementById('user-form');
      if (form) form.reset();
      const idInput = document.getElementById('user-id');
      if (idInput) idInput.value = '';
      const title = document.getElementById('user-form-title');
      if (title) {
        title.innerHTML = `<i data-lucide="user-plus" class="w-3.5 h-3.5"></i><span>Cadastrar Novo Usuário</span>`;
      }
      const submitText = document.getElementById('btn-submit-user-text');
      if (submitText) submitText.textContent = 'Salvar Usuário';
      const resetBtn = document.getElementById('btn-reset-user-form');
      if (resetBtn) resetBtn.classList.add('hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    fillUserForm(user) {
      if (!user) return;
      document.getElementById('user-id').value = user.id || '';
      document.getElementById('user-name').value = user.name || '';
      document.getElementById('user-email').value = user.email || '';
      document.getElementById('user-role').value = user.role || 'financeiro';
      document.getElementById('user-location').value = user.location || 'LD';
      document.getElementById('user-status').value = user.status || 'ativo';

      const title = document.getElementById('user-form-title');
      if (title) {
        title.innerHTML = `<i data-lucide="user-cog" class="w-3.5 h-3.5 text-amber-600"></i><span>Editar Usuário: ${user.name}</span>`;
      }
      const submitText = document.getElementById('btn-submit-user-text');
      if (submitText) submitText.textContent = 'Salvar Alterações';
      const resetBtn = document.getElementById('btn-reset-user-form');
      if (resetBtn) resetBtn.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
      document.getElementById('user-name').focus();
    }

    /**
     * Tela / Modal Dedicado de Edição de Informações do Usuário
     * @param {Object} user
     */
    openEditUserModal(user) {
      if (!user) return;
      const modal = document.getElementById('edit-user-modal');
      if (!modal) return;

      const idInput = document.getElementById('modal-edit-user-id');
      const nameInput = document.getElementById('modal-edit-user-name');
      const emailInput = document.getElementById('modal-edit-user-email');
      const roleSelect = document.getElementById('modal-edit-user-role');
      const locationSelect = document.getElementById('modal-edit-user-location');
      const statusSelect = document.getElementById('modal-edit-user-status');

      if (idInput) idInput.value = user.id || '';
      if (nameInput) nameInput.value = user.name || '';
      if (emailInput) emailInput.value = user.email || '';
      if (roleSelect) roleSelect.value = user.role || 'financeiro';
      if (locationSelect) locationSelect.value = user.location || 'LD';
      if (statusSelect) statusSelect.value = user.status || 'ativo';

      // Atualiza Avatar com Iniciais
      const initials = user.name
        ? user.name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';
      const avatarEl = document.getElementById('modal-edit-user-avatar');
      if (avatarEl) avatarEl.textContent = initials || 'U';

      // Atualiza Badge do Perfil
      const roleMeta = (window.AppConfig.USER_ROLES && window.AppConfig.USER_ROLES[user.role]) || { label: user.role };
      const roleBadge = document.getElementById('modal-edit-user-badge-role');
      if (roleBadge) {
        roleBadge.textContent = roleMeta.label;
      }

      // Atualiza Título e Subtítulo
      const titleEl = document.getElementById('edit-user-modal-title');
      if (titleEl) {
        titleEl.textContent = `Editar: ${user.name}`;
      }
      const subtitleEl = document.getElementById('edit-user-modal-subtitle');
      if (subtitleEl) {
        subtitleEl.textContent = `Atualize os dados, função institucional e permissões de ${user.name}`;
      }

      // Atualiza ID e data de cadastro
      const idDisplay = document.getElementById('modal-edit-user-id-display');
      if (idDisplay) idDisplay.textContent = user.id || 'N/A';

      const createdEl = document.getElementById('modal-edit-user-created-at');
      if (createdEl) {
        if (user.createdAt) {
          try {
            const d = new Date(user.createdAt);
            createdEl.textContent = `Cadastrado em: ${window.AppConfig.utils.formatDate(window.AppConfig.utils.toISODateString(d))}`;
          } catch (e) {
            createdEl.textContent = 'Usuário registrado';
          }
        } else {
          createdEl.textContent = 'Usuário Padrão do Sistema';
        }
      }

      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();

      setTimeout(() => {
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }, 50);
    }

    closeEditUserModal() {
      const modal = document.getElementById('edit-user-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    }

    renderUsersList(users = []) {
      const tbody = document.getElementById('users-table-body');
      const badge = document.getElementById('users-total-count-badge');
      const sidebarBadge = document.getElementById('sidebar-count-users');

      const activeCount = users.filter((u) => u.status === 'ativo').length;
      if (badge) badge.textContent = `${activeCount} ativos (${users.length} total)`;
      if (sidebarBadge) sidebarBadge.textContent = users.length;

      if (!tbody) return;

      if (users.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="py-6 text-center text-slate-400">
              Nenhum usuário cadastrado.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = users.map((user) => {
        const roleMeta = (window.AppConfig.USER_ROLES && window.AppConfig.USER_ROLES[user.role]) || {
          label: user.role,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: 'user'
        };
        const isAtivo = user.status === 'ativo';
        const initials = user.name ? user.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';

        return `
          <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors" data-user-id="${user.id}">
            <td class="py-2.5 px-3 whitespace-nowrap">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-200">
                  ${initials}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-slate-900 dark:text-white leading-tight">${user.name}</div>
                  <div class="text-[10px] text-slate-400">${user.email}</div>
                </div>
              </div>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${roleMeta.badgeClass}">
                <i data-lucide="${roleMeta.icon}" class="w-3 h-3"></i>
                <span>${roleMeta.label}</span>
              </span>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap text-center">
              <span class="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                ${user.location || 'LD'}
              </span>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap text-center">
              <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isAtivo
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }">
                ${isAtivo ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="btn-edit-user p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-500 hover:text-emerald-700 transition-all cursor-pointer active:scale-95"
                  data-user-id="${user.id}"
                  title="Editar Informações do Usuário"
                >
                  <i data-lucide="edit-3" class="w-4 h-4 text-emerald-700 dark:text-emerald-400"></i>
                </button>
                <button
                  type="button"
                  class="btn-delete-user p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-all cursor-pointer active:scale-95"
                  data-user-id="${user.id}"
                  data-user-name="${user.name}"
                  title="Excluir Usuário"
                >
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Modal de Cadastro de Feriados
     */
    openHolidaysModal(selectedYear = '2026') {
      const modal = document.getElementById('holidays-modal');
      const yearSelect = document.getElementById('holiday-filter-year');
      if (yearSelect && selectedYear) {
        yearSelect.value = String(selectedYear);
      }
      const simInput = document.getElementById('sim-date-input');
      if (simInput && !simInput.value) {
        simInput.value = window.AppConfig.utils.toISODateString(new Date());
      }
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    }

    closeHolidaysModal() {
      const modal = document.getElementById('holidays-modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    switchHolidaysTab(tab = 'calendar') {
      const btnCalendar = document.getElementById('tab-btn-holidays-calendar');
      const btnParams = document.getElementById('tab-btn-holidays-params');
      const contentCalendar = document.getElementById('tab-content-holidays-calendar');
      const contentParams = document.getElementById('tab-content-holidays-params');

      if (tab === 'calendar') {
        btnCalendar?.classList.add('border-amber-600', 'text-amber-900', 'dark:text-amber-300', 'bg-amber-50/60', 'dark:bg-amber-950/30');
        btnCalendar?.classList.remove('border-transparent', 'text-slate-600');
        btnParams?.classList.remove('border-amber-600', 'text-amber-900', 'dark:text-amber-300', 'bg-amber-50/60', 'dark:bg-amber-950/30');
        btnParams?.classList.add('border-transparent', 'text-slate-600');

        contentCalendar?.classList.remove('hidden');
        contentParams?.classList.add('hidden');
      } else {
        btnParams?.classList.add('border-amber-600', 'text-amber-900', 'dark:text-amber-300', 'bg-amber-50/60', 'dark:bg-amber-950/30');
        btnParams?.classList.remove('border-transparent', 'text-slate-600');
        btnCalendar?.classList.remove('border-amber-600', 'text-amber-900', 'dark:text-amber-300', 'bg-amber-50/60', 'dark:bg-amber-950/30');
        btnCalendar?.classList.add('border-transparent', 'text-slate-600');

        contentCalendar?.classList.add('hidden');
        contentParams?.classList.remove('hidden');
      }

      if (window.lucide) window.lucide.createIcons();
    }

    renderHolidayParams(params) {
      if (!params) return;
      const daysSelect = document.getElementById('param-alert-business-days');
      if (daysSelect && params.alertAdvanceBusinessDays !== undefined) {
        daysSelect.value = String(params.alertAdvanceBusinessDays);
      }

      const autoProrogateCheck = document.getElementById('param-auto-prorogate');
      if (autoProrogateCheck) {
        autoProrogateCheck.checked = params.autoProrogateNonBusinessDays !== false;
      }

      const autoPopupCheck = document.getElementById('param-auto-popup');
      if (autoPopupCheck) {
        autoPopupCheck.checked = params.autoShowDailyPopup !== false;
      }

      const checkboxes = document.querySelectorAll('input[name="param-hol-type"]');
      const activeTypes = Array.isArray(params.consideredTypes)
        ? params.consideredTypes
        : ['municipal_sjc', 'estadual_sp', 'nacional', 'bancario_cartorio', 'facultativo'];

      checkboxes.forEach((cb) => {
        cb.checked = activeTypes.includes(cb.value);
      });
    }

    renderHolidaySimulation(result) {
      const box = document.getElementById('sim-result-box');
      if (!box) return;

      if (!result) {
        box.innerHTML = `<p class="text-slate-400 text-[11px]">Selecione uma data acima e clique em "Testar Cálculo".</p>`;
        return;
      }

      box.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between pb-1.5 border-b border-amber-100 dark:border-amber-900/40">
            <span class="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <i data-lucide="${result.isBusinessDay ? 'check-circle' : 'alert-circle'}" class="w-4 h-4 ${result.isBusinessDay ? 'text-emerald-600' : 'text-amber-600'}"></i>
              <span>Diagnóstico da Data: <strong>${result.nominalFormatted} (${result.nominalDayName})</strong></span>
            </span>
            <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
              result.isBusinessDay
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }">
              ${result.isBusinessDay ? 'Dia Útil' : result.holiday ? 'Feriado Cartorário' : 'Final de Semana'}
            </span>
          </div>

          ${
            result.holiday
              ? `<div class="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                   <i data-lucide="tag" class="w-3.5 h-3.5 shrink-0"></i>
                   <span>Feriado Detectado: <strong>${result.holiday.name}</strong> (${result.holidayTypeName})</span>
                 </div>`
              : ''
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div class="p-2 rounded bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Vencimento Efetivo Legal</span>
              <span class="font-bold text-slate-900 dark:text-white text-xs">${result.effectiveFormatted} (${result.effectiveDayName})</span>
              ${result.isProrogated ? `<span class="text-[10px] text-amber-700 dark:text-amber-400 block font-medium">↳ Prorrogado automaticamente</span>` : `<span class="text-[10px] text-emerald-600 block font-medium">↳ Sem necessidade de prorrogação</span>`}
            </div>

            <div class="p-2 rounded bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Início do Aviso Prévio (${result.advanceDays} dias úteis antes)</span>
              <span class="font-bold text-slate-900 dark:text-white text-xs">${result.alertStartFormatted} (${result.alertStartDayName})</span>
              <span class="text-[10px] ${result.isAlertActiveToday ? 'text-rose-600 font-extrabold animate-pulse' : 'text-slate-500'} block">
                ${result.isAlertActiveToday ? '🚨 Aviso disparado para HOJE!' : result.alertStatusText}
              </span>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    }

    renderHolidaysList(holidays = [], selectedYear = '2026') {
      const tbody = document.getElementById('holidays-table-body');
      const countBadge = document.getElementById('holidays-count-badge');
      const sidebarBadge = document.getElementById('sidebar-count-holidays');

      if (countBadge) countBadge.textContent = `${holidays.length} feriados (${selectedYear === 'todos' ? 'todos' : selectedYear})`;
      if (sidebarBadge) sidebarBadge.textContent = holidays.length;

      if (!tbody) return;

      if (holidays.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="py-6 text-center text-slate-400">
              Nenhum feriado cadastrado para o ano ${selectedYear}.
            </td>
          </tr>
        `;
        return;
      }

      const todayISO = window.AppConfig.utils.toISODateString(new Date());

      tbody.innerHTML = holidays.map((h) => {
        const typeMeta = (window.AppConfig.HOLIDAY_TYPES && window.AppConfig.HOLIDAY_TYPES[h.type]) || {
          label: h.type || 'Feriado',
          shortLabel: h.type,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300'
        };
        const dateFormatted = window.AppConfig.utils.formatDate(h.date);
        const dayOfWeek = window.AppConfig.utils.getDayOfWeekName(h.date);
        const isToday = h.date === todayISO;

        return `
          <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isToday ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}" data-holiday-id="${h.id}">
            <td class="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
              <div class="flex items-center gap-1.5">
                <span>${dateFormatted}</span>
                ${isToday ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">Hoje</span>' : ''}
              </div>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
              ${dayOfWeek}
            </td>
            <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
              ${h.name}
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap text-center">
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${typeMeta.badgeClass}">
                ${typeMeta.label}
              </span>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap text-right">
              <button
                type="button"
                class="btn-delete-holiday p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                data-holiday-id="${h.id}"
                data-holiday-name="${h.name}"
                title="Excluir Feriado"
              >
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Modal do Gerenciador de Despesas Fixas (Apenas Despesas Fixas)
     */
    openExpenseManagerModal() {
      const modal = document.getElementById('expense-manager-modal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    }

    closeExpenseManagerModal() {
      const modal = document.getElementById('expense-manager-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
      const recurringModal = document.getElementById('recurring-bill-modal');
      if (recurringModal) {
        recurringModal.classList.add('hidden');
      }
      this.resetRecurringForm();
      document.body.classList.remove('overflow-hidden');
    }

    /**
     * Modal de Gerenciamento de Categorias de Despesas (Lista e Edição)
     */
    openCategoriesModal() {
      const modal = document.getElementById('categories-modal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    }

    closeCategoriesModal() {
      const modal = document.getElementById('categories-modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    switchExpenseManagerTab(tabName = 'fixed') {
      const tabBtns = document.querySelectorAll('.tab-exp-btn');
      tabBtns.forEach((btn) => {
        if (btn.dataset.tab === tabName) {
          btn.classList.add('border-emerald-600', 'text-emerald-800', 'dark:text-emerald-300', 'bg-emerald-50/50', 'dark:bg-emerald-950/30', 'font-bold');
          btn.classList.remove('border-transparent', 'text-slate-600', 'dark:text-slate-400', 'font-semibold');
        } else {
          btn.classList.remove('border-emerald-600', 'text-emerald-800', 'dark:text-emerald-300', 'bg-emerald-50/50', 'dark:bg-emerald-950/30', 'font-bold');
          btn.classList.add('border-transparent', 'text-slate-600', 'dark:text-slate-400', 'font-semibold');
        }
      });

      const secCategories = document.getElementById('tab-content-exp-categories');
      const secFixed = document.getElementById('tab-content-exp-fixed');
      const secBudget = document.getElementById('tab-content-exp-budget');

      if (secCategories) secCategories.classList.toggle('hidden', tabName !== 'categories');
      if (secFixed) secFixed.classList.toggle('hidden', tabName !== 'fixed');
      if (secBudget) secBudget.classList.toggle('hidden', tabName !== 'budget');

      if (window.lucide) window.lucide.createIcons();
    }

    renderExpenseCategories(categoriesObj, bills = []) {
      const container = document.getElementById('categories-table-body') || document.getElementById('categories-grid');
      const countBadge = document.getElementById('categories-count-badge');
      const sidebarBadge = document.getElementById('sidebar-count-categories');
      if (!container) return;

      const cats = Object.values(categoriesObj || {});
      const format = window.AppConfig.utils.formatBRL;
      const defaultIds = ['moradia', 'alimentacao', 'fixas', 'variaveis', 'negocios', 'lazer', 'transporte', 'saude', 'educacao', 'outros'];

      if (countBadge) countBadge.textContent = `${cats.length} categorias`;
      if (sidebarBadge) sidebarBadge.textContent = cats.length;

      if (cats.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="3" class="py-8 text-center text-slate-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <i data-lucide="tag" class="w-6 h-6 text-slate-300"></i>
                <p class="text-xs">Nenhuma categoria de despesa cadastrada.</p>
                <button type="button" class="btn-focus-new-cat text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                  Clique aqui para adicionar uma nova categoria
                </button>
              </div>
            </td>
          </tr>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      container.innerHTML = cats.map((cat) => {
        const catBills = bills.filter((b) => b.category === cat.id);

        return `
          <tr class="hover:bg-emerald-50/50 dark:hover:bg-slate-800/40 transition-colors group" data-cat-id="${cat.id}">
            <!-- Categoria & Ícone -->
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold shadow-2xs transition-transform group-hover:scale-105" style="background-color: ${cat.color || '#059669'};">
                  <i data-lucide="${cat.icon || 'tag'}" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                    <span>${cat.label}</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-mono">
                    ID: ${cat.id}
                  </div>
                </div>
              </div>
            </td>

            <!-- Cor de Destaque -->
            <td class="py-2.5 px-3 text-center whitespace-nowrap">
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold shadow-2xs">
                <span class="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-black/10" style="background-color: ${cat.color || '#059669'};"></span>
                <span class="text-slate-700 dark:text-slate-300">${cat.color || '#059669'}</span>
              </div>
            </td>

            <!-- Ações: Editar e Excluir -->
            <td class="py-2.5 px-3 text-center whitespace-nowrap">
              <div class="flex items-center justify-center gap-1.5">
                <!-- Botão Editar Categoria -->
                <button
                  type="button"
                  class="btn-edit-category px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                  data-cat-id="${cat.id}"
                  data-cat-label="${cat.label}"
                  data-cat-icon="${cat.icon || 'tag'}"
                  data-cat-color="${cat.color || '#059669'}"
                  title="Editar esta categoria (nome, cor ou ícone)"
                >
                  <i data-lucide="edit-2" class="w-3 h-3"></i>
                  <span>Editar</span>
                </button>

                <!-- Botão Excluir Categoria -->
                <button
                  type="button"
                  class="btn-delete-category p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  data-cat-id="${cat.id}"
                  data-cat-label="${cat.label}"
                  data-bills-count="${catBills.length}"
                  title="Excluir categoria"
                >
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    }

    fillCategoryForm(cat) {
      const idInput = document.getElementById('cat-id');
      const nameInput = document.getElementById('cat-name');
      const iconInput = document.getElementById('cat-icon');
      const colorInput = document.getElementById('cat-color');
      const colorHex = document.getElementById('cat-color-hex');
      const titleText = document.getElementById('category-form-title-text');
      const submitText = document.getElementById('btn-submit-category-text');
      const cancelBtn = document.getElementById('btn-cancel-cat-form');

      if (idInput) idInput.value = cat.id || '';
      if (nameInput) nameInput.value = cat.label || '';
      if (iconInput) iconInput.value = cat.icon || 'tag';
      if (colorInput) colorInput.value = cat.color || '#059669';
      if (colorHex) colorHex.textContent = cat.color || '#059669';

      if (titleText) titleText.textContent = `Editar Categoria: ${cat.label}`;
      if (submitText) submitText.textContent = 'Salvar Alterações';
      if (cancelBtn) cancelBtn.classList.remove('hidden');

      const formEl = document.getElementById('category-form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }

    resetCategoryForm() {
      const form = document.getElementById('category-form');
      if (form) form.reset();
      const idInput = document.getElementById('cat-id');
      if (idInput) idInput.value = '';
      const colorInput = document.getElementById('cat-color');
      const colorHex = document.getElementById('cat-color-hex');
      if (colorInput) colorInput.value = '#059669';
      if (colorHex) colorHex.textContent = '#059669';

      const titleText = document.getElementById('category-form-title-text');
      const submitText = document.getElementById('btn-submit-category-text');
      const cancelBtn = document.getElementById('btn-cancel-cat-form');

      if (titleText) titleText.textContent = 'Adicionar Nova Categoria de Despesa';
      if (submitText) submitText.textContent = 'Salvar Categoria';
      if (cancelBtn) cancelBtn.classList.add('hidden');
    }

    renderExpenseFixedBills(recurringBills = []) {
      const tbody = document.getElementById('fixed-bills-table-body');
      const totalMonthlyEl = document.getElementById('fixed-exp-total-monthly');
      const totalCountEl = document.getElementById('fixed-exp-total-count');

      const format = window.AppConfig.utils.formatBRL;
      const totalFixedMonthly = recurringBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

      if (totalMonthlyEl) totalMonthlyEl.textContent = format(totalFixedMonthly);
      if (totalCountEl) totalCountEl.textContent = `${recurringBills.length} ${recurringBills.length === 1 ? 'conta fixa' : 'contas fixas'}`;

      // Resetar estado do checkbox mestre e dos textos de botões
      const headerCheck = document.getElementById('check-all-recurring-header');
      if (headerCheck) {
        headerCheck.checked = false;
        headerCheck.indeterminate = false;
      }
      const selectAllBtnText = document.getElementById('btn-select-all-recurring-text');
      if (selectAllBtnText) {
        selectAllBtnText.textContent = 'Selecionar Todas';
      }
      const launchBtnText = document.getElementById('btn-launch-all-recurring-text');
      if (launchBtnText) {
        launchBtnText.textContent = 'Lançar no Mês Atual';
      }

      if (!tbody) return;

      if (recurringBills.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-slate-400">
              <div class="flex flex-col items-center justify-center gap-2">
                <i data-lucide="pin-off" class="w-6 h-6 text-slate-300"></i>
                <p class="text-xs">Nenhuma despesa fixa cadastrada no repositório.</p>
                <button type="button" class="btn-trigger-new-recurring text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                  Clique aqui para cadastrar uma despesa fixa
                </button>
              </div>
            </td>
          </tr>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      tbody.innerHTML = recurringBills.map((b) => {
        const catMeta = (window.AppConfig.CATEGORIES && window.AppConfig.CATEGORIES[b.category])
          || (window.AppConfig.CATEGORIES && Object.values(window.AppConfig.CATEGORIES)[0])
          || { label: b.category || 'Geral', icon: 'tag' };
        const dueDay = b.dueDay || (b.dueDate ? parseInt(b.dueDate.split('-')[2], 10) : 1);
        const loc = b.location === 'CG' ? 'LD' : (b.location || 'LD');

        return `
          <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors" data-recurring-id="${b.id}">
            <td class="py-2.5 px-3 text-center">
              <input
                type="checkbox"
                class="check-single-recurring w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                data-recurring-id="${b.id}"
                data-recurring-name="${b.description}"
                title="Selecionar ${b.description}"
              />
            </td>
            <td class="py-2.5 px-3">
              <div class="font-bold text-slate-900 dark:text-white text-xs">${b.description}</div>
              ${b.notes ? `<div class="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">${b.notes}</div>` : ''}
            </td>
            <td class="py-2.5 px-3 text-center whitespace-nowrap">
              <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                loc === 'REC' ? 'bg-sky-100 text-sky-800' : loc === 'SE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }">${loc}</span>
            </td>
            <td class="py-2.5 px-3 whitespace-nowrap">
              <span class="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                <i data-lucide="${catMeta.icon || 'tag'}" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>${catMeta.label}</span>
              </span>
            </td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs">
              Todo dia ${dueDay}
            </td>
            <td class="py-2.5 px-3 text-right font-bold tabular-nums text-slate-900 dark:text-white whitespace-nowrap text-xs">
              ${format(b.amount)}
            </td>
            <td class="py-2.5 px-3 text-center whitespace-nowrap">
              <div class="flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  class="btn-edit-recurring-bill px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
                  data-recurring-id="${b.id}"
                  title="Editar despesa recorrente"
                >
                  <i data-lucide="edit-2" class="w-3 h-3"></i>
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  class="btn-launch-single-recurring px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
                  data-recurring-id="${b.id}"
                  title="Lançar esta despesa no mês selecionado das despesas"
                >
                  <i data-lucide="calendar-plus" class="w-3 h-3"></i>
                  <span>Lançar no Mês</span>
                </button>

                <button
                  type="button"
                  class="btn-delete-recurring-bill p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                  data-recurring-id="${b.id}"
                  data-recurring-name="${b.description}"
                  title="Excluir do Repositório"
                >
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    }

    openRecurringForm(recurring = null) {
      this.populateSelectOptions();
      const modal = document.getElementById('recurring-bill-modal');
      const title = document.getElementById('recurring-modal-title');
      const subtitle = document.getElementById('recurring-modal-subtitle');
      const submitText = document.getElementById('btn-save-recurring-text');

      if (!modal) return;

      if (recurring) {
        if (title) title.textContent = 'Editar Despesa Fixa';
        if (subtitle) subtitle.textContent = 'Altere os dados da despesa fixa no repositório permanente';
        if (submitText) submitText.textContent = 'Salvar Alterações';
        this.fillRecurringForm(recurring);
      } else {
        if (title) title.textContent = 'Adicionar Nova Despesa Fixa';
        if (subtitle) subtitle.textContent = 'Cadastre uma despesa fixa permanente para constar no repositório do cartório';
        if (submitText) submitText.textContent = 'Salvar Despesa Fixa';
        this.resetRecurringForm();
      }

      modal.classList.remove('hidden');
      setTimeout(() => {
        document.getElementById('recurring-description')?.focus();
      }, 60);
      if (window.lucide) window.lucide.createIcons();
    }

    closeRecurringForm() {
      const modal = document.getElementById('recurring-bill-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
      this.resetRecurringForm();
      const expModal = document.getElementById('expense-manager-modal');
      if (expModal && !expModal.classList.contains('hidden')) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    }

    fillRecurringForm(rec) {
      document.getElementById('recurring-bill-id').value = rec.id || '';
      document.getElementById('recurring-description').value = rec.description || '';
      document.getElementById('recurring-amount').value = rec.amount || '';
      document.getElementById('recurring-due-day').value = rec.dueDay || 10;
      document.getElementById('recurring-location').value = rec.location || 'LD';
      document.getElementById('recurring-category').value = rec.category || (Object.keys(window.AppConfig.CATEGORIES || {})[0] || '');
      document.getElementById('recurring-payment-method').value = rec.paymentMethod || 'pix';
      document.getElementById('recurring-notes').value = rec.notes || '';
    }

    resetRecurringForm() {
      const form = document.getElementById('recurring-bill-form');
      if (form) form.reset();
      const idInput = document.getElementById('recurring-bill-id');
      if (idInput) idInput.value = '';
      const dueDayInput = document.getElementById('recurring-due-day');
      if (dueDayInput) dueDayInput.value = '10';
      const locSelect = document.getElementById('recurring-location');
      if (locSelect) locSelect.value = 'LD';
    }

    renderExpenseBudget(budgetSettings, currentMonthTotal = 0) {
      const budgetAmountInput = document.getElementById('budget-monthly-amount');
      const alertThresholdInput = document.getElementById('budget-alert-threshold');
      const spentEl = document.getElementById('budget-preview-spent');
      const progressEl = document.getElementById('budget-preview-progress');
      const statusEl = document.getElementById('budget-preview-status');
      const remainingEl = document.getElementById('budget-preview-remaining');

      const budget = Number(budgetSettings?.monthlyBudget) || 8000;
      const threshold = Number(budgetSettings?.alertThreshold) || 80;

      if (budgetAmountInput) budgetAmountInput.value = budget;
      if (alertThresholdInput) alertThresholdInput.value = threshold;

      const format = window.AppConfig.utils.formatBRL;
      const pct = budget > 0 ? Math.min(100, Math.round((currentMonthTotal / budget) * 100)) : 0;
      const remaining = Math.max(0, budget - currentMonthTotal);

      if (spentEl) spentEl.textContent = `${format(currentMonthTotal)} de ${format(budget)}`;
      if (progressEl) {
        progressEl.style.width = `${pct}%`;
        if (pct >= 100) {
          progressEl.className = 'bg-rose-600 h-full rounded-full transition-all duration-500';
        } else if (pct >= threshold) {
          progressEl.className = 'bg-amber-500 h-full rounded-full transition-all duration-500';
        } else {
          progressEl.className = 'bg-emerald-600 h-full rounded-full transition-all duration-500';
        }
      }
      if (statusEl) statusEl.textContent = `${pct}% do teto utilizado`;
      if (remainingEl) {
        if (currentMonthTotal > budget) {
          remainingEl.className = 'font-bold text-rose-600';
          remainingEl.textContent = `Teto Excedido em ${format(currentMonthTotal - budget)}`;
        } else {
          remainingEl.className = 'font-semibold text-emerald-700 dark:text-emerald-400';
          remainingEl.textContent = `Saldo Disponível: ${format(remaining)}`;
        }
      }
    }
  }

  window.UIManager = new UIManager();
})(window);
