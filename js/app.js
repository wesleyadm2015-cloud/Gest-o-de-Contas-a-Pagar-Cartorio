/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Controlador Principal da Aplicação (App Controller)
 */

(function (window) {
  'use strict';

  class AppController {
    constructor() {
      const now = new Date();
      this.allBills = [];
      this.filteredBills = [];
      this.activeFilters = {
        period: 'mes', // 'hoje', 'semana', 'mes', 'todos', 'personalizado'
        status: 'todos', // 'todos', 'pendente', 'pago', 'atrasado'
        location: 'todos', // 'todos', 'LD', 'REC', 'SE'
        expenseType: 'todos',
        category: 'todos',
        paymentMethod: 'todos',
        search: '',
        customStart: null,
        customEnd: null,
        sortBy: 'dueDate_asc',
        selectedYear: now.getFullYear(),
        selectedMonth: now.getMonth()
      };
      this.activeTab = 'contas'; // 'contas' | 'relatorios'
      this.activeSidebarId = 'sidebar-nav-all';
    }

    /**
     * Inicializa a aplicação restaurando o estado e tela anteriores
     */
    async init() {
      try {
        this.loadSavedState();
        window.UIManager.init();
        await window.StorageService.getCategories();
        await window.StorageService.getHolidayParams();
        await window.StorageService.getHolidays();
        window.UIManager.populateSelectOptions();
        this.bindEvents();
        this.restoreUIState();
        await this.loadData(true);
      } catch (err) {
        console.error('Falha na inicialização da aplicação:', err);
      }
    }

    /**
     * Salva o estado atual da tela (aba ativa, mês, ano, filtros e botão da sidebar)
     * Garante que ao atualizar a página, o sistema se mantenha na tela/mês atual
     */
    saveCurrentState() {
      try {
        const state = {
          activeTab: this.activeTab,
          activeFilters: this.activeFilters,
          activeSidebarId: this.activeSidebarId || null
        };
        localStorage.setItem('contadiaria_view_state_v1', JSON.stringify(state));
      } catch (err) {
        console.warn('Erro ao salvar estado da tela:', err);
      }
    }

    /**
     * Carrega o estado salvo previamente no LocalStorage
     */
    loadSavedState() {
      try {
        const raw = localStorage.getItem('contadiaria_view_state_v1');
        if (!raw) return;
        const state = JSON.parse(raw);
        if (state) {
          if (state.activeTab && ['contas', 'relatorios'].includes(state.activeTab)) {
            this.activeTab = state.activeTab;
          }
          if (state.activeFilters && typeof state.activeFilters === 'object') {
            this.activeFilters = {
              ...this.activeFilters,
              ...state.activeFilters
            };
            if (this.activeFilters.selectedMonth !== undefined) {
              this.activeFilters.selectedMonth = Number(this.activeFilters.selectedMonth);
            }
            if (this.activeFilters.selectedYear !== undefined) {
              this.activeFilters.selectedYear = Number(this.activeFilters.selectedYear);
            }
          }
          if (state.activeSidebarId) {
            this.activeSidebarId = state.activeSidebarId;
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar estado salvo da tela:', err);
      }
    }

    /**
     * Aplica o estado salvo aos componentes visuais da interface (DOM)
     */
    restoreUIState() {
      // 1. Restaura a visualização da tela atual (Contas vs Relatórios)
      this.switchTab(this.activeTab);

      // 2. Restaura valores dos dropdowns e inputs da barra de filtros
      const selectMonth = document.getElementById('select-month');
      if (selectMonth && this.activeFilters.selectedMonth !== undefined) {
        selectMonth.value = String(this.activeFilters.selectedMonth);
      }

      const selectYear = document.getElementById('select-year');
      if (selectYear && this.activeFilters.selectedYear !== undefined) {
        selectYear.value = String(this.activeFilters.selectedYear);
      }

      const filterStatusSelect = document.getElementById('filter-status-select');
      if (filterStatusSelect && this.activeFilters.status) {
        filterStatusSelect.value = this.activeFilters.status;
      }

      const filterLocSelect = document.getElementById('filter-location-select');
      if (filterLocSelect && this.activeFilters.location) {
        filterLocSelect.value = this.activeFilters.location;
      }

      const sortBy = document.getElementById('sort-by');
      if (sortBy && this.activeFilters.sortBy) {
        sortBy.value = this.activeFilters.sortBy;
      }

      const searchInput = document.getElementById('search-input');
      if (searchInput && this.activeFilters.search) {
        searchInput.value = this.activeFilters.search;
        const clearBtn = document.getElementById('btn-clear-search');
        if (clearBtn) clearBtn.classList.remove('hidden');
      }

      // 3. Restaura os botões de período (Hoje, Esta Semana, Mês Selecionado, Todos, Personalizado)
      if (this.activeFilters.period) {
        document.querySelectorAll('.btn-period-filter').forEach((btn) => {
          const isSelected = btn.dataset.period === this.activeFilters.period;
          btn.classList.toggle('bg-emerald-600', isSelected);
          btn.classList.toggle('text-white', isSelected);
          btn.classList.toggle('shadow-xs', isSelected);
          btn.classList.toggle('text-slate-600', !isSelected);
          btn.classList.toggle('dark:text-slate-400', !isSelected);
        });

        const customDateInputs = document.getElementById('custom-date-container');
        if (customDateInputs) {
          if (this.activeFilters.period === 'personalizado') {
            customDateInputs.classList.remove('hidden');
          } else {
            customDateInputs.classList.add('hidden');
          }
        }
      }

      if (this.activeFilters.customStart) {
        const inputStart = document.getElementById('custom-date-start');
        if (inputStart) inputStart.value = this.activeFilters.customStart;
      }
      if (this.activeFilters.customEnd) {
        const inputEnd = document.getElementById('custom-date-end');
        if (inputEnd) inputEnd.value = this.activeFilters.customEnd;
      }

      // 4. Restaura o botão ativo da Sidebar
      if (this.activeSidebarId) {
        document.querySelectorAll('.sidebar-nav-item').forEach((btn) => btn.classList.remove('active'));
        const activeBtn = document.getElementById(this.activeSidebarId);
        if (activeBtn) activeBtn.classList.add('active');
      }
    }

    /**
     * Carrega os dados do Storage e atualiza a UI
     * @param {boolean} isInitial Se é a carga inicial da página
     */
    async loadData(isInitial = false) {
      try {
        this.allBills = await window.StorageService.getAll();
        this.applyFiltersAndRender();
        this.updateAdminSidebarBadges();
        if (isInitial) {
          this.checkDailyAlertPopup();
        }
      } catch (err) {
        console.error('Falha ao carregar contas:', err);
        window.UIManager.showToast('Erro ao carregar dados do armazenamento.', 'error');
      }
    }

    /**
     * Atualiza os contadores das seções de Administração & Gestão na Sidebar
     */
    async updateAdminSidebarBadges() {
      try {
        const users = await window.StorageService.getUsers();
        const usersBadge = document.getElementById('sidebar-count-users');
        if (usersBadge) usersBadge.textContent = users.length;

        const currentYear = this.activeFilters.selectedYear || new Date().getFullYear();
        const holidays = await window.StorageService.getHolidays(currentYear);
        const holidaysBadge = document.getElementById('sidebar-count-holidays');
        if (holidaysBadge) holidaysBadge.textContent = holidays.length;

        const recurring = await window.StorageService.getRecurringBills();
        const expBadge = document.getElementById('sidebar-count-expense-manager');
        if (expBadge) expBadge.textContent = recurring.length;

        const categories = await window.StorageService.getCategories();
        const catBadge = document.getElementById('sidebar-count-categories');
        if (catBadge) catBadge.textContent = Object.keys(categories || {}).length;
      } catch (e) {
        console.warn('Erro ao atualizar badges da sidebar:', e);
      }
    }

    /**
     * Exibe o popup de alerta com as contas que vencem nos próximos dias úteis parametrizados
     * toda vez que a página for atualizada / recarregada (conforme regra de negócio)
     */
    checkDailyAlertPopup() {
      // Se o usuário estiver na tela de relatórios, não sobrepõe com o popup de contas diárias
      if (this.activeTab !== 'contas') return;

      const params = window.AppConfig.HOLIDAY_PARAMS || { autoShowDailyPopup: true, alertAdvanceBusinessDays: 2 };
      if (params.autoShowDailyPopup === false) return;

      const upcomingBills = window.BillService.getBillsDueInBusinessDays(this.allBills, params.alertAdvanceBusinessDays);
      const overdueBills = window.BillService.getOverdueBills(this.allBills);

      // Se houver contas a vencer nos próximos dias úteis parametrizados (ou atrasadas)
      if (upcomingBills.length > 0 || overdueBills.length > 0) {
        setTimeout(() => {
          window.UIManager.openDailyAlertModal(upcomingBills, overdueBills);
        }, 300);
      }
    }

    /**
     * Aplica os filtros ativos, ordena e atualiza toda a interface
     */
    applyFiltersAndRender() {
      // 1. Filtra as contas de acordo com o estado ativo
      const filtered = window.BillService.filterBills(this.allBills, this.activeFilters);
      // 2. Ordena
      this.filteredBills = window.BillService.sortBills(filtered, this.activeFilters.sortBy);

      // 3. Calcula KPIs para o período ativo
      const kpis = window.BillService.calculateKPIs(
        this.allBills,
        this.activeFilters.period,
        8000,
        this.activeFilters.selectedYear,
        this.activeFilters.selectedMonth
      );

      // 4. Renderiza componentes de UI
      window.UIManager.renderKPIs(kpis);
      const monthBills = window.BillService.getMonthBills(
        this.allBills,
        this.activeFilters.selectedYear,
        this.activeFilters.selectedMonth
      );
      window.UIManager.updateMonthSelector(
        this.activeFilters.selectedYear,
        this.activeFilters.selectedMonth,
        monthBills
      );
      window.UIManager.renderUrgencyBanner(kpis);
      window.UIManager.renderBillsList(this.filteredBills);

      // 5. Atualiza Relatórios, Gráfico de Colunas Anual (12 Meses), Tabela de Mês Selecionado e Cards
      const currentYear = this.activeFilters.selectedYear !== undefined ? Number(this.activeFilters.selectedYear) : new Date().getFullYear();
      const monthlyData = window.BillService.getMonthlyBreakdown(this.allBills, currentYear);
      window.UIManager.renderAnnualChart(monthlyData, currentYear);
      window.UIManager.renderMonthlyReport(monthlyData);
      window.UIManager.renderTopBillsReport(window.BillService.getTopBills(this.allBills, 5));
      this.updateReportSelectedMonthView();

      // 6. Atualiza dados da Sidebar Lateral Esquerda
      window.UIManager.updateSidebarBadges(this.allBills);

      // 7. Atualiza popover de notificações
      this.renderNotificationPopover();

      // 8. Garante renderização dos ícones Lucide
      if (window.lucide) {
        window.lucide.createIcons();
      }

      // 9. Persiste o estado da tela, filtros, mês e ano para manter após recarregar a página
      this.saveCurrentState();
    }

    /**
     * Alterna entre as abas principais (Contas vs Relatórios)
     * @param {'contas'|'relatorios'} tabName
     */
    switchTab(tabName) {
      this.activeTab = tabName;

      const tabContasBtn = document.getElementById('tab-btn-contas');
      const tabRelatoriosBtn = document.getElementById('tab-btn-relatorios');
      const viewContas = document.getElementById('view-contas');
      const viewRelatorios = document.getElementById('view-relatorios');

      if (tabName === 'contas') {
        if (tabContasBtn) {
          tabContasBtn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
          tabContasBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
        }

        if (tabRelatoriosBtn) {
          tabRelatoriosBtn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
          tabRelatoriosBtn.classList.add('text-slate-500', 'dark:text-slate-400');
        }

        if (viewContas) viewContas.classList.remove('hidden');
        if (viewRelatorios) viewRelatorios.classList.add('hidden');

        if (this.activeSidebarId === 'sidebar-report-overview') {
          this.activeSidebarId = 'sidebar-nav-all';
        }
      } else {
        if (tabRelatoriosBtn) {
          tabRelatoriosBtn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
          tabRelatoriosBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
        }

        if (tabContasBtn) {
          tabContasBtn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
          tabContasBtn.classList.add('text-slate-500', 'dark:text-slate-400');
        }

        if (viewContas) viewContas.classList.add('hidden');
        if (viewRelatorios) viewRelatorios.classList.remove('hidden');

        this.activeSidebarId = 'sidebar-report-overview';

        // Atualiza relatórios analíticos extras, gráfico de colunas de 12 meses e tabela do mês selecionado
        const currentYear = this.activeFilters.selectedYear !== undefined ? Number(this.activeFilters.selectedYear) : new Date().getFullYear();
        const monthlyData = window.BillService.getMonthlyBreakdown(this.allBills, currentYear);
        window.UIManager.renderAnnualChart(monthlyData, currentYear);
        window.UIManager.renderMonthlyReport(monthlyData);
        window.UIManager.renderTopBillsReport(window.BillService.getTopBills(this.allBills, 5));
        this.updateReportSelectedMonthView();

        // Atualiza tamanho dos gráficos
        setTimeout(() => {
          if (window.ChartService) {
            window.ChartService.refreshTheme();
          }
        }, 50);
      }

      // Atualiza o destaque do botão ativo na Sidebar
      if (this.activeSidebarId) {
        document.querySelectorAll('.sidebar-nav-item').forEach((btn) => btn.classList.remove('active'));
        const activeBtn = document.getElementById(this.activeSidebarId);
        if (activeBtn) activeBtn.classList.add('active');
      }

      // Persiste a aba atual no LocalStorage
      this.saveCurrentState();
    }

    /**
     * Vincula todos os ouvintes de eventos da página
     */
    bindEvents() {
      // Helper comum de abertura do modal diário de vencimentos
      const openDailyAlertHelper = () => {
        const upcoming = window.BillService.getBillsDueInBusinessDays(this.allBills, 2);
        const overdue = window.BillService.getOverdueBills(this.allBills);
        window.UIManager.openDailyAlertModal(upcoming, overdue);
      };

      // Alternância de Tema
      const btnTheme = document.getElementById('btn-toggle-theme');
      if (btnTheme) {
        btnTheme.addEventListener('click', () => window.UIManager.toggleTheme());
      }

      // Alternância de Abas
      document.getElementById('tab-btn-contas')?.addEventListener('click', () => this.switchTab('contas'));
      document.getElementById('tab-btn-relatorios')?.addEventListener('click', () => this.switchTab('relatorios'));

      // Filtros de Período (Botões Pill)
      const periodButtons = document.querySelectorAll('.btn-period-filter');
      periodButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          periodButtons.forEach((b) => {
            b.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm', 'shadow-xs');
            b.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
          });

          const target = e.currentTarget;
          target.classList.add('bg-emerald-600', 'text-white', 'shadow-xs');
          target.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');

          const period = target.dataset.period;
          this.activeFilters.period = period;

          // Exibe campos de data personalizada se for o caso
          const customDateInputs = document.getElementById('custom-date-container');
          if (customDateInputs) {
            if (period === 'personalizado') {
              customDateInputs.classList.remove('hidden');
            } else {
              customDateInputs.classList.add('hidden');
            }
          }

          this.applyFiltersAndRender();
        });
      });

      // Helper para destacar o botão de período "Mês Selecionado" na UI
      const activateMonthPeriodButton = () => {
        this.activeFilters.period = 'mes';
        const periodBtns = document.querySelectorAll('.btn-period-filter');
        periodBtns.forEach((b) => {
          if (b.dataset.period === 'mes') {
            b.classList.add('bg-emerald-600', 'text-white', 'shadow-xs');
            b.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
          } else {
            b.classList.remove('bg-emerald-600', 'text-white', 'shadow-xs', 'shadow-sm');
            b.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
          }
        });
        const customDateInputs = document.getElementById('custom-date-container');
        if (customDateInputs) {
          customDateInputs.classList.add('hidden');
        }
      };

      // Seletor de Mês (Dropdown Mês)
      document.getElementById('select-month')?.addEventListener('change', (e) => {
        this.activeFilters.selectedMonth = parseInt(e.target.value, 10);
        activateMonthPeriodButton();
        this.applyFiltersAndRender();
      });

      // Seletor de Ano (Dropdown Ano)
      document.getElementById('select-year')?.addEventListener('change', (e) => {
        this.activeFilters.selectedYear = parseInt(e.target.value, 10);
        activateMonthPeriodButton();
        this.applyFiltersAndRender();
      });

      // Botão Mês Anterior (<)
      document.getElementById('btn-prev-month')?.addEventListener('click', () => {
        let currentM = Number(this.activeFilters.selectedMonth);
        let currentY = Number(this.activeFilters.selectedYear);
        if (currentM === 0) {
          currentM = 11;
          currentY -= 1;
        } else {
          currentM -= 1;
        }
        this.activeFilters.selectedMonth = currentM;
        this.activeFilters.selectedYear = currentY;
        activateMonthPeriodButton();
        this.applyFiltersAndRender();
      });

      // Botão Próximo Mês (>)
      document.getElementById('btn-next-month')?.addEventListener('click', () => {
        let currentM = Number(this.activeFilters.selectedMonth);
        let currentY = Number(this.activeFilters.selectedYear);
        if (currentM === 11) {
          currentM = 0;
          currentY += 1;
        } else {
          currentM += 1;
        }
        this.activeFilters.selectedMonth = currentM;
        this.activeFilters.selectedYear = currentY;
        activateMonthPeriodButton();
        this.applyFiltersAndRender();
      });

      // Botão Atalho: Hoje / Mês Atual
      document.getElementById('btn-current-month')?.addEventListener('click', () => {
        const now = new Date();
        this.activeFilters.selectedMonth = now.getMonth();
        this.activeFilters.selectedYear = now.getFullYear();
        activateMonthPeriodButton();
        this.applyFiltersAndRender();
      });

      // Datas Personalizadas
      document.getElementById('custom-date-start')?.addEventListener('change', (e) => {
        this.activeFilters.customStart = e.target.value;
        this.applyFiltersAndRender();
      });
      document.getElementById('custom-date-end')?.addEventListener('change', (e) => {
        this.activeFilters.customEnd = e.target.value;
        this.applyFiltersAndRender();
      });

      // Filtro de Status do Pagamento (Dropdown)
      const statusSelect = document.getElementById('filter-status-select');
      statusSelect?.addEventListener('change', (e) => {
        this.activeFilters.status = e.target.value;
        this.applyFiltersAndRender();
      });

      // Filtro por Local (LD, REC, SE) (Dropdown)
      const locationSelect = document.getElementById('filter-location-select');
      locationSelect?.addEventListener('change', (e) => {
        this.activeFilters.location = e.target.value;
        this.applyFiltersAndRender();
      });

      // Ordenação
      document.getElementById('sort-by')?.addEventListener('change', (e) => {
        this.activeFilters.sortBy = e.target.value;
        this.applyFiltersAndRender();
      });

      // Busca por Texto em Tempo Real
      const searchInput = document.getElementById('search-input');
      const clearSearchBtn = document.getElementById('btn-clear-search');

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.activeFilters.search = e.target.value;
          if (clearSearchBtn) {
            clearSearchBtn.classList.toggle('hidden', !e.target.value);
          }
          this.applyFiltersAndRender();
        });
      }

      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          this.activeFilters.search = '';
          clearSearchBtn.classList.add('hidden');
          this.applyFiltersAndRender();
          searchInput.focus();
        });
      }

      // Botão Limpar Filtros no Empty State
      document.getElementById('btn-clear-all-filters')?.addEventListener('click', () => {
        this.resetFilters();
      });

      // Botão Nova Conta
      document.getElementById('btn-new-bill')?.addEventListener('click', () => {
        window.UIManager.openBillModal('create');
      });

      // =========================================================================
      // EVENTOS DA SIDEBAR LATERAL: PARÂMETROS DE GESTÃO, RELATÓRIOS & AÇÕES
      // =========================================================================
      const updateActiveSidebarBtn = (activeBtn) => {
        document.querySelectorAll('.sidebar-nav-item').forEach((btn) => {
          btn.classList.remove('active');
        });
        if (activeBtn) {
          activeBtn.classList.add('active');
          if (activeBtn.id !== 'sidebar-report-statement' && !activeBtn.id.startsWith('sidebar-action-')) {
            this.activeSidebarId = activeBtn.id;
          }
        }
        this.saveCurrentState();
      };

      // 1. Botão + Nova Despesa na Sidebar
      document.getElementById('sidebar-btn-new-bill')?.addEventListener('click', () => {
        window.UIManager.openBillModal('create');
      });

      // --- SEÇÃO 1: SITUAÇÃO FINANCEIRA (STATUS) ---

      // Todas as Contas
      document.getElementById('sidebar-nav-all')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFilters();
      });

      // Aguardando Pagamento
      document.getElementById('sidebar-nav-pending')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFiltersKeep({ status: 'pendente', period: 'todos' });
      });

      // Vencidas / Urgentes
      document.getElementById('sidebar-nav-overdue')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.filterUrgentOnly();
      });

      // Vencendo em 2 Dias (Lembrete)
      document.getElementById('sidebar-nav-due-2days')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        openDailyAlertHelper();
      });

      // Pagas / Quitações
      document.getElementById('sidebar-nav-paid')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFiltersKeep({ status: 'pago', period: 'todos' });
      });

      // --- SEÇÃO 2: PARÂMETROS POR UNIDADE (LOCAL LD, REC, SE) ---

      // Unidade LD
      document.getElementById('sidebar-nav-ld')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFiltersKeep({ location: 'LD' });
      });

      // Unidade REC
      document.getElementById('sidebar-nav-rec')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFiltersKeep({ location: 'REC' });
      });

      // Unidade SE
      document.getElementById('sidebar-nav-se')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFiltersKeep({ location: 'SE' });
      });

      // --- SEÇÃO 3: PARÂMETROS POR NATUREZA (F / V) ---

      // Despesas Fixas (F)
      document.getElementById('sidebar-nav-fixed')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFiltersKeep({ expenseType: 'fixa' });
      });

      // Despesas Variáveis (V)
      document.getElementById('sidebar-nav-variable')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFiltersKeep({ expenseType: 'variavel' });
      });

      // --- SEÇÃO 4: CONTROLE FISCAL & NF ---

      // Aguardando NF / Doc
      document.getElementById('sidebar-nav-missing-nf')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFiltersKeep({ invoiceStatus: 'aguardando', period: 'todos' });
      });

      // --- SEÇÃO 5: RELATÓRIOS & ANÁLISES EXECUTIVAS ---

      // Painel de Gráficos
      document.getElementById('sidebar-report-overview')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('relatorios');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Cronograma Mensal
      document.getElementById('sidebar-report-monthly')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('relatorios');
        const sec = document.getElementById('report-monthly-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });

      // Top Maiores Despesas
      document.getElementById('sidebar-report-top')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('relatorios');
        const sec = document.getElementById('report-top-bills-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      });

      // Demonstrativo Executivo
      document.getElementById('sidebar-report-statement')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        const kpis = window.BillService.calculateKPIs(this.allBills, 'todos');
        window.UIManager.openStatementModal(this.allBills, kpis);
      });

      // 13. Ações: Baixar Planilha CSV
      document.getElementById('sidebar-action-csv')?.addEventListener('click', () => {
        window.ExportService.exportBillsToCSV(this.filteredBills.length > 0 ? this.filteredBills : this.allBills);
        window.UIManager.showToast('Download do relatório CSV iniciado!', 'success');
      });

      // 14. Ações: Copiar Resumo Formatado
      document.getElementById('sidebar-action-copy')?.addEventListener('click', async () => {
        const kpis = window.BillService.calculateKPIs(
          this.allBills,
          this.activeFilters.period,
          8000,
          this.activeFilters.selectedYear,
          this.activeFilters.selectedMonth
        );
        const text = window.ExportService.generateTextSummary(kpis, this.filteredBills);
        const ok = await window.ExportService.copyToClipboard(text);
        if (ok) {
          window.UIManager.showToast('Resumo financeiro copiado para WhatsApp / E-mail!', 'success');
        } else {
          window.UIManager.showToast('Não foi possível copiar o texto.', 'error');
        }
      });

      // 15. Ações: Imprimir Relatório
      document.getElementById('sidebar-action-print')?.addEventListener('click', () => {
        window.print();
      });

      // 16. Ações: Limpar Todas as Despesas
      document.getElementById('sidebar-action-clear-all')?.addEventListener('click', async () => {
        const total = this.allBills.length;
        if (total === 0) {
          window.UIManager.showToast('Não há nenhuma despesa para remover.', 'info');
          return;
        }
        if (confirm(`Atenção: Tem certeza de que deseja remover todas as ${total} despesas cadastradas? Esta ação apagará permanentemente todos os lançamentos.`)) {
          await window.StorageService.clearAll();
          window.UIManager.showToast('Todas as despesas foram removidas com sucesso!', 'success');
          await this.loadData();
        }
      });

      // Eventos do Modal de Demonstrativo Executivo
      document.getElementById('btn-close-statement-modal')?.addEventListener('click', () => {
        window.UIManager.closeStatementModal();
      });
      document.getElementById('btn-print-statement')?.addEventListener('click', () => {
        window.print();
      });
      document.getElementById('btn-export-statement-excel')?.addEventListener('click', () => {
        const stmtData = window.UIManager.currentStatementData;
        if (stmtData && stmtData.options && stmtData.options.isMonthReport) {
          window.ExportService.exportMonthToExcel(
            this.allBills,
            stmtData.options.year,
            stmtData.options.monthIndex,
            stmtData.options.monthLabel
          );
        } else {
          window.ExportService.exportToCSV(this.allBills);
        }
      });
      document.getElementById('btn-copy-statement')?.addEventListener('click', async () => {
        const stmtData = window.UIManager.currentStatementData;
        const billsToCopy = stmtData?.bills || this.allBills;
        const kpis = stmtData?.kpis || window.BillService.calculateKPIs(this.allBills, 'todos');
        const text = window.ExportService.generateTextSummary(kpis, billsToCopy);
        const ok = await window.ExportService.copyToClipboard(text);
        if (ok) {
          window.UIManager.showToast('Demonstrativo copiado para a área de transferência!', 'success');
        } else {
          window.UIManager.showToast('Erro ao copiar demonstrativo.', 'error');
        }
      });

      // =========================================================================
      // EVENTOS DO RELATÓRIO DE DESPESAS PAGAS POR MÊS (PDF & EXCEL)
      // =========================================================================
      const getSelectedReportMonthInfo = () => {
        const select = document.getElementById('select-report-month');
        if (!select || !select.value) {
          const now = new Date();
          return {
            year: now.getFullYear(),
            monthIndex: now.getMonth(),
            monthLabel: window.AppConfig.MONTH_NAMES[now.getMonth()] + ' de ' + now.getFullYear()
          };
        }
        const [yearStr, monthStr] = select.value.split('-');
        const year = parseInt(yearStr, 10);
        const monthIndex = parseInt(monthStr, 10);
        const monthLabel = select.options[select.selectedIndex]?.textContent || `${window.AppConfig.MONTH_NAMES[monthIndex]} de ${year}`;
        return { year, monthIndex, monthLabel };
      };

      // 1. Botão do Topo: Gerar PDF do Mês Selecionado
      document.getElementById('btn-export-selected-month-pdf')?.addEventListener('click', () => {
        const { year, monthIndex, monthLabel } = getSelectedReportMonthInfo();
        this.handleMonthPDF(year, monthIndex, monthLabel);
      });

      // 2. Botão do Topo: Gerar Excel do Mês Selecionado
      document.getElementById('btn-export-selected-month-excel')?.addEventListener('click', () => {
        const { year, monthIndex, monthLabel } = getSelectedReportMonthInfo();
        this.handleMonthExcel(year, monthIndex, monthLabel);
      });

      // 3. Seleção do Mês no Relatório: Atualiza a tabela com todas as despesas daquele mês (Somente Visualização)
      document.getElementById('select-report-month')?.addEventListener('change', () => {
        this.updateReportSelectedMonthView();
      });

      // Submissão do Formulário de Conta (Criar / Editar)
      document.getElementById('bill-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });

      // Fechamento de Modais
      document.getElementById('btn-close-modal')?.addEventListener('click', () => window.UIManager.closeBillModal());
      document.getElementById('btn-cancel-modal')?.addEventListener('click', () => window.UIManager.closeBillModal());

      // Sincronização entre Status e Data de Pagamento no formulário
      document.getElementById('bill-status')?.addEventListener('change', (e) => {
        const isPaid = e.target.value === 'pago';
        const input = document.getElementById('bill-payment-date');
        if (input) {
          if (isPaid && !input.value) {
            input.value = window.AppConfig.utils.toISODateString();
          } else if (!isPaid) {
            input.value = '';
          }
        }
      });

      // Mudança direta na data de pagamento no formulário reflete no status
      document.getElementById('bill-payment-date')?.addEventListener('change', (e) => {
        const statusSelect = document.getElementById('bill-status');
        if (statusSelect) {
          if (e.target.value) {
            statusSelect.value = 'pago';
          } else {
            statusSelect.value = 'pendente';
          }
        }
      });

      // Modal de Exclusão
      document.getElementById('btn-cancel-delete')?.addEventListener('click', () => window.UIManager.closeDeleteModal());
      document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
        await this.handleDeleteConfirm();
      });

      // =========================================================================
      // EVENTOS DO MODAL RÁPIDO: NOTA FISCAL E DOCUMENTO
      // =========================================================================
      document.getElementById('btn-close-quick-nf')?.addEventListener('click', () => {
        window.UIManager.closeQuickNFModal();
      });
      document.getElementById('btn-cancel-quick-nf')?.addEventListener('click', () => {
        window.UIManager.closeQuickNFModal();
      });
      document.getElementById('quick-nf-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'quick-nf-modal') {
          window.UIManager.closeQuickNFModal();
        }
      });

      document.getElementById('quick-nf-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('quick-nf-bill-id').value;
        const invoiceNumber = document.getElementById('quick-nf-input').value.trim();
        const documentNumber = document.getElementById('quick-doc-input').value.trim();

        try {
          await window.StorageService.update(id, { invoiceNumber, documentNumber });
          window.UIManager.closeQuickNFModal();
          window.UIManager.showToast('Nota Fiscal e Documento atualizados com sucesso!', 'success');
          await this.loadData();
        } catch (err) {
          console.error('Falha ao atualizar NF/Doc:', err);
          window.UIManager.showToast('Erro ao salvar Nota Fiscal/Doc.', 'error');
        }
      });

      document.getElementById('btn-clear-quick-nf')?.addEventListener('click', async () => {
        const id = document.getElementById('quick-nf-bill-id').value;

        try {
          await window.StorageService.update(id, { invoiceNumber: '', documentNumber: '' });
          window.UIManager.closeQuickNFModal();
          window.UIManager.showToast('Nota Fiscal e Documento removidos.', 'info');
          await this.loadData();
        } catch (err) {
          console.error('Falha ao limpar NF/Doc:', err);
          window.UIManager.showToast('Erro ao remover dados.', 'error');
        }
      });

      // =========================================================================
      // EVENTOS DO MODAL: LEMBRETE DIÁRIO DE VENCIMENTOS (2 DIAS ÚTEIS)
      // =========================================================================
      const openDailyAlertHelper = () => {
        const upcoming = window.BillService.getBillsDueInBusinessDays(this.allBills, 2);
        const overdue = window.BillService.getOverdueBills(this.allBills);
        window.UIManager.openDailyAlertModal(upcoming, overdue);
      };

      document.getElementById('btn-close-daily-alert')?.addEventListener('click', () => {
        window.UIManager.closeDailyAlertModal();
      });

      document.getElementById('btn-confirm-daily-alert')?.addEventListener('click', () => {
        window.UIManager.closeDailyAlertModal();
      });

      document.getElementById('daily-alert-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'daily-alert-modal') {
          window.UIManager.closeDailyAlertModal();
        }
      });

      // Botão no Popover de Notificações
      document.getElementById('btn-popover-open-daily-alert')?.addEventListener('click', () => {
        const popover = document.getElementById('notification-popover');
        if (popover) popover.classList.add('hidden');
        openDailyAlertHelper();
      });

      // Botão Filtrar na Tabela a partir do Modal
      document.getElementById('btn-daily-alert-filter-table')?.addEventListener('click', () => {
        window.UIManager.closeDailyAlertModal();
        this.switchTab('contas');
        const today = new Date();
        const todayISO = window.AppConfig.utils.toISODateString(today);
        const targetDate = window.AppConfig.utils.addBusinessDays(today, 2);
        const targetISO = window.AppConfig.utils.toISODateString(targetDate);

        this.activeFilters.period = 'personalizado';
        this.activeFilters.customStart = todayISO;
        this.activeFilters.customEnd = targetISO;
        this.activeFilters.status = 'pendente';

        const customDateInputs = document.getElementById('custom-date-container');
        if (customDateInputs) customDateInputs.classList.remove('hidden');
        const startInput = document.getElementById('custom-date-start');
        if (startInput) startInput.value = todayISO;
        const endInput = document.getElementById('custom-date-end');
        if (endInput) endInput.value = targetISO;

        document.querySelectorAll('.btn-period-filter').forEach((b) => {
          const isCustom = b.dataset.period === 'personalizado';
          b.classList.toggle('bg-emerald-600', isCustom);
          b.classList.toggle('text-white', isCustom);
          b.classList.toggle('shadow-xs', isCustom);
        });

        this.applyFiltersAndRender();
        document.getElementById('bills-table-section')?.scrollIntoView({ behavior: 'smooth' });
        window.UIManager.showToast('Exibindo contas que vencem nos próximos 2 dias úteis.', 'info');
      });

      // Botão Mostrar Atrasadas a partir do Modal
      document.getElementById('btn-daily-alert-show-overdue')?.addEventListener('click', () => {
        window.UIManager.closeDailyAlertModal();
        this.switchTab('contas');
        this.filterUrgentOnly();
      });

      // Botão para reiniciar simulação de 1º acesso
      document.getElementById('btn-reset-daily-alert-seen')?.addEventListener('click', () => {
        localStorage.removeItem('contadiaria_last_daily_popup_date');
        window.UIManager.showToast('Primeiro acesso reiniciado! Ao recarregar a página, o popup abrirá automaticamente.', 'success', 3500);
      });

      // Ação de Quitar Diretamente no Popup ("Pagar Hoje")
      document.getElementById('daily-alert-list')?.addEventListener('click', async (e) => {
        const btnPay = e.target.closest('.btn-daily-alert-quick-pay');
        if (!btnPay) return;
        const billId = btnPay.dataset.id;
        if (!billId) return;

        const bill = this.allBills.find((b) => b.id === billId);
        if (!bill) return;

        const todayISO = window.AppConfig.utils.toISODateString();
        await window.StorageService.update(billId, {
          status: 'pago',
          paymentDate: todayISO
        });

        window.UIManager.showToast(`Conta "${bill.description}" quitada com sucesso!`, 'success');
        await this.loadData();

        // Atualiza a listagem do modal em tempo real
        const remainingUpcoming = window.BillService.getBillsDueInBusinessDays(this.allBills, 2);
        const remainingOverdue = window.BillService.getOverdueBills(this.allBills);
        window.UIManager.openDailyAlertModal(remainingUpcoming, remainingOverdue);
      });

      // Delegação de Eventos de Clique na Tabela e nos Cards (Editar Despesa, Pagar 1-clique, Excluir, Limpar Data, Calendário, NF/Doc Rápido)
      const containerClickDelegation = (e) => {
        const quickNfBtn = e.target.closest('.btn-quick-edit-nf');
        const clearDateBtn = e.target.closest('.btn-clear-payment-date');
        const toggleBtn = e.target.closest('.btn-toggle-paid');
        const editBtn = e.target.closest('.btn-edit-bill');
        const deleteBtn = e.target.closest('.btn-delete-bill');
        const calendarBtn = e.target.closest('.btn-open-calendar-picker');

        if (quickNfBtn) {
          e.stopPropagation();
          const id = quickNfBtn.dataset.id;
          const bill = this.allBills.find((b) => b.id === id);
          if (bill) {
            window.UIManager.openQuickNFModal(bill);
          }
          return;
        }

        if (calendarBtn) {
          e.stopPropagation();
          const container = calendarBtn.closest('.relative, .flex');
          const hiddenPicker = container?.querySelector('.hidden-native-date-picker');
          if (hiddenPicker) {
            if (typeof hiddenPicker.showPicker === 'function') {
              hiddenPicker.showPicker();
            } else {
              hiddenPicker.focus();
            }
          }
          return;
        }

        if (clearDateBtn) {
          e.stopPropagation();
          const id = clearDateBtn.dataset.id;
          this.handleInlinePaymentDateChange(id, null);
          return;
        }

        if (toggleBtn) {
          e.stopPropagation();
          const id = toggleBtn.dataset.id;
          this.handleQuickPayToggle(id);
          return;
        }

        if (editBtn) {
          e.stopPropagation();
          const id = editBtn.dataset.id;
          this.handleEditBill(id);
          return;
        }

        if (deleteBtn) {
          e.stopPropagation();
          const id = deleteBtn.dataset.id;
          this.handlePromptDelete(id);
          return;
        }
      };

      document.getElementById('bills-table-body')?.addEventListener('click', containerClickDelegation);
      document.getElementById('bills-mobile-cards')?.addEventListener('click', containerClickDelegation);

      // =========================================================================
      // EVENTOS DE DATA SEGMENTADA (Dia, Mês e Ano Independentes)
      // Permite alterar apenas o dia, apenas o mês ou apenas o ano individualmente
      // =========================================================================

      // 1. Ao clicar ou focar no Dia, Mês ou Ano: seleciona todo o número para edição imediata
      const segmentedDateFocusHandler = (e) => {
        const seg = e.target.closest('.date-seg-day, .date-seg-month, .date-seg-year');
        if (seg) {
          setTimeout(() => seg.select(), 10);
        }
      };
      document.getElementById('bills-table-body')?.addEventListener('focusin', segmentedDateFocusHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('focusin', segmentedDateFocusHandler);

      // 2. Ao digitar nos campos de Dia, Mês ou Ano: aceita apenas números e avança automaticamente
      const segmentedDateInputHandler = (e) => {
        const seg = e.target.closest('.date-seg-day, .date-seg-month, .date-seg-year');
        if (!seg) return;

        const val = seg.value.replace(/\D/g, '');
        seg.value = val;

        const container = seg.closest('.date-segmented-container');
        if (!container) return;

        const dayInput = container.querySelector('.date-seg-day');
        const monthInput = container.querySelector('.date-seg-month');
        const yearInput = container.querySelector('.date-seg-year');

        // Se digitou 2 dígitos no dia, avança para o mês
        if (seg === dayInput && val.length >= 2) {
          monthInput?.focus();
          monthInput?.select();
        }
        // Se digitou 2 dígitos no mês, avança para o ano
        else if (seg === monthInput && val.length >= 2) {
          yearInput?.focus();
          yearInput?.select();
        }
      };
      document.getElementById('bills-table-body')?.addEventListener('input', segmentedDateInputHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('input', segmentedDateInputHandler);

      // 3. Teclado nos campos de Dia, Mês ou Ano: navegação por setas, barra e Enter para salvar
      const segmentedDateKeyHandler = (e) => {
        const seg = e.target.closest('.date-seg-day, .date-seg-month, .date-seg-year');
        if (!seg) return;

        const container = seg.closest('.date-segmented-container');
        if (!container) return;

        const dayInput = container.querySelector('.date-seg-day');
        const monthInput = container.querySelector('.date-seg-month');
        const yearInput = container.querySelector('.date-seg-year');

        if (e.key === 'Enter') {
          e.preventDefault();
          seg.blur();
          return;
        }

        // Barra '/' ou Seta para Direita avança para o próximo segmento
        if (e.key === '/' || e.key === 'ArrowRight') {
          if (seg === dayInput) {
            e.preventDefault();
            monthInput?.focus();
            monthInput?.select();
          } else if (seg === monthInput) {
            e.preventDefault();
            yearInput?.focus();
            yearInput?.select();
          }
        }
        // Seta para Esquerda volta para o segmento anterior
        else if (e.key === 'ArrowLeft') {
          if (seg === yearInput && (seg.selectionStart === 0 || seg.selectionStart === seg.selectionEnd)) {
            e.preventDefault();
            monthInput?.focus();
            monthInput?.select();
          } else if (seg === monthInput && (seg.selectionStart === 0 || seg.selectionStart === seg.selectionEnd)) {
            e.preventDefault();
            dayInput?.focus();
            dayInput?.select();
          }
        }
        // Backspace em campo vazio volta para o anterior
        else if (e.key === 'Backspace' && seg.value === '') {
          if (seg === yearInput) {
            e.preventDefault();
            monthInput?.focus();
            monthInput?.select();
          } else if (seg === monthInput) {
            e.preventDefault();
            dayInput?.focus();
            dayInput?.select();
          }
        }
      };
      document.getElementById('bills-table-body')?.addEventListener('keydown', segmentedDateKeyHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('keydown', segmentedDateKeyHandler);

      // 4. Salvar data segmentada quando o foco sair do conjunto (Dia/Mês/Ano)
      const segmentedDateFocusOutHandler = (e) => {
        const seg = e.target.closest('.date-seg-day, .date-seg-month, .date-seg-year');
        if (!seg) return;

        const container = seg.closest('.date-segmented-container');
        if (!container) return;

        setTimeout(() => {
          if (container.contains(document.activeElement)) {
            return; // Ainda está dentro do mesmo container (ex: navegou do dia pro mês)
          }

          const id = container.dataset.id;
          const dayInput = container.querySelector('.date-seg-day');
          const monthInput = container.querySelector('.date-seg-month');
          const yearInput = container.querySelector('.date-seg-year');

          const dayStr = dayInput ? dayInput.value.trim() : '';
          const monthStr = monthInput ? monthInput.value.trim() : '';
          const yearStr = yearInput ? yearInput.value.trim() : '';

          // Se todos os campos estiverem vazios, remove a data de pagamento
          if (!dayStr && !monthStr && !yearStr) {
            this.handleInlinePaymentDateChange(id, null);
            return;
          }

          const bill = this.allBills.find((b) => b.id === id);
          const baseDate = bill?.paymentDate || window.AppConfig.utils.toISODateString();
          const [baseY, baseM, baseD] = baseDate.split('-');

          const day = dayStr ? parseInt(dayStr, 10) : parseInt(baseD, 10);
          const month = monthStr ? parseInt(monthStr, 10) : parseInt(baseM, 10);
          let year = yearStr ? parseInt(yearStr, 10) : parseInt(baseY, 10);
          if (year < 100) year += 2000;

          // Validações
          if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 1900 || year > 2100) {
            window.UIManager.showToast('Data inválida. Verifique o dia, mês e ano informados.', 'warning');
            if (bill?.paymentDate) {
              const parts = bill.paymentDate.split('-');
              if (dayInput) dayInput.value = parts[2] || '';
              if (monthInput) monthInput.value = parts[1] || '';
              if (yearInput) yearInput.value = parts[0] || '';
            }
            return;
          }

          const daysInMonth = new Date(year, month, 0).getDate();
          if (day < 1 || day > daysInMonth) {
            window.UIManager.showToast(`O mês ${String(month).padStart(2, '0')}/${year} tem apenas ${daysInMonth} dias.`, 'warning');
            if (bill?.paymentDate) {
              const parts = bill.paymentDate.split('-');
              if (dayInput) dayInput.value = parts[2] || '';
              if (monthInput) monthInput.value = parts[1] || '';
              if (yearInput) yearInput.value = parts[0] || '';
            }
            return;
          }

          const pad = (n) => String(n).padStart(2, '0');
          const isoDate = `${year}-${pad(month)}-${pad(day)}`;

          if (isoDate !== bill?.paymentDate) {
            this.handleInlinePaymentDateChange(id, isoDate);
          } else {
            // Garante exibição formatada com 2 dígitos
            if (dayInput) dayInput.value = pad(day);
            if (monthInput) monthInput.value = pad(month);
            if (yearInput) yearInput.value = String(year);
          }
        }, 120);
      };

      document.getElementById('bills-table-body')?.addEventListener('focusout', segmentedDateFocusOutHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('focusout', segmentedDateFocusOutHandler);

      // Compatibilidade: campo texto único legível se houver
      const inlineDateMaskHandler = (e) => {
        const input = e.target.closest('.input-manual-payment-date');
        if (input) {
          let v = input.value.replace(/\D/g, '');
          if (v.length > 8) v = v.substring(0, 8);
          if (v.length > 4) {
            input.value = v.substring(0, 2) + '/' + v.substring(2, 4) + '/' + v.substring(4);
          } else if (v.length > 2) {
            input.value = v.substring(0, 2) + '/' + v.substring(2);
          } else {
            input.value = v;
          }
        }
      };

      document.getElementById('bills-table-body')?.addEventListener('input', inlineDateMaskHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('input', inlineDateMaskHandler);

      const inlineDateCommitHandler = (e) => {
        const input = e.target.closest('.input-manual-payment-date');
        if (input) {
          const id = input.dataset.id;
          const raw = input.value.trim();
          if (!raw) {
            this.handleInlinePaymentDateChange(id, null);
            return;
          }
          const iso = this.parseBrazilianDateToISO(raw);
          if (iso) {
            this.handleInlinePaymentDateChange(id, iso);
          } else {
            window.UIManager.showToast('Data inválida. Digite no formato dia/mês/ano (ex: 15/11/2026).', 'warning');
            const bill = this.allBills.find((b) => b.id === id);
            input.value = bill?.paymentDate ? window.AppConfig.utils.formatDate(bill.paymentDate) : '';
          }
        }
      };

      document.getElementById('bills-table-body')?.addEventListener('change', inlineDateCommitHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('change', inlineDateCommitHandler);

      const inlineDateKeyHandler = (e) => {
        const input = e.target.closest('.input-manual-payment-date');
        if (input && e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      };

      document.getElementById('bills-table-body')?.addEventListener('keydown', inlineDateKeyHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('keydown', inlineDateKeyHandler);

      // 4. Ouvinte de mudança no seletor nativo de calendário oculto
      const hiddenPickerChangeHandler = (e) => {
        const picker = e.target.closest('.hidden-native-date-picker');
        if (picker && picker.value) {
          const id = picker.dataset.id;
          this.handleInlinePaymentDateChange(id, picker.value);
        }
      };

      document.getElementById('bills-table-body')?.addEventListener('change', hiddenPickerChangeHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('change', hiddenPickerChangeHandler);

      // Ouvinte de mudança no Status (Lista Suspensa Pago / Aguardando Pagamento)
      const inlineStatusChangeHandler = (e) => {
        const select = e.target.closest('.select-inline-status');
        if (select) {
          const id = select.dataset.id;
          const newStatus = select.value;
          this.handleInlineStatusChange(id, newStatus);
        }
      };

      document.getElementById('bills-table-body')?.addEventListener('change', inlineStatusChangeHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('change', inlineStatusChangeHandler);

      // Ouvinte de mudança no Local (Lista Suspensa LD, REC, SE)
      const inlineLocationChangeHandler = (e) => {
        const select = e.target.closest('.select-inline-location');
        if (select) {
          const id = select.dataset.id;
          const newLocation = select.value;
          this.handleInlineLocationChange(id, newLocation);
        }
      };

      document.getElementById('bills-table-body')?.addEventListener('change', inlineLocationChangeHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('change', inlineLocationChangeHandler);

      // Ouvinte de mudança na classificação F/V (F = Fixa, V = Variável)
      const inlineExpenseTypeChangeHandler = (e) => {
        const select = e.target.closest('.select-inline-expense-type');
        if (select) {
          const id = select.dataset.id;
          const newType = select.value;
          this.handleInlineExpenseTypeChange(id, newType);
        }
      };

      document.getElementById('bills-table-body')?.addEventListener('change', inlineExpenseTypeChangeHandler);
      document.getElementById('bills-mobile-cards')?.addEventListener('change', inlineExpenseTypeChangeHandler);

      // Botão do Banner de Urgência ("Ver Contas Urgentes")
      document.getElementById('btn-view-urgent')?.addEventListener('click', () => {
        this.filterUrgentOnly();
      });

      // Botão Sino de Notificações
      const bellBtn = document.getElementById('btn-notification-bell');
      const popover = document.getElementById('notification-popover');
      if (bellBtn && popover) {
        bellBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          popover.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
          if (!popover.contains(e.target) && !bellBtn.contains(e.target)) {
            popover.classList.add('hidden');
          }
        });
      }

      // Exportação CSV (Contas Filtradas na Tela)
      document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        const bills = this.filteredBills || [];
        if (bills.length === 0) {
          window.UIManager.showToast('Nenhuma despesa encontrada com os filtros atuais para exportar.', 'warning');
          return;
        }
        const year = this.activeFilters?.selectedYear !== undefined ? this.activeFilters.selectedYear : new Date().getFullYear();
        const pad = (n) => String(n).padStart(2, '0');
        const monthIndex = this.activeFilters?.selectedMonth !== undefined ? this.activeFilters.selectedMonth : new Date().getMonth();
        const monthKey = `${year}-${pad(monthIndex + 1)}`;
        const filename = `despesas_filtradas_${monthKey}.csv`;

        window.ExportService.exportToCSV(bills, filename);
        window.UIManager.showToast(`Planilha CSV exportada com ${bills.length} conta(s) filtrada(s)!`, 'success');
      });

      document.getElementById('btn-export-csv-report')?.addEventListener('click', () => {
        const bills = this.filteredBills || [];
        if (bills.length === 0) {
          window.UIManager.showToast('Nenhuma despesa para exportar.', 'warning');
          return;
        }
        window.ExportService.exportToCSV(bills);
        window.UIManager.showToast('Arquivo CSV baixado com sucesso!', 'success');
      });

      // 1. Exportar PDF das Contas Atualmente Filtradas
      document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
        this.handleExportCurrentPDF();
      });

      // 2. Copiar Resumo Formatado (Compatibilidade)
      document.getElementById('btn-copy-summary')?.addEventListener('click', async () => {
        const kpis = window.BillService.calculateKPIs(
          this.allBills,
          this.activeFilters.period,
          8000,
          this.activeFilters.selectedYear,
          this.activeFilters.selectedMonth
        );
        const ok = await window.ExportService.copySummaryToClipboard(this.filteredBills, kpis);
        if (ok) {
          window.UIManager.showToast('Resumo formatado copiado para a área de transferência!', 'success');
        } else {
          window.UIManager.showToast('Não foi possível copiar o texto.', 'error');
        }
      });

      // Restaurar Dados Mock de Demonstração
      document.getElementById('btn-reset-demo')?.addEventListener('click', async () => {
        if (confirm('Deseja recarregar os dados de exemplo dinâmicos? Seus lançamentos atuais serão substituídos pelo modelo inicial.')) {
          await window.StorageService.resetWithMock();
          await this.loadData();
          window.UIManager.showToast('Dados de demonstração restaurados com sucesso!', 'success');
        }
      });

      // Botão de Limpar Filtros no Empty State
      document.getElementById('btn-clear-all-filters')?.addEventListener('click', () => {
        this.resetFilters();
      });

      // =========================================================================
      // EVENTOS: 1. CADASTRO DE USUÁRIOS
      // =========================================================================
      document.getElementById('sidebar-btn-users')?.addEventListener('click', async () => {
        const users = await window.StorageService.getUsers();
        window.UIManager.renderUsersList(users);
        window.UIManager.openUsersModal();
      });

      document.getElementById('btn-close-users-modal')?.addEventListener('click', () => {
        window.UIManager.closeUsersModal();
      });
      document.getElementById('btn-close-users-modal-bottom')?.addEventListener('click', () => {
        window.UIManager.closeUsersModal();
      });
      document.getElementById('users-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'users-modal') {
          window.UIManager.closeUsersModal();
        }
      });
      document.getElementById('btn-reset-user-form')?.addEventListener('click', () => {
        window.UIManager.resetUserForm();
      });

      document.getElementById('user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('user-id').value;
        const name = document.getElementById('user-name').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const role = document.getElementById('user-role').value;
        const location = document.getElementById('user-location').value;
        const status = document.getElementById('user-status').value;

        if (!name || !email) {
          window.UIManager.showToast('Por favor, informe o nome e o e-mail do usuário.', 'warning');
          return;
        }

        await window.StorageService.saveUser({ id, name, email, role, location, status });
        window.UIManager.showToast(id ? 'Usuário atualizado com sucesso!' : 'Novo usuário cadastrado com sucesso!', 'success');
        window.UIManager.resetUserForm();
        const updatedUsers = await window.StorageService.getUsers();
        window.UIManager.renderUsersList(updatedUsers);
        this.updateAdminSidebarBadges();
      });

      document.getElementById('users-table-body')?.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-edit-user');
        const deleteBtn = e.target.closest('.btn-delete-user');

        if (editBtn) {
          const userId = editBtn.dataset.userId || editBtn.getAttribute('data-user-id') || editBtn.closest('tr')?.dataset?.userId;
          const users = await window.StorageService.getUsers();
          let user = users.find((u) => String(u.id) === String(userId));
          if (!user && userId) {
            user = users.find((u) => u.email === userId || u.name === userId);
          }
          if (user) {
            window.UIManager.openEditUserModal(user);
          } else {
            console.warn('Usuário não localizado para edição:', userId);
          }
          return;
        }

        if (deleteBtn) {
          const userId = deleteBtn.dataset.userId || deleteBtn.getAttribute('data-user-id') || deleteBtn.closest('tr')?.dataset?.userId;
          const userName = deleteBtn.dataset.userName || 'este usuário';
          if (confirm(`Tem certeza de que deseja remover o usuário "${userName}"?`)) {
            await window.StorageService.deleteUser(userId);
            window.UIManager.showToast('Usuário removido com sucesso!', 'success');
            const updatedUsers = await window.StorageService.getUsers();
            window.UIManager.renderUsersList(updatedUsers);
            this.updateAdminSidebarBadges();
          }
          return;
        }
      });

      // Controles da Tela Dedicada de Edição de Usuário
      document.getElementById('btn-close-edit-user-modal')?.addEventListener('click', () => {
        window.UIManager.closeEditUserModal();
      });

      document.getElementById('btn-cancel-edit-user-modal')?.addEventListener('click', () => {
        window.UIManager.closeEditUserModal();
      });

      document.getElementById('edit-user-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'edit-user-modal') {
          window.UIManager.closeEditUserModal();
        }
      });

      // Fechar modais com a tecla Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const editModal = document.getElementById('edit-user-modal');
          if (editModal && !editModal.classList.contains('hidden')) {
            window.UIManager.closeEditUserModal();
            return;
          }
          const expModal = document.getElementById('expense-manager-modal');
          if (expModal && !expModal.classList.contains('hidden')) {
            window.UIManager.closeExpenseManagerModal();
            return;
          }
          const catModal = document.getElementById('categories-modal');
          if (catModal && !catModal.classList.contains('hidden')) {
            window.UIManager.closeCategoriesModal();
            return;
          }
          const usersModal = document.getElementById('users-modal');
          if (usersModal && !usersModal.classList.contains('hidden')) {
            window.UIManager.closeUsersModal();
            return;
          }
          const holModal = document.getElementById('holidays-modal');
          if (holModal && !holModal.classList.contains('hidden')) {
            window.UIManager.closeHolidaysModal();
            return;
          }
        }
      });

      // Atualização interativa do Avatar com as iniciais ao digitar o nome
      document.getElementById('modal-edit-user-name')?.addEventListener('input', (e) => {
        const name = e.target.value.trim();
        const initials = name ? name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
        const avatarEl = document.getElementById('modal-edit-user-avatar');
        if (avatarEl) avatarEl.textContent = initials || 'U';
      });

      // Atualização dinâmica do badge de Perfil ao trocar a função
      document.getElementById('modal-edit-user-role')?.addEventListener('change', (e) => {
        const roleVal = e.target.value;
        const roleMeta = (window.AppConfig.USER_ROLES && window.AppConfig.USER_ROLES[roleVal]) || { label: roleVal };
        const badgeEl = document.getElementById('modal-edit-user-badge-role');
        if (badgeEl) badgeEl.textContent = roleMeta.label;
      });

      // Submissão do Formulário na Tela Dedicada de Edição
      document.getElementById('modal-edit-user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('modal-edit-user-id').value;
        const name = document.getElementById('modal-edit-user-name').value.trim();
        const email = document.getElementById('modal-edit-user-email').value.trim();
        const role = document.getElementById('modal-edit-user-role').value;
        const location = document.getElementById('modal-edit-user-location').value;
        const status = document.getElementById('modal-edit-user-status').value;

        if (!name || !email) {
          window.UIManager.showToast('Por favor, preencha o nome e o e-mail do usuário.', 'warning');
          return;
        }

        await window.StorageService.saveUser({ id, name, email, role, location, status });
        window.UIManager.showToast(`Informações de "${name}" atualizadas com sucesso!`, 'success');
        window.UIManager.closeEditUserModal();

        const updatedUsers = await window.StorageService.getUsers();
        window.UIManager.renderUsersList(updatedUsers);
        this.updateAdminSidebarBadges();
      });

      // =========================================================================
      // EVENTOS: 2. CADASTRO DE FERIADOS
      // =========================================================================
      const loadAndRenderHolidays = async () => {
        const yearSelect = document.getElementById('holiday-filter-year');
        const year = yearSelect ? yearSelect.value : (this.activeFilters.selectedYear || '2026');
        const holidays = await window.StorageService.getHolidays(year);
        window.UIManager.renderHolidaysList(holidays, year);
      };

      document.getElementById('sidebar-btn-holidays')?.addEventListener('click', async () => {
        const currentYear = this.activeFilters.selectedYear || '2026';
        await loadAndRenderHolidays();
        const params = await window.StorageService.getHolidayParams();
        window.UIManager.renderHolidayParams(params);
        window.UIManager.switchHolidaysTab('calendar');
        window.UIManager.openHolidaysModal(currentYear);
      });

      document.getElementById('btn-close-holidays-modal')?.addEventListener('click', () => {
        window.UIManager.closeHolidaysModal();
      });
      document.getElementById('btn-close-holidays-modal-bottom')?.addEventListener('click', () => {
        window.UIManager.closeHolidaysModal();
      });
      document.getElementById('holidays-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'holidays-modal') {
          window.UIManager.closeHolidaysModal();
        }
      });

      // Alternância de abas no Modal de Feriados (Calendário vs Parametrização)
      document.querySelectorAll('.tab-holidays-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const tab = e.currentTarget.dataset.tab;
          window.UIManager.switchHolidaysTab(tab);
          if (tab === 'params') {
            const params = await window.StorageService.getHolidayParams();
            window.UIManager.renderHolidayParams(params);
          }
        });
      });

      // Submissão do Formulário de Parametrização de Feriados & Aviso Prévio
      document.getElementById('holiday-params-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const daysSelect = document.getElementById('param-alert-business-days');
        const autoProrogate = document.getElementById('param-auto-prorogate')?.checked;
        const autoPopup = document.getElementById('param-auto-popup')?.checked;
        const checkedTypes = Array.from(document.querySelectorAll('input[name="param-hol-type"]:checked')).map((cb) => cb.value);

        const params = {
          alertAdvanceBusinessDays: parseInt(daysSelect?.value, 10) || 2,
          autoProrogateNonBusinessDays: autoProrogate,
          consideredTypes: checkedTypes,
          autoShowDailyPopup: autoPopup
        };

        await window.StorageService.saveHolidayParams(params);
        window.AppConfig.utils.reloadHolidays();
        window.UIManager.showToast('Parâmetros de feriados e aviso prévio salvos com sucesso!', 'success');
        
        // Recalcula status de todas as contas, filtros e contadores da sidebar
        await this.loadData();
      });

      // Restaurar Parâmetros Padrão de Feriados e Aviso Prévio
      document.getElementById('btn-reset-holiday-params')?.addEventListener('click', async () => {
        if (confirm('Deseja restaurar os parâmetros de feriados e aviso prévio para os padrões cartorários (2 dias úteis)?')) {
          const defaults = await window.StorageService.resetHolidayParams();
          window.AppConfig.utils.reloadHolidays();
          window.UIManager.renderHolidayParams(defaults);
          window.UIManager.showToast('Parâmetros restaurados com sucesso!', 'success');
          await this.loadData();
        }
      });

      // Simulador de Vencimento Efetivo e Início de Aviso Prévio
      const runHolidaySimulation = () => {
        const dateInput = document.getElementById('sim-date-input');
        const val = dateInput?.value;
        if (!val) {
          window.UIManager.showToast('Selecione uma data para simular o cálculo.', 'warning');
          return;
        }

        const advanceDays = parseInt(document.getElementById('param-alert-business-days')?.value, 10) || 2;
        const today = window.BillService.getTodayNormalized();
        const todayISO = window.AppConfig.utils.toISODateString(today);

        const nominalDate = new Date(val + 'T00:00:00');
        const nominalFormatted = window.AppConfig.utils.formatDate(val);
        const nominalDayName = window.AppConfig.utils.getDayOfWeekName(nominalDate);
        const isBusiness = window.AppConfig.utils.isBusinessDay(val);
        const holiday = window.AppConfig.utils.isHoliday(val);
        const holTypeMeta = holiday && window.AppConfig.HOLIDAY_TYPES ? window.AppConfig.HOLIDAY_TYPES[holiday.type] : null;

        const effectiveDue = window.AppConfig.utils.getEffectiveBusinessDueDate(val);
        const effectiveISO = window.AppConfig.utils.toISODateString(effectiveDue);
        const effectiveFormatted = window.AppConfig.utils.formatDate(effectiveISO);
        const effectiveDayName = window.AppConfig.utils.getDayOfWeekName(effectiveDue);
        const isProrogated = effectiveISO !== val;

        // Data em que o aviso começará a ser exibido (N dias úteis antes do vencimento efetivo)
        let alertStartDate = new Date(effectiveDue);
        let subtracted = 0;
        let maxLoop = 60;
        while (subtracted < advanceDays && maxLoop > 0) {
          alertStartDate.setDate(alertStartDate.getDate() - 1);
          if (window.AppConfig.utils.isBusinessDay(alertStartDate)) {
            subtracted++;
          }
          maxLoop--;
        }
        const alertStartISO = window.AppConfig.utils.toISODateString(alertStartDate);
        const alertStartFormatted = window.AppConfig.utils.formatDate(alertStartISO);
        const alertStartDayName = window.AppConfig.utils.getDayOfWeekName(alertStartDate);

        const isAlertActiveToday = todayISO >= alertStartISO && todayISO <= effectiveISO;
        let alertStatusText = '';
        if (todayISO > effectiveISO) {
          alertStatusText = 'Vencimento já ultrapassado perante a data de hoje.';
        } else if (todayISO < alertStartISO) {
          const diffToAlert = window.AppConfig.utils.getBusinessDaysDiff(todayISO, alertStartISO);
          alertStatusText = `Aviso entrará em vigor em ${diffToAlert} dia(s) útil(eis).`;
        } else {
          alertStatusText = 'Aviso atualmente ATIVO no painel!';
        }

        window.UIManager.renderHolidaySimulation({
          nominalDate,
          nominalISO: val,
          nominalFormatted,
          nominalDayName,
          isBusinessDay: isBusiness,
          holiday,
          holidayTypeName: holTypeMeta ? holTypeMeta.label : (holiday ? holiday.type : ''),
          effectiveDue,
          effectiveISO,
          effectiveFormatted,
          effectiveDayName,
          isProrogated,
          advanceDays,
          alertStartDate,
          alertStartISO,
          alertStartFormatted,
          alertStartDayName,
          isAlertActiveToday,
          alertStatusText
        });
      };

      document.getElementById('btn-run-holiday-sim')?.addEventListener('click', runHolidaySimulation);
      document.getElementById('sim-date-input')?.addEventListener('change', runHolidaySimulation);

      document.getElementById('holiday-filter-year')?.addEventListener('change', async () => {
        await loadAndRenderHolidays();
      });

      document.getElementById('holiday-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dateInput = document.getElementById('holiday-date');
        const nameInput = document.getElementById('holiday-name');
        const typeInput = document.getElementById('holiday-type');

        const date = dateInput.value;
        const name = nameInput.value.trim();
        const type = typeInput.value;

        if (!date || !name) {
          window.UIManager.showToast('Preencha a data e a descrição do feriado.', 'warning');
          return;
        }

        await window.StorageService.saveHoliday({ date, name, type });
        window.UIManager.showToast(`Feriado "${name}" cadastrado com sucesso!`, 'success');
        nameInput.value = '';
        await loadAndRenderHolidays();
        this.updateAdminSidebarBadges();
        // Recalcula alerta diário e filtros pois a data útil pode ter mudado
        this.applyFiltersAndRender();
      });

      document.getElementById('holidays-table-body')?.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.btn-delete-holiday');
        if (deleteBtn) {
          const holId = deleteBtn.dataset.holidayId;
          const holName = deleteBtn.dataset.holidayName || 'este feriado';
          if (confirm(`Deseja remover o feriado "${holName}"?`)) {
            await window.StorageService.deleteHoliday(holId);
            window.UIManager.showToast('Feriado removido com sucesso!', 'success');
            await loadAndRenderHolidays();
            this.updateAdminSidebarBadges();
            this.applyFiltersAndRender();
          }
        }
      });

      document.getElementById('btn-reset-default-holidays')?.addEventListener('click', async () => {
        const yearSelect = document.getElementById('holiday-filter-year');
        const year = yearSelect ? yearSelect.value : null;
        if (confirm('Deseja restaurar os feriados oficiais padrão de São José dos Campos e do Brasil?')) {
          await window.StorageService.resetDefaultHolidays(year);
          window.UIManager.showToast('Feriados oficiais padrão restaurados com sucesso!', 'success');
          await loadAndRenderHolidays();
          this.updateAdminSidebarBadges();
          this.applyFiltersAndRender();
        }
      });

      // =========================================================================
      // EVENTOS: 3. GERENCIADOR DE DESPESAS FIXAS (EXCLUSIVO PARA CONTAS FIXAS)
      // =========================================================================
      document.getElementById('sidebar-btn-expense-manager')?.addEventListener('click', async () => {
        window.UIManager.populateSelectOptions();
        const recurringBills = await window.StorageService.getRecurringBills();
        window.UIManager.renderExpenseFixedBills(recurringBills);
        window.UIManager.openExpenseManagerModal();
      });

      document.getElementById('btn-close-expense-manager-modal')?.addEventListener('click', () => {
        window.UIManager.closeExpenseManagerModal();
      });
      document.getElementById('btn-close-expense-manager-modal-bottom')?.addEventListener('click', () => {
        window.UIManager.closeExpenseManagerModal();
      });
      document.getElementById('expense-manager-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'expense-manager-modal') {
          window.UIManager.closeExpenseManagerModal();
        }
      });

      // =========================================================================
      // EVENTOS: 4. GERENCIAR CATEGORIAS DE DESPESAS (LISTA E FORMULÁRIO)
      // =========================================================================
      document.getElementById('sidebar-btn-manage-categories')?.addEventListener('click', async () => {
        window.UIManager.populateSelectOptions();
        const categories = await window.StorageService.getCategories();
        window.UIManager.renderExpenseCategories(categories, this.allBills);
        window.UIManager.openCategoriesModal();
      });

      document.getElementById('btn-close-categories-modal')?.addEventListener('click', () => {
        window.UIManager.closeCategoriesModal();
      });
      document.getElementById('btn-close-categories-modal-bottom')?.addEventListener('click', () => {
        window.UIManager.closeCategoriesModal();
      });
      document.getElementById('categories-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'categories-modal') {
          window.UIManager.closeCategoriesModal();
        }
      });

      // Mudança de Cor no formulário de categoria
      const catColorInput = document.getElementById('cat-color');
      const catColorHex = document.getElementById('cat-color-hex');
      if (catColorInput && catColorHex) {
        catColorInput.addEventListener('input', (e) => {
          catColorHex.textContent = e.target.value;
        });
      }

      // Cancelar edição no form de categoria
      document.getElementById('btn-cancel-cat-form')?.addEventListener('click', () => {
        window.UIManager.resetCategoryForm();
      });

      // Botão de Nova Categoria na barra de ações
      document.getElementById('btn-focus-new-cat')?.addEventListener('click', () => {
        window.UIManager.resetCategoryForm();
        document.getElementById('cat-name')?.focus();
      });

      // Restaurar Categorias Padrão
      document.getElementById('btn-reset-categories-default')?.addEventListener('click', async () => {
        if (confirm('Deseja restaurar as categorias padrão do sistema cartorário? Categorias customizadas serão redefinidas para os padrões institucionais.')) {
          const defaults = await window.StorageService.resetDefaultCategories();
          window.UIManager.resetCategoryForm();
          window.UIManager.populateSelectOptions();
          window.UIManager.renderExpenseCategories(defaults, this.allBills);
          await this.updateAdminSidebarBadges();
          await this.loadData();
          window.UIManager.showToast('Categorias padrão restauradas com sucesso!', 'success');
        }
      });

      // Submissão do Formulário de Categoria (Criar ou Editar)
      document.getElementById('category-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('cat-id');
        const nameInput = document.getElementById('cat-name');
        const iconInput = document.getElementById('cat-icon');
        const colorInput = document.getElementById('cat-color');

        const existingId = idInput?.value ? idInput.value.trim() : '';
        const label = nameInput.value.trim();
        const icon = iconInput.value;
        const color = colorInput.value;

        if (!label) {
          window.UIManager.showToast('Informe o nome da categoria.', 'warning');
          return;
        }

        const isEditing = Boolean(existingId);
        const catId = existingId || ('cat_' + label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_'));

        await window.StorageService.saveCategory({ id: catId, label, icon, color });
        window.UIManager.showToast(isEditing ? `Categoria "${label}" atualizada com sucesso!` : `Categoria "${label}" adicionada com sucesso!`, 'success');
        
        window.UIManager.resetCategoryForm();
        window.UIManager.populateSelectOptions();
        const categories = await window.StorageService.getCategories();
        window.UIManager.renderExpenseCategories(categories, this.allBills);
        await this.updateAdminSidebarBadges();
        this.applyFiltersAndRender();
      });

      // Ações na Lista de Categorias (Editar e Excluir)
      const handleCategoryAction = async (e) => {
        // Editar Categoria
        const editBtn = e.target.closest('.btn-edit-category');
        if (editBtn) {
          const catId = editBtn.dataset.catId;
          const categories = await window.StorageService.getCategories();
          const cat = categories[catId] || {
            id: catId,
            label: editBtn.dataset.catLabel,
            icon: editBtn.dataset.catIcon,
            color: editBtn.dataset.catColor
          };
          window.UIManager.fillCategoryForm(cat);
          return;
        }

        // Excluir Categoria
        const deleteBtn = e.target.closest('.btn-delete-category');
        if (deleteBtn) {
          const catId = deleteBtn.dataset.catId;
          const catLabel = deleteBtn.dataset.catLabel || 'esta categoria';
          const billsCount = parseInt(deleteBtn.dataset.billsCount, 10) || 0;

          const confirmMsg = billsCount > 0
            ? `Deseja realmente excluir a categoria "${catLabel}"?\n\nExistem ${billsCount} conta(s) vinculada(s) a ela. Ao confirmar, essas contas serão reclassificadas automaticamente para "Outras Despesas".`
            : `Deseja realmente excluir a categoria "${catLabel}"?`;

          if (confirm(confirmMsg)) {
            const success = await window.StorageService.deleteCategory(catId);
            if (success) {
              window.UIManager.showToast(`Categoria "${catLabel}" removida com sucesso!`, 'success');
              window.UIManager.resetCategoryForm();
              window.UIManager.populateSelectOptions();
              await this.loadData();
              const categories = await window.StorageService.getCategories();
              window.UIManager.renderExpenseCategories(categories, this.allBills);
              await this.updateAdminSidebarBadges();
            } else {
              window.UIManager.showToast('Não foi possível remover a categoria selecionada.', 'error');
            }
          }
        }
      };

      document.getElementById('categories-table-body')?.addEventListener('click', handleCategoryAction);
      document.getElementById('categories-table')?.addEventListener('click', handleCategoryAction);
      document.getElementById('categories-grid')?.addEventListener('click', handleCategoryAction);

      // =========================================================================
      // GESTÃO DE DESPESAS RECORRENTES (REPOSITÓRIO PERMANENTE)
      // =========================================================================
      // Botão para abrir formulário de inclusão de despesa recorrente
      document.getElementById('btn-open-recurring-form')?.addEventListener('click', () => {
        window.UIManager.openRecurringForm();
      });

      document.getElementById('btn-close-recurring-form')?.addEventListener('click', () => {
        window.UIManager.closeRecurringForm();
      });

      document.getElementById('btn-cancel-recurring-form')?.addEventListener('click', () => {
        window.UIManager.closeRecurringForm();
      });

      // Submissão do formulário de Despesa Recorrente
      document.getElementById('recurring-bill-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('recurring-bill-id').value;
        const description = document.getElementById('recurring-description').value.trim();
        const amount = parseFloat(document.getElementById('recurring-amount').value) || 0;
        const dueDay = parseInt(document.getElementById('recurring-due-day').value, 10) || 1;
        const location = document.getElementById('recurring-location').value;
        const category = document.getElementById('recurring-category').value;
        const paymentMethod = document.getElementById('recurring-payment-method').value;
        const notes = document.getElementById('recurring-notes').value.trim();

        if (!description) {
          window.UIManager.showToast('Informe a descrição da despesa recorrente.', 'warning');
          return;
        }

        if (amount <= 0) {
          window.UIManager.showToast('Informe um valor válido maior que zero.', 'warning');
          return;
        }

        await window.StorageService.saveRecurringBill({
          id,
          description,
          amount,
          dueDay,
          location,
          category,
          paymentMethod,
          notes
        });

        window.UIManager.showToast(
          id ? `Despesa "${description}" atualizada no repositório!` : `Despesa "${description}" salva com sucesso no repositório!`,
          'success'
        );

        window.UIManager.closeRecurringForm();
        const updatedRecurring = await window.StorageService.getRecurringBills();
        window.UIManager.renderExpenseFixedBills(updatedRecurring);
        this.updateAdminSidebarBadges();
      });

      // Ações na Tabela de Despesas Recorrentes (Editar, Lançar no Mês, Excluir)
      document.getElementById('fixed-bills-table-body')?.addEventListener('click', async (e) => {
        const triggerBtn = e.target.closest('.btn-trigger-new-recurring');
        const editBtn = e.target.closest('.btn-edit-recurring-bill');
        const launchBtn = e.target.closest('.btn-launch-single-recurring');
        const deleteBtn = e.target.closest('.btn-delete-recurring-bill');

        if (triggerBtn) {
          window.UIManager.openRecurringForm();
          return;
        }

        if (editBtn) {
          const recId = editBtn.dataset.recurringId;
          const recurringBills = await window.StorageService.getRecurringBills();
          const rec = recurringBills.find((r) => r.id === recId);
          if (rec) {
            window.UIManager.openRecurringForm(rec);
          }
          return;
        }

        if (launchBtn) {
          const recId = launchBtn.dataset.recurringId;
          const year = this.activeFilters.selectedYear !== undefined ? Number(this.activeFilters.selectedYear) : new Date().getFullYear();
          const month = this.activeFilters.selectedMonth !== undefined ? Number(this.activeFilters.selectedMonth) : new Date().getMonth();
          const monthName = (window.AppConfig.MONTH_NAMES && window.AppConfig.MONTH_NAMES[month]) || 'Mês';

          try {
            const newBill = await window.StorageService.launchRecurringBillToMonth(recId, year, month);
            window.UIManager.showToast(`Despesa "${newBill.description}" lançada em ${monthName}/${year}!`, 'success');
            await this.loadData();
          } catch (err) {
            console.error('Erro ao lançar despesa recorrente:', err);
            window.UIManager.showToast('Erro ao lançar despesa no mês.', 'error');
          }
          return;
        }

        if (deleteBtn) {
          const recId = deleteBtn.dataset.recurringId;
          const recName = deleteBtn.dataset.recurringName || 'esta despesa';
          if (confirm(`Tem certeza de que deseja remover a despesa recorrente "${recName}" deste repositório?`)) {
            await window.StorageService.deleteRecurringBill(recId);
            window.UIManager.showToast(`Despesa recorrente "${recName}" removida do repositório.`, 'info');
            const updatedRecurring = await window.StorageService.getRecurringBills();
            window.UIManager.renderExpenseFixedBills(updatedRecurring);
            this.updateAdminSidebarBadges();
          }
          return;
        }
      });

      // Botão Lançar Todas no Mês Atual
      document.getElementById('btn-launch-all-recurring')?.addEventListener('click', async () => {
        const year = this.activeFilters.selectedYear !== undefined ? Number(this.activeFilters.selectedYear) : new Date().getFullYear();
        const month = this.activeFilters.selectedMonth !== undefined ? Number(this.activeFilters.selectedMonth) : new Date().getMonth();
        const monthName = (window.AppConfig.MONTH_NAMES && window.AppConfig.MONTH_NAMES[month]) || 'Mês';

        const result = await window.StorageService.launchAllRecurringToMonth(year, month);
        if (result.created.length > 0) {
          window.UIManager.showToast(`${result.created.length} despesa(s) recorrente(s) lançada(s) em ${monthName}/${year}!`, 'success');
          await this.loadData();
        } else if (result.skipped.length > 0) {
          window.UIManager.showToast(`As despesas recorrentes do repositório já constam lançadas em ${monthName}/${year}.`, 'info');
        } else {
          window.UIManager.showToast('Nenhuma despesa recorrente cadastrada no repositório.', 'warning');
        }
      });

      // Submissão de Parâmetros Orçamentários
      document.getElementById('budget-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const monthlyBudget = parseFloat(document.getElementById('budget-monthly-amount').value) || 8000;
        const alertThreshold = parseInt(document.getElementById('budget-alert-threshold').value, 10) || 80;

        await window.StorageService.saveBudgetSettings({ monthlyBudget, alertThreshold });
        window.UIManager.showToast('Parâmetros de orçamento salvos com sucesso!', 'success');

        const currentYear = this.activeFilters.selectedYear || new Date().getFullYear();
        const currentMonth = this.activeFilters.selectedMonth !== undefined ? this.activeFilters.selectedMonth : new Date().getMonth();
        const monthBills = window.BillService.getMonthBills(this.allBills, currentYear, currentMonth);
        const currentMonthTotal = monthBills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
        window.UIManager.renderExpenseBudget({ monthlyBudget, alertThreshold }, currentMonthTotal);
      });
    }

    /**
     * Trata o envio do formulário de criação/edição
     */
    async handleFormSubmit() {
      const id = document.getElementById('bill-id').value;
      const description = document.getElementById('bill-description').value.trim();
      const location = document.getElementById('bill-location')?.value || 'LD';
      const expenseType = document.getElementById('bill-expense-type')?.value || 'fixa';
      const rawAmount = document.getElementById('bill-amount').value;
      let amount = parseFloat(rawAmount);
      if (isNaN(amount) && typeof rawAmount === 'string') {
        const clean = rawAmount.replace(/\./g, '').replace(',', '.');
        amount = parseFloat(clean);
      }
      const dueDate = document.getElementById('bill-due-date').value;
      const category = document.getElementById('bill-category')?.value || 'outros';
      const paymentMethod = document.getElementById('bill-payment-method')?.value || 'pix';
      const invoiceNumber = document.getElementById('bill-invoice-number')?.value.trim() || '';
      const documentNumber = document.getElementById('bill-document-number')?.value.trim() || '';
      const status = document.getElementById('bill-status')?.value || 'pendente';
      const paymentDate = document.getElementById('bill-payment-date')?.value || null;
      const notes = document.getElementById('bill-notes')?.value.trim() || '';

      if (!description) {
        window.UIManager.showToast('Por favor, informe a descrição da conta.', 'warning');
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        window.UIManager.showToast('Por favor, informe um valor monetário válido maior que zero.', 'warning');
        return;
      }

      if (!dueDate) {
        window.UIManager.showToast('Por favor, selecione a data de vencimento.', 'warning');
        return;
      }

      let finalStatus = status;
      let finalPaymentDate = paymentDate;

      if (finalPaymentDate) {
        finalStatus = 'pago';
      } else if (finalStatus === 'pago') {
        finalPaymentDate = window.AppConfig.utils.toISODateString();
      }

      const dueDay = dueDate && dueDate.includes('-') ? parseInt(dueDate.split('-')[2], 10) : 1;

      const billData = {
        description,
        location,
        expenseType,
        dueDay,
        invoiceNumber,
        documentNumber,
        amount,
        dueDate,
        category,
        paymentMethod,
        status: finalStatus,
        paymentDate: finalPaymentDate,
        notes
      };

      try {
        if (id) {
          await window.StorageService.update(id, billData);
          window.UIManager.showToast(`Despesa "${description}" atualizada com sucesso!`, 'success');
        } else {
          await window.StorageService.create(billData);
          window.UIManager.showToast(`Nova despesa "${description}" cadastrada!`, 'success');
        }

        window.UIManager.closeBillModal();
        await this.loadData();
      } catch (err) {
        console.error('Falha ao salvar conta:', err);
        window.UIManager.showToast('Erro ao gravar os dados. Verifique o console.', 'error');
      }
    }

    /**
     * Converte data digitada manualmente no formato DD/MM/AAAA para formato ISO (YYYY-MM-DD)
     * @param {string} str
     * @returns {string|null}
     */
    parseBrazilianDateToISO(str) {
      if (!str) return null;
      const clean = str.trim();
      const parts = clean.split('/');
      if (parts.length !== 3) return null;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
      if (year < 1900 || year > 2100) return null;
      if (month < 1 || month > 12) return null;
      const daysInMonth = new Date(year, month, 0).getDate();
      if (day < 1 || day > daysInMonth) return null;
      const pad = (n) => String(n).padStart(2, '0');
      return `${year}-${pad(month)}-${pad(day)}`;
    }

    /**
     * Atualiza a data de pagamento diretamente pela coluna da tabela ou card
     * O usuário pode digitar livremente pelo teclado ou escolher no calendário
     * @param {string} id
     * @param {string|null} newDate
     */
    async handleInlinePaymentDateChange(id, newDate) {
      const bill = this.allBills.find((b) => b.id === id);
      if (!bill) return;

      try {
        if (newDate) {
          // Salva a data exata informada pelo usuário e garante status pago
          await window.StorageService.update(id, {
            status: 'pago',
            paymentDate: newDate
          });
          window.UIManager.showToast(`Data de pagamento de "${bill.description}" definida para ${window.AppConfig.utils.formatDate(newDate)}!`, 'success');
        } else {
          await window.StorageService.update(id, {
            status: 'pendente',
            paymentDate: null
          });
          window.UIManager.showToast(`Data de pagamento de "${bill.description}" removida (marcada como Aguardando Pagamento).`, 'info');
        }

        await this.loadData();
      } catch (err) {
        console.error('Falha ao atualizar data de pagamento:', err);
        window.UIManager.showToast('Erro ao atualizar data de pagamento.', 'error');
      }
    }

    /**
     * Altera o status da conta diretamente via dropdown ("Pago" vs "Aguardando Pagamento")
     * Ao colocar pago, sempre preenche automaticamente com a data atual (hoje)
     * @param {string} id
     * @param {'pago' | 'pendente'} newStatus
     */
    async handleInlineStatusChange(id, newStatus) {
      const bill = this.allBills.find((b) => b.id === id);
      if (!bill) return;

      try {
        if (newStatus === 'pago') {
          // Quando colocar pago, sempre preenche com a data atual (hoje)
          const today = window.AppConfig.utils.toISODateString();
          await window.StorageService.update(id, {
            status: 'pago',
            paymentDate: today
          });
          window.UIManager.showToast(`Despesa "${bill.description}" marcada como PAGA com a data de hoje (${window.AppConfig.utils.formatDate(today)})!`, 'success');
        } else {
          await window.StorageService.update(id, {
            status: 'pendente',
            paymentDate: null
          });
          window.UIManager.showToast(`Despesa "${bill.description}" marcada como AGUARDANDO PAGAMENTO.`, 'info');
        }

        await this.loadData();
      } catch (err) {
        console.error('Falha ao atualizar status da conta:', err);
        window.UIManager.showToast('Erro ao atualizar status.', 'error');
      }
    }

    /**
     * Altera o Local da conta diretamente via dropdown ("LD", "REC" ou "SE")
     * @param {string} id
     * @param {'LD' | 'REC' | 'SE'} newLocation
     */
    async handleInlineLocationChange(id, newLocation) {
      const bill = this.allBills.find((b) => b.id === id);
      if (!bill) return;

      try {
        await window.StorageService.update(id, { location: newLocation });
        window.UIManager.showToast(`Local de "${bill.description}" definido para ${newLocation}!`, 'success');
        await this.loadData();
      } catch (err) {
        console.error('Falha ao atualizar local da conta:', err);
        window.UIManager.showToast('Erro ao atualizar local da conta.', 'error');
      }
    }

    /**
     * Altera o Tipo F/V da conta diretamente via seletor (F = Fixa, V = Variável)
     * @param {string} id
     * @param {'fixa' | 'variavel'} newType
     */
    async handleInlineExpenseTypeChange(id, newType) {
      const bill = this.allBills.find((b) => b.id === id);
      if (!bill) return;

      try {
        await window.StorageService.update(id, { expenseType: newType });
        const label = newType === 'fixa' ? 'Fixa (F)' : 'Variável (V)';
        window.UIManager.showToast(`Despesa "${bill.description}" classificada como ${label}!`, 'success');
        await this.loadData();
      } catch (err) {
        console.error('Falha ao atualizar tipo F/V da conta:', err);
        window.UIManager.showToast('Erro ao atualizar classificação da conta.', 'error');
      }
    }

    /**
     * 1-Clique Toggle para Marcar como Pago / Pendente
     * @param {string} id
     */
    async handleQuickPayToggle(id) {
      const bill = this.allBills.find((b) => b.id === id);
      if (!bill) return;

      const isCurrentlyPaid = bill.effectiveStatus === 'pago' || bill.status === 'pago';
      const newStatus = isCurrentlyPaid ? 'pendente' : 'pago';
      const newPaymentDate = isCurrentlyPaid ? null : window.AppConfig.utils.toISODateString();

      try {
        await window.StorageService.update(id, {
          status: newStatus,
          paymentDate: newPaymentDate
        });

        if (isCurrentlyPaid) {
          window.UIManager.showToast(`Conta "${bill.description}" marcada como AGUARDANDO PAGAMENTO.`, 'info');
        } else {
          window.UIManager.showToast(`Conta "${bill.description}" quitada com sucesso!`, 'success');
        }

        await this.loadData();
      } catch (err) {
        console.error('Falha ao alternar pagamento:', err);
        window.UIManager.showToast('Erro ao atualizar status da conta.', 'error');
      }
    }

    /**
     * Abre modal de edição para uma conta existente
     * Enriquece os dados especificamente para o mês de referência selecionado
     * @param {string} id
     */
    async handleEditBill(id) {
      const rawBill = await window.StorageService.getById(id);
      if (!rawBill) return;

      const [enrichedBill] = window.BillService.enrichBills([rawBill]);
      if (enrichedBill) {
        window.UIManager.openBillModal('edit', enrichedBill);
      }
    }

    /**
     * Solicita confirmação de exclusão
     * @param {string} id
     */
    async handlePromptDelete(id) {
      const bill = await window.StorageService.getById(id);
      if (bill) {
        window.UIManager.openDeleteModal(bill);
      }
    }

    /**
     * Confirmação efetiva da exclusão completa
     */
    async handleDeleteConfirm() {
      const bill = window.UIManager.currentBillToDelete;
      if (!bill) return;

      try {
        await window.StorageService.delete(bill.id);
        window.UIManager.closeDeleteModal();
        window.UIManager.showToast(`Conta "${bill.description}" removida com sucesso.`, 'info');
        await this.loadData();
      } catch (err) {
        console.error('Falha ao excluir conta:', err);
        window.UIManager.showToast('Erro ao excluir conta.', 'error');
      }
    }

    /**
     * Gera relatório e visualização PDF de um mês selecionado
     * @param {number} year Ano
     * @param {number} monthIndex Mês (0 a 11)
     * @param {string} monthLabel Rótulo amigável (ex: 'Novembro de 2026')
     */
    handleMonthPDF(year, monthIndex, monthLabel) {
      const monthBills = window.BillService.getMonthBills(this.allBills, year, monthIndex);
      const kpis = window.BillService.calculateKPIs(this.allBills, 'mes', 8000, year, monthIndex);
      window.UIManager.openStatementModal(monthBills, kpis, {
        isMonthReport: true,
        monthLabel: monthLabel,
        year: year,
        monthIndex: monthIndex
      });
    }

    /**
     * Exporta as contas atualmente filtradas / visualizadas na tabela para PDF (A4)
     * Garante que SEMPRE sejam exportadas as informações exatamente como estão filtradas na tela
     */
    handleExportCurrentPDF() {
      const bills = this.filteredBills || [];

      if (bills.length === 0) {
        window.UIManager.showToast('Nenhuma despesa encontrada com os filtros atuais para exportar.', 'warning');
        return;
      }

      const year = this.activeFilters?.selectedYear !== undefined ? this.activeFilters.selectedYear : new Date().getFullYear();
      const monthIndex = this.activeFilters?.selectedMonth !== undefined ? this.activeFilters.selectedMonth : new Date().getMonth();
      const monthName = (window.AppConfig.MONTH_NAMES && window.AppConfig.MONTH_NAMES[monthIndex])
        ? `${window.AppConfig.MONTH_NAMES[monthIndex]} de ${year}`
        : `Mês de Referência (${year})`;

      // Indicadores calculados EXATAMENTE sobre a lista de contas filtradas
      const kpis = window.BillService.calculateKPIsFromList(bills);

      // Descreve os filtros aplicados para constar no cabeçalho do documento PDF
      const filterBadges = [];
      if (this.activeFilters.status !== 'todos') {
        const statusMap = { pago: 'Pagas', pendente: 'Aguardando Pagamento', atrasado: 'Atrasadas' };
        filterBadges.push(statusMap[this.activeFilters.status] || this.activeFilters.status);
      }
      if (this.activeFilters.location !== 'todos') {
        filterBadges.push(`Local ${this.activeFilters.location}`);
      }
      if (this.activeFilters.expenseType !== 'todos') {
        filterBadges.push(this.activeFilters.expenseType === 'fixa' ? 'Fixas' : 'Variáveis');
      }
      if (this.activeFilters.search) {
        filterBadges.push(`Busca: "${this.activeFilters.search}"`);
      }

      const subtitle = filterBadges.length > 0
        ? `${monthName} • Filtro: ${filterBadges.join(' | ')} (${bills.length} contas)`
        : `${monthName} (${bills.length} contas filtradas)`;

      window.UIManager.openStatementModal(bills, kpis, {
        isMonthReport: true,
        monthLabel: subtitle,
        year: year,
        monthIndex: monthIndex
      });
    }

    /**
     * Exporta os lançamentos do mês selecionado diretamente para arquivo Excel
     * @param {number} year Ano
     * @param {number} monthIndex Mês (0 a 11)
     * @param {string} monthLabel Rótulo amigável (ex: 'Novembro de 2026')
     */
    handleMonthExcel(year, monthIndex, monthLabel) {
      window.ExportService.exportMonthToExcel(this.allBills, year, monthIndex, monthLabel);
    }

    /**
     * Atualiza a tabela de despesas em modo SOMENTE VISUALIZAÇÃO do mês selecionado em view-relatorios
     * Traz todas as despesas daquele mês de modo que o usuário consiga apenas visualizar, sem fazer alterações
     */
    updateReportSelectedMonthView() {
      const select = document.getElementById('select-report-month');
      if (!select) return;

      let year, monthIndex, monthLabel;
      if (select.value) {
        const [yearStr, monthStr] = select.value.split('-');
        year = parseInt(yearStr, 10);
        monthIndex = parseInt(monthStr, 10);
        monthLabel = select.options[select.selectedIndex]?.textContent || `${window.AppConfig.MONTH_NAMES[monthIndex]} de ${year}`;
      } else {
        const now = new Date();
        year = this.activeFilters?.selectedYear !== undefined ? Number(this.activeFilters.selectedYear) : now.getFullYear();
        monthIndex = this.activeFilters?.selectedMonth !== undefined ? Number(this.activeFilters.selectedMonth) : now.getMonth();
        monthLabel = `${window.AppConfig.MONTH_NAMES[monthIndex]} de ${year}`;
      }

      const monthBills = window.BillService.getMonthBills(this.allBills, year, monthIndex);
      window.UIManager.renderSelectedMonthBills(monthBills, year, monthIndex, monthLabel);
    }

    /**
     * Filtra apenas contas urgentes (atrasadas ou vencendo hoje)
     */
    filterUrgentOnly() {
      // Muda período para todos para não esconder atrasadas de outros meses
      this.activeFilters.period = 'todos';
      this.activeFilters.status = 'atrasado';

      const filterStatusSelect = document.getElementById('filter-status-select');
      if (filterStatusSelect) filterStatusSelect.value = 'atrasado';

      // Atualiza botões visuais de período
      document.querySelectorAll('.btn-period-filter').forEach((btn) => {
        if (btn.dataset.period === 'todos') {
          btn.classList.add('bg-emerald-600', 'text-white', 'shadow-xs');
          btn.classList.remove('text-slate-600', 'dark:text-slate-400');
        } else {
          btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-xs', 'shadow-sm');
          btn.classList.add('text-slate-600', 'dark:text-slate-400');
        }
      });

      this.applyFiltersAndRender();

      // Scroll suave até a tabela
      const tableSection = document.getElementById('bills-table-section');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth' });
      }
    }

    /**
     * Reseta todos os filtros para o padrão
     */
    /**
     * Reseta filtros mantendo apenas os parâmetros especificados (ex: { location: 'LD' })
     * @param {Object} overrides
     */
    resetFiltersKeep(overrides = {}) {
      const now = new Date();
      this.activeFilters = {
        period: overrides.period !== undefined ? overrides.period : 'mes',
        status: overrides.status !== undefined ? overrides.status : 'todos',
        location: overrides.location !== undefined ? overrides.location : 'todos',
        expenseType: overrides.expenseType !== undefined ? overrides.expenseType : 'todos',
        category: overrides.category !== undefined ? overrides.category : 'todos',
        paymentMethod: overrides.paymentMethod !== undefined ? overrides.paymentMethod : 'todos',
        invoiceStatus: overrides.invoiceStatus !== undefined ? overrides.invoiceStatus : 'todos',
        search: '',
        customStart: null,
        customEnd: null,
        sortBy: 'dueDate_asc',
        selectedYear: this.activeFilters?.selectedYear !== undefined ? this.activeFilters.selectedYear : now.getFullYear(),
        selectedMonth: this.activeFilters?.selectedMonth !== undefined ? this.activeFilters.selectedMonth : now.getMonth(),
        ...overrides
      };

      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = '';

      const filterStatusSelect = document.getElementById('filter-status-select');
      if (filterStatusSelect) filterStatusSelect.value = this.activeFilters.status;

      const filterLocSelect = document.getElementById('filter-location-select');
      if (filterLocSelect) filterLocSelect.value = this.activeFilters.location;

      const sortBy = document.getElementById('sort-by');
      if (sortBy) sortBy.value = 'dueDate_asc';

      document.querySelectorAll('.btn-period-filter').forEach((btn) => {
        const isSelected = btn.dataset.period === this.activeFilters.period;
        btn.classList.toggle('bg-emerald-600', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('shadow-xs', isSelected);
        btn.classList.toggle('text-slate-600', !isSelected);
      });

      this.applyFiltersAndRender();
    }

    /**
     * Reseta todos os filtros para o padrão
     */
    resetFilters() {
      this.resetFiltersKeep({});
    }

    /**
     * Renderiza o popover suspenso de notificações ao clicar no sino
     */
    renderNotificationPopover() {
      const container = document.getElementById('notification-popover-list');
      if (!container) return;

      const urgentBills = window.BillService.getUrgentBills(this.allBills);

      if (urgentBills.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-slate-400 text-xs">
            <i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2 text-emerald-500/80"></i>
            Tudo em dia! Nenhuma conta atrasada ou vencendo hoje.
          </div>
        `;
      } else {
        container.innerHTML = urgentBills
          .map((b) => {
            const isOverdue = b.effectiveStatus === 'atrasado';
            return `
              <div class="p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-amber-500'}"></span>
                    <span class="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">${b.description}</span>
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ${window.AppConfig.utils.formatBRL(b.amount)} • ${b.relativeDate.text}
                  </div>
                </div>
                <button
                  type="button"
                  class="btn-toggle-paid px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shrink-0"
                  data-id="${b.id}"
                >
                  Pagar
                </button>
              </div>
            `;
          })
          .join('');
      }

      if (window.lucide) window.lucide.createIcons();
    }
  }

  window.App = new AppController();

  // Inicialização quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
  });
})(window);
