/**
 * Sistema de Gerenciamento de Pagamento de Contas Diário
 * Camada de Acesso a Dados (Storage Service / Repository Pattern)
 * 
 * NOTA DE ARQUITETURA PARA MIGRAÇÃO:
 * Esta camada foi implementada com métodos assíncronos baseados em Promises.
 * Para substituir o LocalStorage pelo Supabase, Firebase ou uma API REST (Node/Python/Go),
 * basta trocar o corpo dos métodos abaixo pela respectiva chamada de rede,
 * sem necessidade de alterar nenhuma linha da camada de UI ou regras de negócio!
 * 
 * Exemplo com Supabase:
 *   async getAll() {
 *     const { data, error } = await supabase.from('bills').select('*').order('due_date', { ascending: true });
 *     if (error) throw error;
 *     return data;
 *   }
 */

(function (window) {
  'use strict';

  class StorageService {
    constructor() {
      this.storageKey = window.AppConfig.STORAGE_KEY;
      this.settingsKey = window.AppConfig.SETTINGS_KEY;
      this.usersKey = 'contadiaria_users_v1';
      this.holidaysKey = 'contadiaria_holidays_v1';
      this.categoriesKey = 'contadiaria_categories_v1';
      this.holidayParamsKey = 'contadiaria_holiday_params_v1';
      this.budgetKey = 'contadiaria_budget_settings_v1';
      this.recurringKey = 'contadiaria_recurring_expenses_v1';
      this._init();
    }

    /**
     * Inicializa o armazenamento garantindo que todas as contas anteriores sejam removidas
     * @private
     */
    _init() {
      try {
        const wipeKey = 'contadiaria_wiped_all_bills_v1';
        if (!localStorage.getItem(wipeKey)) {
          // Limpa todas as contas existentes na primeira execução desta versão
          localStorage.setItem(this.storageKey, JSON.stringify([]));
          localStorage.setItem(wipeKey, 'true');
        } else {
          const existingData = localStorage.getItem(this.storageKey);
          if (!existingData) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
          }
        }

        const existingSettings = localStorage.getItem(this.settingsKey);
        if (!existingSettings) {
          const defaultSettings = {
            theme: 'system', // 'light', 'dark', 'system'
            monthlyBudget: 8000.00,
            autoMarkOverdue: true
          };
          localStorage.setItem(this.settingsKey, JSON.stringify(defaultSettings));
        }
      } catch (err) {
        console.error('Erro ao inicializar LocalStorage:', err);
      }
    }

    /**
     * Lê com segurança o array de contas do LocalStorage
     * @private
     * @returns {Array<Object>}
     */
    _getStoredBills() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error('Erro ao ler bills do localStorage:', err);
        return [];
      }
    }

    /**
     * Retorna todas as contas cadastradas
     * @returns {Promise<Array<Object>>}
     */
    async getAll() {
      return new Promise((resolve) => {
        try {
          let bills = this._getStoredBills();
          // Migração transparente de registros legados: CG -> LD e campos de despesas fixas
          let migrated = false;
          bills = bills.map((b) => {
            if (b.location === 'CG') {
              b.location = 'LD';
              migrated = true;
            }
            const isFixed = b.expenseType === 'fixa' || b.category === 'fixas';
            if (isFixed) {
              if (!b.launchDueDate && b.dueDate) {
                b.launchDueDate = b.dueDate;
                migrated = true;
              }
              if (!b.startMonthKey) {
                const orig = b.launchDueDate || b.dueDate;
                b.startMonthKey = orig && orig.includes('-') ? orig.substring(0, 7) : '';
                migrated = true;
              }
              if (!b.dueDay && b.dueDate && b.dueDate.includes('-')) {
                b.dueDay = parseInt(b.dueDate.split('-')[2], 10) || 1;
                migrated = true;
              }
              if (!b.monthlyOverrides && b.monthlyStatus) {
                b.monthlyOverrides = { ...b.monthlyStatus };
                migrated = true;
              } else if (!b.monthlyOverrides) {
                b.monthlyOverrides = {};
                migrated = true;
              }
            }
            return b;
          });
          if (migrated) {
            localStorage.setItem(this.storageKey, JSON.stringify(bills));
          }
          resolve(bills);
        } catch (err) {
          console.error('Falha ao ler contas do storage:', err);
          resolve([]);
        }
      });
    }

    /**
     * Retorna uma conta específica pelo ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
      const bills = await this.getAll();
      const found = bills.find((b) => b.id === id);
      return found || null;
    }

    /**
     * Salva uma nova conta
     * @param {Object} billData
     * @returns {Promise<Object>}
     */
    async create(billData) {
      return new Promise((resolve, reject) => {
        try {
          const bills = this._getStoredBills();
          const dueDate = billData.dueDate;
          const dueDay = billData.dueDay || (dueDate && dueDate.includes('-') ? parseInt(dueDate.split('-')[2], 10) : 1);
          const startMonthKey = billData.startMonthKey || (dueDate && dueDate.includes('-') ? dueDate.substring(0, 7) : window.AppConfig.utils.toISODateString().substring(0, 7));
          
          const isFixed = ['fixa', 'variavel'].includes(billData.expenseType)
            ? billData.expenseType === 'fixa'
            : (billData.category === 'fixas');

          const finalStatus = billData.status || 'pendente';
          const finalPaymentDate = finalStatus === 'pago' ? (billData.paymentDate || window.AppConfig.utils.toISODateString()) : null;

          const newBill = {
            id: billData.id || window.AppConfig.utils.generateId(),
            description: String(billData.description || '').trim(),
            location: ['LD', 'REC', 'SE'].includes(billData.location) ? billData.location : (billData.location === 'CG' ? 'LD' : 'LD'),
            expenseType: isFixed ? 'fixa' : 'variavel',
            dueDay,
            dueDate,
            invoiceNumber: String(billData.invoiceNumber || '').trim(),
            documentNumber: String(billData.documentNumber || '').trim(),
            amount: Number(billData.amount) || 0,
            category: billData.category || 'outros',
            status: finalStatus,
            paymentMethod: billData.paymentMethod || 'pix',
            invoiceStatus: billData.invoiceStatus || 'aguardando',
            notes: String(billData.notes || '').trim(),
            paymentDate: finalPaymentDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          bills.unshift(newBill); // Insere no início
          localStorage.setItem(this.storageKey, JSON.stringify(bills));
          resolve(newBill);
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * Atualiza uma conta existente
     * Cada conta pertence exclusivamente ao seu próprio lançamento
     * @param {string} id
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async update(id, updates) {
      return new Promise((resolve, reject) => {
        try {
          const bills = this._getStoredBills();
          const index = bills.findIndex((b) => b.id === id);

          if (index === -1) {
            return reject(new Error(`Conta com id "${id}" não encontrada.`));
          }

          const existing = bills[index];
          const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString()
          };

          if (updated.location === 'CG') {
            updated.location = 'LD';
          }

          if (updates.dueDate && updates.dueDate.includes('-')) {
            const parts = updates.dueDate.split('-');
            if (parts.length === 3) {
              updated.dueDay = parseInt(parts[2], 10);
            }
          }

          if (updated.status === 'pago' && !updated.paymentDate) {
            updated.paymentDate = window.AppConfig.utils.toISODateString();
          } else if (updated.status !== 'pago') {
            updated.paymentDate = null;
          }

          bills[index] = updated;
          localStorage.setItem(this.storageKey, JSON.stringify(bills));
          resolve(updated);
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * Remove uma conta pelo ID
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async delete(id) {
      return new Promise((resolve, reject) => {
        try {
          const bills = this._getStoredBills();
          const filtered = bills.filter((b) => b.id !== id);
          localStorage.setItem(this.storageKey, JSON.stringify(filtered));
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    }

    /**
     * Exclui despesa diretamente pelo id
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async excludeFixedFromMonth(id) {
      return this.delete(id);
    }

    /**
     * Restaura os dados de exemplo dinâmicos
     * @returns {Promise<Array<Object>>}
     */
    async resetWithMock() {
      return new Promise((resolve) => {
        const mock = window.MockData.generate();
        localStorage.setItem(this.storageKey, JSON.stringify(mock));
        resolve(mock);
      });
    }

    /**
     * Limpa todas as contas
     * @returns {Promise<void>}
     */
    async clearAll() {
      return new Promise((resolve) => {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        resolve();
      });
    }

    /**
     * Lê as configurações de usuário
     * @returns {Promise<Object>}
     */
    async getSettings() {
      return new Promise((resolve) => {
        try {
          const raw = localStorage.getItem(this.settingsKey);
          resolve(raw ? JSON.parse(raw) : { theme: 'system', monthlyBudget: 8000.00 });
        } catch {
          resolve({ theme: 'system', monthlyBudget: 8000.00 });
        }
      });
    }

    /**
     * Salva as configurações de usuário
     * @param {Object} settings
     * @returns {Promise<Object>}
     */
    async saveSettings(settings) {
      return new Promise((resolve) => {
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
        resolve(settings);
      });
    }

    // =========================================================================
    // 1. GESTÃO DE USUÁRIOS (CADASTRO, EDIÇÃO E EXCLUSÃO)
    // =========================================================================

    /**
     * Retorna a lista de usuários cadastrados no sistema
     * @returns {Promise<Array<Object>>}
     */
    async getUsers() {
      return new Promise((resolve) => {
        try {
          const raw = localStorage.getItem(this.usersKey);
          let users = raw ? JSON.parse(raw) : null;
          if (!Array.isArray(users) || users.length === 0) {
            users = [
              {
                id: 'usr_wesley',
                name: 'Wesley Paranhos',
                email: 'wesley@2oficialsjc.com.br',
                role: 'admin',
                location: 'LD',
                status: 'ativo',
                createdAt: new Date().toISOString()
              },
              {
                id: 'usr_financeiro',
                name: 'Equipe Financeira',
                email: 'financeiro@2oficialsjc.com.br',
                role: 'financeiro',
                location: 'Todas',
                status: 'ativo',
                createdAt: new Date().toISOString()
              }
            ];
            localStorage.setItem(this.usersKey, JSON.stringify(users));
          }
          resolve(users);
        } catch (err) {
          console.error('Erro ao ler usuários:', err);
          resolve([]);
        }
      });
    }

    /**
     * Salva (cria ou atualiza) um usuário
     * @param {Object} userData
     * @returns {Promise<Object>}
     */
    async saveUser(userData) {
      const users = await this.getUsers();
      let savedUser = null;
      if (userData.id) {
        const index = users.findIndex((u) => u.id === userData.id);
        if (index !== -1) {
          users[index] = { ...users[index], ...userData, updatedAt: new Date().toISOString() };
          savedUser = users[index];
        } else {
          userData.id = 'usr_' + Date.now().toString(36);
          userData.createdAt = new Date().toISOString();
          users.push(userData);
          savedUser = userData;
        }
      } else {
        userData.id = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        userData.createdAt = new Date().toISOString();
        users.push(userData);
        savedUser = userData;
      }
      localStorage.setItem(this.usersKey, JSON.stringify(users));
      return savedUser;
    }

    /**
     * Remove um usuário pelo ID
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteUser(id) {
      const users = await this.getUsers();
      const filtered = users.filter((u) => u.id !== id);
      localStorage.setItem(this.usersKey, JSON.stringify(filtered));
      return true;
    }

    // =========================================================================
    // 2. GESTÃO DE FERIADOS (SJC, ESTADUAIS SP E NACIONAIS)
    // =========================================================================

    /**
     * Retorna os feriados cadastrados (opcionalmente filtrados por ano)
     * @param {number|string|null} year
     * @returns {Promise<Array<Object>>}
     */
    async getHolidays(year = null) {
      return new Promise((resolve) => {
        try {
          const raw = localStorage.getItem(this.holidaysKey);
          let holidays = raw ? JSON.parse(raw) : null;
          if (!Array.isArray(holidays) || holidays.length === 0) {
            holidays = [...(window.AppConfig.DEFAULT_HOLIDAYS || [])];
            localStorage.setItem(this.holidaysKey, JSON.stringify(holidays));
          }
          window.AppConfig._holidaysCache = holidays;

          if (year !== null && year !== undefined && String(year) !== 'todos') {
            const yStr = String(year);
            holidays = holidays.filter((h) => h.date && h.date.startsWith(yStr));
          }

          // Ordena por data crescente
          holidays.sort((a, b) => a.date.localeCompare(b.date));
          resolve(holidays);
        } catch (err) {
          console.error('Erro ao ler feriados:', err);
          resolve([]);
        }
      });
    }

    /**
     * Leitura síncrona dos feriados cadastrados
     * @returns {Array<Object>}
     */
    getHolidaysSync() {
      try {
        const raw = localStorage.getItem(this.holidaysKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback
      }
      return window.AppConfig.DEFAULT_HOLIDAYS || [];
    }

    /**
     * Salva (cria ou atualiza) um feriado
     * @param {Object} holiday
     * @returns {Promise<Object>}
     */
    async saveHoliday(holiday) {
      const allHolidays = await this.getHolidays(null);
      let saved = null;
      if (holiday.id) {
        const idx = allHolidays.findIndex((h) => h.id === holiday.id);
        if (idx !== -1) {
          allHolidays[idx] = { ...allHolidays[idx], ...holiday };
          saved = allHolidays[idx];
        } else {
          holiday.id = 'hol_' + Date.now().toString(36);
          allHolidays.push(holiday);
          saved = holiday;
        }
      } else {
        holiday.id = 'hol_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        allHolidays.push(holiday);
        saved = holiday;
      }
      allHolidays.sort((a, b) => a.date.localeCompare(b.date));
      localStorage.setItem(this.holidaysKey, JSON.stringify(allHolidays));
      window.AppConfig._holidaysCache = allHolidays;
      window.AppConfig.utils.reloadHolidays();
      return saved;
    }

    /**
     * Remove um feriado pelo ID
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteHoliday(id) {
      const allHolidays = await this.getHolidays(null);
      const filtered = allHolidays.filter((h) => h.id !== id);
      localStorage.setItem(this.holidaysKey, JSON.stringify(filtered));
      window.AppConfig._holidaysCache = filtered;
      window.AppConfig.utils.reloadHolidays();
      return true;
    }

    /**
     * Restaura os feriados padrão de São José dos Campos e do Brasil
     * @param {number|string|null} year
     * @returns {Promise<Array<Object>>}
     */
    async resetDefaultHolidays(year = null) {
      const defaults = window.AppConfig.DEFAULT_HOLIDAYS || [];
      if (year && String(year) !== 'todos') {
        const yStr = String(year);
        const current = await this.getHolidays(null);
        const others = current.filter((h) => !h.date.startsWith(yStr));
        const defaultsForYear = defaults.filter((h) => h.date.startsWith(yStr));
        const merged = [...others, ...defaultsForYear].sort((a, b) => a.date.localeCompare(b.date));
        localStorage.setItem(this.holidaysKey, JSON.stringify(merged));
        window.AppConfig._holidaysCache = merged;
      } else {
        localStorage.setItem(this.holidaysKey, JSON.stringify(defaults));
        window.AppConfig._holidaysCache = defaults;
      }
      window.AppConfig.utils.reloadHolidays();
      return this.getHolidays(year);
    }

    /**
     * Retorna os parâmetros de feriados e aviso prévio
     * @returns {Promise<Object>}
     */
    async getHolidayParams() {
      return new Promise((resolve) => {
        try {
          const raw = localStorage.getItem(this.holidayParamsKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              window.AppConfig.HOLIDAY_PARAMS = parsed;
              return resolve(parsed);
            }
          }
          const defaults = {
            alertAdvanceBusinessDays: 2,
            autoProrogateNonBusinessDays: true,
            consideredTypes: ['municipal_sjc', 'estadual_sp', 'nacional', 'bancario_cartorio', 'facultativo'],
            autoShowDailyPopup: true
          };
          localStorage.setItem(this.holidayParamsKey, JSON.stringify(defaults));
          window.AppConfig.HOLIDAY_PARAMS = defaults;
          resolve(defaults);
        } catch {
          resolve(window.AppConfig.HOLIDAY_PARAMS || {
            alertAdvanceBusinessDays: 2,
            autoProrogateNonBusinessDays: true,
            consideredTypes: ['municipal_sjc', 'estadual_sp', 'nacional', 'bancario_cartorio', 'facultativo'],
            autoShowDailyPopup: true
          });
        }
      });
    }

    /**
     * Salva os parâmetros de feriados e aviso prévio
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    async saveHolidayParams(params) {
      return new Promise((resolve) => {
        const clean = {
          alertAdvanceBusinessDays: Math.max(1, Math.min(10, parseInt(params.alertAdvanceBusinessDays, 10) || 2)),
          autoProrogateNonBusinessDays: params.autoProrogateNonBusinessDays !== false,
          consideredTypes: Array.isArray(params.consideredTypes) && params.consideredTypes.length > 0
            ? params.consideredTypes
            : ['municipal_sjc', 'estadual_sp', 'nacional', 'bancario_cartorio', 'facultativo'],
          autoShowDailyPopup: params.autoShowDailyPopup !== false
        };
        localStorage.setItem(this.holidayParamsKey, JSON.stringify(clean));
        window.AppConfig.HOLIDAY_PARAMS = clean;
        resolve(clean);
      });
    }

    /**
     * Restaura os parâmetros de feriados e aviso prévio para o padrão institucional (2 dias úteis)
     * @returns {Promise<Object>}
     */
    async resetHolidayParams() {
      const defaults = {
        alertAdvanceBusinessDays: 2,
        autoProrogateNonBusinessDays: true,
        consideredTypes: ['municipal_sjc', 'estadual_sp', 'nacional', 'bancario_cartorio', 'facultativo'],
        autoShowDailyPopup: true
      };
      localStorage.setItem(this.holidayParamsKey, JSON.stringify(defaults));
      window.AppConfig.HOLIDAY_PARAMS = defaults;
      return defaults;
    }

    // =========================================================================
    // 3. GERENCIADOR DE DESPESAS (CATEGORIAS E ORÇAMENTO)
    // =========================================================================

    /**
     * Retorna todas as categorias de despesas gerenciáveis
     * @returns {Promise<Object>}
     */
    async getCategories() {
      return new Promise((resolve) => {
        try {
          const raw = localStorage.getItem(this.categoriesKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              window.AppConfig.CATEGORIES = parsed;
              return resolve(parsed);
            }
          }
          // Se não houver no storage, inicializa com as categorias padrão e salva
          localStorage.setItem(this.categoriesKey, JSON.stringify(window.AppConfig.CATEGORIES));
          resolve(window.AppConfig.CATEGORIES);
        } catch {
          resolve(window.AppConfig.CATEGORIES);
        }
      });
    }

    /**
     * Salva ou atualiza qualquer categoria (nome, ícone, cor)
     * @param {Object} catData
     * @returns {Promise<Object>}
     */
    async saveCategory(catData) {
      try {
        const categories = await this.getCategories();
        let catId = catData.id;

        if (!catId) {
          const slug = String(catData.label || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_');
          catId = 'cat_' + (slug || Date.now().toString(36));
        }

        const existing = categories[catId] || {};
        const label = String(catData.label || existing.label || 'Nova Categoria').trim();
        const icon = catData.icon || existing.icon || 'tag';
        const color = catData.color || existing.color || '#059669';

        const updatedCat = {
          ...existing,
          id: catId,
          label,
          icon,
          color,
          badgeClass: `bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800`,
          isCustom: true
        };

        categories[catId] = updatedCat;
        window.AppConfig.CATEGORIES = categories;
        localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
        return updatedCat;
      } catch (err) {
        console.error('Erro ao salvar categoria:', err);
        return null;
      }
    }

    /**
     * Remove uma categoria de despesa e reatribui contas existentes para "Outros"
     * @param {string} catId
     * @returns {Promise<boolean>}
     */
    async deleteCategory(catId) {
      try {
        if (catId === 'outros') {
          throw new Error('A categoria "Outros" é padrão do sistema e não pode ser removida.');
        }

        const categories = await this.getCategories();
        if (!categories[catId]) {
          return false;
        }

        delete categories[catId];
        window.AppConfig.CATEGORIES = categories;
        localStorage.setItem(this.categoriesKey, JSON.stringify(categories));

        // Reatribui contas vinculadas a essa categoria para 'outros'
        const bills = this._getStoredBills();
        let billsChanged = false;
        bills.forEach((b) => {
          if (b.category === catId) {
            b.category = 'outros';
            billsChanged = true;
          }
        });
        if (billsChanged) {
          localStorage.setItem(this.storageKey, JSON.stringify(bills));
        }

        // Reatribui despesas recorrentes vinculadas a essa categoria para 'outros'
        try {
          const rawRec = localStorage.getItem(this.recurringKey);
          if (rawRec) {
            const recs = JSON.parse(rawRec);
            let recsChanged = false;
            recs.forEach((r) => {
              if (r.category === catId) {
                r.category = 'outros';
                recsChanged = true;
              }
            });
            if (recsChanged) {
              localStorage.setItem(this.recurringKey, JSON.stringify(recs));
            }
          }
        } catch {}

        return true;
      } catch (err) {
        console.error('Erro ao excluir categoria:', err);
        return false;
      }
    }

    /**
     * Restaura as categorias padrão iniciais
     * @returns {Promise<Object>}
     */
    async resetDefaultCategories() {
      const defaults = {
        moradia: {
          id: 'moradia',
          label: 'Moradia / Instalações',
          icon: 'building-2',
          color: '#3b82f6',
          badgeClass: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
        },
        tecnologia: {
          id: 'tecnologia',
          label: 'Softwares & TI',
          icon: 'cpu',
          color: '#10b981',
          badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
        },
        manutencao: {
          id: 'manutencao',
          label: 'Manutenção & Serviços',
          icon: 'wrench',
          color: '#6366f1',
          badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
        },
        alimentacao: {
          id: 'alimentacao',
          label: 'Alimentação & Copa',
          icon: 'utensils',
          color: '#f59e0b',
          badgeClass: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        },
        suprimentos: {
          id: 'suprimentos',
          label: 'Suprimentos & Cartório',
          icon: 'file-badge',
          color: '#8b5cf6',
          badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
        },
        telefonia: {
          id: 'telefonia',
          label: 'Telefonia & Internet',
          icon: 'phone',
          color: '#06b6d4',
          badgeClass: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800'
        },
        servicos_pj: {
          id: 'servicos_pj',
          label: 'Honorários & Terceiros',
          icon: 'briefcase',
          color: '#ec4899',
          badgeClass: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800'
        },
        outros: {
          id: 'outros',
          label: 'Outras Despesas',
          icon: 'tag',
          color: '#64748b',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
        }
      };

      localStorage.setItem(this.categoriesKey, JSON.stringify(defaults));
      window.AppConfig.CATEGORIES = defaults;
      return defaults;
    }

    /**
     * Retorna configurações orçamentárias do cartório
     * @returns {Promise<Object>}
     */
    async getBudgetSettings() {
      return new Promise((resolve) => {
        try {
          const raw = localStorage.getItem(this.budgetKey);
          resolve(raw ? JSON.parse(raw) : { monthlyBudget: 8000.00, alertThreshold: 80, notes: '' });
        } catch {
          resolve({ monthlyBudget: 8000.00, alertThreshold: 80, notes: '' });
        }
      });
    }

    /**
     * Salva as configurações orçamentárias
     * @param {Object} settings
     * @returns {Promise<Object>}
     */
    async saveBudgetSettings(settings) {
      return new Promise((resolve) => {
        localStorage.setItem(this.budgetKey, JSON.stringify(settings));
        resolve(settings);
      });
    }

    /**
     * Retorna a lista de despesas recorrentes cadastradas no repositório permanente
     * @returns {Promise<Array<Object>>}
     */
    async getRecurringBills() {
      return new Promise((resolve) => {
        try {
          const raw = localStorage.getItem(this.recurringKey);
          let items = raw ? JSON.parse(raw) : null;

          if (!items || !Array.isArray(items)) {
            // Se ainda não existir no repositório, verifica se há contas fixas no storage de lançamentos
            // ou inicializa com a despesa fixa padrão (ex: Siscart)
            const stored = this._getStoredBills();
            const fixedFromBills = stored.filter((b) => b.expenseType === 'fixa' || b.description === 'Siscart');
            
            if (fixedFromBills.length > 0) {
              items = fixedFromBills.map((b) => ({
                id: 'rec_' + (b.id || Date.now().toString(36)),
                description: b.description || 'Siscart',
                amount: Number(b.amount) || 5000.23,
                dueDay: b.dueDay || (b.dueDate ? parseInt(b.dueDate.split('-')[2], 10) : 9),
                location: b.location === 'CG' ? 'LD' : (b.location || 'LD'),
                category: b.category || 'moradia',
                paymentMethod: b.paymentMethod || 'pix',
                notes: b.notes || '',
                createdAt: b.createdAt || new Date().toISOString()
              }));
            } else {
              items = [
                {
                  id: 'rec_siscart_default',
                  description: 'Siscart',
                  amount: 5000.23,
                  dueDay: 9,
                  location: 'LD',
                  category: 'moradia',
                  paymentMethod: 'pix',
                  notes: 'Software e sistema cartorário padrão',
                  createdAt: new Date().toISOString()
                }
              ];
            }
            localStorage.setItem(this.recurringKey, JSON.stringify(items));
          }

          items.sort((a, b) => (Number(a.dueDay) || 0) - (Number(b.dueDay) || 0));
          resolve(items);
        } catch (err) {
          console.error('Erro ao buscar despesas recorrentes:', err);
          resolve([]);
        }
      });
    }

    /**
     * Salva (cria ou atualiza) uma despesa recorrente no repositório permanente
     * @param {Object} recurringData
     * @returns {Promise<Object>}
     */
    async saveRecurringBill(recurringData) {
      const items = await this.getRecurringBills();
      let saved = null;

      const cleanItem = {
        description: String(recurringData.description || '').trim(),
        amount: Number(recurringData.amount) || 0,
        dueDay: Math.min(31, Math.max(1, parseInt(recurringData.dueDay, 10) || 1)),
        location: ['LD', 'REC', 'SE'].includes(recurringData.location) ? recurringData.location : 'LD',
        category: recurringData.category || 'outros',
        paymentMethod: recurringData.paymentMethod || 'pix',
        notes: String(recurringData.notes || '').trim(),
        updatedAt: new Date().toISOString()
      };

      if (recurringData.id) {
        const idx = items.findIndex((i) => i.id === recurringData.id);
        if (idx !== -1) {
          items[idx] = { ...items[idx], ...cleanItem };
          saved = items[idx];
        } else {
          cleanItem.id = recurringData.id;
          cleanItem.createdAt = new Date().toISOString();
          items.push(cleanItem);
          saved = cleanItem;
        }
      } else {
        cleanItem.id = 'rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        cleanItem.createdAt = new Date().toISOString();
        items.push(cleanItem);
        saved = cleanItem;
      }

      items.sort((a, b) => a.dueDay - b.dueDay);
      localStorage.setItem(this.recurringKey, JSON.stringify(items));
      return saved;
    }

    /**
     * Remove uma despesa recorrente do repositório pelo ID
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteRecurringBill(id) {
      const items = await this.getRecurringBills();
      const filtered = items.filter((i) => i.id !== id);
      localStorage.setItem(this.recurringKey, JSON.stringify(filtered));
      return true;
    }

    /**
     * Lança uma despesa recorrente do repositório como conta no mês especificado
     * @param {string} recurringId
     * @param {number} year
     * @param {number} monthIndex (0 a 11)
     * @returns {Promise<Object>}
     */
    async launchRecurringBillToMonth(recurringId, year, monthIndex) {
      const items = await this.getRecurringBills();
      const rec = items.find((i) => i.id === recurringId);
      if (!rec) {
        throw new Error('Despesa recorrente não encontrada no repositório.');
      }

      const pad = (n) => String(n).padStart(2, '0');
      const maxDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const actualDay = Math.min(rec.dueDay, maxDaysInMonth);
      const dueDate = `${year}-${pad(monthIndex + 1)}-${pad(actualDay)}`;

      const newBill = await this.create({
        description: rec.description,
        amount: rec.amount,
        dueDate: dueDate,
        dueDay: actualDay,
        location: rec.location,
        category: rec.category,
        paymentMethod: rec.paymentMethod,
        expenseType: 'fixa',
        status: 'pendente',
        notes: rec.notes
      });

      return newBill;
    }

    /**
     * Lança todas as despesas recorrentes do repositório no mês especificado (sem duplicar já existentes)
     * @param {number} year
     * @param {number} monthIndex (0 a 11)
     * @returns {Promise<{ created: Array<Object>, skipped: Array<Object> }>}
     */
    async launchAllRecurringToMonth(year, monthIndex) {
      const items = await this.getRecurringBills();
      const stored = this._getStoredBills();
      const pad = (n) => String(n).padStart(2, '0');
      const monthPrefix = `${year}-${pad(monthIndex + 1)}`;
      const currentMonthBills = stored.filter((b) => b.dueDate && b.dueDate.startsWith(monthPrefix));

      const created = [];
      const skipped = [];

      for (const rec of items) {
        const exists = currentMonthBills.some((b) => 
          b.description.trim().toLowerCase() === rec.description.trim().toLowerCase()
        );

        if (exists) {
          skipped.push(rec);
        } else {
          const maxDaysInMonth = new Date(year, monthIndex + 1, 0).getDate();
          const actualDay = Math.min(rec.dueDay, maxDaysInMonth);
          const dueDate = `${year}-${pad(monthIndex + 1)}-${pad(actualDay)}`;

          const b = await this.create({
            description: rec.description,
            amount: rec.amount,
            dueDate: dueDate,
            dueDay: actualDay,
            location: rec.location,
            category: rec.category,
            paymentMethod: rec.paymentMethod,
            expenseType: 'fixa',
            status: 'pendente',
            notes: rec.notes
          });
          created.push(b);
        }
      }

      return { created, skipped };
    }
  }

  window.StorageService = new StorageService();
})(window);
