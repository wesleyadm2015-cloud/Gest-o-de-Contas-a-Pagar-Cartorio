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
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
      window.UIManager.init();
      window.UIManager.populateSelectOptions();
      this.bindEvents();
      await this.loadData(true);
    }

    /**
     * Carrega os dados do Storage e atualiza a UI
     * @param {boolean} isInitial Se é a carga inicial da página
     */
    async loadData(isInitial = false) {
      try {
        this.allBills = await window.StorageService.getAll();
        this.applyFiltersAndRender();
        if (isInitial) {
          this.checkDailyAlertPopup();
        }
      } catch (err) {
        console.error('Falha ao carregar contas:', err);
        window.UIManager.showToast('Erro ao carregar dados do armazenamento.', 'error');
      }
    }

    /**
     * Verifica se é o primeiro acesso do dia e exibe o popup automático de contas
     * que vencem com até 2 dias úteis de antecedência
     */
    checkDailyAlertPopup() {
      const todayISO = window.AppConfig.utils.toISODateString();
      const lastSeenDate = localStorage.getItem('contadiaria_last_daily_popup_date');

      if (lastSeenDate !== todayISO) {
        const upcomingBills = window.BillService.getBillsDueInBusinessDays(this.allBills, 2);
        const overdueBills = window.BillService.getOverdueBills(this.allBills);

        // Se houver contas a vencer nos próximos 2 dias úteis (ou atrasadas)
        if (upcomingBills.length > 0 || overdueBills.length > 0) {
          // Marca no LocalStorage para não exibir novamente hoje em refreshs automáticos
          localStorage.setItem('contadiaria_last_daily_popup_date', todayISO);
          // Abre o popup de forma suave
          setTimeout(() => {
            window.UIManager.openDailyAlertModal(upcomingBills, overdueBills);
          }, 350);
        }
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

      // 5. Atualiza Relatórios e Gráficos
      const categoryData = window.BillService.getCategoryBreakdown(this.filteredBills.length > 0 ? this.filteredBills : this.allBills);
      window.UIManager.renderCategoryReport(categoryData);

      if (window.ChartService) {
        window.ChartService.renderCategoryChart('chart-categories', categoryData);
        window.ChartService.renderStatusChart('chart-status', kpis);
      }

      // 6. Atualiza dados da Sidebar Lateral Esquerda e Relatórios Adicionais
      window.UIManager.updateSidebarBadges(this.allBills);
      window.UIManager.renderMonthlyReport(window.BillService.getMonthlyBreakdown(this.allBills));
      window.UIManager.renderTopBillsReport(window.BillService.getTopBills(this.allBills, 5));

      // 7. Atualiza popover de notificações
      this.renderNotificationPopover();

      // 8. Garante renderização dos ícones Lucide
      if (window.lucide) {
        window.lucide.createIcons();
      }
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
        tabContasBtn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
        tabContasBtn.classList.remove('text-slate-500', 'dark:text-slate-400');

        tabRelatoriosBtn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
        tabRelatoriosBtn.classList.add('text-slate-500', 'dark:text-slate-400');

        viewContas.classList.remove('hidden');
        viewRelatorios.classList.add('hidden');
      } else {
        tabRelatoriosBtn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
        tabRelatoriosBtn.classList.remove('text-slate-500', 'dark:text-slate-400');

        tabContasBtn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-sm');
        tabContasBtn.classList.add('text-slate-500', 'dark:text-slate-400');

        viewContas.classList.add('hidden');
        viewRelatorios.classList.remove('hidden');

        // Atualiza relatórios analíticos extras
        window.UIManager.renderMonthlyReport(window.BillService.getMonthlyBreakdown(this.allBills));
        window.UIManager.renderTopBillsReport(window.BillService.getTopBills(this.allBills, 5));

        // Atualiza tamanho dos gráficos
        setTimeout(() => {
          if (window.ChartService) {
            window.ChartService.refreshTheme();
          }
        }, 50);
      }
    }

    /**
     * Vincula todos os ouvintes de eventos da página
     */
    bindEvents() {
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

      // Filtro de Status do Pagamento (Pills e Dropdown sincronizados)
      const statusSelect = document.getElementById('filter-status-select');
      const statusButtons = document.querySelectorAll('.btn-status-filter');
      
      const updateStatusUI = (statusVal) => {
        this.activeFilters.status = statusVal;
        if (statusSelect && statusSelect.value !== statusVal) {
          statusSelect.value = statusVal;
        }
        statusButtons.forEach((b) => {
          const isActive = b.dataset.status === statusVal;
          b.classList.toggle('border-emerald-600', isActive);
          b.classList.toggle('text-emerald-600', isActive);
          b.classList.toggle('dark:text-emerald-400', isActive);
          b.classList.toggle('font-semibold', isActive);
          b.classList.toggle('bg-emerald-50/70', isActive);
          b.classList.toggle('dark:bg-emerald-950/30', isActive);
          b.classList.toggle('text-slate-500', !isActive);
          b.classList.toggle('dark:text-slate-400', !isActive);
          b.classList.toggle('border-transparent', !isActive);
        });
      };

      statusButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          updateStatusUI(e.currentTarget.dataset.status);
          this.applyFiltersAndRender();
        });
      });

      statusSelect?.addEventListener('change', (e) => {
        updateStatusUI(e.target.value);
        this.applyFiltersAndRender();
      });

      // Filtro por Local (LD, REC, SE) (Pills e Dropdown sincronizados)
      const locationSelect = document.getElementById('filter-location-select');
      const locationButtons = document.querySelectorAll('.btn-location-pill');

      const updateLocationUI = (locVal) => {
        this.activeFilters.location = locVal;
        if (locationSelect && locationSelect.value !== locVal) {
          locationSelect.value = locVal;
        }
        locationButtons.forEach((b) => {
          const isActive = b.dataset.location === locVal;
          b.classList.toggle('border-emerald-600', isActive);
          b.classList.toggle('text-emerald-600', isActive);
          b.classList.toggle('dark:text-emerald-400', isActive);
          b.classList.toggle('font-bold', isActive);
          b.classList.toggle('bg-emerald-50/70', isActive);
          b.classList.toggle('dark:bg-emerald-950/30', isActive);
          b.classList.toggle('text-slate-500', !isActive);
          b.classList.toggle('dark:text-slate-400', !isActive);
          b.classList.toggle('border-transparent', !isActive);
        });
      };

      locationButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          updateLocationUI(e.currentTarget.dataset.location);
          this.applyFiltersAndRender();
        });
      });

      locationSelect?.addEventListener('change', (e) => {
        updateLocationUI(e.target.value);
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
      // EVENTOS DA SIDEBAR LATERAL ESQUERDA (GERENCIAMENTO & RELATÓRIOS)
      // =========================================================================
      const updateActiveSidebarBtn = (activeBtn) => {
        document.querySelectorAll('.sidebar-nav-item').forEach((btn) => {
          btn.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');
      };

      // 1. Botão + Nova Despesa na Sidebar
      document.getElementById('sidebar-btn-new-bill')?.addEventListener('click', () => {
        window.UIManager.openBillModal('create');
      });

      // 2. Gerenciamento: Todas as Contas
      document.getElementById('sidebar-nav-all')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.resetFilters();
      });

      // 3. Gerenciamento: Aguardando Pagamento
      document.getElementById('sidebar-nav-pending')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.activeFilters.status = 'pendente';
        this.activeFilters.period = 'todos';
        const filterStatusSelect = document.getElementById('filter-status-select');
        if (filterStatusSelect) filterStatusSelect.value = 'pendente';
        document.querySelectorAll('.btn-status-filter').forEach((b) => {
          const isPending = b.dataset.status === 'pendente';
          b.classList.toggle('border-emerald-600', isPending);
          b.classList.toggle('text-emerald-600', isPending);
          b.classList.toggle('dark:text-emerald-400', isPending);
          b.classList.toggle('font-semibold', isPending);
          b.classList.toggle('bg-emerald-50/70', isPending);
          b.classList.toggle('dark:bg-emerald-950/30', isPending);
          b.classList.toggle('border-transparent', !isPending);
          b.classList.toggle('text-slate-500', !isPending);
        });
        this.applyFiltersAndRender();
      });

      // 4. Gerenciamento: Vencidas / Urgentes
      document.getElementById('sidebar-nav-overdue')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.filterUrgentOnly();
      });

      // 5. Gerenciamento: Pagas / Quitações
      document.getElementById('sidebar-nav-paid')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('contas');
        this.activeFilters.status = 'pago';
        this.activeFilters.period = 'todos';
        const filterStatusSelect = document.getElementById('filter-status-select');
        if (filterStatusSelect) filterStatusSelect.value = 'pago';
        document.querySelectorAll('.btn-status-filter').forEach((b) => {
          const isPaid = b.dataset.status === 'pago';
          b.classList.toggle('border-emerald-600', isPaid);
          b.classList.toggle('text-emerald-600', isPaid);
          b.classList.toggle('dark:text-emerald-400', isPaid);
          b.classList.toggle('font-semibold', isPaid);
          b.classList.toggle('bg-emerald-50/70', isPaid);
          b.classList.toggle('dark:bg-emerald-950/30', isPaid);
          b.classList.toggle('border-transparent', !isPaid);
          b.classList.toggle('text-slate-500', !isPaid);
        });
        this.applyFiltersAndRender();
      });

      // 6. Relatórios: Painel Geral & Gráficos
      document.getElementById('sidebar-report-overview')?.addEventListener('click', (e) => {
        updateActiveSidebarBtn(e.currentTarget);
        this.switchTab('relatorios');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // 7. Relatórios: Demonstrativo Executivo
      document.getElementById('sidebar-report-statement')?.addEventListener('click', () => {
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
      document.getElementById('btn-copy-statement')?.addEventListener('click', async () => {
        const kpis = window.BillService.calculateKPIs(this.allBills, 'todos');
        const text = window.ExportService.generateTextSummary(kpis, this.allBills);
        const ok = await window.ExportService.copyToClipboard(text);
        if (ok) {
          window.UIManager.showToast('Demonstrativo copiado para a área de transferência!', 'success');
        } else {
          window.UIManager.showToast('Erro ao copiar demonstrativo.', 'error');
        }
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

        const pad = (n) => String(n).padStart(2, '0');
        const monthKey = `${this.activeFilters.selectedYear}-${pad(this.activeFilters.selectedMonth + 1)}`;

        try {
          await window.StorageService.update(id, { invoiceNumber, documentNumber, monthKey });
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
        const pad = (n) => String(n).padStart(2, '0');
        const monthKey = `${this.activeFilters.selectedYear}-${pad(this.activeFilters.selectedMonth + 1)}`;

        try {
          await window.StorageService.update(id, { invoiceNumber: '', documentNumber: '', monthKey });
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

      // Botão na Sidebar
      document.getElementById('sidebar-nav-due-2days')?.addEventListener('click', (e) => {
        document.querySelectorAll('.sidebar-nav-item').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
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

      // Exportação CSV
      document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        window.ExportService.exportToCSV(this.filteredBills);
        window.UIManager.showToast('Arquivo CSV baixado com sucesso!', 'success');
      });

      document.getElementById('btn-export-csv-report')?.addEventListener('click', () => {
        window.ExportService.exportToCSV(this.filteredBills);
        window.UIManager.showToast('Arquivo CSV baixado com sucesso!', 'success');
      });

      // Copiar Resumo Formatado
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
      const pad = (n) => String(n).padStart(2, '0');
      const year = this.activeFilters?.selectedYear !== undefined ? this.activeFilters.selectedYear : new Date().getFullYear();
      const month = this.activeFilters?.selectedMonth !== undefined ? this.activeFilters.selectedMonth : new Date().getMonth();
      const monthKey = `${year}-${pad(month + 1)}`;

      const startMonthKey = dueDate && dueDate.includes('-') ? dueDate.substring(0, 7) : monthKey;

      const billData = {
        description,
        location,
        expenseType,
        dueDay,
        startMonthKey,
        launchDueDate: dueDate,
        invoiceNumber,
        documentNumber,
        amount,
        dueDate,
        category,
        paymentMethod,
        status: finalStatus,
        paymentDate: finalPaymentDate,
        notes,
        monthKey
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

      const pad = (n) => String(n).padStart(2, '0');
      const monthKey = `${this.activeFilters.selectedYear}-${pad(this.activeFilters.selectedMonth + 1)}`;

      try {
        if (newDate) {
          // Salva a data exata informada pelo usuário e garante status pago
          await window.StorageService.update(id, {
            status: 'pago',
            paymentDate: newDate,
            monthKey
          });
          window.UIManager.showToast(`Data de pagamento de "${bill.description}" definida para ${window.AppConfig.utils.formatDate(newDate)}!`, 'success');
        } else {
          await window.StorageService.update(id, {
            status: 'pendente',
            paymentDate: null,
            monthKey
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

      const pad = (n) => String(n).padStart(2, '0');
      const monthKey = `${this.activeFilters.selectedYear}-${pad(this.activeFilters.selectedMonth + 1)}`;

      try {
        if (newStatus === 'pago') {
          // Quando colocar pago, sempre preenche com a data atual (hoje)
          const today = window.AppConfig.utils.toISODateString();
          await window.StorageService.update(id, {
            status: 'pago',
            paymentDate: today,
            monthKey
          });
          window.UIManager.showToast(`Despesa "${bill.description}" marcada como PAGA com a data de hoje (${window.AppConfig.utils.formatDate(today)})!`, 'success');
        } else {
          await window.StorageService.update(id, {
            status: 'pendente',
            paymentDate: null,
            monthKey
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

      const pad = (n) => String(n).padStart(2, '0');
      const monthKey = `${this.activeFilters.selectedYear}-${pad(this.activeFilters.selectedMonth + 1)}`;

      const isCurrentlyPaid = bill.effectiveStatus === 'pago' || bill.status === 'pago';
      const newStatus = isCurrentlyPaid ? 'pendente' : 'pago';
      const newPaymentDate = isCurrentlyPaid ? null : window.AppConfig.utils.toISODateString();

      try {
        await window.StorageService.update(id, {
          status: newStatus,
          paymentDate: newPaymentDate,
          monthKey
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
     * @param {string} id
     */
    async handleEditBill(id) {
      const bill = await window.StorageService.getById(id);
      if (bill) {
        window.UIManager.openBillModal('edit', bill);
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
     * Confirmação efetiva da exclusão
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

      // Atualiza botões visuais de status
      document.querySelectorAll('.btn-status-filter').forEach((btn) => {
        if (btn.dataset.status === 'atrasado') {
          btn.classList.add('border-emerald-600', 'text-emerald-600', 'dark:text-emerald-400', 'font-semibold', 'bg-emerald-50/70');
          btn.classList.remove('text-slate-500', 'dark:text-slate-400', 'border-transparent');
        } else {
          btn.classList.remove('border-emerald-600', 'text-emerald-600', 'dark:text-emerald-400', 'font-semibold', 'bg-emerald-50/70');
          btn.classList.add('text-slate-500', 'dark:text-slate-400', 'border-transparent');
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
    resetFilters() {
      const now = new Date();
      this.activeFilters = {
        period: 'mes',
        status: 'todos',
        location: 'todos',
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

      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = '';

      const filterStatusSelect = document.getElementById('filter-status-select');
      if (filterStatusSelect) filterStatusSelect.value = 'todos';

      const filterLocSelect = document.getElementById('filter-location-select');
      if (filterLocSelect) filterLocSelect.value = 'todos';

      const sortBy = document.getElementById('sort-by');
      if (sortBy) sortBy.value = 'dueDate_asc';

      document.querySelectorAll('.btn-period-filter').forEach((btn) => {
        const isMes = btn.dataset.period === 'mes';
        btn.classList.toggle('bg-emerald-600', isMes);
        btn.classList.toggle('text-white', isMes);
        btn.classList.toggle('shadow-xs', isMes);
        btn.classList.toggle('text-slate-600', !isMes);
      });

      document.querySelectorAll('.btn-status-filter').forEach((btn) => {
        const isTodos = btn.dataset.status === 'todos';
        btn.classList.toggle('border-emerald-600', isTodos);
        btn.classList.toggle('text-emerald-600', isTodos);
        btn.classList.toggle('font-semibold', isTodos);
        btn.classList.toggle('bg-emerald-50/70', isTodos);
        btn.classList.toggle('border-transparent', !isTodos);
        btn.classList.toggle('text-slate-500', !isTodos);
      });

      document.querySelectorAll('.btn-location-pill').forEach((btn) => {
        const isTodos = btn.dataset.location === 'todos';
        btn.classList.toggle('border-emerald-600', isTodos);
        btn.classList.toggle('text-emerald-600', isTodos);
        btn.classList.toggle('font-bold', isTodos);
        btn.classList.toggle('bg-emerald-50/70', isTodos);
        btn.classList.toggle('border-transparent', !isTodos);
        btn.classList.toggle('text-slate-500', !isTodos);
      });

      this.applyFiltersAndRender();
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
