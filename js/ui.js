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

      // Card Total a Pagar / Pendente
      const elPending = document.getElementById('kpi-total-pending');
      const elPendingCount = document.getElementById('kpi-pending-count');
      if (elPending) elPending.textContent = format(kpis.totalPending);
      if (elPendingCount) elPendingCount.textContent = `${kpis.pendingCount} pendentes`;

      // Card Total Pago
      const elPaid = document.getElementById('kpi-total-paid');
      const elPaidPct = document.getElementById('kpi-paid-percentage');
      if (elPaid) elPaid.textContent = format(kpis.totalPaid);
      if (elPaidPct) elPaidPct.textContent = `${kpis.paidPercentage}% quitado`;

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
                      ${window.AppConfig.utils.formatDate(bill.dueDate)}
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium">
                      ${bill.relativeDate.text}
                    </span>
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
        document.getElementById('bill-category').value = bill.category;
        const invoiceSelect = document.getElementById('bill-invoice-status');
        if (invoiceSelect) invoiceSelect.value = bill.invoiceStatus || 'aguardando';
        document.getElementById('bill-status').value = bill.status === 'atrasado' ? 'pendente' : bill.status;
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

      if (upcomingBills.length === 0) {
        listContainer.innerHTML = `
          <div class="py-12 px-4 text-center">
            <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <i data-lucide="check-circle-2" class="w-7 h-7"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-800 dark:text-slate-100">Nenhuma conta com vencimento nos próximos 2 dias úteis!</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Seus compromissos financeiros imediatos estão em dia.
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
            urgencyLabel = '📅 Vence em 2 dias úteis';
            borderClass = 'border-emerald-300 dark:border-emerald-900/80';
            bgClass = 'bg-emerald-50/20 dark:bg-emerald-950/10';
            iconBg = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600';
          }

          const dueDateObj = bill.effectiveDueDate || (bill.dueDate ? new Date(bill.dueDate + 'T00:00:00') : new Date());
          const dayName = window.AppConfig.utils.getDayOfWeekName(dueDateObj);
          const loc = bill.location === 'CG' ? 'LD' : (bill.location || 'LD');
          const locBadgeClass = loc === 'LD' || loc === 'CG' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300' : loc === 'REC' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300';

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
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      • ${dayName}, ${window.AppConfig.utils.formatDate(bill.dueDate)}
                    </span>
                  </div>
                  <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 mt-1 leading-snug">
                    ${bill.description}
                  </h4>
                  <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                    <span>Cat: <strong class="text-slate-700 dark:text-slate-300">${bill.categoryMeta?.label || bill.category}</strong></span>
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
     * Popula os selects do modal e da barra de filtros com base nas constantes de config
     */
    populateSelectOptions() {
      // Categoria no formulário
      const modalCategorySelect = document.getElementById('bill-category');
      if (modalCategorySelect && modalCategorySelect.options.length <= 1) {
        modalCategorySelect.innerHTML = Object.values(window.AppConfig.CATEGORIES)
          .map((cat) => `<option value="${cat.id}">${cat.label}</option>`)
          .join('');
      }

      // Método de pagamento no formulário
      const modalPaymentSelect = document.getElementById('bill-payment-method');
      if (modalPaymentSelect && modalPaymentSelect.options.length <= 1) {
        modalPaymentSelect.innerHTML = Object.values(window.AppConfig.PAYMENT_METHODS)
          .map((pay) => `<option value="${pay.id}">${pay.label}</option>`)
          .join('');
      }

      // Popula selects adicionais se existirem no DOM
      const filterCategorySelect = document.getElementById('filter-category');
      if (filterCategorySelect && filterCategorySelect.options.length <= 1) {
        let options = `<option value="todos">Todas as Categorias</option>`;
        options += Object.values(window.AppConfig.CATEGORIES)
          .map((cat) => `<option value="${cat.id}">${cat.label}</option>`)
          .join('');
        filterCategorySelect.innerHTML = options;
      }

      const filterPaymentSelect = document.getElementById('filter-payment');
      if (filterPaymentSelect && filterPaymentSelect.options.length <= 1) {
        let options = `<option value="todos">Todos os Métodos</option>`;
        options += Object.values(window.AppConfig.PAYMENT_METHODS)
          .map((pay) => `<option value="${pay.id}">${pay.label}</option>`)
          .join('');
        filterPaymentSelect.innerHTML = options;
      }
    }

    /**
     * Modal de Confirmação de Exclusão (com suporte a despesas fixas recorrentes)
     * @param {Object} bill
     * @param {Object} context { selectedYear, selectedMonth }
     */
    openDeleteModal(bill, context = {}) {
      this.currentBillToDelete = bill;
      this.currentDeleteContext = context;
      const modal = document.getElementById('delete-modal');
      const descEl = document.getElementById('delete-bill-description');
      const amountEl = document.getElementById('delete-bill-amount');
      const modalTitle = document.getElementById('delete-modal-title');
      const modalBadge = document.getElementById('delete-modal-badge');
      const fixedOptions = document.getElementById('delete-fixed-options');
      const standardActions = document.getElementById('delete-standard-actions');
      const fixedMonthLabel = document.getElementById('delete-fixed-month-label');

      if (!modal) return;

      if (descEl) descEl.textContent = bill.description;
      if (amountEl) amountEl.textContent = window.AppConfig.utils.formatBRL(bill.amount);

      const isFixed = bill.expenseType === 'fixa' || bill.category === 'fixas';
      const year = context.selectedYear !== undefined ? Number(context.selectedYear) : new Date().getFullYear();
      const month = context.selectedMonth !== undefined ? Number(context.selectedMonth) : new Date().getMonth();
      const monthName = (window.AppConfig.MONTH_NAMES && window.AppConfig.MONTH_NAMES[month]) || 'Mês Atual';

      if (isFixed && fixedOptions && standardActions) {
        if (modalBadge) modalBadge.classList.remove('hidden');
        if (modalTitle) modalTitle.textContent = 'Excluir Despesa Fixa?';
        fixedOptions.classList.remove('hidden');
        standardActions.classList.add('hidden');
        if (fixedMonthLabel) {
          fixedMonthLabel.textContent = `${monthName}/${year}`;
        }
      } else {
        if (modalBadge) modalBadge.classList.add('hidden');
        if (modalTitle) modalTitle.textContent = 'Excluir Conta?';
        if (fixedOptions) fixedOptions.classList.add('hidden');
        if (standardActions) standardActions.classList.remove('hidden');
      }

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
        if (b.isPriorToLaunch) return;

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
     * Renderiza o Cronograma Mensal de Vencimentos em view-relatorios
     * @param {Array<Object>} monthlyData
     */
    renderMonthlyReport(monthlyData) {
      const container = document.getElementById('report-monthly-grid');
      if (!container) return;

      if (!monthlyData || monthlyData.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-6 text-center text-slate-400 text-xs">
            Nenhum dado mensal disponível para o período.
          </div>
        `;
        return;
      }

      container.innerHTML = monthlyData
        .map((m) => {
          const paidPct = m.total > 0 ? ((m.paid / m.total) * 100).toFixed(0) : 0;
          return `
            <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs font-bold text-slate-900 dark:text-slate-100">${m.label}</span>
                  <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    ${m.count} ${m.count === 1 ? 'conta' : 'contas'}
                  </span>
                </div>
                <div class="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                  ${window.AppConfig.utils.formatBRL(m.total)}
                </div>
                <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-500 mt-2">
                  <div>
                    <span class="block text-[10px] text-emerald-600 font-semibold">Pago (${paidPct}%)</span>
                    <span class="font-bold text-slate-700 dark:text-slate-300">${window.AppConfig.utils.formatBRL(m.paid)}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-amber-600 font-semibold">A Pagar</span>
                    <span class="font-bold text-slate-700 dark:text-slate-300">${window.AppConfig.utils.formatBRL(m.pending)}</span>
                  </div>
                </div>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
                <div class="bg-emerald-500 h-full rounded-full transition-all" style="width: ${paidPct}%"></div>
              </div>
            </div>
          `;
        })
        .join('');
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
    openStatementModal(bills, kpis) {
      const modal = document.getElementById('statement-modal');
      const bodyEl = document.getElementById('statement-modal-body');
      if (!modal || !bodyEl) return;

      const enriched = window.BillService.enrichBills(bills);
      const pendingBills = enriched.filter((b) => b.effectiveStatus !== 'pago');
      const paidBills = enriched.filter((b) => b.effectiveStatus === 'pago');

      bodyEl.innerHTML = `
        <div class="space-y-4 text-xs">
          <!-- Cabeçalho do Extrato -->
          <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 class="font-bold text-sm">Demonstrativo Geral de Contas a Pagar</h4>
              <p class="text-[11px] text-emerald-800">Posição financeira gerada em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-emerald-700 block">Total Geral</span>
              <span class="text-base font-extrabold tabular-nums">${window.AppConfig.utils.formatBRL(kpis.totalAmount)}</span>
            </div>
          </div>

          <!-- Grade de Resumo -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">A Pagar</span>
              <span class="text-sm font-bold text-amber-700 tabular-nums">${window.AppConfig.utils.formatBRL(kpis.totalPending)}</span>
              <span class="text-[10px] text-slate-400 block">${kpis.pendingCount} pendentes</span>
            </div>
            <div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Pago</span>
              <span class="text-sm font-bold text-emerald-700 tabular-nums">${window.AppConfig.utils.formatBRL(kpis.totalPaid)}</span>
              <span class="text-[10px] text-slate-400 block">${kpis.paidCount} pagas (${kpis.paidPercentage}%)</span>
            </div>
            <div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Vencidas</span>
              <span class="text-sm font-bold text-rose-700 tabular-nums">${window.AppConfig.utils.formatBRL(kpis.overdueTotal)}</span>
              <span class="text-[10px] text-slate-400 block">${kpis.overdueCount} atrasadas</span>
            </div>
            <div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <span class="text-[10px] uppercase font-bold text-slate-500 block">Total Contas</span>
              <span class="text-sm font-bold text-slate-800 tabular-nums">${bills.length} contas</span>
              <span class="text-[10px] text-slate-400 block">cadastradas</span>
            </div>
          </div>

          <!-- Contas Pendentes -->
          <div>
            <h5 class="font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center justify-between">
              <span>Contas Pendentes (${pendingBills.length})</span>
              <span class="text-amber-700 font-extrabold">${window.AppConfig.utils.formatBRL(kpis.totalPending)}</span>
            </h5>
            <div class="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              ${
                pendingBills.length === 0
                  ? '<div class="p-3 text-center text-slate-400">Nenhuma conta pendente! Todas estão quitadas.</div>'
                  : pendingBills.map((b) => `
                    <div class="p-2 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase mr-1 ${
                          b.location === 'REC' ? 'bg-blue-100 text-blue-800' : b.location === 'SE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }">${b.location === 'CG' ? 'LD' : (b.location || 'LD')}</span>
                        <span class="font-semibold text-slate-800">${b.description}</span>
                        ${(b.invoiceNumber || b.documentNumber) ? `<span class="text-[10px] text-emerald-800 font-medium block">${b.invoiceNumber ? `NF: ${b.invoiceNumber}` : ''} ${b.documentNumber ? `Doc: ${b.documentNumber}` : ''}</span>` : ''}
                        <span class="text-[10px] text-slate-400 block">${b.categoryMeta.label} • Vence em ${window.AppConfig.utils.formatDate(b.dueDate)} (${b.relativeDate.text})</span>
                      </div>
                      <span class="font-bold text-slate-900 tabular-nums">${window.AppConfig.utils.formatBRL(b.amount)}</span>
                    </div>
                  `).join('')
              }
            </div>
          </div>

          <!-- Contas Pagas -->
          <div>
            <h5 class="font-bold text-slate-800 dark:text-slate-100 mb-1.5 flex items-center justify-between">
              <span>Contas Quitadas (${paidBills.length})</span>
              <span class="text-emerald-700 font-extrabold">${window.AppConfig.utils.formatBRL(kpis.totalPaid)}</span>
            </h5>
            <div class="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              ${
                paidBills.length === 0
                  ? '<div class="p-3 text-center text-slate-400">Nenhuma conta quitada até o momento.</div>'
                  : paidBills.map((b) => `
                    <div class="p-2 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase mr-1 ${
                          b.location === 'REC' ? 'bg-blue-100 text-blue-800' : b.location === 'SE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }">${b.location === 'CG' ? 'LD' : (b.location || 'LD')}</span>
                        <span class="font-medium text-slate-700">${b.description}</span>
                        <span class="text-[10px] text-slate-400 block">Paga em ${b.paymentDate ? window.AppConfig.utils.formatDate(b.paymentDate) : '-'}</span>
                      </div>
                      <span class="font-bold text-emerald-800 tabular-nums">${window.AppConfig.utils.formatBRL(b.amount)}</span>
                    </div>
                  `).join('')
              }
            </div>
          </div>
        </div>
      `;

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      if (window.lucide) window.lucide.createIcons();
    }

    closeStatementModal() {
      const modal = document.getElementById('statement-modal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }
  }

  window.UIManager = new UIManager();
})(window);
